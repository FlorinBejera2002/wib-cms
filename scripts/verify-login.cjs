const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wib_test'
const EMAIL = 'admin@asigurari.ro'
const PASSWORD = 'Admin123!'

async function verify() {
  await mongoose.connect(MONGODB_URI)
  const user = await mongoose.connection.db
    .collection('cms_users')
    .findOne({ email: EMAIL })

  if (!user) {
    console.log('ERROR: user not found')
    process.exit(1)
  }

  console.log('User found:', user.email, '| isActive:', user.isActive)
  console.log('Stored hash:', user.password)

  const match = await bcrypt.compare(PASSWORD, user.password)
  console.log('Password match for "' + PASSWORD + '":', match)

  await mongoose.disconnect()
}

verify().catch(err => { console.error(err); process.exit(1) })
