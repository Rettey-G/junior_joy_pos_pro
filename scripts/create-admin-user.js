// Usage: node scripts/create-admin-user.js <username> <password> <name>
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdbname';

async function createAdmin(username, password, name) {
  await mongoose.connect(MONGODB_URI);
  const existing = await User.findOne({ username });
  if (existing) {
    console.error('User already exists:', username);
    process.exit(1);
  }
  const user = new User({ username, password, name, role: 'admin' });
  await user.save();
  console.log(`Admin user '${username}' created.`);
  mongoose.disconnect();
}

const [,, username, password, name] = process.argv;
if (!username || !password || !name) {
  console.error('Usage: node scripts/create-admin-user.js <username> <password> <name>');
  process.exit(1);
}
createAdmin(username, password, name);
