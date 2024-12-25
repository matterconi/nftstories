const Grant = require('../../models/Grant');
const Address = require('../../models/Address');

// Predefined URIs and Metadata
const ALLOWANCE_METADATA = {
  1: {
    uri: "https://beige-advisory-marten-375.mypinata.cloud/ipfs/QmQtmNHkZgJqChtamNRMSqzDNDZBudfeQw6mtGR9nsY6Bg",
    name: "Novice pack",
    description: "Step into the world of NFTs with 3 exclusive mints to start shaping your collection. Perfect for testing the waters and discovering your unique style.",
    image: "https://gateway.pinata.cloud/ipfs/QmTAQvhe13fx7mqM4MwKjCkwcJosHJw3ctoPRW1dsLT5Rk",
  },
  2: {
    uri: "https://beige-advisory-marten-375.mypinata.cloud/ipfs/QmeLdBHaCWzxgo4VFxQehmqGiwr9jQWPybJamJZobxyTXC",
    name: "Intermediate bundle",
    description: "Build momentum with 5 mints to expand your gallery and bring your vision to life. For the enthusiast ready to create a presence on the marketplace.",
    image: "https://gateway.pinata.cloud/ipfs/QmXqU3zuzFYNVPBqQi9WWZWHjZVEoJXaYtAkAEPRDTG4Ts",
  },
  3: {
    uri: "https://beige-advisory-marten-375.mypinata.cloud/ipfs/QmdnBHaztJGTQ87qi8u8sA7AEfWJVWwLweFextXHJL32aV",
    name: "Master set",
    description: "Unleash your expertise with 10 NFTs to mint. This pro pack is designed for serious collectors ready to leave their mark on the marketplace.",
    image: "https://gateway.pinata.cloud/ipfs/QmZBT4Um8c86dhHJhoSo4QHKtty7zxNaj1tK6V3zbUbop2",
  },
};

const handleGrantMinted = async (args) => {
  const [id, owner, allowance] = args;

  const grantIdNum = Number(id); // Convert BigInt to a regular number
  const allowanceNum = Number(allowance); // Ensure allowance is a number

  try {
    // Get metadata based on the allowance
    const metadata = ALLOWANCE_METADATA[allowanceNum];
    if (!metadata) {
      throw new Error(`Invalid allowance: ${allowanceNum}. No metadata found.`);
    }

    // Step 1: Create a new Grant in the database
    const grant = await Grant.create({
      owner,
      id: grantIdNum,
      allowance: allowanceNum,
      uri: metadata.uri,
      metadata: {
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
      },
    });

    console.log(`Grant created: ID ${grantIdNum}, owned by ${owner}, URI: ${metadata.uri}`);

    // Step 2: Add the Grant to the owner's address profile
    let ownerAddress = await Address.findOne({ account: owner }).lean();

    if (!ownerAddress) {
      console.log(`Creating new address profile for owner: ${owner}`);
      await Address.create({
        account: owner,
        profile: { account: owner },
        grants: [grant._id], // Add the newly created grant's ID
      });
    } else {
      await Address.updateOne(
        { account: owner },
        { $addToSet: { grants: grant._id } } // Add to `grants` if not already present
      );
    }

    console.log(`Grant ID ${grantIdNum} added to owner's profile`);

  } catch (err) {
    console.error('Error handling GrantMinted event:', err);
  }
};

module.exports = handleGrantMinted;
