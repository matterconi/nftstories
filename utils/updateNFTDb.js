const { handleTransfer, handleMarketItemCreated, handleMarketItemSold, handleMarketItemRelisted, handleMarketItemRemoved, handleMarketItemPriceUpdated, handleWithdrawFunds } = require('./handleNFTEvents');

const updateDb = async (eventName, args, contract) => {
  try {
    switch (eventName) {
      case 'Transfer':
        await handleTransfer(args);
        break;
      case 'MarketItemCreated':
        await handleMarketItemCreated(args, contract);
        break;
      case 'MarketItemSold':
        await handleMarketItemSold(args);
        break;
      case 'MarketItemRelisted':
        await handleMarketItemRelisted(args);
        break;
      case 'MarketItemRemoved':
        await handleMarketItemRemoved(args);
        break;
      case 'MarketItemPriceUpdated':
        await handleMarketItemPriceUpdated(args);
        break;
      case 'FeesWithdrawn':
        await handleWithdrawFunds(args);
        break;
      default:
        console.warn(`Unhandled event type: ${eventName}`);
    }
  } catch (err) {
    console.error(`Error updating database for event ${eventName}:`, err);
  }
};

module.exports = updateDb;
