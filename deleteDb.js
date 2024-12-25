const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Function to drop all collections and completely erase the database
 */
async function eraseDatabase() {
  try {
    const db = mongoose.connection;

    const collections = await db.db.listCollections().toArray();
    for (const collection of collections) {
      await db.dropCollection(collection.name);
      console.log(`Dropped collection: ${collection.name}`);
    }

    console.log('Database erased successfully.');
  } catch (error) {
    console.error('Error erasing the database:', error.message);
  }
}

/**
 * Main function to connect to MongoDB and erase the database
 */
async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');

    await eraseDatabase();

    process.exit(0);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}

main();
