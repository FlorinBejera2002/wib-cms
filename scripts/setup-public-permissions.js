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

  // Get public role ID
  const rolesRes = await fetch(`${TARGET_URL}/roles?filter[name][_eq]=Public`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const rolesData = await rolesRes.json();
  const publicRoleId = rolesData.data[0].id;

  console.log(`Public role ID: ${publicRoleId}\n`);

  // Collections that need READ permission
  const readCollections = [
    'blog_posts',
    'blog_categories',
    'blog_tags',
    'blog_comments',
    'news'
  ];

  // Collections that need CREATE permission
  const createCollections = [
    { collection: 'newsletter_subscribers', fields: ['email'] },
    { collection: 'blog_comments', fields: ['post_slug', 'author_name', 'author_email', 'content'] }
  ];

  // Delete existing public permissions
  console.log('🗑️  Deleting existing public permissions...');
  const existingPermsRes = await fetch(`${TARGET_URL}/permissions?filter[role][_eq]=${publicRoleId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const existingPerms = await existingPermsRes.json();
  
  for (const perm of existingPerms.data || []) {
    await fetch(`${TARGET_URL}/permissions/${perm.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }
  console.log(`✓ Deleted ${existingPerms.data?.length || 0} existing permissions\n`);

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
  for (const { collection, fields } of createCollections) {
    const permission = {
      role: publicRoleId,
      collection: collection,
      action: 'create',
      fields: fields,
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
      console.log(`  ✓ ${collection} (${fields.join(', ')})`);
    } else {
      const error = await res.text();
      console.log(`  ✗ ${collection}: ${error}`);
    }
  }

  console.log('\n✅ Public permissions configured!');
}

setupPublicPermissions().catch(console.error);
