# ARCXP (AXP) — ERC-721 on ARC Testnet

Production-grade ERC-721 for the ARCXP genesis drop.

- Name: **ARCXP** · Symbol: **AXP** · Standard: **ERC-721**
- Max supply: **3,000** · Max per wallet: **3** · Per tx: **1**
- Free mint — user pays ARC Testnet gas
- Same image for every token (shared `tokenURI`)
- Network: ARC Testnet · Chain ID `5042002` · RPC `https://rpc.testnet.arc.network` · Explorer `https://testnet.arcscan.app`

## 1. Upload artwork + metadata

1. Upload `src/assets/arcxp-nft.jpg` to IPFS (e.g. Pinata / nft.storage). Note the image CID.
2. Copy `metadata.example.json` → `metadata.json`, replace the `image` field with `ipfs://<image-cid>/arcxp-nft.jpg`.
3. Upload `metadata.json` to IPFS. Note the metadata CID — this is your `TOKEN_URI`,
   e.g. `ipfs://<metadata-cid>/metadata.json`.

## 2. Install Hardhat (one-time)

```bash
cd contracts
npm init -y
npm i -D hardhat @nomicfoundation/hardhat-toolbox dotenv
npm i @openzeppelin/contracts
# rename hardhat.config.cjs → hardhat.config.js if your package.json has "type":"module" issues
```

Create `contracts/.env`:

```
PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
TOKEN_URI=ipfs://YOUR_METADATA_CID/metadata.json
```

Fund the deployer with ARC Testnet gas.

## 3. Compile + deploy

```bash
npx hardhat compile
npx hardhat run scripts/deploy.cjs --network arcTestnet
```

You'll see:

```
ARCXP deployed to: 0xabc...123
```

## 4. Wire the frontend

Add the deployed address to your root `.env` (Lovable env or local `.env`):

```
VITE_ARCXP_CONTRACT=0xabc...123
```

Redeploy / refresh the site. The Mint page will read on-chain `totalMinted`,
`mintedPerWallet`, and call `mint()` via MetaMask on ARC Testnet.

## Contract surface

- `mint()` — mints exactly 1 NFT to `msg.sender`. Enforces wallet cap, supply cap, EOA-only.
- `totalMinted() → uint256`
- `remainingSupply() → uint256`
- `remainingForWallet(address) → uint256`
- `mintedPerWallet(address) → uint256`
- `MAX_SUPPLY` / `MAX_PER_WALLET`
- Owner: `setMintActive(bool)`, `setTokenURI(string)`
