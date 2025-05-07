// Script to deploy the VotingFactory contract
const hre = require("hardhat");

async function main() {
  console.log("Deploying VotingFactory contract...");

  // Get the contract factory
  const VotingFactory = await hre.ethers.getContractFactory("VotingFactory");
  
  // Deploy the contract
  const factory = await VotingFactory.deploy();
  
  // Wait for deployment to finish
  await factory.deployed();
  
  console.log("VotingFactory deployed to:", factory.address);
  
  // Verify the contract on Etherscan if not on a local network
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    
    // Wait for 6 block confirmations
    await factory.deployTransaction.wait(6);
    
    // Verify contract
    console.log("Verifying contract...");
    await hre.run("verify:verify", {
      address: factory.address,
      constructorArguments: [],
    });
    
    console.log("Contract verified!");
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 