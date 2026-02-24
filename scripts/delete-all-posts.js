const TARGET_URL = 'https://wib-cms.onrender.com';
const ADMIN_EMAIL = 'admin@asigurari.ro';
const ADMIN_PASSWORD = 'ChangeThisPassword123!';

async function deleteAllPosts() {
  // Login
  const loginRes = await fetch(`${TARGET_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.access_token;

  // Get all post IDs
  const postsRes = await fetch(`${TARGET_URL}/items/blog_posts?fields=id&limit=-1`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const postsData = await postsRes.json();
  const posts = postsData.data || [];

  console.log(`Found ${posts.length} posts to delete...`);

  // Delete all posts
  for (const post of posts) {
    await fetch(`${TARGET_URL}/items/blog_posts/${post.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  console.log(`✓ Deleted ${posts.length} posts`);
}

deleteAllPosts().catch(console.error);
