const WebSocket = require('ws');

const activeSockets = new Map(); // Track connected clients

const setupWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });

  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');

    ws.on('message', (message) => {
      console.log('message: ', message)
      try {
        const data = JSON.parse(message);
        if (data.type === 'REGISTER' && data.accountId) {
          activeSockets.set(data.accountId.toLowerCase(), ws);
          console.log(`WebSocket registered for account: ${data.accountId}`);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      activeSockets.forEach((socket, accountId) => {
        if (socket === ws) {
          activeSockets.delete(accountId);
        }
      });
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('WebSocket server is set up');

  // Broadcast function for updates
  const broadcastProfileUpdate = (accountId, profile) => {
    console.log('broadcastProfileUpdate called with accountId:', accountId, 'profile:', profile);
    const ws = activeSockets.get(accountId.toLowerCase());
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log(`Broadcasting profile update to account: ${accountId}`);
      ws.send(JSON.stringify({ type: 'PROFILE_UPDATED', profile }));
    }
  };

  return { wss, broadcastProfileUpdate };
};

module.exports = setupWebSocket;
