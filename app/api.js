// One JSON endpoint per view; Map cache + ETag revalidation + in-flight dedupe
// + minute-bound cache + cursor pagination + 429 wait-and-retry.
const API = 'https://make.fun/api';
export const ROUTES = {
  board: '/competitions?status=open&activity=times',
  bounty: s => '/competitions/' + s + '?submissions=summary',
  leaderboard: s => '/competitions/' + s + '/leaderboard?rows=all',
  profile: h => '/profiles/' + h
};
const cache = new Map(), inflight = new Map();
export const stats = { requests: 0, unchanged: 0, cached: 0 };
export function resetStats() { stats.requests = 0; stats.unchanged = 0; stats.cached = 0; paintStats(); }
export function paintStats() {
  const el = document.getElementById('req');
  if (el) el.textContent = 'this view: ' + stats.requests + ' API request(s) · ' + stats.unchanged + ' unchanged (ETag) · ' + stats.cached + ' from cache';
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function fetchJson(path) {
  const url = API + path, now = Date.now(), hit = cache.get(url);
  if (hit && now - hit.at < 60000) { stats.cached++; paintStats(); return hit.body; }
  if (inflight.has(url)) return inflight.get(url);
  const job = (async () => {
    for (let attempt = 0; attempt < 4; attempt++) {
      const headers = {};
      if (hit && hit.etag) headers['If-None-Match'] = hit.etag;
      let res;
      try { res = await fetch(url, { headers }); }
      catch (e) {
        if (hit && hit.etag) { delete headers['If-None-Match']; res = await fetch(url, { headers }); }
        else throw e;
      }
      stats.requests++; paintStats();
      if (res.status === 304 && hit) { hit.at = Date.now(); stats.unchanged++; paintStats(); return hit.body; }
      if (res.status === 429) { await sleep(Math.min(30000, 1000 * (parseInt(res.headers.get('Retry-After') || '2', 10) || 2) * (attempt + 1))); continue; }
      if (!res.ok) throw new Error('make.fun ' + res.status + ' for ' + path);
      const body = await res.json();
      cache.set(url, { etag: res.headers.get('ETag'), body, at: Date.now() });
      return body;
    }
    throw new Error('make.fun rate-limited ' + path);
  })();
  inflight.set(url, job);
  try { return await job; } finally { inflight.delete(url); }
}
export async function board() {
  let items = [], cursor = null;
  do {
    const d = await fetchJson(ROUTES.board + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
    items = items.concat(d.items || []);
    cursor = d.next_cursor || null;
  } while (cursor);
  return items;
}
export const bounty = s => fetchJson(ROUTES.bounty(s));
export const leaderboard = s => fetchJson(ROUTES.leaderboard(s));
export const profile = h => fetchJson(ROUTES.profile(h));
