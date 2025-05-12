const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Get the Contract Factories
  const VoteSessionFactory = await ethers.getContractFactory("VoteSessionFactory");
  
  // Deploy the factory contract
  console.log("Deploying VoteSessionFactory...");
  const factory = await VoteSessionFactory.deploy();
  await factory.waitForDeployment();
  
  const address = await factory.getAddress();
  console.log(`VoteSessionFactory deployed to: ${address}`);
  
  // For testing, deploy a sample voting session
  if (network.name === "localhost" || network.name === "hardhat" || network.name === "ganache") {
    console.log("\nDeploying a sample voting session for testing...");
    
    // Current timestamp
    const now = Math.floor(Date.now() / 1000);
    // Session ends in 1 day
    const endTime = now + 86400;
    
    // Sample participants
    const participants = ["Option A", "Option B", "Option C"];
    
    // Create a sample session (single vote mode)
    const tx = await factory.createVoteSession(
      1, // Session ID
      participants,
      endTime,
      0, // Single vote mode
      1 // Max choices (only relevant for multiple/ranked)
    );
    
    await tx.wait();
    console.log("Sample voting session created with ID: 1");
    
    // Get the session address
    const sessionAddress = await factory.sessions(1);
    console.log(`Session address: ${sessionAddress}`);
  }
  
  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 