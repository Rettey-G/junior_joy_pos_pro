// Usage: node scripts/list-users.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdbname';

async function listUsers() {
  await mongoose.connect(MONGODB_URI);
  const users = await User.find({}, 'username name role');
  if (users.length === 0) {
    console.log('No users found.');
  } else {
    console.log('User list:');
    users.forEach(u => {
      console.log(`- Username: ${u.username}, Name: ${u.name}, Role: ${u.role}`);
    });
  }
  mongoose.disconnect();
}

listUsers();
