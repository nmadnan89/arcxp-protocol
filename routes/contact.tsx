import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { Mail, Twitter, Github, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — ARC XP" },
      { name: "description", content: "Get in touch with the ARC XP team. Support, partnerships, and general inquiries." },
      { property: "og:title", content: "Contact — ARC XP" },
      { property: "og:description", content: "Get in touch with the ARC XP team. Support, partnerships, and general inquiries." },
      { property: "og:url", content: "https://arcxp.xyz/contact" },
    ],
    links: [
      { rel: "canonical", href: "https://arcxp.xyz/contact" },
    ],
  }),
  component: ContactPage,
});

const channels = [
  {
    icon: Mail,
    label: "Email",
    value: "support@arcxp.xyz",
    href: "mailto:support@arcxp.xyz",
    desc: "For support, bug reports, and general inquiries.",
  },
  {
    icon: Twitter,
    label: "Twitter / X",
    value: "@ARCXPProtocol",
    href: "https://twitter.com/ARCXPProtocol",
    desc: "Announcements, updates, and community engagement.",
  },
  {
    icon: MessageCircle,
    label: "Discord",
    value: "discord.gg/arcxp",
    href: "https://discord.gg/arcxp",
    desc: "Join the community for real-time discussions and support.",
  },
  {
    icon: Github,
    label: "GitHub",
    value: "github.com/arcxp",
    href: "https://github.com/arcxp",
    desc: "Explore our open-source repositories and contribute.",
  },
];

function ContactPage() {
  return (
    <PublicLayout>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-strong text-xs text-brand-cyan mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan animate-pulse" /> Connect
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          <span className="gradient-text">Contact</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
          Have a question, partnership idea, or just want to say hi? We are here.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {channels.map((c) => {
          const Icon = c.icon;
          return (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-xl p-5 hover:bg-white/[0.04] transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg gradient-bg group-hover:scale-105 transition-transform">
                  <Icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{c.label}</h3>
                  <p className="text-xs text-brand-cyan">{c.value}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
            </a>
          );
        })}
      </div>

      <section className="glass rounded-2xl p-6 sm:p-8 text-center">
        <h2 className="text-lg font-semibold mb-2">Response Time</h2>
        <p className="text-sm text-muted-foreground mb-1">
          We typically respond to emails within 24-48 hours.
        </p>
        <p className="text-sm text-muted-foreground">
          For faster help, join our Discord community where moderators and core contributors are active daily.
        </p>
      </section>
    </PublicLayout>
  );
}
