const mongoose = require('mongoose');

// Define the AddressProfile schema
const addressProfileSchema = new mongoose.Schema({
  account: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    default: '' // Default to an empty string if not provided
  },
  profileImage: { 
    type: String // Optional field
  },
  public_id: { 
    type: String 
  }, // Cloudinary public_id for efficient deletion
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Export the schema (NOT the model)
module.exports = addressProfileSchema;
