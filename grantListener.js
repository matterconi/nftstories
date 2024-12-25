const abi = require('./GrantNFT.json').abi; // Import ABI for the Grant contract
const dotenv = require("dotenv");
const updateDb = require('./utils/updateGrantDb'); // Utility to update the database

dotenv.config();

const contractAddress = process.env.ADDRESS_GRANT; // Grant contract address

const handleContract = (ws, rpcProvider, contract) => {
  ws.on('open', () => {
    console.log(`Connected to WebSocket for Grant contract: ${contractAddress}`);

    // Subscribe to events emitted by this contract
    const subscriptionMessage = JSON.stringify({
      type: 'subscribe',
      event: '*',
      filters: {
        address: contractAddress, // Filter by the Grant contract address
      },
    });

    ws.send(subscriptionMessage);
  });

  ws.on('message', async (data) => {
    try {
      const event = JSON.parse(data);

      if (event?.data?.txHash) {
        const txHash = event.data.txHash;
        const txReceipt = await rpcProvider.getTransactionReceipt(txHash);

        if (txReceipt) {
          await handleTransaction(txReceipt, contract);
        } else {
          console.log('No transaction receipt found');
        }
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  });

  ws.on('error', (err) => {
    console.error(`WebSocket Error for Grant contract: ${contract.address}`, err);
  });

  ws.on('close', () => {
    console.log(`WebSocket closed for Grant contract: ${contract.address}`);
  });
};

const handleTransaction = async (txReceipt, contract) => {
  const { logs, transactionHash, from, to } = txReceipt;

  console.log(`Transaction Hash: ${transactionHash}`);
  console.log(`From: ${from}`);
  console.log(`To: ${to}`);

  for (const log of logs) {
    try {
      const parsedLog = contract.interface.parseLog(log);

      if (!parsedLog) {
        console.warn('Unable to parse log:', log);
        continue;
      }

      const { name, args } = parsedLog;
      console.log(`Event Name: ${name}`);
      console.log('Parsed Event:', args);

      // Example: Update database with event details
      await updateDb(name, args, contract);
    } catch (err) {
      console.error('Error parsing log:', err);
    }
  }
};

module.exports = { contractAddress, abi, handleContract };
