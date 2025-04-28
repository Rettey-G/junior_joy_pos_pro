const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config');

async function createTestUser() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Create test user
    const testUser = new User({
      username: 'test_user',
      password: 'test123',
      name: 'Test User',
      role: 'admin'
    });
    
    await testUser.save();
    console.log('Test user created successfully');
    
    // Verify user exists
    const user = await User.findOne({ username: 'test_user' });
    console.log('User found:', user);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestUser(); 