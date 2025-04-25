// Usage: node scripts/reset-user-password.js <username> <newpassword>
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdbname';

async function resetPassword(username, newPassword) {
  await mongoose.connect(MONGODB_URI);
  const user = await User.findOne({ username });
  if (!user) {
    console.error('User not found:', username);
    process.exit(1);
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  await user.save();
  console.log(`Password for user '${username}' has been reset.`);
  mongoose.disconnect();
}

const [,, username, newPassword] = process.argv;
if (!username || !newPassword) {
  console.error('Usage: node scripts/reset-user-password.js <username> <newpassword>');
  process.exit(1);
}
resetPassword(username, newPassword);
