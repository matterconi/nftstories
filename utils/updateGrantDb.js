const { handleGrantMinted, handleGrantBurned } = require('./handleGrantEvents');

const updateDb = async (eventName, args, contract) => {
  try {
    switch (eventName) {
      case 'GrantMinted':
        await handleGrantMinted(args, contract);
        break;
      case 'Transfer': {
        const [from, to, tokenId] = args;
        const nullAddress = '0x0000000000000000000000000000000000000000';

        if (to === nullAddress) {
          // Handle the burned case
          await handleGrantBurned([tokenId, from]);
        }
        break;
      }
      // Add more event handlers as needed
    }
  } catch (error) {
    console.error(`Error processing event ${eventName}:`, error);
  }
};

module.exports = updateDb;
