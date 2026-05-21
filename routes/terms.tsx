import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — ARC XP" },
      { name: "description", content: "ARC XP Terms of Service. Read the rules and conditions for using the ARC XP platform." },
      { property: "og:title", content: "Terms of Service — ARC XP" },
      { property: "og:description", content: "ARC XP Terms of Service. Read the rules and conditions for using the ARC XP platform." },
      { property: "og:url", content: "https://arcxp.xyz/terms" },
    ],
    links: [
      { rel: "canonical", href: "https://arcxp.xyz/terms" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PublicLayout>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-strong text-xs text-brand-cyan mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan animate-pulse" /> Legal
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          <span className="gradient-text">Terms of Service</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="space-y-6">
        <TermsSection title="1. Acceptance of Terms">
          <p>
            By accessing or using ARC XP, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform. These terms apply to all visitors, users, and contributors.
          </p>
        </TermsSection>

        <TermsSection title="2. Eligibility">
          <p>
            You must be at least 18 years old or the age of legal majority in your jurisdiction to use ARC XP. By using the platform, you represent that you meet this requirement.
          </p>
        </TermsSection>

        <TermsSection title="3. Accounts & Authentication">
          <ul>
            <li>You may sign in using Google OAuth or a compatible Web3 wallet.</li>
            <li>You are responsible for maintaining the security of your credentials and private keys.</li>
            <li>We reserve the right to suspend accounts that violate these terms or engage in abusive behavior.</li>
          </ul>
        </TermsSection>

        <TermsSection title="4. Prohibited Conduct">
          <p>Users may not:</p>
          <ul>
            <li>Use bots, scripts, or automation to farm XP or manipulate leaderboards.</li>
            <li>Create multiple accounts to abuse referral or reward systems.</li>
            <li>Attempt to exploit smart contracts or bypass anti-cheat mechanisms.</li>
            <li>Harass, abuse, or discriminate against other community members.</li>
            <li>Upload malicious content or interfere with platform operations.</li>
          </ul>
        </TermsSection>

        <TermsSection title="5. XP, Badges & Rewards">
          <ul>
            <li>XP and badges are granted based on platform activity and are subject to anti-cheat verification.</li>
            <li>We reserve the right to revoke XP or badges obtained through fraudulent means.</li>
            <li>Rewards and token distributions are subject to change and may be governed by community vote.</li>
          </ul>
        </TermsSection>

        <TermsSection title="6. Intellectual Property">
          <p>
            The ARC XP name, logo, and platform design are the property of ARC XP Protocol. Users retain ownership of their original content but grant us a license to display it on the platform. Open-source code is governed by its respective licenses.
          </p>
        </TermsSection>

        <TermsSection title="7. Disclaimers">
          <p>
            ARC XP is provided "as is" without warranties of any kind. Blockchain transactions are irreversible. We are not responsible for lost funds, failed transactions, or smart contract bugs outside our control. Always verify transactions before signing.
          </p>
        </TermsSection>

        <TermsSection title="8. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, ARC XP Protocol and its contributors shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.
          </p>
        </TermsSection>

        <TermsSection title="9. Governing Law">
          <p>
            These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which ARC XP Protocol is registered, without regard to conflict of law principles.
          </p>
        </TermsSection>

        <TermsSection title="10. Changes to Terms">
          <p>
            We may modify these terms at any time. Material changes will be communicated via the platform. Continued use after changes constitutes acceptance.
          </p>
        </TermsSection>

        <TermsSection title="11. Contact">
          <p>
            For questions about these terms, email{" "}
            <a href="mailto:support@arcxp.xyz" className="text-brand-cyan hover:underline">
              support@arcxp.xyz
            </a>.
          </p>
        </TermsSection>
      </div>
    </PublicLayout>
  );
}

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-xl p-5 sm:p-6">
      <h2 className="text-sm font-semibold mb-3 tracking-wide">{title}</h2>
      <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}
