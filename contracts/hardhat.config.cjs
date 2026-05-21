/**
 * Hardhat config for deploying ARCXP to ARC Testnet.
 *
 * Install (one-time, from /contracts):
 *   npm init -y
 *   npm i -D hardhat @nomicfoundation/hardhat-toolbox dotenv
 *   npm i @openzeppelin/contracts
 *
 * Create a .env file in /contracts:
 *   PRIVATE_KEY=0xyour_deployer_private_key
 *   TOKEN_URI=ipfs://<your-metadata-cid>/metadata.json
 *
 * Deploy:
 *   npx hardhat compile
 *   npx hardhat run scripts/deploy.cjs --network arcTestnet
 */
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  paths: { sources: "./", cache: "./cache", artifacts: "./artifacts" },
  networks: {
    arcTestnet: {
      url: "https://rpc.testnet.arc.network",
      chainId: 5042002,
      accounts: [PRIVATE_KEY],
    },
  },
};
