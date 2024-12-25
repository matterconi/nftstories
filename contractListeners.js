const { Contract } = require('ethers');
const contractData = require('./NFTMarketplace.json'); // Import the JSON file
const abi = contractData.abi; // Extract the ABI from the JSON

// Contract instance
let contract;

const setupContractListeners = (provider, contractAddress) => {
  if (!provider) {
    console.error('Provider is not set up yet.');
    return;
  }

  if (!contractAddress) {
    console.error('Contract address is not provided.');
    return;
  }

  try {
    // Initialize the contract with the correct ABI
    contract = new Contract(contractAddress, abi, provider);
    console.log(`Contract set up for address: ${contract.target}`);
    listenToContractEvents();
  } catch (error) {
    console.error('Failed to initialize contract:', error.message);
    return;
  }
};

// General event listener function
const listenToContractEvents = () => {
  if (!contract) {
    console.error('Contract is not initialized.');
    return;
  }

  console.log(`Listening to all contract events on: ${contract.target}`);

  const handleTransfer = (from, to, tokenId, event) => {
    console.log(`Transfer detected from ${from} to ${to} for token ID: ${tokenId}`);
    console.log('Full event details:', event);
  };
  
  contract.on('Transfer', handleTransfer)
    .then(() => {
      console.log('Transfer event listener set up successfully');
    })
    .catch((error) => {
      console.error('Failed to set up listener:', error);
    });

};

module.exports = { setupContractListeners };
