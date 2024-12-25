const express = require('express');
const NFT = require('../models/NFT');
const Address = require('../models/Address'); // Import the Address model
const Grant = require('../models/Grant'); // Import the Grant model
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Configuration
const upload = multer({ dest: 'uploads/' });

// Utility function for updating Cloudinary
const handleProfileImageUpdate = async (accountIdLower, filePath) => {
  console.log('handleProfileImageUpdate called with accountId:', accountIdLower, 'filePath:', filePath);
  const existingAddress = await Address.findOne({ account: accountIdLower });
  console.log('Existing address found:', existingAddress ? existingAddress._id : 'None');

  // Delete old profile picture if it exists
  if (existingAddress?.profile?.public_id) {
    console.log('Deleting old profile image with public_id:', existingAddress.profile.public_id);
    try {
      await cloudinary.uploader.destroy(existingAddress.profile.public_id);
      console.log('Old profile image deleted successfully');
    } catch (error) {
      console.error(`Failed to delete image with public_id: ${existingAddress.profile.public_id}`, error);
    }
  } else {
    console.log('No existing profile image to delete');
  }

  console.log('Uploading new profile picture to Cloudinary...');
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'profile-images',
  });
  console.log('Cloudinary upload result:', result);

  fs.unlinkSync(filePath); // Remove the file from the local system after upload
  console.log('Local file removed:', filePath);

  return {
    profileImage: result.secure_url,
    public_id: result.public_id,
  };
};

