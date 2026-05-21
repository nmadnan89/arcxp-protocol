import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  increment,
  addDoc,
  getDocs,
  Timestamp,
  collectionGroup,
  where,
} from "firebase/firestore";
import {
  Shield,
  Users,
  Calendar,
  Activity as ActivityIcon,
  Search,
  Plus,
  Minus,
  Trash2,
  Edit3,
  Loader2,
  Trophy,
  Award,
  Sparkles,
  Wallet,
  X,
  Check,
  Share2,
  Sun,
  UserCheck,
  MessageSquare,
  Bug,
  Lightbulb,
  Star,
  TrendingUp,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, type UserProfile } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/admin";
import { getFirebase } from "@/lib/firebase";
import { BADGE_CATALOG } from "@/lib/badges";
import { actionLabel, type ActivityRow } from "@/lib/use-activity";
import { hasContract, readContract } from "@/lib/arcxp-contract";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin — ARC XP" }] }),
  component: AdminPage,
});

type Tab = "users" | "events" | "activity" | "stats" | "feedback";

function AdminPage() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useIsAdmin();
  const [tab, setTab] = useState<Tab>("users");

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast.error("Admins only", { description: "You don't have access to this page." });
      void navigate({ to: "/" });
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-strong text-xs text-brand-cyan mb-3">
            <Shield className="h-3.5 w-3.5" /> Admin Console
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">
            <span className="gradient-text">Mission Control</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage users, XP, badges, events, and monitor activity across the protocol.
          </p>
        </div>
      </div>

      <div className="glass rounded-2xl p-1.5 flex flex-wrap gap-1 w-full sm:w-fit">
        {(
          [
            { id: "users", label: "Users", icon: Users },
            { id: "events", label: "Events", icon: Calendar },
            { id: "activity", label: "Activity", icon: ActivityIcon },
            { id: "stats", label: "Stats", icon: Trophy },
            { id: "feedback", label: "Feedback", icon: MessageSquare },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
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
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "users" && <UsersPanel />}
      {tab === "events" && <EventsPanel />}
      {tab === "activity" && <ActivityPanel />}
      {tab === "stats" && <StatsPanel />}
      {tab === "feedback" && <FeedbackPanel />}
    </div>
  );
}

// -------------------- USERS --------------------

