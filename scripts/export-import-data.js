const SOURCE_URL = process.env.SOURCE_DIRECTUS_URL || 'http://localhost:8055';
const TARGET_URL = process.env.TARGET_DIRECTUS_URL || 'https://wib-cms.onrender.com';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || 'admin@asigurari.ro';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || 'ChangeThisPassword123!';

async function login(url) {
  const response = await fetch(`${url}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const data = await response.json();
  return data.data.access_token;
}

async function getItems(url, token, collection) {
  const response = await fetch(`${url}/items/${collection}?limit=-1`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data.data || [];
}

async function createItem(url, token, collection, item) {
  const response = await fetch(`${url}/items/${collection}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item)
  });
  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to create item: ${error}`);
  }
  return response.ok;
}

async function exportImportData() {
  console.log('🔄 Starting data migration...\n');

  // Login to source and target
  const sourceToken = await login(SOURCE_URL);
  console.log('✓ Connected to source Directus (local)');

  const targetToken = await login(TARGET_URL);
  console.log('✓ Connected to target Directus (Render)\n');

  // Export and import blog posts
  console.log('📝 Migrating blog posts...');
  const posts = await getItems(SOURCE_URL, sourceToken, 'blog_posts');
  console.log(`  Found ${posts.length} blog posts`);

  if (posts.length > 0) {
    let imported = 0;
    for (let i = 0; i < posts.length; i++) {
      const post = { ...posts[i] };
      delete post.id;
      delete post.date_created;
      delete post.date_updated;

      const success = await createItem(TARGET_URL, targetToken, 'blog_posts', post);
      if (success) imported++;

      if ((i + 1) % 10 === 0 || i === posts.length - 1) {
        console.log(`  ✓ Imported ${i + 1}/${posts.length}`);
      }
    }
    console.log(`  ✓ Successfully imported ${imported}/${posts.length} posts`);
  }

  // Export and import blog comments
  console.log('\n💬 Migrating blog comments...');
  const comments = await getItems(SOURCE_URL, sourceToken, 'blog_comments');
  console.log(`  Found ${comments.length} blog comments`);

  if (comments.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < comments.length; i += batchSize) {
      const batch = comments.slice(i, i + batchSize).map(c => {
        delete c.id;
        delete c.date_created;
        return c;
      });
      await createItems(TARGET_URL, targetToken, 'blog_comments', batch);
      console.log(`  ✓ Imported ${Math.min(i + batchSize, comments.length)}/${comments.length}`);
    }
  }

  // Export and import newsletter subscribers
  console.log('\n📧 Migrating newsletter subscribers...');
  const subscribers = await getItems(SOURCE_URL, sourceToken, 'newsletter_subscribers');
  console.log(`  Found ${subscribers.length} newsletter subscribers`);

  if (subscribers.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize).map(s => {
        delete s.id;
        delete s.date_created;
        return s;
      });
      await createItems(TARGET_URL, targetToken, 'newsletter_subscribers', batch);
      console.log(`  ✓ Imported ${Math.min(i + batchSize, subscribers.length)}/${subscribers.length}`);
    }
  }

  console.log('\n✅ Migration complete!');
  console.log(`\nSummary:`);
  console.log(`  - Blog posts: ${posts.length}`);
  console.log(`  - Comments: ${comments.length}`);
  console.log(`  - Subscribers: ${subscribers.length}`);
}

exportImportData().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
