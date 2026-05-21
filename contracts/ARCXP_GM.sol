// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ARCXP GM (Daily on-chain GM for ARC Testnet)
/// @notice One GM per wallet every 24 hours. Free, user pays gas only.
///         Tracks per-wallet streak, last GM timestamp, total GMs, and
///         daily GM count keyed by UTC day. No owner, no admin keys.
contract ARCXP_GM {
    uint256 public constant COOLDOWN = 24 hours;

    struct GMData {
        uint64 lastGM;       // unix seconds
        uint32 streak;       // consecutive days (resets if > 48h gap)
        uint32 totalGMs;     // lifetime GMs for this wallet
    }

    mapping(address => GMData) public gmOf;
    mapping(uint256 => uint256) public dailyCount; // utcDay => count

    uint256 public totalGMs;
    uint256 public uniqueWallets;

    event GM(address indexed wallet, uint64 timestamp, uint32 streak, uint32 totalForWallet, uint256 utcDay);

    /// @notice Say GM. Reverts if called again within 24h by same wallet.
    function sayGM() external {
        require(tx.origin == msg.sender, "No contracts");
        GMData memory d = gmOf[msg.sender];
        uint64 nowTs = uint64(block.timestamp);
        require(nowTs >= d.lastGM + COOLDOWN, "Cooldown active");

        // streak: +1 if within 48h, else reset to 1
        uint32 newStreak = (d.lastGM != 0 && nowTs <= d.lastGM + 2 * COOLDOWN) ? d.streak + 1 : 1;
        if (d.totalGMs == 0) uniqueWallets += 1;

        d.lastGM = nowTs;
        d.streak = newStreak;
        d.totalGMs += 1;
        gmOf[msg.sender] = d;

        uint256 day = block.timestamp / 1 days;
        dailyCount[day] += 1;
        totalGMs += 1;

        emit GM(msg.sender, nowTs, newStreak, d.totalGMs, day);
    }

    /// @notice Seconds until `wallet` can GM again (0 if available now).
    function timeUntilNextGM(address wallet) external view returns (uint256) {
        uint64 last = gmOf[wallet].lastGM;
        if (last == 0) return 0;
        uint256 next = uint256(last) + COOLDOWN;
        return block.timestamp >= next ? 0 : next - block.timestamp;
    }

    function canGM(address wallet) external view returns (bool) {
        uint64 last = gmOf[wallet].lastGM;
        return last == 0 || block.timestamp >= uint256(last) + COOLDOWN;
    }

    function lastGM(address wallet) external view returns (uint64) { return gmOf[wallet].lastGM; }
    function streakOf(address wallet) external view returns (uint32) { return gmOf[wallet].streak; }
    function totalGMsOf(address wallet) external view returns (uint32) { return gmOf[wallet].totalGMs; }

    /// @notice Today's GM count (UTC).
    function todayCount() external view returns (uint256) {
        return dailyCount[block.timestamp / 1 days];
    }
}