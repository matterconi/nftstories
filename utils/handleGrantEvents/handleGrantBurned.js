const Grant = require('../../models/Grant');
const Address = require('../../models/Address');

const handleGrantBurned = async (args) => {
  const [id, owner] = args;

  const grantIdNum = Number(id); // Convert BigInt to a regular number

  try {
    // Step 1: Find and delete the burned grant
    const grant = await Grant.findOne({ id: grantIdNum });
    if (!grant) {
      console.warn(`Grant with ID ${grantIdNum} not found in database`);
      return;
    }

    await Grant.deleteOne({ id: grantIdNum });
    console.log(`Grant with ID ${grantIdNum} deleted from database`);

    // Step 2: Remove the grant's reference from the owner's profile
    await Address.updateOne(
      { account: owner },
      { $pull: { grants: grant._id } } // Remove the grant's ObjectId from the owner's grants array
    );

    console.log(`Grant ID ${grantIdNum} removed from owner's profile`);

  } catch (err) {
    console.error('Error handling burned grant:', err);
  }
};

module.exports = handleGrantBurned;
