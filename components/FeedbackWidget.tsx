import { useState } from "react";
import { MessageSquare, Bug, Lightbulb, Star, Loader2, X, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { submitFeedback, type FeedbackKind } from "@/lib/feedback";

export function FeedbackWidget() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>("bug");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const reset = () => {
    setMessage("");
    setRating(0);
    setKind("bug");
  };

  const send = async () => {
    setBusy(true);
    try {
      await submitFeedback(
        { kind, message, rating: kind === "rating" ? rating : undefined },
        { uid: user.uid, email: user.email, name: profile?.username ?? profile?.name ?? null },
      );
      toast.success("Thanks for the feedback!", { description: "We've received your message." });
      reset();
      setOpen(false);
    } catch (e) {
      toast.error("Couldn't send", { description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setBusy(false);
    }
  };

  const kinds: { id: FeedbackKind; label: string; icon: typeof Bug }[] = [
    { id: "bug", label: "Bug", icon: Bug },
    { id: "suggestion", label: "Idea", icon: Lightbulb },
    { id: "rating", label: "Rate", icon: Star },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed z-40 bottom-5 right-5 h-12 w-12 rounded-full gradient-bg text-primary-foreground glow flex items-center justify-center shadow-lg hover:opacity-90 transition"
      >
        <MessageSquare className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass rounded-2xl w-full max-w-md p-5 sm:p-6 relative"
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/5"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-strong text-xs text-brand-cyan mb-3">
              <MessageSquare className="h-3.5 w-3.5" /> Feedback
            </div>
            <h2 className="text-xl font-bold mb-1">
              <span className="gradient-text">Help us improve ARC</span>
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Report a bug, share an idea, or rate your experience.
            </p>

            <div className="flex gap-1.5 mb-4">
              {kinds.map((k) => {
                const Icon = k.icon;
                const active = kind === k.id;
                return (
                  <button
                    key={k.id}
                    onClick={() => setKind(k.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                      active
                        ? "gradient-bg text-primary-foreground glow"
                        : "glass-strong text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {k.label}
                  </button>
                );
              })}
            </div>

            {kind === "rating" && (
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    aria-label={`Rate ${n}`}
                    className="p-1 transition hover:scale-110"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        n <= rating ? "fill-brand-cyan text-brand-cyan" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder={
                kind === "bug"
                  ? "What went wrong? Steps to reproduce…"
                  : kind === "suggestion"
                  ? "What would make ARC better?"
                  : "Tell us about your experience (optional)"
              }
              className="w-full glass-strong rounded-xl p-3 text-sm bg-transparent outline-none resize-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-muted-foreground">{message.length}/2000</span>
              <button
                onClick={send}
                disabled={busy}
                className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-primary-foreground text-sm font-semibold glow hover:opacity-90 transition disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}