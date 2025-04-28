const { MongoClient } = require('mongodb');
const config = require('../config');

async function showDatabaseData() {
  const client = new MongoClient(config.MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB successfully');

    const db = client.db('pos-database');
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log('\nCollections in database:');
    console.log(collections.map(c => c.name).join(', '));

    // Show data from each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      const data = await db.collection(collectionName).find({}).toArray();
      
      console.log(`\n=== ${collectionName.toUpperCase()} ===`);
      console.log(`Total documents: ${data.length}`);
      if (data.length > 0) {
        console.log('Sample document:');
        console.log(JSON.stringify(data[0], null, 2));
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

showDatabaseData(); 