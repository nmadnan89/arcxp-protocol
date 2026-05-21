import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Users,
  Mic,
  Video,
  MessageCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
  UserCheck,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { XP_ACTIONS } from "@/lib/xp";
import { useEvent, useEventMember, type EventDoc } from "@/lib/use-events";
import { rsvpEvent, cancelRsvp, markAttendance } from "@/lib/events-actions";

export const Route = createFileRoute("/_app/events/$eventId")({
  head: () => ({ meta: [{ title: "Event — ARC XP" }] }),
  component: EventDetailsPage,
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
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return e.date || "TBA";
}

function EventDetailsPage() {
  const { eventId } = useParams({ from: "/_app/events/$eventId" });
  const { user } = useAuth();
  const { event, loading } = useEvent(eventId);
  const { present: hasRsvp } = useEventMember("rsvps", eventId, user?.uid);
  const { present: hasAttended } = useEventMember(
    "attendees",
    eventId,
    user?.uid,
  );
  const [busy, setBusy] = useState<"rsvp" | "attend" | null>(null);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="glass rounded-2xl p-6 sm:p-12 text-center space-y-3">
        <h2 className="text-xl font-semibold">Event not found</h2>
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-sm text-brand-cyan hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>
      </div>
    );
  }

  const Icon = typeIcons[event.type] ?? Calendar;
  const past =
    !!event.startAt?.toDate &&
    event.startAt.toDate().getTime() < Date.now();

  const onRsvp = async () => {
    if (!user) return toast.error("Sign in to RSVP");
    setBusy("rsvp");
    try {
      if (hasRsvp) {
        await cancelRsvp(event.id, user.uid);
        toast.success("RSVP cancelled");
      } else {
        const res = await rsvpEvent(event.id, user.uid);
        if (res.already) toast.message("Already RSVP'd");
        else toast.success("You're in!", { description: event.title });
      }
    } catch (e) {
      toast.error("RSVP failed", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(null);
    }
  };

  const onAttend = async () => {
    if (!user) return toast.error("Sign in to join");
    setBusy("attend");
    try {
      const res = await markAttendance(event.id, user.uid);
      if (res && res.awarded > 0) {
        toast.success(`+${res.awarded} XP earned!`, {
          description: `Attendance confirmed · Total: ${res.total}`,
        });
      } else {
        toast.message("Attendance already recorded", {
          description: "XP only awarded once per event.",
        });
      }
    } catch (e) {
      toast.error("Could not mark attendance", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <Link
        to="/events"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" /> All events
      </Link>

      <div className="glass rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full gradient-bg opacity-20 blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center gap-3 relative">
          <div className="h-12 w-12 rounded-2xl gradient-bg flex items-center justify-center glow">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs px-3 py-1 rounded-full glass-strong">
            {event.type}
          </span>
          {past && (
            <span className="text-xs px-3 py-1 rounded-full glass-strong text-muted-foreground">
              Past event
            </span>
          )}
          {hasAttended && (
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Attended
            </span>
          )}
          {!hasAttended && hasRsvp && (
            <span className="text-xs px-3 py-1 rounded-full bg-brand-cyan/15 text-brand-cyan inline-flex items-center gap-1">
              <UserCheck className="h-3 w-3" /> RSVP'd
            </span>
          )}
        </div>

        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
            {event.title}
          </h1>
          <p className="text-muted-foreground mt-1">Hosted by {event.host}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 relative">
          <div className="glass-strong rounded-xl px-4 py-3 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-brand-cyan" />
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                When
              </div>
              <div className="text-sm font-medium">{formatWhen(event)}</div>
            </div>
          </div>
          <div className="glass-strong rounded-xl px-4 py-3 flex items-center gap-3">
            <Users className="h-5 w-5 text-brand-cyan" />
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Going
              </div>
              <div className="text-sm font-medium">
                {(event.going ?? 0).toLocaleString()} ·{" "}
                {(event.attendees ?? 0).toLocaleString()} attended
              </div>
            </div>
          </div>
        </div>

        {event.description && (
          <p className="text-sm leading-relaxed text-muted-foreground relative whitespace-pre-line">
            {event.description}
          </p>
        )}

        <div className="glass-strong rounded-xl px-4 py-3 flex items-center gap-3 relative">
          <Trophy className="h-5 w-5 text-brand-cyan" />
          <div className="text-sm">
            <span className="font-semibold text-brand-cyan">
              +{XP_ACTIONS.event_participation} XP
            </span>{" "}
            <span className="text-muted-foreground">
              awarded once per attendance.
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 relative">
          <button
            onClick={onRsvp}
            disabled={!user || busy !== null || past}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 ${
              hasRsvp
                ? "glass-strong ring-1 ring-brand-cyan/50"
                : "gradient-bg text-primary-foreground glow hover:opacity-90"
            }`}
          >
            {busy === "rsvp" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasRsvp ? (
              "✓ Cancel RSVP"
            ) : (
              "RSVP"
            )}
          </button>
          <button
            onClick={onAttend}
            disabled={!user || busy !== null || hasAttended}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 ${
              hasAttended
                ? "glass-strong text-emerald-400 ring-1 ring-emerald-500/40"
                : "bg-brand-cyan/20 text-brand-cyan ring-1 ring-brand-cyan/40 hover:bg-brand-cyan/30"
            }`}
          >
            {busy === "attend" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasAttended ? (
              "✓ Attendance Confirmed"
            ) : (
              `Join Event · +${XP_ACTIONS.event_participation} XP`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}