// Deploy script for VotingSystem contract
const hre = require("hardhat");

async function main() {
  try {
    console.log("Starting deployment process...");
    
    // Get deployer account
    let deployer;
    try {
      const signers = await hre.ethers.getSigners();
      if (signers.length === 0) {
        throw new Error("No signers available. Make sure your network configuration is correct.");
      }
      deployer = signers[0];
      console.log("Deploying contracts with the account:", deployer.address);
      
      // Get the balance using ethers provider
      const provider = hre.ethers.provider;
      const balance = await provider.getBalance(deployer.address);
      console.log("Account balance:", balance.toString());
    } catch (error) {
      console.error("Error getting signers:", error);
      throw error;
    }

    // Deploy VotingSystem
    console.log("Creating contract factory...");
    const VotingSystem = await hre.ethers.getContractFactory("VotingSystem");
    
    console.log("Deploying contract...");
    const votingSystem = await VotingSystem.deploy();

    console.log("Waiting for deployment transaction...");
    await votingSystem.waitForDeployment();
    
    console.log("Getting contract address...");
    const votingSystemAddress = await votingSystem.getAddress();

    console.log("VotingSystem deployed to:", votingSystemAddress);
    
    // Save the contract address to a file for easy access
    const fs = require("fs");
    const contractsDir = __dirname + "/../contracts_info";
    
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir);
    }
    
    fs.writeFileSync(
      contractsDir + "/contract-address.json",
      JSON.stringify({ VotingSystem: votingSystemAddress }, null, 2)
    );
    
    // Also save the contract's ABI
    console.log("Saving contract ABI...");
    const VotingSystemArtifact = require("../artifacts/contracts/VotingSystem.sol/VotingSystem.json");
    fs.writeFileSync(
      contractsDir + "/VotingSystem.json",
      JSON.stringify(VotingSystemArtifact, null, 2)
    );

    console.log("Contract address and ABI saved to", contractsDir);
  } catch (error) {
    console.error("Error during deployment:", error);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

// Run the deployment process directly
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  }); 