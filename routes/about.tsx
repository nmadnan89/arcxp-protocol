import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { ArcLogo } from "@/components/ArcLogo";
import { Zap, Shield, Globe, Trophy, Users, Sparkles } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — ARC XP" },
      { name: "description", content: "Learn about ARC XP, the Web3 community protocol for tracking XP, badges, and leaderboard rankings." },
      { property: "og:title", content: "About — ARC XP" },
      { property: "og:description", content: "Learn about ARC XP, the Web3 community protocol for tracking XP, badges, and leaderboard rankings." },
      { property: "og:url", content: "https://arcxp.xyz/about" },
    ],
    links: [
      { rel: "canonical", href: "https://arcxp.xyz/about" },
    ],
  }),
  component: AboutPage,
});

const values = [
  { icon: Zap, label: "On-chain XP", desc: "Every action is transparently recorded and verifiable on the blockchain." },
  { icon: Shield, label: "Anti-Cheat", desc: "Advanced heuristics and proof-of-humanity keep the leaderboard fair." },
  { icon: Globe, label: "Community First", desc: "Governance and rewards are driven by the community, not a central authority." },
  { icon: Trophy, label: "Meritocracy", desc: "Climb the ranks through genuine contribution, not speculation." },
  { icon: Users, label: "Referral Network", desc: "Grow the ecosystem and earn XP by onboarding new members." },
  { icon: Sparkles, label: "NFT Badges", desc: "Unlock unique on-chain badges that prove your achievements forever." },
];

function AboutPage() {
  return (
    <PublicLayout>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-strong text-xs text-brand-cyan mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan animate-pulse" /> Protocol
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          <span className="gradient-text">About ARC XP</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
          ARC XP is a Web3 community protocol built to recognize, track, and reward genuine contribution.
        </p>
      </div>

      <section className="glass rounded-2xl p-6 sm:p-8 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <ArcLogo size={32} />
          </div>
          <h2 className="text-lg font-semibold">Our Mission</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ARC XP was born from a simple idea: the most valuable participants in any community are the ones who show up consistently, help others, and drive the ecosystem forward. We built a protocol that transparently tracks those contributions on-chain, converts them into XP, and rewards top performers with badges, NFTs, and governance weight.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">
          Whether you are a developer, creator, moderator, or evangelist, ARC XP gives you a permanent, verifiable reputation score that follows you across the network.
        </p>
      </section>

      <section className="grid sm:grid-cols-2 gap-4 mb-8">
        {values.map((v) => {
          const Icon = v.icon;
          return (
            <div key={v.label} className="glass rounded-xl p-5 hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg gradient-bg">
                  <Icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <h3 className="text-sm font-semibold">{v.label}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          );
        })}
      </section>

      <section className="glass rounded-2xl p-6 sm:p-8 text-center">
        <h2 className="text-lg font-semibold mb-2">Ready to join the network?</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Sign in, connect your wallet, and start earning XP today.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-xl gradient-bg px-6 py-2.5 text-sm font-semibold text-primary-foreground glow hover:opacity-90 transition"
        >
          Launch Dashboard
        </a>
      </section>
    </PublicLayout>
  );
}
