/**
 * Sample Server Script
 * 
 * This script demonstrates how to use the blockchain bridge in a standalone server.
 * It can be used for testing and development purposes.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bridgeRouter = require('./index');
const { utils } = require('./index');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Use bridge router
app.use('/api/blockchain', bridgeRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Blockchain Bridge API',
    status: 'running',
    endpoints: {
      status: '/api/blockchain/status',
      sessions: '/api/blockchain/sessions',
      vote: '/api/blockchain/vote'
    }
  });
});

// Initialize blockchain connection on startup if environment variables are set
const { BLOCKCHAIN_PRIVATE_KEY, CONTRACT_ADDRESS, PROVIDER_URL } = process.env;

if (BLOCKCHAIN_PRIVATE_KEY) {
  utils.blockchainConnector.initialize({
    privateKey: BLOCKCHAIN_PRIVATE_KEY,
    contractAddress: CONTRACT_ADDRESS,
    providerUrl: PROVIDER_URL
  })
    .then(() => {
      console.log('Blockchain connection initialized successfully');
    })
    .catch((error) => {
      console.error('Failed to initialize blockchain connection:', error);
    });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 