// Formatting: money, time left, dates, HTML escaping.
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const usd = n => '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
export const usd0 = n => '$' + Math.round(Number(n || 0)).toLocaleString('en-US');
export const num = n => Number(n || 0).toLocaleString('en-US');
export const pctMicro = m => (Number(m || 0) / 10000).toFixed(2) + '%';
export function left(ms) {
  if (ms <= 0) return 'closed';
  const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
  return d > 0 ? d + 'd ' + h + 'h' : h > 0 ? h + 'h ' + m + 'm' : m + 'm ' + (s % 60) + 's';
}
export function leftClass(ms) { return ms <= 0 ? '' : ms < 3600000 ? 'urgent' : ms < 86400000 ? 'soon' : ''; }
export function spanPct(opened, deadline, now) {
  const o = new Date(opened).getTime(), d = new Date(deadline).getTime();
  if (!(d > o)) return 100;
  return Math.max(0, Math.min(100, 100 * (now - o) / (d - o)));
}
export const date = iso => { try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return iso; } };
export const ord = n => { const v = Number(n), s = ['th', 'st', 'nd', 'rd'], k = v % 100; return v + (s[(k - 20) % 10] || s[k] || s[0]); };
