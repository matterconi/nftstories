const NFT = require('../../models/NFT');
const Address = require('../../models/Address');

const handleMarketItemSold = async (args) => {
  const [tokenId, seller, buyer, price] = args;
  const tokenIdNum = Number(tokenId);

  try {
    // Step 1: Find the existing NFT in the database
    const nft = await NFT.findOne({ tokenId: tokenIdNum });

    if (!nft) {
      console.error(`NFT with Token ID ${tokenId} not found during MarketItemSold event`);
      return;
    }

    // Step 2: Update the NFT details
    nft.seller = null;
    nft.price = null;
    nft.isSold = true;
    await nft.save();

    console.log(`NFT with Token ID ${tokenIdNum} sold. Updated details.`);

    // Step 3: Remove the NFT from the seller's listed NFTs
    await Address.updateOne(
      { account: seller },
      { $pull: { nftListed: nft._id } }
    );

    console.log(`NFT with Token ID ${tokenIdNum} removed from seller's listings.`);

  } catch (err) {
    console.error('Error handling MarketItemSold event:', err);
  }
};

module.exports = handleMarketItemSold;
