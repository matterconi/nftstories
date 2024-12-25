const mongoose = require('mongoose');

const grantSchema = new mongoose.Schema({
  owner: { 
    type: String, 
    required: true 
  },
  id: { 
    type: Number, 
    required: true, 
    unique: true 
  },
  uri: { 
    type: String, 
    required: false // Initially not set, can be updated later
  },
  allowance: { 
    type: Number, 
    required: true 
  },
  metadata: {
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
  },
  tier: {
    type: Number,
    default: 1, // Default to Tier 1 if not provided
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Create a model based on the schema
const Grant = mongoose.model('Grant', grantSchema);

module.exports = Grant;
