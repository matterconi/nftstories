const mongoose = require('mongoose');
require('dotenv').config();
const Address = require('./models/Address'); // Adjust the path as needed

async function updateAddressNames() {
  try {
    // Use MongoDB's `$set` to update the default name to an empty string
    const result = await Address.updateMany({ "profile.name": { $exists: true } }, { $set: { "profile.name": "" } });

    console.log(`${result.modifiedCount} addresses have been updated to set default name to an empty string.`);
    process.exit();
  } catch (error) {
    console.error('Error updating address names:', error);
    process.exit(1);
  }
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected successfully');
    await updateAddressNames();
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

connectDB();

