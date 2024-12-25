const NFT = require('../../models/NFT');
const Address = require('../../models/Address');

const handleMarketItemRemoved = async (args) => {
  const [tokenId, seller] = args;
  const tokenIdNum = Number(tokenId);

  try {
    // Step 1: Find the existing NFT in the database
    const nft = await NFT.findOne({ tokenId: tokenIdNum });

    if (!nft) {
      console.error(`NFT with Token ID ${tokenIdNum} not found during MarketItemRemoved event`);
      return;
    }

    // Step 2: Update the NFT details
    nft.seller = null;
    nft.price = 0;
    nft.isSold = false;
    await nft.save();

    console.log(`NFT with Token ID ${tokenIdNum} removed from sale.`);

    // Step 3: Remove the NFT from the seller's listed NFTs
    await Address.updateOne(
      { account: seller },
      { $pull: { nftListed: nft._id } }
    );

    console.log(`NFT with Token ID ${tokenIdNum} removed from seller's listings.`);

  } catch (err) {
    console.error('Error handling MarketItemRemoved event:', err);
  }
};

module.exports = handleMarketItemRemoved;
