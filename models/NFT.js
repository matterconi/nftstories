const mongoose = require('mongoose');

const NFTSchema = new mongoose.Schema({
  tokenId: { type: Number, required: true, unique: true },
  owner: { type: String, required: true },
  seller: { type: String, default: null },
  price: { type: String, default: null },
  metadata: {
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
  },
  tokenURI: { type: String, default: '' },
  isSold: { type: Boolean, default: false },
}, {
  timestamps: true,
});

module.exports = mongoose.models.NFT || mongoose.model('NFT', NFTSchema);
