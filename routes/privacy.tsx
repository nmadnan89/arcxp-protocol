import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — ARC XP" },
      { name: "description", content: "ARC XP Privacy Policy. Learn how we collect, use, and protect your personal data." },
      { property: "og:title", content: "Privacy Policy — ARC XP" },
      { property: "og:description", content: "ARC XP Privacy Policy. Learn how we collect, use, and protect your personal data." },
      { property: "og:url", content: "https://arcxp.xyz/privacy" },
    ],
    links: [
      { rel: "canonical", href: "https://arcxp.xyz/privacy" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-strong text-xs text-brand-cyan mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan animate-pulse" /> Legal
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          <span className="gradient-text">Privacy Policy</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="space-y-6">
        <PolicySection title="1. Information We Collect">
          <p>We collect information you provide directly, such as:</p>
          <ul>
            <li>Account information (email, username, profile photo) when you sign in via Google or wallet authentication.</li>
            <li>Public wallet addresses you connect to the platform.</li>
            <li>Activity data including XP earnings, quest completions, badge unlocks, and leaderboard rankings.</li>
          </ul>
        </PolicySection>

        <PolicySection title="2. How We Use Your Information">
          <ul>
            <li>To provide and maintain the ARC XP platform and its features.</li>
            <li>To calculate XP, assign badges, and generate leaderboard rankings.</li>
            <li>To detect and prevent abuse, fraud, and cheating via automated anti-cheat systems.</li>
            <li>To communicate important updates about the protocol.</li>
          </ul>
        </PolicySection>

        <PolicySection title="3. On-Chain Data">
          <p>
            ARC XP operates on public blockchains. Wallet addresses, XP transactions, badge mints, and NFT transfers are permanently recorded on-chain and are publicly visible. We do not control the visibility of this data.
          </p>
        </PolicySection>

        <PolicySection title="4. Cookies & Tracking">
          <p>
            We use essential cookies for authentication and session management. We do not use third-party advertising cookies or trackers. Analytics data is anonymized where possible.
          </p>
        </PolicySection>

        <PolicySection title="5. Data Sharing">
          <p>We do not sell your personal data. We may share data only in the following circumstances:</p>
          <ul>
            <li>With service providers who assist in operating the platform (e.g., hosting, analytics).</li>
            <li>When required by law or to protect the rights and safety of our users.</li>
          </ul>
        </PolicySection>

        <PolicySection title="6. Your Rights">
          <p>
            Depending on your jurisdiction, you may have the right to access, correct, or delete your personal data. On-chain data cannot be deleted due to the immutable nature of blockchains. For account-related requests, contact us at the email below.
          </p>
        </PolicySection>

        <PolicySection title="7. Security">
          <p>
            We implement industry-standard security measures to protect your data. However, no system is completely secure. You are responsible for safeguarding your wallet private keys and seed phrases.
          </p>
        </PolicySection>

        <PolicySection title="8. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify users of material changes via the platform or email. Continued use after changes constitutes acceptance.
          </p>
        </PolicySection>

        <PolicySection title="9. Contact">
          <p>
            For privacy-related questions, email us at{" "}
            <a href="mailto:support@arcxp.xyz" className="text-brand-cyan hover:underline">
              support@arcxp.xyz
            </a>.
          </p>
        </PolicySection>
      </div>
    </PublicLayout>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-xl p-5 sm:p-6">
      <h2 className="text-sm font-semibold mb-3 tracking-wide">{title}</h2>
      <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}
