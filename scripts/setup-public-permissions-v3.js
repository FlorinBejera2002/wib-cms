const TARGET_URL = 'https://wib-cms.onrender.com';
const ADMIN_EMAIL = 'admin@asigurari.ro';
const ADMIN_PASSWORD = 'ChangeThisPassword123!';
const PUBLIC_POLICY_ID = 'abf8a154-5b1c-4a46-ac9c-7300570f4f17';

async function setupPublicPermissions() {
  // Login
  const loginRes = await fetch(`${TARGET_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.access_token;
  console.log('✓ Authenticated\n');

  // Check existing permissions
  const existingRes = await fetch(`${TARGET_URL}/permissions?filter[policy][_eq]=${PUBLIC_POLICY_ID}&limit=-1`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const existingData = await existingRes.json();
  const existing = existingData.data || [];
  console.log(`Existing public permissions: ${existing.length}`);
  
  // Show what collections already have permissions
  const existingCollections = existing.map(p => `${p.collection}:${p.action}`);
  console.log('Existing:', existingCollections.join(', '));
  console.log('');

  // Permissions to add
  const permissions = [
    { collection: 'blog_posts', action: 'read', fields: ['*'] },
    { collection: 'blog_categories', action: 'read', fields: ['*'] },
    { collection: 'blog_tags', action: 'read', fields: ['*'] },
    { collection: 'blog_comments', action: 'read', fields: ['*'] },
    { collection: 'blog_comments', action: 'create', fields: ['post_slug', 'author_name', 'author_email', 'content'] },
    { collection: 'news', action: 'read', fields: ['*'] },
    { collection: 'newsletter_subscribers', action: 'create', fields: ['email'] },
  ];

  console.log('📖 Adding permissions...');
  for (const perm of permissions) {
    // Skip if already exists
    const key = `${perm.collection}:${perm.action}`;
    if (existingCollections.includes(key)) {
      console.log(`  ⏭ ${key} (already exists)`);
      continue;
    }

    const body = {
      policy: PUBLIC_POLICY_ID,
      collection: perm.collection,
      action: perm.action,
      fields: perm.fields,
      permissions: {},
      validation: {}
    };

    const res = await fetch(`${TARGET_URL}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      console.log(`  ✓ ${key}`);
    } else {
      const error = await res.text();
      console.log(`  ✗ ${key}: ${error}`);
    }
  }

  // Test public access
  console.log('\n🔍 Testing public access...');
  const testRes = await fetch(`${TARGET_URL}/items/blog_posts?limit=1`);
  if (testRes.ok) {
    const testData = await testRes.json();
    console.log(`✅ Public access works! Found ${testData.data.length} post(s)`);
    if (testData.data[0]) {
      console.log(`   First post: "${testData.data[0].title}"`);
    }
  } else {
    console.log(`❌ Public access failed: ${testRes.status} ${testRes.statusText}`);
  }
}

setupPublicPermissions().catch(console.error);
