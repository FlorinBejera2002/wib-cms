const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'WIB-CMS/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  await mongoose.connect('mongodb://192.168.0.31:27017/wib_test', { bufferCommands: false });
  console.log('Connected to MongoDB');

  const posts = mongoose.connection.db.collection('blog_posts');
  const media = mongoose.connection.db.collection('cms_media');

  // Get all unique image URLs
  const allPosts = await posts.find({}).project({ featuredImageUrl: 1, featuredImageAlt: 1 }).toArray();
  const urlMap = new Map();
  allPosts.forEach((p) => {
    if (p.featuredImageUrl && !urlMap.has(p.featuredImageUrl)) {
      urlMap.set(p.featuredImageUrl, p.featuredImageAlt || '');
    }
  });

  console.log(`Found ${urlMap.size} unique images to download\n`);

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  let success = 0;
  let failed = 0;
  const urlToLocal = new Map();

  const entries = [...urlMap.entries()];

  // Process in batches of 5
  for (let i = 0; i < entries.length; i += 5) {
    const batch = entries.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map(async ([url, alt]) => {
        const urlParts = url.split('/');
        const originalName = urlParts[urlParts.length - 1];
        const system = urlParts[urlParts.length - 2];
        const localName = `${system}-${originalName}`;
        const localPath = path.join(UPLOAD_DIR, localName);

        // Skip if already downloaded
        if (fs.existsSync(localPath)) {
          urlToLocal.set(url, `/uploads/${localName}`);
          return { url, localName, skipped: true };
        }

        const buffer = await downloadFile(url);
        fs.writeFileSync(localPath, buffer);
        urlToLocal.set(url, `/uploads/${localName}`);

        // Determine mime type
        const ext = path.extname(originalName).toLowerCase();
        const mimeTypes = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif' };
        const mimeType = mimeTypes[ext] || 'image/webp';

        // Create media record
        await media.insertOne({
          filename: originalName,
          url: `/uploads/${localName}`,
          mimeType,
          size: buffer.length,
          alt: alt || originalName.replace(/\.[^.]+$/, '').replace(/-/g, ' '),
          uploadedBy: null,
          createdAt: new Date(),
        });

        return { url, localName, size: buffer.length };
      })
    );

    results.forEach((r) => {
      if (r.status === 'fulfilled') {
        const v = r.value;
        if (v.skipped) {
          process.stdout.write('S');
        } else {
          process.stdout.write('.');
        }
        success++;
      } else {
        process.stdout.write('X');
        console.error(`\n  FAILED: ${r.reason.message}`);
        failed++;
      }
    });
  }

  console.log(`\n\nDownloaded: ${success}, Failed: ${failed}`);

  // Update post featuredImageUrl to local paths
  let updated = 0;
  for (const [remoteUrl, localUrl] of urlToLocal) {
    const result = await posts.updateMany(
      { featuredImageUrl: remoteUrl },
      { $set: { featuredImageUrl: localUrl } }
    );
    updated += result.modifiedCount;
  }
  console.log(`Updated ${updated} posts with local image URLs`);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
