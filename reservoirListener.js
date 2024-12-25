require('dotenv').config();

const { WebSocketProvider, JsonRpcProvider, Contract } = require('ethers');
const WebSocket = require('ws');
const contract1 = require('./marketPlaceListener');
const grantListener = require('./grantListener'); // Import grantListener

// Shared provider configurations
const RESERVOIR_WS = process.env.RESERVOIR_WS;
const INFURA_RPC_URL = "https://sepolia.infura.io/v3/6c0edc89adeb43a6a30fe53157d81186";

const rpcProvider = new JsonRpcProvider(INFURA_RPC_URL);
let provider;

// List of contracts
const contracts = [
  { contractAddress: contract1.contractAddress, abi: contract1.abi, handleContract: contract1.handleContract },
  { contractAddress: grantListener.contractAddress, abi: grantListener.abi, handleContract: grantListener.handleContract },
];

// Function to start the provider and integrate contracts
const startListening = () => {
  // Initialize WebSocket provider
  provider = new WebSocketProvider(RESERVOIR_WS, 'sepolia', {
    pollingInterval: 1000,
    retryCount: 5,
    timeout: 10000,
  });

  provider.websocket.on('error', (err) => {
    console.error('WebSocket Error:', err);
    provider.websocket.terminate();
    reconnectProvider();
  });

  provider.websocket.on('close', () => {
    console.log('WebSocket closed, reconnecting...');
    reconnectProvider();
  });

  // Set up WebSocket listeners for each contract
  contracts.forEach(({ contractAddress, abi, handleContract }) => {
    const contract = new Contract(contractAddress, abi, rpcProvider);
    const ws = new WebSocket(RESERVOIR_WS);
    handleContract(ws, rpcProvider, contract);
  });

  // Shared keep-alive ping
  setInterval(() => {
    if (provider.websocket.readyState === WebSocket.OPEN) {
      provider.websocket.ping();
      console.log('Sent keep-alive ping');
    }
  }, 30000); // Ping every 30 seconds

  console.log('Provider setup complete, listening to contracts...');
};

// Reconnect the provider on error or closure
const reconnectProvider = () => {
  console.log('Attempting to reconnect...');
  setTimeout(() => {
    startListening(); // Reinitialize everything on reconnect
  }, 5000); // Retry after 5 seconds
};

// Start listening immediately when this file is run
module.exports = { startListening };
