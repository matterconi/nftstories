require('dotenv').config();
const { WebSocketProvider } = require('ethers');

const RESERVOIR_WS = process.env.RESERVOIR_WS;

// Function to set up the WebSocket provider
const setupProvider = () => {
  const provider = new WebSocketProvider(RESERVOIR_WS);

  console.log('WebSocket provider set up successfully');
  
  handleProviderErrors(provider);

  return provider;
};

// Handle provider errors and reconnection
const handleProviderErrors = (provider) => {
  provider.websocket.on('error', (err) => {
    console.error('WebSocket Error:', err);
    provider.websocket.terminate();
    reconnectProvider();
  });

  provider.websocket.on('close', () => {
    console.log('WebSocket closed, reconnecting...');
    reconnectProvider();
  });
};

// Function to reconnect the WebSocket provider
const reconnectProvider = () => {
  setTimeout(() => {
    console.log('Reconnecting WebSocket provider...');
    setupProvider();
  }, 1000);
};

module.exports = { setupProvider };
