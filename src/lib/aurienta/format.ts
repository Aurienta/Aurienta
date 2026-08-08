// Aurienta formatters — EGP, percentages, hashes, time-remaining.

export function egp(n: number, opts: { compact?: boolean; decimals?: number } = {}) {
  if (opts.compact && Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M EGP`;
  if (opts.compact && Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}k EGP`;
  return `${n.toLocaleString("en-US", { maximumFractionDigits: opts.decimals ?? 0 })} EGP`;
}

export function pct(n: number, decimals = 1) {
  return `${n.toFixed(decimals)}%`;
}

export function shortHash(h?: string | null, head = 8, tail = 4) {
  if (!h) return "—";
  if (h.length <= head + tail) return h;
  return `${h.slice(0, head)}…${h.slice(-tail)}`;
}

export function timeRemaining(to: Date): string {
  const ms = to.getTime() - Date.now();
  if (ms <= 0) return "ended";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function timeAgo(d: Date): string {
  const ms = Date.now() - new Date(d).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function vitalSign(value: number, healthy: number, alert: number, inverted = false) {
  if (inverted) {
    if (value <= healthy) return "green";
    if (value < alert) return "yellow";
    return "red";
  }
  if (value >= healthy) return "green";
  if (value >= alert) return "yellow";
  return "red";
}