router.post('/api/upload-profile', upload.single('profilePic'), async (req, res) => {
  console.log('--- /api/upload-profile route hit ---');

  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    const { accountId, name } = req.body;
    if (!accountId) {
      console.log('No accountId provided, returning 400');
      return res.status(400).json({ error: 'Account ID is required' });
    }

    const accountIdLower = accountId.toLowerCase();
    console.log('Lowercased accountId:', accountIdLower);

    const updateFields = { updatedAt: new Date() };
    console.log('Initial updateFields:', updateFields);

    // Handle profile picture update if provided
    if (req.file) {
      console.log('Profile picture detected, updating...');
      try {
        const { profileImage, public_id } = await handleProfileImageUpdate(accountIdLower, req.file.path);
        updateFields['profile.profileImage'] = profileImage;
        updateFields['profile.public_id'] = public_id;
        console.log('Profile picture updated:', { profileImage, public_id });
      } catch (error) {
        console.error('Error updating profile image:', error);
        return res.status(500).json({ error: 'Failed to update profile image' });
      }
    } else {
      console.log('No profile picture provided in request');
    }

    // Handle name update if provided
    if (name) {
      console.log('Name provided, updating seller metadata:', name);
      updateFields['profile.name'] = name;

      try {
        const nftUpdateResult = await NFT.updateMany(
          { seller: accountIdLower },
          { $set: { 'sellerMetadata.name': name } }
        );
        console.log('NFTs updated for seller metadata:', nftUpdateResult);
      } catch (error) {
        console.error('Error updating NFT seller metadata:', error);
        return res.status(500).json({ error: 'Failed to update seller metadata' });
      }
    } else {
      console.log('No name provided, skipping seller metadata update');
    }

    console.log('Final updateFields before DB write:', updateFields);

    // Update the address with the provided fields
    const updatedAddress = await Address.findOneAndUpdate(
      { account: accountIdLower },
      { $set: updateFields },
      { upsert: true, new: true }
    );

    console.log('Updated address after findOneAndUpdate:', updatedAddress);

    if (!updatedAddress) {
      console.warn('No updatedAddress returned from DB. Possibly an issue with findOneAndUpdate.');
    }

    console.log('Calling broadcastProfileUpdate...');
    console.log('broadcastProfileUpdate parameters:', accountIdLower, {
      name: updatedAddress?.profile?.name,
      profileImage: updatedAddress?.profile?.profileImage,
    });

    // Broadcast profile updates via WebSocket
    req.broadcastProfileUpdate(accountIdLower, {
      name: updatedAddress?.profile?.name,
      profileImage: updatedAddress?.profile?.profileImage,
    });

    console.log('broadcastProfileUpdate called successfully. Sending response...');

    // Respond with updated profile details
    res.status(200).json({
      message: 'Profile updated successfully',
      profile: {
        name: updatedAddress?.profile?.name,
        profileImage: updatedAddress?.profile?.profileImage,
        public_id: updatedAddress?.profile?.public_id,
      },
    });

    console.log('Response sent successfully');
  } catch (error) {
    console.error('Error updating profile or NFTs:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});


/**
 * Fetch NFTs based on filters
 * 
 */

router.get('/api/nfts', async (req, res) => {
  const ALLOWED_QUERY_PARAMS = ['id', 'tokenId', 'excludeSeller', 'marketplace', 'requestMetadata']; // Add 'requestMetadata' to allowed params
  const queryParams = Object.keys(req.query);
  const invalidParams = queryParams.filter(param => !ALLOWED_QUERY_PARAMS.includes(param));

  if (invalidParams.length > 0) {
    return res.status(400).json({ error: `Unsupported query parameter(s): ${invalidParams.join(', ')}` });
  }

  const { id, tokenId, excludeSeller, marketplace, requestMetadata } = req.query;
  const filter = {};

  if (id) filter._id = id;
  if (tokenId) filter.tokenId = Number(tokenId);
  if (excludeSeller) filter.seller = { $not: new RegExp(`^${excludeSeller}$`, 'i') };
  if (marketplace === 'true') filter.owner = '0x1c187f98b1204b9a6BDFF625B6FBdf530326A120';

  try {
    const nfts = await NFT.find(filter).lean();

    if (nfts.length === 0) {
      return res.status(404).json({ message: 'No NFTs found matching the query' });
    }

    if (requestMetadata === 'true') {
      // Fetch seller metadata for each NFT
      const enrichedNFTs = await Promise.all(
        nfts.map(async (nft) => {
          const sellerMetadata = await Address.findOne({ account: nft.seller.toLowerCase() }).lean();

          return {
            ...nft,
            sellerMetadata: sellerMetadata?.profile || null,
          };
        })
      );

      return res.json(enrichedNFTs);
    }

    res.json(nfts); // Return plain NFTs if metadata isn't requested
  } catch (error) {
    console.error('Error in /api/nfts route:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Other existing routes remain unchanged
 */
router.get('/api/addresses', async (req, res) => {
  try {
    const addresses = await Address.find().lean();
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/grants', async (req, res) => {
  try {
    const grants = await Grant.find().lean();
    res.json(grants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/addresses/:account', async (req, res) => {
  try {
    const addressData = await Address.findOne({ account: req.params.account.toLowerCase() }).lean();
    if (!addressData) return res.status(404).json({ message: 'Address not found' });
    res.json(addressData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get NFTs owned by a specific account
router.get('/api/addresses/:account/nftOwned', async (req, res) => {
  try {
    const addressData = await Address.findOne({ account: req.params.account.toLowerCase() })
      .populate('nftOwned')
      .lean();

    if (!addressData || !addressData.nftOwned.length) {
      return res.status(404).json({ message: 'No NFTs owned by this address' });
    }

    res.json(addressData.nftOwned);
  } catch (error) {
    console.error('Error fetching owned NFTs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get NFTs listed by a specific account
router.get('/api/addresses/:account/nftListed', async (req, res) => {
  try {
    const addressData = await Address.findOne({ account: req.params.account.toLowerCase() })
      .populate('nftListed')
      .lean();
    if (!addressData || !addressData.nftListed.length) {
      return res.status(404).json({ message: 'No NFTs listed by this address' });
    }

    res.json(addressData.nftListed);
  } catch (error) {
    console.error('Error fetching listed NFTs:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/addresses/:account/grants', async (req, res) => {
  try {
    // Find the address by account (case-insensitive match using toLowerCase)
    const addressData = await Address.findOne({ account: req.params.account.toLowerCase() })
      .populate('grants') // Populate the grants field with full Grant documents
      .lean();

    // Check if the address exists and has grants
    if (!addressData || !addressData.grants.length) {
      return res.status(404).json({ message: 'No grants found for this address' });
    }

    // Respond with the grants
    res.json(addressData.grants);
  } catch (error) {
    console.error('Error fetching grants for address:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update the price of a specific NFT
router.put('/api/nfts/:tokenId', async (req, res) => {
  try {
    const tokenId = req.params.tokenId;

    const result = await NFT.findOneAndUpdate(
      { tokenId }, // Use tokenId as the primary key in the query
      { price: req.body.price },
      { new: true }
    );

    if (!result) {
      return res.status(404).send('NFT not found');
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating NFT price:', error);
    res.status(500).send('Error updating NFT price');
  }
});


module.exports = router;
