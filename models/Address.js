const mongoose = require('mongoose');
const addressProfileSchema = require('./AddressProfile'); // Importing the AddressProfile schema

// Define the Address Schema
const addressSchema = new mongoose.Schema({
  account: { 
    type: String, 
    required: true, 
    unique: true,
    set: (value) => value.toLowerCase() // Automatically convert to lowercase
  },
  profile: { 
    type: addressProfileSchema, // Embed the AddressProfile schema correctly
    default: () => ({}) // Default to an empty object if not provided
  },
  nftListed: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'NFT' // Reference to the NFT collection
  }],
  nftOwned: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'NFT' // Reference to the NFT collection
  }],
  grants: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Grant' // Reference to the Grant collection
  }],
  totalProfits: { 
    type: Number, 
    default: 0 
  }, // Track total earnings from all sales
  availableFunds: { 
    type: Number, 
    default: 0 
  }, // Track funds available for withdrawal
}, {
  timestamps: true // Automatically add createdAt and updatedAt fields
});

// Create the Address model
const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
