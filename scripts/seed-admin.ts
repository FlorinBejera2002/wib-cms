import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://192.168.0.31:27017/wib_test'

async function seedAdmin() {
  await mongoose.connect(MONGODB_URI)

  const db = mongoose.connection.db
  const collection = db.collection('cms_users')

  const email = process.env.ADMIN_EMAIL || 'admin@asigurari.ro'
  const password = process.env.ADMIN_PASSWORD

  if (!password) {
    console.error('❌ ADMIN_PASSWORD env variable is required')
    process.exit(1)
  }

  const existing = await collection.findOne({ email })
  if (existing) {
    console.log(`⚠️  Admin user already exists: ${email}`)
    await mongoose.disconnect()
    return
  }

  const hash = await bcrypt.hash(password, 12)

  await collection.insertOne({
    email,
    name: 'Admin',
    password: hash,
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  console.log(`✅ Admin user created: ${email}`)
  await mongoose.disconnect()
}

seedAdmin().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
