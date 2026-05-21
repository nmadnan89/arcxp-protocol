import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { ArcLogo } from "@/components/ArcLogo";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-purple/30 blur-[120px] animate-orb" />
        <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-brand-blue/25 blur-[140px] animate-orb" style={{ animationDelay: "-5s" }} />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-brand-cyan/15 blur-[120px] animate-orb" style={{ animationDelay: "-10s" }} />
      </div>
      <div className="glass rounded-3xl p-8 sm:p-12 w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <ArcLogo size={56} className="relative z-10" />
            <div className="absolute inset-0 bg-brand-purple/50 blur-2xl rounded-full" />
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-strong text-xs text-brand-cyan mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan animate-pulse" /> Signal lost
        </div>
        <h1 className="text-6xl font-black tracking-tight gradient-text">404</h1>
        <h2 className="mt-3 text-xl font-semibold text-foreground">Off the grid</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This node doesn't exist in the ARC network. Let's get you back to base.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl gradient-bg px-5 py-2.5 text-sm font-semibold text-primary-foreground glow hover:opacity-90 transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ARC XP - Web3 Community Dashboard" },
      { name: "description", content: "Track points, streaks, badges, events, and leaderboard for the ARC XP community." },
      { name: "author", content: "ARC XP" },
      { property: "og:title", content: "ARC XP - Web3 Community Dashboard" },
      { property: "og:description", content: "Track points, streaks, badges, events, and leaderboard for the ARC XP community." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "ARC XP" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@ARCXPProtocol" },
      { name: "twitter:title", content: "ARC XP - Web3 Community Dashboard" },
      { name: "twitter:description", content: "Track points, streaks, badges, events, and leaderboard for the ARC XP community." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/39cbf384-d65f-4288-a531-cdd89d52307b" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/39cbf384-d65f-4288-a531-cdd89d52307b" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "ARC XP",
          alternateName: "ARC XP Protocol",
          url: "https://arcxp.xyz",
          logo: "https://arcxp.xyz/favicon.svg",
          sameAs: [
            "https://twitter.com/ARCXPProtocol",
            "https://github.com/arcxp",
          ],
        }),
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "alternate icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}
