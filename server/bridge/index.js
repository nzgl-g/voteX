/**
 * Blockchain Bridge Module
 * Initializes the blockchain bridge module
 */

const routes = require("./routes");
const blockchainService = require("./blockchain-service");
const metadataService = require("./metadata-service");
const config = require("./config");

/**
 * Initialize the blockchain bridge module
 * @param {Object} app Express application
 */
function initializeBridge(app) {
  // Initialize blockchain service when the app starts
  blockchainService.initialize()
    .then(isInitialized => {
      if (isInitialized) {
        console.log("Blockchain bridge initialized successfully");
      } else {
        console.warn("Blockchain bridge initialization failed. Some functionality may be unavailable.");
      }
    })
    .catch(error => {
      console.error("Error initializing blockchain bridge:", error);
    });
  
  // Register routes
  app.use("/blockchain", routes);
  
  console.log("Blockchain bridge routes registered");
}

module.exports = {
  initializeBridge,
  routes,
  blockchainService,
  metadataService,
  config
}; 