const NFT = require('../../models/NFT');
const Address = require('../../models/Address');

const activeTransfers = new Set();

const handleTransfer = async (args) => {
  const [from, to, tokenId] = args;
  const tokenIdNum = Number(tokenId);

  // Ignore minting events (from address is 0x0)
  if (from === '0x0000000000000000000000000000000000000000') {
    console.log(`Minting detected for Token ID: ${tokenIdNum}`);
    return;
  }

  if (to === '0x0000000000000000000000000000000000000000') {
    console.log(`Burn detected for Token ID: ${tokenIdNum}`);
    return;
  }

  // Check if this token is already being processed to avoid race conditions
  if (activeTransfers.has(tokenIdNum)) {
    console.log(`Token ID ${tokenIdNum} is already being processed.`);
    return;
  }

  // Add tokenId to active set to prevent duplicate processing
  activeTransfers.add(tokenIdNum);

  try {
    // Step 1: Check if the NFT already exists using lean() for faster reads
    let nft = await NFT.findOne({ tokenId: tokenIdNum }).lean();

    if (!nft) {
      console.log(`Creating new NFT for Token ID ${tokenIdNum}`);
      nft = await NFT.create({ tokenId: tokenIdNum, owner: to });
    } else {
      if (nft.owner !== to) {
        console.log(`Updating owner for Token ID ${tokenIdNum} to ${to}`);
        await NFT.updateOne({ tokenId: tokenIdNum }, { owner: to });
      }
    }

    // Step 2: Check if the "from" address exists, if not create it
    if (from !== '0x0000000000000000000000000000000000000000') {
      let fromAddress = await Address.findOne({ account: from }).lean();
      if (!fromAddress) {
        console.log(`Creating new address for account: ${from}`);
        await Address.create({ account: from, profile: { account: from } });
      }
      await Address.updateOne(
        { account: from },
        { $pull: { nftOwned: nft._id } }
      );
    }

    // Step 3: Check if the "to" address exists, if not create it
    let toAddress = await Address.findOne({ account: to }).lean();
    if (!toAddress) {
      console.log(`Creating new address for account: ${to}`);
      await Address.create({ account: to, profile: { account: to } });
    }
    await Address.updateOne(
      { account: to },
      { $push: { nftOwned: nft._id } }
    );

    console.log(`NFT transfer handled successfully for Token ID ${tokenIdNum}`);
  } catch (err) {
    console.error('Error handling Transfer event:', err);
  } finally {
    // Remove the tokenId from the active set
    activeTransfers.delete(tokenIdNum);
  }
};

module.exports = handleTransfer;
