// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ARCXP Genesis NFT (AXP)
/// @notice ERC-721 collection for ARC Testnet. Free mint, gas paid by user.
///         Max supply 3000, max 3 per wallet, 1 NFT per transaction.
///         Same metadata for all tokens (single shared image).
contract ARCXP is ERC721, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 3000;
    uint256 public constant MAX_PER_WALLET = 3;

    uint256 private _nextId = 1;
    string private _sharedTokenURI;
    bool public mintActive = true;

    mapping(address => uint256) public mintedPerWallet;

    event Minted(address indexed to, uint256 indexed tokenId);
    event MintActiveChanged(bool active);
    event TokenURIChanged(string newURI);

    constructor(string memory initialTokenURI)
        ERC721("ARCXP", "AXP")
        Ownable(msg.sender)
    {
        _sharedTokenURI = initialTokenURI;
    }

    /// @notice Mint exactly one NFT. 1 per tx, max 3 per wallet, free + gas.
    function mint() external nonReentrant {
        require(mintActive, "Mint inactive");
        require(tx.origin == msg.sender, "No contracts");
        require(_nextId <= MAX_SUPPLY, "Sold out");
        require(mintedPerWallet[msg.sender] < MAX_PER_WALLET, "Wallet limit reached");

        uint256 tokenId = _nextId++;
        mintedPerWallet[msg.sender] += 1;
        _safeMint(msg.sender, tokenId);
        emit Minted(msg.sender, tokenId);
    }

    function totalMinted() external view returns (uint256) {
        return _nextId - 1;
    }

    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - (_nextId - 1);
    }

    function remainingForWallet(address wallet) external view returns (uint256) {
        uint256 used = mintedPerWallet[wallet];
        return used >= MAX_PER_WALLET ? 0 : MAX_PER_WALLET - used;
    }

    /// @dev All tokens share the same metadata URI (same image for all mints).
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _sharedTokenURI;
    }

    // ---- Admin ----
    function setTokenURI(string calldata newURI) external onlyOwner {
        _sharedTokenURI = newURI;
        emit TokenURIChanged(newURI);
    }

    function setMintActive(bool active) external onlyOwner {
        mintActive = active;
        emit MintActiveChanged(active);
    }
}
