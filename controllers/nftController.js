const NFT = require('../models/NFT');
const User = require('../models/User');
const pusher = require('../pusher');

const handleTransferEvent = async (from, to, tokenId) => {
  try {
    // Update the owner of the NFT
    await NFT.findOneAndUpdate({ tokenId }, { owner: to });

    // Remove the NFT from the previous owner's collection
    await User.updateOne({ address: from }, { $pull: { nftsOwned: tokenId } });

    // Add the NFT to the new owner's collection
    await User.updateOne({ address: to }, { $addToSet: { nftsOwned: tokenId } });

    // Send real-time updates via Pusher
    pusher.trigger('nft-channel', 'transfer-event', {
      tokenId,
      from,
      to,
    });

    console.log(`NFT with tokenId ${tokenId} transferred from ${from} to ${to}`);
  } catch (error) {
    console.error('Error handling transfer event:', error);
  }
};

module.exports = { handleTransferEvent };
