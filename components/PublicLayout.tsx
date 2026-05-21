import { Link } from "@tanstack/react-router";
import { ArcLogo } from "./ArcLogo";
import { Github, Twitter } from "lucide-react";

interface PublicLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PublicLayout({ children, className = "" }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Ambient gradient orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-purple/30 blur-[120px] animate-orb" />
        <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-brand-blue/25 blur-[140px] animate-orb" style={{ animationDelay: "-5s" }} />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-brand-cyan/15 blur-[120px] animate-orb" style={{ animationDelay: "-10s" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="ARC XP">
            <div className="relative shrink-0">
              <ArcLogo size={28} className="relative z-10 transition-transform duration-500 group-hover:rotate-180" />
              <div className="absolute inset-0 bg-brand-purple/50 blur-lg rounded-full group-hover:bg-brand-cyan/40 transition-colors" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-black text-sm tracking-[0.18em] gradient-text">
                ARC
              </span>
              <span className="h-2.5 w-px bg-gradient-to-b from-transparent via-brand-cyan to-transparent opacity-70" />
              <span className="font-light text-sm tracking-[0.32em] text-foreground/90">
                XP
              </span>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {publicNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all duration-200"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/"
              className="ml-2 px-4 py-1.5 rounded-lg text-sm font-medium gradient-bg text-primary-foreground glow-sm hover:opacity-90 transition"
            >
              App
            </Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className={`flex-1 px-4 sm:px-6 py-10 sm:py-14 ${className}`}>
        <div className="max-w-3xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="glass border-t border-white/5 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <ArcLogo size={22} />
              <span className="text-xs text-muted-foreground tracking-[0.2em] uppercase">
                ARC XP Protocol
              </span>
            </div>

            <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              {publicNav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/ARCXPProtocol"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/arcxp"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] text-muted-foreground/60 tracking-wider">
              &copy; {new Date().getFullYear()} ARC XP Protocol. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const publicNav = [
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
] as const;
