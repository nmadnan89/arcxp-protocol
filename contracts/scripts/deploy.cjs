const hre = require("hardhat");

async function main() {
  const tokenURI = process.env.TOKEN_URI || "ipfs://REPLACE_ME/metadata.json";
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Factory = await hre.ethers.getContractFactory("ARCXP");
  const contract = await Factory.deploy(tokenURI);
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log("ARCXP deployed to:", addr);
  console.log("Explorer:", `https://testnet.arcscan.app/address/${addr}`);
  console.log("Set VITE_ARCXP_CONTRACT in your .env to:", addr);
}

main().catch((e) => { console.error(e); process.exit(1); });
