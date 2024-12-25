const NFT = require('../../models/NFT');
const Address = require('../../models/Address');

const handleMarketItemPriceUpdated = async (args) => {
  const [tokenId, seller, newPrice] = args;
  const tokenIdNum = Number(tokenId);

  try {
    // Step 1: Find the existing NFT in the database
    const nft = await NFT.findOne({ tokenId: tokenIdNum });

    if (!nft) {
      console.error(`NFT with Token ID ${tokenId} not found during MarketItemPriceUpdated event`);
      return;
    }

    // Step 2: Ensure the seller is still correct
    if (nft.seller !== seller) {
      console.warn(`Seller mismatch for Token ID ${tokenId}. Expected: ${nft.seller}, Got: ${seller}`);
      return;
    }

    // Step 3: Update the price of the NFT
    nft.price = Number(newPrice); // Convert BigInt to a regular number
    await nft.save();

    console.log(`Price updated for NFT with Token ID ${tokenIdNum}: New Price = ${newPrice}`);
  } catch (err) {
    console.error('Error handling MarketItemPriceUpdated event:', err);
  }
};

module.exports = handleMarketItemPriceUpdated;
