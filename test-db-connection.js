const mongoose = require('mongoose');

// Connection string with proper credentials
const mongoURI = 'mongodb+srv://Rettey:Adhu1447@cluster0.hriuovn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully!');
    
    // List all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    console.log('Connection test completed successfully!');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  } finally {
    // Close the connection when done
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the test
connectDB(); 