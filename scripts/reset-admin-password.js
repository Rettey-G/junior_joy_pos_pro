// Reset admin password script
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/junior_joy_pos';

async function resetAdminPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find admin users
    const adminUsers = await User.find({ role: 'admin' });
    
    if (adminUsers.length === 0) {
      console.log('No admin users found. Creating a new admin user...');
      
      // Create a new admin user with simple credentials
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      
      const newAdmin = new User({
        username: 'admin',
        password: hashedPassword, // Password will be '123456'
        name: 'System Admin',
        role: 'admin'
      });
      
      await newAdmin.save();
      console.log('Created new admin user with username "admin" and password "123456"');
    } else {
      console.log(`Found ${adminUsers.length} admin users. Resetting passwords...`);
      
      // Reset password for all admin users
      for (const user of adminUsers) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);
        
        user.password = hashedPassword;
        await user.save();
        
        console.log(`Reset password for admin user: ${user.username}`);
      }
      
      console.log('All admin passwords have been reset to "123456"');
    }
    
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();
