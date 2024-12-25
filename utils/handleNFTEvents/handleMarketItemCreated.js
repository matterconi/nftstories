const NFT = require('../../models/NFT');
const Grant = require('../../models/Grant');
const Address = require('../../models/Address');
const axios = require('axios');

// Track processed items to avoid concurrent processing
const processedItems = new Set();

const handleMarketItemCreated = async (args, contract) => {
  const [tokenId, seller, owner, price, isSold] = args;
  const tokenIdNum = Number(tokenId); // Convert BigInt to a regular number

  if (processedItems.has(tokenIdNum)) {
    console.log(`Token ID ${tokenIdNum} is already being processed. Skipping.`);
    return;
  }

  // Mark as processing
  processedItems.add(tokenIdNum);

  try {
    // Step 1: Find or create the NFT in the database
    let nft = await NFT.findOne({ tokenId: tokenIdNum });

    if (!nft) {
      console.log(`NFT with Token ID ${tokenIdNum} not found. Creating a new entry.`);
      nft = new NFT({ tokenId: tokenIdNum });
    }

    // Step 2: Fetch the tokenURI if not already set
    let tokenURI = nft.tokenURI;
    if (!tokenURI) {
      try {
        tokenURI = await contract.tokenURI(tokenIdNum);
        nft.tokenURI = tokenURI;
      } catch (err) {
        console.error(`Error fetching tokenURI for Token ID ${tokenIdNum}:`, err);
        return;
      }
    }

    // Step 3: Fetch metadata if not already set
    let metadata = nft.metadata || {};
    if (!metadata.name || !metadata.description || !metadata.image) {
      try {
        const { data } = await axios.get(tokenURI);
        metadata = {
          image: data.image || '',
          name: data.name || '',
          description: data.description || '',
        };
        nft.metadata = metadata;
      } catch (err) {
        console.warn(`Failed to fetch metadata for Token ID ${tokenIdNum} from URI: ${tokenURI}`, err);
      }
    }

    // Step 4: Update the NFT details
    nft.seller = seller;
    nft.owner = owner;
    nft.price = Number(price); // Convert BigInt to a regular number
    nft.isSold = isSold;
    await nft.save();

    console.log(`NFT updated: Token ID ${tokenIdNum}, listed by ${seller}`);

    // Step 5: Update the seller's `nftListed` array
    const address = await Address.findOneAndUpdate(
      { account: seller },
      { $addToSet: { nftListed: nft._id } }, // Add to `nftListed` if not already present
      { new: true, upsert: true } // Create the Address document if it doesn't exist
    );

    console.log(`Token ID ${tokenIdNum} added to seller's listed tokens`);

    // Step 6: Decrease the allowance of the seller's first grant
    if (address.grants.length > 0) {
      const grantId = address.grants[0]; // Use the first grant ID
      const grant = await Grant.findById(grantId);

      if (grant && grant.allowance > 0) {
        grant.allowance -= 1; // Decrease the allowance
        await grant.save();
        console.log(`Grant ID ${grant.id} allowance decreased. New allowance: ${grant.allowance}`);
      } else {
        console.warn(`Grant ID ${grantId} not found or allowance is already zero.`);
      }
    } else {
      console.warn(`Seller has no grants to decrease allowance.`);
    }
  } catch (err) {
    console.error(`Error handling MarketItemCreated event for Token ID ${tokenIdNum}:`, err);
  } finally {
    // Ensure processing state is cleared
    processedItems.delete(tokenIdNum);
  }
};

module.exports = handleMarketItemCreated;
