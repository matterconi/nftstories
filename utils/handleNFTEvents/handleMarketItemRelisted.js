const NFT = require('../../models/NFT');
const Address = require('../../models/Address');

const handleMarketItemRelisted = async (args) => {
  const [tokenId, seller, price] = args;
  const tokenIdNum = Number(tokenId);

  try {
    // Step 1: Find the existing NFT in the database
    let nft = await NFT.findOne({ tokenId: tokenIdNum });

    if (!nft) {
      console.error(`NFT with Token ID ${tokenIdNum} not found during MarketItemRelisted event`);
      return;
    }

    // Step 2: Update the NFT details
    nft.seller = seller;
    nft.price = Number(price); // Convert BigInt to a regular number
    nft.isSold = false; // Mark as not sold since it's relisted
    await nft.save();

    console.log(`NFT with Token ID ${tokenIdNum} relisted by ${seller} at price ${price}`);

    // Step 3: Add the token to the seller's `nftListed` array
    let sellerAddress = await Address.findOne({ account: seller }).lean();

    if (!sellerAddress) {
      console.log(`Creating new address profile for seller: ${seller}`);
      await Address.create({ account: seller, profile: { account: seller }, nftListed: [nft._id] });
    } else {
      await Address.updateOne(
        { account: seller },
        { $addToSet: { nftListed: nft._id } } // Add to `nftListed` if not already present
      );
    }

    console.log(`Token ID ${tokenIdNum} added to seller's listed tokens`);
  } catch (err) {
    console.error('Error handling MarketItemRelisted event:', err);
  }
};

module.exports = handleMarketItemRelisted;
