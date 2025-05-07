/**
 * Status Routes
 * 
 * Express routes for blockchain connection status.
 */

const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');

/**
 * @route POST /status/initialize
 * @desc Initialize the blockchain connection
 * @access Private
 */
router.post('/initialize', async (req, res) => {
  try {
    const { privateKey, contractAddress, providerUrl } = req.body;
    
    // Validate request body
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key is required' });
    }
    
    // Call controller method
    const result = await statusController.initialize({
      privateKey,
      contractAddress,
      providerUrl
    });
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error initializing blockchain connection:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /status
 * @desc Get the blockchain connection status
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    // Call controller method
    const result = await statusController.getStatus();
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting blockchain status:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router; 