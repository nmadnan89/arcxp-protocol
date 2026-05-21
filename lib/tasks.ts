import { XP_ACTIONS, type XpAction } from "./xp";

export type TaskRepeat = "daily" | "once";

export type TaskDef = {
  id: string;
  title: string;
  action: XpAction;
  repeat: TaskRepeat;
};

export const TASKS: TaskDef[] = [
  { id: "gm",                  title: "Say GM",                   action: "gm",                  repeat: "daily" },
  { id: "daily_login",         title: "Daily login",              action: "daily_login",         repeat: "daily" },
  { id: "read_content",        title: "Read featured content",    action: "read_content",        repeat: "daily" },
  { id: "watch_video",         title: "Watch a video",            action: "watch_video",         repeat: "daily" },
  { id: "event_participation", title: "Join a community event",   action: "event_participation", repeat: "daily" },
];

export const taskPoints = (t: TaskDef) => XP_ACTIONS[t.action];

const todayKey = () => new Date().toISOString().slice(0, 10);

/** dedupeKey strategy: daily tasks reset per UTC day; once tasks are lifetime. */
export function taskDedupeKey(t: TaskDef): string {
  return t.repeat === "daily" ? todayKey() : "lifetime";
}

export function taskEventId(t: TaskDef): string {
  return `${t.action}__${taskDedupeKey(t)}`;
}