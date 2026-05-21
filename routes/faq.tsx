import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — ARC XP" },
      { name: "description", content: "Frequently asked questions about ARC XP, XP earnings, wallets, badges, and more." },
      { property: "og:title", content: "FAQ — ARC XP" },
      { property: "og:description", content: "Frequently asked questions about ARC XP, XP earnings, wallets, badges, and more." },
      { property: "og:url", content: "https://arcxp.xyz/faq" },
    ],
    links: [
      { rel: "canonical", href: "https://arcxp.xyz/faq" },
    ],
  }),
  component: FAQPage,
});

const faqs = [
  {
    question: "What is ARC XP?",
    answer:
      "ARC XP is a Web3 community protocol that tracks and rewards genuine contribution. Users earn XP by completing quests, participating in events, referring friends, and engaging with the ecosystem. Top contributors unlock badges, NFTs, and leaderboard recognition.",
  },
  {
    question: "How do I earn XP?",
    answer:
      "You can earn XP through multiple channels: daily check-ins (GM), completing quests, attending events, referring new users, maintaining streaks, and contributing to the community. Each action has a defined XP value and may be subject to anti-cheat verification.",
  },
  {
    question: "Which wallets are supported?",
    answer:
      "ARC XP supports MetaMask, Rabby, OKX Wallet, Coinbase Wallet, and WalletConnect-compatible wallets. You can also sign in with Google. All wallet connections operate on the ARC Testnet (Chain ID 5042002).",
  },
  {
    question: "What are ARC XP badges?",
    answer:
      "Badges are on-chain NFTs that represent specific achievements. They are permanently minted to your wallet and serve as verifiable proof of your contributions. Some badges unlock exclusive perks, governance weight, or bonus XP multipliers.",
  },
  {
    question: "Is my data private?",
    answer:
      "Personal account data (email, username) is stored securely and never sold. However, wallet addresses, XP transactions, and NFT mints are recorded on public blockchains and are inherently visible. See our Privacy Policy for full details.",
  },
  {
    question: "How does the referral system work?",
    answer:
      "Every user receives a unique referral code and link. When someone signs up using your referral, both you and the new user receive XP rewards. We enforce anti-abuse protections to prevent gaming the system with fake accounts.",
  },
  {
    question: "What happens if I am flagged by anti-cheat?",
    answer:
      "Our anti-cheat system uses behavior heuristics to detect suspicious patterns. If flagged, your XP may be temporarily withheld pending review. Repeat offenders risk permanent account suspension and forfeiture of illegitimate rewards.",
  },
  {
    question: "Can I transfer or sell my XP?",
    answer:
      "XP is non-transferable and tied to your account and wallet. It represents reputation, not a currency. However, earned tokens or NFT rewards may be transferable depending on the specific reward terms.",
  },
  {
    question: "How do I report a bug or request a feature?",
    answer:
      "Use the feedback widget inside the app, or reach out via email at support@arcxp.xyz. For technical issues, include your wallet address, browser, and a description of what happened.",
  },
  {
    question: "Is ARC XP open source?",
    answer:
      "Yes. Core smart contracts and select frontend components are open source. You can find our repositories on GitHub and contribute to the protocol's development.",
  },
];

function FAQPage() {
  return (
    <PublicLayout>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-strong text-xs text-brand-cyan mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan animate-pulse" /> Help
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          <span className="gradient-text">Frequently Asked Questions</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
          Everything you need to know about ARC XP.
        </p>
      </div>

      <div className="glass rounded-2xl p-5 sm:p-6">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border-b border-white/5 last:border-0"
            >
              <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <section className="mt-8 glass rounded-2xl p-6 sm:p-8 text-center">
        <h2 className="text-lg font-semibold mb-2">Still have questions?</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Reach out to our team and we will get back to you.
        </p>
        <a
          href="/contact"
          className="inline-flex items-center justify-center rounded-xl gradient-bg px-6 py-2.5 text-sm font-semibold text-primary-foreground glow hover:opacity-90 transition"
        >
          Contact Support
        </a>
      </section>
    </PublicLayout>
  );
}
