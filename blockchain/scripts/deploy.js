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

  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 