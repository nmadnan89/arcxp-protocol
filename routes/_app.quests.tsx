import { createFileRoute } from "@tanstack/react-router";
import { BeginnerQuests } from "@/components/BeginnerQuests";

export const Route = createFileRoute("/_app/quests")({
  head: () => ({
    meta: [
      { title: "Beginner Quests — ARC XP" },
      {
        name: "description",
        content:
          "Complete one-time beginner quests on ARC XP — connect a wallet, drop your first GM, mint your first NFT, send your first transfer, invite a friend.",
      },
    ],
  }),
  component: QuestsPage,
});

function QuestsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-brand-purple/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-brand-blue/25 blur-3xl pointer-events-none" />
        <div className="relative">
          <span className="text-[10px] uppercase tracking-[0.3em] text-brand-cyan">
            Beginner path
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">
            <span className="gradient-text">Beginner Quests</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Five one-time quests to bootstrap your ARC XP journey. Each one
            rewards XP and unlocks new parts of the ecosystem.
          </p>
        </div>
      </div>

      <BeginnerQuests variant="full" />
    </div>
  );
}