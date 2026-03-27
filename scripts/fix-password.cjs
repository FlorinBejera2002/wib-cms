const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wib_test'
const EMAIL = process.env.ADMIN_EMAIL || 'admin@asigurari.ro'
const PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!'

async function fixPassword() {
  await mongoose.connect(MONGODB_URI)
  const hash = bcrypt.hashSync(PASSWORD, 12)
  const result = await mongoose.connection.db
    .collection('cms_users')
    .updateOne({ email: EMAIL }, { $set: { password: hash } })
  console.log('Updated:', result.modifiedCount, '| Hash:', hash)
  await mongoose.disconnect()
}

fixPassword().catch(err => { console.error(err); process.exit(1) })
