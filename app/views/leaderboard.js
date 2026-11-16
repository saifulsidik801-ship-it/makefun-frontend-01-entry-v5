// Leaderboard: 50 rows a page with deep links, rank column with the 90%
// interval, Prize from the cached board item's rewardsNow. One endpoint:
// ROUTES.leaderboard; the band reads the cached board (0 extra requests).
import { esc, usd, num, left, pctMicro } from '../format.js';
const CSS = 'css-lb';
const PAGE = 50;
function ensureCss() {
  if (document.getElementById(CSS)) return;
  const s = document.createElement('style'); s.id = CSS;
  s.textContent = '.band{display:flex;gap:18px;flex-wrap:wrap;background:#f7f9fb;border:1px solid #e5e8ec;border-radius:8px;padding:10px 14px;margin:10px 0}'
    + 'table.lb{width:100%;border-collapse:collapse;font-size:13px}'
    + 'table.lb th,table.lb td{padding:7px 6px;border-top:1px solid #eef1f4;text-align:left;vertical-align:top}'
    + 'table.lb th{color:#5b6470;font-size:12px}table.lb td.r,table.lb th.r{text-align:right}'
    + 'table.lb td.t{max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    + '.pager{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:12px 0}'
    + '.pager a{font-weight:700}.pager span{color:#5b6470;font-size:13px}';
  document.head.appendChild(s);
}
function norm(r) {
  if (r.values) return { rank: r.rank, handle: r.handle, title: r.title || '', judge: r.values.judge, low: r.values.judge_low, high: r.values.judge_high, prizeRank: r.prize_rank };
  return { rank: r.rank, handle: r.handle, title: r.title || '', judge: r.value, low: r.interval ? r.interval.low : null, high: r.interval ? r.interval.high : null, prizeRank: r.prize_rank };
}
export async function render(view, arg, ctx) {
  ensureCss();
  const [lb, items] = await Promise.all([ctx.api.leaderboard(arg.slug), ctx.api.board()]);
  const item = items.find(x => x.slug === arg.slug) || {};
  const rows = [...(lb.entries || []), ...(lb.rest || [])].map(norm).sort((a, b) => a.rank - b.rank);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const page = Math.min(Math.max(1, arg.page || 1), pages);
  const slice = rows.slice((page - 1) * PAGE, page * PAGE);
  const leader = rows[0];
  const prizeFor = pr => {
    const rw = (item.rewardsNow || []).find(r => r.place === pr);
    return rw ? usd(rw.amountUsd) : '—';
  };
  const base = '#/leaderboard/' + esc(arg.slug) + '/';
  view.innerHTML = '<h1>Leaderboard — ' + esc(item.title || arg.slug) + '</h1>'
    + '<div class=band><span>Live pot <b>' + usd(item.potUsd || item.rewardAmount || 0) + '</b></span>'
    + '<span>Closes in <b>' + left(new Date(item.deadline).getTime() - Date.now()) + '</b></span>'
    + '<span>Ranked <b>' + rows.length + ' of ' + num(item.submissionCount || rows.length) + '</b></span>'
    + (leader ? '<span>Leader <b><a href="#/profile/' + esc(leader.handle) + '">' + esc(leader.handle) + '</a> — ' + pctMicro(leader.judge) + '</b></span>' : '')
    + '</div>'
    + '<div class=pager><span>Rows ' + ((page - 1) * PAGE + 1) + '–' + Math.min(page * PAGE, rows.length) + ' of ' + rows.length + ' ranked · Page ' + page + ' of ' + pages + ' · ' + slice.length + ' row nodes on the page</span>'
    + (page > 1 ? '<a href="' + base + (page - 1) + '">← Prev</a>' : '<span>← Prev</span>')
    + (page < pages ? '<a href="' + base + (page + 1) + '">Next →</a>' : '<span>Next →</span>')
    + '</div>'
    + '<table class=lb><thead><tr><th>Rank</th><th>Entry</th><th class=r>Judge · 90% interval</th><th class=r>Prize</th></tr></thead><tbody>'
    + slice.map(r => '<tr><td>#' + r.rank + '</td><td><a href="#/profile/' + esc(r.handle) + '"><b>' + esc(r.handle) + '</b></a><br><span class=t style="display:block;color:#5b6470">' + esc(r.title) + '</span></td><td class=r><b>' + pctMicro(r.judge) + '</b><br><span style="color:#5b6470">' + (r.low != null ? pctMicro(r.low) + ' – ' + pctMicro(r.high) : '—') + '</span></td><td class=r><b>' + prizeFor(r.prizeRank) + '</b></td></tr>').join('')
    + '</tbody></table>'
    + '<div class=pager><span>Page ' + page + ' of ' + pages + '</span>'
    + (page > 1 ? '<a href="' + base + (page - 1) + '">← Prev</a>' : '<span>← Prev</span>')
    + (page < pages ? '<a href="' + base + (page + 1) + '">Next →</a>' : '<span>Next →</span>')
    + '<a href="#/bounty/' + esc(arg.slug) + '">Back to the bounty →</a></div>';
}
