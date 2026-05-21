import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Calendar,
  Users,
  Mic,
  Video,
  MessageCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { XP_ACTIONS } from "@/lib/xp";
import {
  partitionEvents,
  useEvents,
  type EventDoc,
} from "@/lib/use-events";
import { rsvpEvent } from "@/lib/events-actions";
import { useXpEvents } from "@/lib/use-xp-events";

export const Route = createFileRoute("/_app/events")({
  head: () => ({ meta: [{ title: "Events — ARC XP" }] }),
  component: EventsPage,
});

const typeIcons: Record<string, typeof Mic> = {
  "Twitter Space": Mic,
  Webinar: Video,
  AMA: MessageCircle,
  Event: Sparkles,
};

function formatWhen(e: EventDoc) {
  const d = e.startAt?.toDate?.();
  if (d) {
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return e.date || "TBA";
}

function EventsPage() {
  const { user } = useAuth();
  const { events, loading } = useEvents();
  const { ids } = useXpEvents(user?.uid);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [pending, setPending] = useState<string | null>(null);

  const { upcoming, past } = useMemo(() => partitionEvents(events), [events]);
  const list = tab === "upcoming" ? upcoming : past;

  const handleRsvp = async (e: EventDoc) => {
    if (!user) {
      toast.error("Sign in to RSVP");
      return;
    }
    setPending(e.id);
    try {
      const res = await rsvpEvent(e.id, user.uid);
      if (res.already) {
        toast.message("Already RSVP'd", { description: e.title });
      } else {
        toast.success("You're in!", { description: `RSVP confirmed · ${e.title}` });
      }
    } catch (err) {
      toast.error("RSVP failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold">
          <span className="gradient-text">Events</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          RSVP, attend, and earn{" "}
          <span className="text-brand-cyan font-medium">
            +{XP_ACTIONS.event_participation} XP
          </span>{" "}
          per event.
        </p>
      </div>

      <div className="glass rounded-2xl p-1.5 inline-flex gap-1">
        {(
          [
            { id: "upcoming", label: "Upcoming", count: upcoming.length },
            { id: "past", label: "Past", count: past.length },
          ] as const
        ).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                active
                  ? "gradient-bg text-primary-foreground glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {t.label}
              <span className="text-[11px] opacity-70">{t.count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Loader2 className="h-6 w-6 animate-spin inline text-brand-cyan" />
        </div>
      ) : list.length === 0 ? (
        <div className="glass rounded-2xl p-6 sm:p-12 text-center text-muted-foreground text-sm">
          {tab === "upcoming"
            ? "No upcoming events. Check back soon."
            : "No past events yet."}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((e, i) => {
            const Icon = typeIcons[e.type] ?? Calendar;
            const attended = ids.has(`event_participation__event:${e.id}`);
            const isPending = pending === e.id;
            const past = tab === "past";
            return (
              <div
                key={e.id}
                className="glass rounded-2xl p-5 flex flex-col gap-4 hover:scale-[1.02] transition animate-scale-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center glow">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full glass-strong">
                    {e.type}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                    {e.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hosted by {e.host}
                  </p>
                </div>
                <div className="text-sm text-brand-cyan flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> {formatWhen(e)}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />{" "}
                    {(e.going ?? 0).toLocaleString()} going
                  </span>
                  {attended && (
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> attended
                    </span>
                  )}
                </div>
                <div className="mt-auto flex gap-2">
                  {!past && (
                    <button
                      onClick={() => handleRsvp(e)}
                      disabled={isPending || !user}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 gradient-bg text-primary-foreground glow hover:opacity-90 disabled:opacity-50"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "RSVP"
                      )}
                    </button>
                  )}
                  <Link
                    to="/events/$eventId"
                    params={{ eventId: e.id }}
                    className={`${
                      past ? "flex-1" : ""
                    } py-2.5 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 glass-strong hover:bg-white/10`}
                  >
                    {past ? (
                      <>
                        <Clock className="h-4 w-4" /> View
                      </>
                    ) : (
                      <>
                        Details <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}