function UsersPanel() {
  const [rows, setRows] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<UserProfile | null>(null);

  useEffect(() => {
    const { db } = getFirebase();
    if (!db) return;
    const q = query(collection(db, "users"), orderBy("points", "desc"), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => d.data() as UserProfile));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        (r.name ?? "").toLowerCase().includes(s) ||
        (r.username ?? "").toLowerCase().includes(s) ||
        (r.email ?? "").toLowerCase().includes(s) ||
        (r.walletAddress ?? "").toLowerCase().includes(s),
    );
  }, [rows, search]);

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-3 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground ml-1" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or wallet…"
          className="bg-transparent outline-none flex-1 text-sm placeholder:text-muted-foreground"
        />
        <span className="text-xs text-muted-foreground px-2">{filtered.length} users</span>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-white/5">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Email</th>
                <th className="text-right px-4 py-3">XP</th>
                <th className="text-right px-4 py-3 hidden sm:table-cell">Streak</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Wallet</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline" />
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.uid} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="" className="h-8 w-8 rounded-full ring-1 ring-white/10 shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center text-xs font-bold shrink-0">
                          {(u.username ?? "U")[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium truncate">{u.username ?? u.name ?? "—"}</div>
                        <div className="text-[11px] text-muted-foreground truncate md:hidden">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground truncate max-w-[220px]">
                    {u.email}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-cyan">
                    {(u.points ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">{u.streak ?? 0}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {u.walletAddress ? (
                      <span className="font-mono text-[11px] glass-strong px-2 py-1 rounded-md inline-flex items-center gap-1">
                        <Wallet className="h-3 w-3" />
                        {u.walletAddress.slice(0, 6)}…{u.walletAddress.slice(-4)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <XPButton uid={u.uid} delta={10} />
                      <XPButton uid={u.uid} delta={-10} />
                      <button
                        onClick={() => setEditing(u)}
                        className="p-2 rounded-lg hover:bg-white/10 transition"
                        title="Manage"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <UserEditor user={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function XPButton({ uid, delta }: { uid: string; delta: number }) {
  const [busy, setBusy] = useState(false);
  const Icon = delta > 0 ? Plus : Minus;
  const onClick = async () => {
    const { db } = getFirebase();
    if (!db) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, "users", uid), { points: increment(delta) });
      toast.success(`${delta > 0 ? "+" : ""}${delta} XP applied`);
    } catch (e) {
      toast.error("Failed", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`p-2 rounded-lg transition ${
        delta > 0 ? "hover:bg-emerald-500/10 text-emerald-400" : "hover:bg-rose-500/10 text-rose-400"
      } disabled:opacity-50`}
      title={`${delta > 0 ? "Add" : "Remove"} ${Math.abs(delta)} XP`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
    </button>
  );
}

function UserEditor({ user, onClose }: { user: UserProfile; onClose: () => void }) {
  const [xp, setXp] = useState<string>(String(user.points ?? 0));
  const [busy, setBusy] = useState(false);
  const [badges, setBadges] = useState<string[]>(user.badges ?? []);

  const save = async () => {
    const { db } = getFirebase();
    if (!db) return;
    setBusy(true);
    try {
      const n = Number(xp);
      await updateDoc(doc(db, "users", user.uid), {
        points: Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0,
        badges,
      });
      toast.success("User updated");
      onClose();
    } catch (e) {
      toast.error("Failed", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id: string) =>
    setBadges((b) => (b.includes(id) ? b.filter((x) => x !== id) : [...b, id]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="glass rounded-2xl p-5 sm:p-6 w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] overflow-y-auto relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-lg hover:bg-white/10 z-10"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 mb-5 pr-10 min-w-0">
          {user.photoURL ? (
            <img src={user.photoURL} className="h-10 w-10 rounded-full ring-1 ring-white/20" alt="" />
          ) : (
            <div className="h-10 w-10 rounded-full gradient-bg shrink-0" />
          )}
          <div className="min-w-0">
            <div className="font-semibold truncate">{user.username}</div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
        </div>

        <label className="text-xs uppercase tracking-wider text-muted-foreground">XP Total</label>
        <input
          type="number"
          value={xp}
          onChange={(e) => setXp(e.target.value)}
          className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-cyan/50"
        />

        {user.walletAddress && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Wallet</div>
            <div className="glass-strong rounded-xl px-3 py-2 font-mono text-xs break-all">
              {user.walletAddress}
            </div>
          </div>
        )}

        <div className="mt-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
            <Award className="h-3.5 w-3.5" /> Badges
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {BADGE_CATALOG.map((b) => {
              const on = badges.includes(b.id);
              return (
                <button
                  key={b.id}
                  onClick={() => toggle(b.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm transition ${
                    on
                      ? "glass-strong ring-1 ring-brand-cyan/60 text-foreground"
                      : "bg-white/5 hover:bg-white/10 text-muted-foreground"
                  }`}
                >
                  <span className="text-lg">{b.icon}</span>
                  <span className="flex-1 truncate">{b.name}</span>
                  {on && <Check className="h-3.5 w-3.5 text-brand-cyan" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="px-4 py-2 rounded-xl gradient-bg text-primary-foreground text-sm font-semibold glow disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------- EVENTS --------------------

type AdminEvent = {
  id: string;
  title: string;
  type: string;
  date: string;
  host: string;
  going?: number;
  attendees?: number;
  description?: string;
  startAt?: Timestamp;
};

function EventsPanel() {
  const [rows, setRows] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const { db } = getFirebase();
    if (!db) return;
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminEvent, "id">) })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { db } = getFirebase();
    if (!db) return;
    try {
      await deleteDoc(doc(db, "events", id));
      toast.success("Event deleted");
    } catch (e) {
      toast.error("Delete failed", { description: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-primary-foreground font-semibold text-sm glow"
        >
          <Plus className="h-4 w-4" /> New Event
        </button>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-6 sm:p-10 text-center">
          <Loader2 className="h-5 w-5 animate-spin inline text-brand-cyan" />
        </div>
      ) : rows.length === 0 ? (
        <div className="glass rounded-2xl p-6 sm:p-10 text-center text-muted-foreground text-sm">
          No events yet. Create one to get started.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((e) => (
            <div key={e.id} className="glass rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs px-3 py-1 rounded-full glass-strong">{e.type}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditing(e)} className="p-2 rounded-lg hover:bg-white/10">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(e.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <h3 className="font-semibold leading-tight">{e.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">Hosted by {e.host}</p>
              </div>
              <div className="text-sm text-brand-cyan flex items-center gap-2">
                <Calendar className="h-4 w-4" /> {e.date}
              </div>
            </div>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <EventEditor
          event={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function EventEditor({ event, onClose }: { event: AdminEvent | null; onClose: () => void }) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [type, setType] = useState(event?.type ?? "Twitter Space");
  const [date, setDate] = useState(event?.date ?? "");
  const [host, setHost] = useState(event?.host ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [startAtLocal, setStartAtLocal] = useState(() => {
    const d = event?.startAt?.toDate?.();
    if (!d) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const { db } = getFirebase();
    if (!db) return;
    if (!title.trim() || !host.trim() || (!date.trim() && !startAtLocal)) {
      toast.error("Please fill all fields");
      return;
    }
    setBusy(true);
    try {
      const startAt = startAtLocal ? Timestamp.fromDate(new Date(startAtLocal)) : null;
      const dateLabel =
        date.trim() ||
        (startAt
          ? startAt.toDate().toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          : "");
      if (event) {
        await updateDoc(doc(db, "events", event.id), {
          title,
          type,
          date: dateLabel,
          host,
          description,
          ...(startAt ? { startAt } : {}),
        });
        toast.success("Event updated");
      } else {
        await addDoc(collection(db, "events"), {
          title,
          type,
          date: dateLabel,
          host,
          description,
          ...(startAt ? { startAt } : {}),
          going: 0,
          attendees: 0,
          createdAt: serverTimestamp(),
        });
        toast.success("Event created");
      }
      onClose();
    } catch (e) {
      toast.error("Save failed", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="glass rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[92vh] sm:max-h-[85vh] overflow-y-auto relative my-auto">
        <button onClick={onClose} className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-lg hover:bg-white/10 z-10">
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 pr-10">
          <Sparkles className="h-4 w-4 text-brand-cyan" />
          {event ? "Edit Event" : "New Event"}
        </h2>
        <div className="space-y-3">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              <option>Twitter Space</option>
              <option>Webinar</option>
              <option>AMA</option>
              <option>Event</option>
            </select>
          </Field>
          <Field label="Starts At">
            <input
              type="datetime-local"
              value={startAtLocal}
              onChange={(e) => setStartAtLocal(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Date Label (optional override)">
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="Auto-generated from Starts At if blank"
              className={inputCls}
            />
          </Field>
          <Field label="Host">
            <input value={host} onChange={(e) => setHost(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={inputCls}
              placeholder="What is this event about?"
            />
          </Field>
        </div>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm w-full sm:w-auto">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="px-4 py-2 rounded-xl gradient-bg text-primary-foreground text-sm font-semibold glow disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {event ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-cyan/50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </div>
  );
}

// -------------------- ACTIVITY --------------------

function ActivityPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const { db } = getFirebase();
    if (!db) return;
    const q = query(collection(db, "users"), orderBy("points", "desc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => d.data() as UserProfile);
      setUsers(list);
      if (!selected) setSelected(user?.uid ?? list[0]?.uid ?? "");
    });
    return () => unsub();
  }, [user?.uid, selected]);

  useEffect(() => {
    if (!selected) return;
    const { db } = getFirebase();
    if (!db) return;
    const q = query(
      collection(db, "users", selected, "xpEvents"),
      orderBy("createdAt", "desc"),
      limit(100),
    );
    const unsub = onSnapshot(q, (snap) => {
      setRows(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityRow, "id">) })),
      );
    });
    return () => unsub();
  }, [selected]);

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-3">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full bg-transparent outline-none text-sm px-2 py-1"
        >
          {users.map((u) => (
            <option key={u.uid} value={u.uid} className="bg-background">
              {u.username ?? u.email} — {(u.points ?? 0).toLocaleString()} XP
            </option>
          ))}
        </select>
      </div>

      <div className="glass rounded-2xl divide-y divide-white/5">
        {rows.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">No activity yet.</div>
        )}
        {rows.map((r) => {
          const date = r.createdAt?.toDate?.();
          return (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 rounded-xl glass-strong flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-brand-cyan" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{actionLabel(r.action)}</div>
                <div className="text-[11px] text-muted-foreground">
                  {date ? date.toLocaleString() : "—"}
                </div>
              </div>
              <div className="text-brand-cyan text-sm font-semibold">+{r.points}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------- STATS --------------------

function StatsPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [xpEvents, setXpEvents] = useState<
    Array<{ uid: string; action: string; points: number; ms: number }>
  >([]);
  const [abuse, setAbuse] = useState<
    Array<{ uid: string; kind: string; ms: number }>
  >([]);
  const [mintStats, setMintStats] = useState<{
    total: number;
    max: number;
    remaining: number;
  } | null>(null);

  useEffect(() => {
    const { db } = getFirebase();
    if (!db) return;
    const unsubU = onSnapshot(
      query(collection(db, "users"), orderBy("points", "desc")),
      (snap) => {
        setUsers(snap.docs.map((d) => d.data() as UserProfile));
        setLoading(false);
      },
    );
    const unsubE = onSnapshot(collection(db, "events"), (snap) => {
      setEvents(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminEvent, "id">) })),
      );
    });
    const since30 = Timestamp.fromMillis(Date.now() - 30 * 86_400_000);
    const unsubX = onSnapshot(
      query(collectionGroup(db, "xpEvents"), where("createdAt", ">=", since30)),
      (snap) => {
        setXpEvents(
          snap.docs.map((d) => {
            const data = d.data() as { action?: string; points?: number; createdAt?: Timestamp };
            return {
              uid: d.ref.parent.parent?.id ?? "",
              action: data.action ?? "",
              points: data.points ?? 0,
              ms: data.createdAt?.toMillis?.() ?? 0,
            };
          }),
        );
      },
      (err) => console.warn("xpEvents subscription failed", err),
    );
    const since7 = Timestamp.fromMillis(Date.now() - 7 * 86_400_000);
    const unsubA = onSnapshot(
      query(collection(db, "abuseLogs"), where("createdAt", ">=", since7)),
      (snap) => {
        setAbuse(
          snap.docs.map((d) => {
            const data = d.data() as { uid?: string; kind?: string; createdAt?: Timestamp };
            return {
              uid: data.uid ?? "",
              kind: data.kind ?? "",
              ms: data.createdAt?.toMillis?.() ?? 0,
            };
          }),
        );
      },
      (err) => console.warn("abuseLogs subscription failed", err),
    );
    return () => {
      unsubU();
      unsubE();
      unsubX();
      unsubA();
    };
  }, []);

  useEffect(() => {
    if (!hasContract()) return;
    let cancel = false;
    (async () => {
      try {
        const c = readContract();
        const [t, m, r] = await Promise.all([
          c.totalMinted(),
          c.MAX_SUPPLY(),
          c.remainingSupply(),
        ]);
        if (!cancel) {
          setMintStats({ total: Number(t), max: Number(m), remaining: Number(r) });
        }
      } catch (e) {
        console.warn("mint stats failed", e);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const m = useMemo(() => {
    const now = Date.now();
    const dayMs = 86_400_000;
    const tsMs = (v: unknown) => {
      const t = v as Timestamp | undefined;
      return typeof t?.toMillis === "function" ? t.toMillis() : 0;
    };
    const totalUsers = users.length;
    const dau = users.filter((u) => now - tsMs(u.lastLogin) < dayMs).length;
    const wau = users.filter((u) => now - tsMs(u.lastLogin) < 7 * dayMs).length;
    const wallets = users.filter((u) => Boolean(u.walletAddress)).length;
    const totalXp = users.reduce((a, u) => a + (u.points ?? 0), 0);
    const gmToday = users.filter((u) => now - tsMs(u.lastGMClaim) < dayMs).length;
    const totalReferrals = users.reduce(
      (a, u) => a + ((u as UserProfile & { referralCount?: number }).referralCount ?? 0),
      0,
    );
    const refUsers = users.filter(
      (u) => ((u as UserProfile & { referralCount?: number }).referralCount ?? 0) > 0,
    ).length;
    const eventGoing = events.reduce((a, e) => a + (e.going ?? 0), 0);
    const eventAttended = events.reduce((a, e) => a + (e.attendees ?? 0), 0);
    const topByXp = users.slice(0, 10);
    const topReferrers = [...users]
      .filter((u) => ((u as UserProfile & { referralCount?: number }).referralCount ?? 0) > 0)
      .sort(
        (a, b) =>
          ((b as UserProfile & { referralCount?: number }).referralCount ?? 0) -
          ((a as UserProfile & { referralCount?: number }).referralCount ?? 0),
      )
      .slice(0, 10);

    // Wallet map for quick lookup
    const walletByUid = new Map<string, string | null | undefined>();
    users.forEach((u) => walletByUid.set(u.uid, u.walletAddress));

    // 14-day daily series
    const days: Array<{
      day: string;
      ms: number;
      activeWallets: number;
      gm: number;
      xp: number;
      newUsers: number;
      newWallets: number;
    }> = [];
    const startOfDay = (ms: number) => {
      const d = new Date(ms);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };
    const today0 = startOfDay(now);
    for (let i = 13; i >= 0; i--) {
      const dStart = today0 - i * dayMs;
      days.push({
        day: new Date(dStart).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        ms: dStart,
        activeWallets: 0,
        gm: 0,
        xp: 0,
        newUsers: 0,
        newWallets: 0,
      });
    }
    const dayIndex = (ms: number) => {
      const idx = Math.floor((startOfDay(ms) - days[0].ms) / dayMs);
      return idx >= 0 && idx < days.length ? idx : -1;
    };

    const walletActiveByDay: Array<Set<string>> = days.map(() => new Set());
    for (const ev of xpEvents) {
      const idx = dayIndex(ev.ms);
      if (idx < 0) continue;
      days[idx].xp += ev.points;
      if (ev.action === "gm") days[idx].gm += 1;
      const w = walletByUid.get(ev.uid);
      if (w) walletActiveByDay[idx].add(w.toLowerCase());
    }
    walletActiveByDay.forEach((s, i) => (days[i].activeWallets = s.size));
    for (const u of users) {
      const j = dayIndex(tsMs(u.joinedAt));
      if (j >= 0) days[j].newUsers += 1;
      const wc = dayIndex(tsMs(u.walletConnectedAt));
      if (wc >= 0) days[wc].newWallets += 1;
    }

    // Retention: users joined >=7d ago and active in last 7d
    const cohort7 = users.filter((u) => tsMs(u.joinedAt) > 0 && now - tsMs(u.joinedAt) >= 7 * dayMs);
    const retained7 = cohort7.filter((u) => now - tsMs(u.lastLogin) < 7 * dayMs).length;
    const cohort30 = users.filter((u) => tsMs(u.joinedAt) > 0 && now - tsMs(u.joinedAt) >= 30 * dayMs);
    const retained30 = cohort30.filter((u) => now - tsMs(u.lastLogin) < 30 * dayMs).length;
    const ret7Pct = cohort7.length ? Math.round((retained7 / cohort7.length) * 100) : 0;
    const ret30Pct = cohort30.length ? Math.round((retained30 / cohort30.length) * 100) : 0;

    // Suspicious activity:
    //  - abuse strikes in last 7d
    //  - users with single-day XP > 750 (rate-limit cap is ~500/write; treat >750/day as anomaly)
    const strikeByUid = new Map<string, { count: number; kinds: Set<string> }>();
    for (const a of abuse) {
      const prev = strikeByUid.get(a.uid) ?? { count: 0, kinds: new Set<string>() };
      prev.count += 1;
      if (a.kind) prev.kinds.add(a.kind);
      strikeByUid.set(a.uid, prev);
    }
    const xpByUidDay = new Map<string, number>();
    for (const ev of xpEvents) {
      const key = `${ev.uid}__${startOfDay(ev.ms)}`;
      xpByUidDay.set(key, (xpByUidDay.get(key) ?? 0) + ev.points);
    }
    const xpAnomalies = new Map<string, number>(); // uid -> max single-day XP in window
    for (const [key, pts] of xpByUidDay) {
      const uid = key.split("__")[0];
      if (pts > (xpAnomalies.get(uid) ?? 0)) xpAnomalies.set(uid, pts);
    }
    const userByUid = new Map(users.map((u) => [u.uid, u] as const));
    const suspicious = Array.from(
      new Set<string>([...strikeByUid.keys(), ...xpAnomalies.keys()]),
    )
      .map((uid) => {
        const u = userByUid.get(uid);
        const s = strikeByUid.get(uid);
        const maxDayXp = xpAnomalies.get(uid) ?? 0;
        return {
          uid,
          label: u?.username ?? u?.name ?? u?.email ?? uid.slice(0, 8),
          strikes: s?.count ?? 0,
          kinds: Array.from(s?.kinds ?? []),
          maxDayXp,
          blocked: Boolean((u as (UserProfile & { blocked?: boolean }) | undefined)?.blocked),
          score: (s?.count ?? 0) * 10 + (maxDayXp > 750 ? 5 : 0),
        };
      })
      .filter((r) => r.strikes > 0 || r.maxDayXp > 750)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return {
      totalUsers,
      dau,
      wau,
      wallets,
      totalXp,
      gmToday,
      totalReferrals,
      refUsers,
      eventGoing,
      eventAttended,
      eventsCount: events.length,
      topByXp,
      topReferrers,
      days,
      ret7Pct,
      ret30Pct,
      cohort7Size: cohort7.length,
      cohort30Size: cohort30.length,
      suspicious,
    };
  }, [users, events, xpEvents, abuse]);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 sm:p-10 text-center">
        <Loader2 className="h-5 w-5 animate-spin inline text-brand-cyan" />
      </div>
    );
  }

  const walletPct = m.totalUsers ? Math.round((m.wallets / m.totalUsers) * 100) : 0;
  const dauPct = m.totalUsers ? Math.round((m.dau / m.totalUsers) * 100) : 0;
  const gmPct = m.totalUsers ? Math.round((m.gmToday / m.totalUsers) * 100) : 0;
  const gmTodaySeries = m.days[m.days.length - 1]?.gm ?? 0;
  const activeWalletsToday = m.days[m.days.length - 1]?.activeWallets ?? 0;
  const mintPct = mintStats && mintStats.max > 0 ? Math.round((mintStats.total / mintStats.max) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={Users} label="Total Users" value={m.totalUsers.toLocaleString()} />
        <StatTile
          icon={UserCheck}
          label="Daily Active"
          value={m.dau.toLocaleString()}
          sub={`${dauPct}% of users · ${m.wau} weekly`}
        />
        <StatTile
          icon={Wallet}
          label="Active Wallets · 24h"
          value={activeWalletsToday.toLocaleString()}
          sub={`${m.wallets} linked · ${walletPct}% of users`}
        />
        <StatTile
          icon={Sparkles}
          label="XP Distributed"
          value={m.totalXp.toLocaleString()}
          sub="across all users"
        />
        <StatTile
          icon={Sun}
          label="GM · Today"
          value={gmTodaySeries.toLocaleString()}
          sub={`${m.gmToday} unique · ${gmPct}% of users`}
        />
        <StatTile
          icon={Share2}
          label="Referrals"
          value={m.totalReferrals.toLocaleString()}
          sub={`${m.refUsers} active referrers`}
        />
        <StatTile
          icon={ImageIcon}
          label="NFTs Minted"
          value={mintStats ? mintStats.total.toLocaleString() : "—"}
          sub={
            mintStats
              ? `${mintPct}% of ${mintStats.max.toLocaleString()} · ${mintStats.remaining.toLocaleString()} left`
              : hasContract()
                ? "Loading on-chain…"
                : "Contract not configured"
          }
        />
        <StatTile
          icon={TrendingUp}
          label="Retention · 7d"
          value={`${m.ret7Pct}%`}
          sub={`${m.ret30Pct}% over 30d · ${m.cohort7Size} cohort`}
        />
      </div>

      {/* Daily series */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Daily active wallets · 14d" icon={Wallet}>
          <Sparkline
            data={m.days.map((d) => ({ label: d.day, value: d.activeWallets }))}
            accent="from-brand-cyan to-brand-purple"
            format={(n) => `${n} wallet${n === 1 ? "" : "s"}`}
          />
        </ChartCard>
        <ChartCard title="Daily GM check-ins · 14d" icon={Sun}>
          <Sparkline
            data={m.days.map((d) => ({ label: d.day, value: d.gm }))}
            accent="from-amber-400 to-rose-400"
            format={(n) => `${n} GM`}
          />
        </ChartCard>
        <ChartCard title="New user signups · 14d" icon={UserCheck}>
          <Sparkline
            data={m.days.map((d) => ({ label: d.day, value: d.newUsers }))}
            accent="from-emerald-400 to-teal-400"
            format={(n) => `${n} new`}
          />
        </ChartCard>
        <ChartCard title="New wallets linked · 14d" icon={Wallet}>
          <Sparkline
            data={m.days.map((d) => ({ label: d.day, value: d.newWallets }))}
            accent="from-violet-400 to-fuchsia-400"
            format={(n) => `${n} linked`}
          />
        </ChartCard>
      </div>

      {/* Leaderboards */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Top users by XP" icon={Trophy}>
          <BarList
            items={m.topByXp.map((u) => ({
              label: u.username ?? u.name ?? u.email ?? u.uid.slice(0, 6),
              value: u.points ?? 0,
            }))}
            accent="from-brand-cyan to-brand-purple"
            format={(n) => `${n.toLocaleString()} XP`}
          />
        </ChartCard>
        <ChartCard title="Top referrers" icon={Share2}>
          <BarList
            items={m.topReferrers.map((u) => ({
              label: u.username ?? u.name ?? u.email ?? u.uid.slice(0, 6),
              value:
                (u as UserProfile & { referralCount?: number }).referralCount ?? 0,
            }))}
            accent="from-emerald-400 to-brand-cyan"
            format={(n) => `${n} invite${n === 1 ? "" : "s"}`}
          />
        </ChartCard>
      </div>

      {/* Suspicious activity */}
      <ChartCard title="Suspicious activity · 7d" icon={AlertTriangle}>
        {m.suspicious.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            No anomalies detected. All clear.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {m.suspicious.map((s) => (
              <div
                key={s.uid}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                    s.blocked
                      ? "bg-rose-500/15 text-rose-400"
                      : s.strikes >= 3
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {s.label}
                    {s.blocked && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-rose-400">
                        blocked
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {s.strikes > 0 && <>{s.strikes} strike{s.strikes === 1 ? "" : "s"}</>}
                    {s.strikes > 0 && s.kinds.length > 0 && " · "}
                    {s.kinds.slice(0, 3).join(", ")}
                    {s.maxDayXp > 750 && (
                      <> · peak {s.maxDayXp.toLocaleString()} XP/day</>
                    )}
                  </div>
                </div>
                <div className="font-mono text-xs text-muted-foreground hidden sm:block">
                  {s.uid.slice(0, 8)}
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>

      <div className="grid grid-cols-2 gap-4">
        <StatTile
          icon={Calendar}
          label="Event RSVPs"
          value={m.eventGoing.toLocaleString()}
          sub={`${m.eventsCount} events`}
        />
        <StatTile
          icon={Trophy}
          label="Event Attendance"
          value={m.eventAttended.toLocaleString()}
          sub="XP awarded on join"
        />
      </div>
    </div>
  );
}

function ChartCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-brand-cyan" /> {title}
      </div>
      {children}
    </div>
  );
}

function BarList({
  items,
  accent,
  format,
}: {
  items: Array<{ label: string; value: number }>;
  accent: string;
  format: (n: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) {
    return <div className="text-sm text-muted-foreground py-6 text-center">No data yet.</div>;
  }
  return (
    <div className="space-y-2.5">
      {items.map((it, idx) => {
        const pct = Math.max(2, Math.round((it.value / max) * 100));
        return (
          <div key={`${it.label}-${idx}`} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate text-foreground/90">
                <span className="text-muted-foreground mr-1.5">#{idx + 1}</span>
                {it.label}
              </span>
              <span className="text-brand-cyan font-mono">{format(it.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${accent} rounded-full transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center glow">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
      <div className="text-2xl font-bold gradient-text">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function Sparkline({
  data,
  accent,
  format,
}: {
  data: Array<{ label: string; value: number }>;
  accent: string;
  format: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((a, d) => a + d.value, 0);
  const last = data[data.length - 1]?.value ?? 0;
  const prev = data[data.length - 2]?.value ?? 0;
  const delta = last - prev;
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-bold gradient-text leading-none">{format(last)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            total {total.toLocaleString()} · last 14d
          </div>
        </div>
        <div
          className={`text-xs font-mono ${
            delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-muted-foreground"
          }`}
        >
          {delta > 0 ? "+" : ""}
          {delta} d/d
        </div>
      </div>
      <div className="flex items-end gap-1 h-20">
        {data.map((d, i) => {
          const h = Math.max(2, Math.round((d.value / max) * 100));
          return (
            <div key={`${d.label}-${i}`} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-sm bg-gradient-to-t ${accent} opacity-80 group-hover:opacity-100 transition`}
                  style={{ height: `${h}%` }}
                  title={`${d.label}: ${format(d.value)}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

// -------------------- FEEDBACK --------------------

type FeedbackRow = {
  id: string;
  kind: "bug" | "suggestion" | "rating";
  message: string;
  rating: number | null;
  url?: string;
  uid: string | null;
  email: string | null;
  name: string | null;
  status: "new" | "reviewed" | "resolved";
  createdAt?: Timestamp;
  userAgent?: string;
};

function FeedbackPanel() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "bug" | "suggestion" | "rating">("all");

  useEffect(() => {
    const { db } = getFirebase();
    if (!db) return;
    const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FeedbackRow, "id">) })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.kind === filter);

  const setStatus = async (id: string, status: FeedbackRow["status"]) => {
    const { db } = getFirebase();
    if (!db) return;
    await updateDoc(doc(db, "feedback", id), { status });
    toast.success(`Marked ${status}`);
  };

  const remove = async (id: string) => {
    const { db } = getFirebase();
    if (!db) return;
    await deleteDoc(doc(db, "feedback", id));
    toast.success("Deleted");
  };

  const kindMeta: Record<FeedbackRow["kind"], { icon: typeof Bug; label: string; color: string }> = {
    bug: { icon: Bug, label: "Bug", color: "text-rose-400" },
    suggestion: { icon: Lightbulb, label: "Idea", color: "text-amber-400" },
    rating: { icon: Star, label: "Rating", color: "text-brand-cyan" },
  };

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-2 flex flex-wrap gap-1">
        {(["all", "bug", "suggestion", "rating"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
              filter === f
                ? "gradient-bg text-primary-foreground glow"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            {f} {f !== "all" && `(${rows.filter((r) => r.kind === f).length})`}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground px-2 self-center">
          {filtered.length} entries
        </span>
      </div>

      {loading && (
        <div className="glass rounded-2xl p-6 sm:p-10 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin inline" />
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div className="glass rounded-2xl p-6 sm:p-10 text-center text-muted-foreground text-sm">
          No feedback yet.
        </div>
      )}

      <div className="grid gap-3">
        {filtered.map((r) => {
          const Meta = kindMeta[r.kind];
          const Icon = Meta.icon;
          const when = r.createdAt?.toDate?.().toLocaleString() ?? "";
          return (
            <div key={r.id} className="glass rounded-2xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl glass-strong flex items-center justify-center ${Meta.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{Meta.label}</span>
                    {r.kind === "rating" && r.rating != null && (
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < (r.rating ?? 0) ? "fill-brand-cyan text-brand-cyan" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </span>
                    )}
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        r.status === "new"
                          ? "bg-brand-cyan/15 text-brand-cyan"
                          : r.status === "reviewed"
                          ? "bg-amber-400/15 text-amber-300"
                          : "bg-emerald-400/15 text-emerald-300"
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{when}</span>
                  </div>
                  <div className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                    {r.message || <span className="text-muted-foreground italic">No message</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    <span>{r.name ?? "Anonymous"}</span>
                    {r.email && <span>{r.email}</span>}
                    {r.url && <span>· {r.url}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {r.status !== "reviewed" && (
                      <button
                        onClick={() => setStatus(r.id, "reviewed")}
                        className="text-xs px-3 py-1.5 rounded-lg glass-strong hover:bg-white/10"
                      >
                        Mark reviewed
                      </button>
                    )}
                    {r.status !== "resolved" && (
                      <button
                        onClick={() => setStatus(r.id, "resolved")}
                        className="text-xs px-3 py-1.5 rounded-lg glass-strong hover:bg-white/10"
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={() => remove(r.id)}
                      className="text-xs px-3 py-1.5 rounded-lg glass-strong hover:bg-white/10 text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5 inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
