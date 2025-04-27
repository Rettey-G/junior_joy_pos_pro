// Script to add a new user directly to MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Connection string - using the one from your MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://Rettey:Adhu1447@cluster0.qi38xbl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// User credentials to add
const NEW_USERNAME = 'website_user';
const NEW_PASSWORD = 'website123';
const DISPLAY_NAME = 'Website User';
const USER_ROLE = 'admin'; // admin, manager, or cashier

async function addWebsiteUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
    
    // Check if user already exists
    const existingUser = await User.findOne({ username: NEW_USERNAME });
    if (existingUser) {
      console.log(`User '${NEW_USERNAME}' already exists. Updating password...`);
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);
      
      // Update the user
      existingUser.password = hashedPassword;
      await existingUser.save();
      
      console.log(`Password updated for user '${NEW_USERNAME}'`);
    } else {
      console.log(`Creating new user '${NEW_USERNAME}'...`);
      
      // Create a new user with the specified credentials
      const newUser = new User({
        username: NEW_USERNAME,
        password: NEW_PASSWORD, // Will be hashed by the pre-save hook in the User model
        name: DISPLAY_NAME,
        role: USER_ROLE
      });
      
      await newUser.save();
      console.log(`User '${NEW_USERNAME}' created successfully with role: ${USER_ROLE}`);
    }
    
    console.log('\n===== LOGIN CREDENTIALS =====');
    console.log(`Username: ${NEW_USERNAME}`);
    console.log(`Password: ${NEW_PASSWORD}`);
    console.log('=============================\n');
    
    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
addWebsiteUser();
