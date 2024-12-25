const abi = require('./NFTMarketplace.json').abi;
const dotenv = require('dotenv');
const updateDb = require('./utils/updateNFTDb');

const { handleTransfer, handleMarketItemCreated, handleMarketItemSold, handleMarketItemRelisted, handleMarketItemRemoved, handleMarketItemPriceUpdated, handleWithdrawFunds } = require('./utils/handleNFTEvents');

dotenv.config();

const contractAddress = process.env.ADDRESS_MARKET;

// Track currently processing transactions and logs
const processingTransactions = new Set();
const processingLogs = new Map();

const handleContract = (ws, rpcProvider, contract) => {
  ws.on('open', () => {
    console.log(`Connected to WebSocket for contract: ${contractAddress}`);

    const subscriptionMessage = JSON.stringify({
      type: 'subscribe',
      event: '*',
      filters: {
        address: contractAddress,
      },
    });

    ws.send(subscriptionMessage);
  });

  ws.on('message', async (data) => {
    try {
      const event = JSON.parse(data);

      if (event?.data?.txHash) {
        const txHash = event.data.txHash;

        // Check if the transaction is already being processed
        if (processingTransactions.has(txHash)) {
          console.log(`Transaction ${txHash} is already being processed. Skipping.`);
          return;
        }

        // Mark the transaction as processing
        processingTransactions.add(txHash);

        try {
          const txReceipt = await rpcProvider.getTransactionReceipt(txHash);

          if (txReceipt) {
            await handleTransaction(txReceipt, contract);
          } else {
            console.log('No transaction receipt found');
          }
        } catch (err) {
          console.error(`Error processing transaction ${txHash}:`, err);
        } finally {
          // Remove from processing set
          processingTransactions.delete(txHash);
        }
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  });

  ws.on('error', (err) => {
    console.error(`WebSocket Error for contract: ${contractAddress}`, err);
  });

  ws.on('close', () => {
    console.log(`WebSocket closed for contract: ${contractAddress}`);
  });
};

const handleTransaction = async (txReceipt, contract) => {
  const { logs, transactionHash } = txReceipt;

  console.log(`Processing NFT transaction: ${transactionHash}`);

  // Pass 2: Handle NFT-specific events
  for (const log of logs) {
    const parsedLog = contract.interface.parseLog(log);
    const { name, args } = parsedLog;
    try {
      switch (name) {
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
          console.warn(`Unhandled event type: ${name}`);
      }
    } catch (err) {
      console.error(`Error updating database for event ${name}:`, err);
    }
  }
};

module.exports = { contractAddress, abi, handleContract };
