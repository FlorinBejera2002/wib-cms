const TARGET_URL = 'https://wib-cms.onrender.com';
const ADMIN_EMAIL = 'admin@asigurari.ro';
const ADMIN_PASSWORD = 'ChangeThisPassword123!';

async function checkCount() {
  // Login
  const loginRes = await fetch(`${TARGET_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.access_token;

  // Get count
  const countRes = await fetch(`${TARGET_URL}/items/blog_posts?aggregate[count]=*&limit=0`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const countData = await countRes.json();
  
  console.log('Total blog posts in Render Directus:', countData.data[0].count);
}

checkCount().catch(console.error);
