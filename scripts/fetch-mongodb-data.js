const { MongoClient } = require('mongodb');
const config = require('../config');
const fs = require('fs');
const path = require('path');

async function fetchMongoDBData() {
  const client = new MongoClient(config.MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB successfully');

    const db = client.db('pos-database');
    
    // Create backup directory
    const backupDir = path.join(__dirname, '../database-backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log('Collections found:', collections.map(c => c.name));

    // Fetch data from each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      const data = await db.collection(collectionName).find({}).toArray();
      
      // Save to JSON file
      const filePath = path.join(backupDir, `${collectionName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Saved ${data.length} documents from ${collectionName}`);
    }

    console.log('Data fetch completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fetchMongoDBData(); 