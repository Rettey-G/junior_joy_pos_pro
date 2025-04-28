const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('../config');

async function fetchAllCollections() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '../database-backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Get all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Found collections:', collections.map(c => c.name));

    // Fetch data from each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
      
      // Save to JSON file
      const filePath = path.join(backupDir, `${collectionName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Saved ${data.length} documents from ${collectionName} to ${filePath}`);
    }

    console.log('Database backup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

 