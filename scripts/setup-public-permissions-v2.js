const TARGET_URL = 'https://wib-cms.onrender.com';
const ADMIN_EMAIL = 'admin@asigurari.ro';
const ADMIN_PASSWORD = 'ChangeThisPassword123!';

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

  // Get all roles
  const rolesRes = await fetch(`${TARGET_URL}/roles`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const rolesData = await rolesRes.json();
  console.log('Available roles:', rolesData.data.map(r => `${r.name} (${r.id})`).join(', '));
  
  const publicRole = rolesData.data.find(r => r.id === null || r.name === 'Public');
  const publicRoleId = publicRole ? publicRole.id : null;

  console.log(`\nUsing public role ID: ${publicRoleId}\n`);

  // Collections that need READ permission
  const readCollections = [
    'blog_posts',
    'blog_categories',
    'blog_tags',
    'blog_comments',
    'news'
  ];

  // Add READ permissions
  console.log('📖 Adding READ permissions...');
  for (const collection of readCollections) {
    const permission = {
      role: publicRoleId,
      collection: collection,
      action: 'read',
      fields: ['*'],
      permissions: {},
      validation: {}
    };

    const res = await fetch(`${TARGET_URL}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(permission)
    });

    if (res.ok) {
      console.log(`  ✓ ${collection}`);
    } else {
      const error = await res.text();
      console.log(`  ✗ ${collection}: ${error}`);
    }
  }

  // Add CREATE permissions
  console.log('\n✍️  Adding CREATE permissions...');
  
  // Newsletter subscribers
  const newsletterPerm = {
    role: publicRoleId,
    collection: 'newsletter_subscribers',
    action: 'create',
    fields: ['email'],
    permissions: {},
    validation: {}
  };

  let res = await fetch(`${TARGET_URL}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newsletterPerm)
  });

  if (res.ok) {
    console.log(`  ✓ newsletter_subscribers (email)`);
  } else {
    const error = await res.text();
    console.log(`  ✗ newsletter_subscribers: ${error}`);
  }

  // Blog comments
  const commentsPerm = {
    role: publicRoleId,
    collection: 'blog_comments',
    action: 'create',
    fields: ['post_slug', 'author_name', 'author_email', 'content'],
    permissions: {},
    validation: {}
  };

  res = await fetch(`${TARGET_URL}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commentsPerm)
  });

  if (res.ok) {
    console.log(`  ✓ blog_comments (post_slug, author_name, author_email, content)`);
  } else {
    const error = await res.text();
    console.log(`  ✗ blog_comments: ${error}`);
  }

  console.log('\n✅ Public permissions configured!');
  console.log('\nTest public access:');
  console.log(`curl "${TARGET_URL}/items/blog_posts?limit=1"`);
}

setupPublicPermissions().catch(console.error);
