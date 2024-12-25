const handleTransfer = require('./handleTransfer');
const handleMarketItemCreated = require('./handleMarketItemCreated');
const handleMarketItemSold = require('./handleMarketItemSold');
const handleMarketItemRelisted = require('./handleMarketItemRelisted');
const handleMarketItemRemoved = require('./handleMarketItemRemoved');
const handleMarketItemPriceUpdated = require('./handleMarketItemPriceUpdated');
const handleWithdrawFunds = require('./handleWithdrawFunds');

module.exports = { handleTransfer, handleMarketItemCreated, handleMarketItemSold, handleMarketItemRelisted, handleMarketItemRemoved, handleMarketItemPriceUpdated, handleWithdrawFunds };