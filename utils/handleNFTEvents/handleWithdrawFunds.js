const Address = require('../../models/Address');

const handleWithdrawFunds = async (args) => {
  const [user, amount] = args;

  try {
    const amountNum = Number(amount);

    // Step 1: Find the user's address in the database
    const userAddress = await Address.findOne({ account: user });

    if (!userAddress) {
      console.error(`Address ${user} not found in database`);
      return;
    }

    // Step 2: Deduct the withdrawn amount from availableFunds
    userAddress.availableFunds -= amountNum;
    await userAddress.save();

    console.log(`Funds withdrawn successfully for ${user}, amount: ${amountNum}`);
  } catch (err) {
    console.error('Error handling FundsWithdrawn event:', err);
  }
};

module.exports = handleWithdrawFunds;
