export const currentUser = {
  username: "0xNova",
  handle: "@nova_arc",
  avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=Nova&backgroundColor=8b5cf6,3b82f6",
  totalPoints: 12_480,
  rank: 7,
  streak: 24,
  badgesEarned: 9,
  joined: "Jan 2024",
};

export const recentActivity = [
  { id: 1, action: "Completed daily task", detail: "Retweet ARC announcement", points: 50, time: "2h ago" },
  { id: 2, action: "Badge unlocked", detail: "Streak Master 🔥", points: 200, time: "1d ago" },
  { id: 3, action: "Attended event", detail: "Twitter Space: Layer 2 Future", points: 150, time: "2d ago" },
  { id: 4, action: "Referred a friend", detail: "@neocrypto joined", points: 300, time: "3d ago" },
  { id: 5, action: "Quiz complete", detail: "DeFi 101 — perfect score", points: 120, time: "4d ago" },
];

export const dailyTasks = [
  { id: 1, title: "Check in to ARC", points: 20, done: true },
  { id: 2, title: "Share a community post", points: 50, done: true },
  { id: 3, title: "Comment on Discord thread", points: 30, done: false },
  { id: 4, title: "Invite a friend", points: 100, done: false },
  { id: 5, title: "Complete weekly quiz", points: 80, done: false },
];

export const upcomingEvents = [
  { id: 1, title: "ARC Genesis Twitter Space", type: "Twitter Space", date: "May 18, 2026 · 6PM UTC", host: "@arc_network", going: 1240 },
  { id: 2, title: "Web3 Builders Webinar", type: "Webinar", date: "May 22, 2026 · 4PM UTC", host: "Vitalik B.", going: 3200 },
  { id: 3, title: "Community AMA", type: "AMA", date: "May 25, 2026 · 7PM UTC", host: "ARC Core Team", going: 890 },
  { id: 4, title: "Hackathon Kickoff", type: "Event", date: "Jun 1, 2026 · All day", host: "ARC Foundation", going: 5400 },
  { id: 5, title: "NFT Drop Showcase", type: "Twitter Space", date: "Jun 5, 2026 · 5PM UTC", host: "@nft_collective", going: 760 },
  { id: 6, title: "Layer 2 Deep Dive", type: "Webinar", date: "Jun 10, 2026 · 3PM UTC", host: "ARC Research", going: 1890 },
];

export const leaderboard = [
  { rank: 1, name: "CryptoKing", points: 48_920, avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=King&backgroundColor=3b82f6,8b5cf6" },
  { rank: 2, name: "DeFiQueen", points: 42_110, avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=Queen&backgroundColor=ec4899,8b5cf6" },
  { rank: 3, name: "ChainWizard", points: 39_540, avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=Wizard&backgroundColor=06b6d4,3b82f6" },
  { rank: 4, name: "NFTHunter", points: 31_200, avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=Hunter&backgroundColor=8b5cf6" },
  { rank: 5, name: "MetaMaker", points: 28_850, avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=Maker&backgroundColor=10b981,3b82f6" },
  { rank: 6, name: "BlockBard", points: 19_400, avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=Bard&backgroundColor=f59e0b,ec4899" },
  { rank: 7, name: "0xNova", points: 12_480, avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=Nova&backgroundColor=8b5cf6,3b82f6" },
  { rank: 8, name: "PixelPunk", points: 11_220, avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=Punk&backgroundColor=ef4444,8b5cf6" },
  { rank: 9, name: "ZeroKnight", points: 10_010, avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=Knight&backgroundColor=3b82f6" },
  { rank: 10, name: "GasGuru", points: 9_540, avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=Guru&backgroundColor=06b6d4,10b981" },
];

export const badges = [
  { id: 1, name: "First Steps", desc: "Joined the ARC community", icon: "🚀", unlocked: true, progress: 100 },
  { id: 2, name: "Streak Master", desc: "Maintain a 7-day streak", icon: "🔥", unlocked: true, progress: 100 },
  { id: 3, name: "Social Butterfly", desc: "Share 10 posts", icon: "🦋", unlocked: true, progress: 100 },
  { id: 4, name: "Event Hopper", desc: "Attend 5 community events", icon: "🎟️", unlocked: true, progress: 100 },
  { id: 5, name: "DeFi Scholar", desc: "Complete DeFi quiz series", icon: "🎓", unlocked: true, progress: 100 },
  { id: 6, name: "Inviter", desc: "Refer 3 friends", icon: "🤝", unlocked: true, progress: 100 },
  { id: 7, name: "OG Member", desc: "Member for 6+ months", icon: "💎", unlocked: true, progress: 100 },
  { id: 8, name: "Top Voter", desc: "Vote in 10 governance proposals", icon: "🗳️", unlocked: true, progress: 100 },
  { id: 9, name: "Quiz Champion", desc: "Score 100% on 5 quizzes", icon: "🏆", unlocked: true, progress: 100 },
  { id: 10, name: "Whale", desc: "Earn 25,000 points", icon: "🐋", unlocked: false, progress: 50 },
  { id: 11, name: "Influencer", desc: "Refer 25 friends", icon: "📣", unlocked: false, progress: 32 },
  { id: 12, name: "Legend", desc: "Reach top 3 leaderboard", icon: "👑", unlocked: false, progress: 18 },
];

export const contributionHistory = [
  { month: "Jan", points: 820 },
  { month: "Feb", points: 1340 },
  { month: "Mar", points: 1680 },
  { month: "Apr", points: 2100 },
  { month: "May", points: 2960 },
  { month: "Jun", points: 3580 },
];