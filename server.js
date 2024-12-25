require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Importing the CORS middleware
const connectDB = require('./db/connect');
const routes = require('./routes/routes');
const { startListening } = require('./reservoirListener'); // Start WebSocket listener for other functionalities
const setupWebSocket = require('./webSocket'); // Import the WebSocket setup for profile updates
const { WebSocketProvider } = require('ethers');
const http = require('http'); // For combining Express and WebSocket on one server

const app = express();
const PORT = process.env.PORT || 4000;
const RESERVOIR_WS = process.env.RESERVOIR_WS;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow both origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
  credentials: true // Allow cookies and other credentials
}));

app.use(express.json());

// Add `broadcastProfileUpdate` middleware only for the '/api/upload-profile' route
app.use('/api/upload-profile', (req, res, next) => {
  console.log('Middleware attaching broadcastProfileUpdate...');
  req.broadcastProfileUpdate = broadcastProfileUpdate;
  console.log('Attached:', typeof req.broadcastProfileUpdate);
  next();
});

// Add your routes
app.use(routes);

// Connect to MongoDB
connectDB();

// Create an HTTP server for Express and WebSocket
const server = http.createServer(app);

// Set up the WebSocket server
const { broadcastProfileUpdate } = setupWebSocket(server); // WebSocket for profile updates

// Set up the Reservoir WebSocket provider
let provider;
try {
  provider = new WebSocketProvider(RESERVOIR_WS);
  console.log('WebSocket provider set up successfully');
} catch (error) {
  console.error('Failed to set up WebSocket provider:', error.message);
}

// Start listening for blockchain events using the Reservoir listener
if (provider) {
  startListening(); // Keep the Reservoir WebSocket listener active
}

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
