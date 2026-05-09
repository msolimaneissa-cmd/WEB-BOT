export type DiscordActivityItem = {
  id: string;
  timestamp?: unknown;
  [key: string]: unknown;
};

export function getActivityTimeMs(activity: Pick<DiscordActivityItem, 'timestamp'>): number {
  const t: any = activity.timestamp as any;
  if (!t) return 0;
  if (typeof t === 'number' && Number.isFinite(t)) return t;
  if (typeof t === 'string') {
    const ms = new Date(t).getTime();
    return Number.isFinite(ms) ? ms : 0;
  }
  if (t instanceof Date) return Number.isFinite(t.getTime()) ? t.getTime() : 0;
  if (typeof t === 'object' && typeof t.seconds === 'number') return t.seconds * 1000;
  if (typeof t === 'object' && typeof t.toDate === 'function') {
    const d = t.toDate();
    if (d instanceof Date) return Number.isFinite(d.getTime()) ? d.getTime() : 0;
  }
  return 0;
}

