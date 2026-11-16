// Bounty page: rewards with proportional bars + fee share, Dates as 3 cells,
// Enter CTA, leaderboard tab with ranked count. Board beside it from the
// cached board — 0 extra requests. One endpoint: ROUTES.bounty.
import { esc, usd, usd0, num, left, date } from '../format.js';
const CSS = 'css-bounty';
function ensureCss() {
  if (document.getElementById(CSS)) return;
  const s = document.createElement('style'); s.id = CSS;
  s.textContent = '.split{display:grid;gap:20px}'
    + '.split aside{display:none;border-right:1px solid #e5e8ec;padding-right:16px}'
    + '@media(min-width:1100px){.split{grid-template-columns:300px 1fr}.split aside{display:block}}'
    + '.split aside a{display:block;padding:7px 4px;border-top:1px solid #eef1f4;text-decoration:none;color:inherit;font-size:13px}'
    + '.split aside a[aria-current=page]{background:#eef4ff;font-weight:700}'
    + '.split aside .pot{float:right;font-weight:700}'
    + '.band{display:flex;gap:18px;flex-wrap:wrap;background:#f7f9fb;border:1px solid #e5e8ec;border-radius:8px;padding:10px 14px;margin:10px 0}'
    + '.dates{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0}'
    + '.dates div{border:1px solid #e5e8ec;border-radius:8px;padding:8px 10px}.dates b{display:block;font-size:13px}.dates span{color:#5b6470;font-size:12px}'
    + '.cta{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}'
    + '.btn{background:#2456d6;color:#fff;padding:9px 16px;border-radius:8px;font-weight:700;text-decoration:none}'
    + '.btn.ghost{background:#fff;color:#2456d6;border:1px solid #2456d6}'
    + '.rw{display:grid;grid-template-columns:64px 1fr auto;gap:4px 10px;align-items:center;padding:5px 0;border-top:1px solid #eef1f4;font-size:13px}'
    + '.rw .bar2{display:block;height:8px;background:#eef1f4;border-radius:4px;overflow:hidden}.rw .bar2 i{display:block;height:100%;background:#2456d6}'
    + '.rw .amt{text-align:right}.rw .fee{color:#5b6470;font-size:12px}'
    + '.desc p{margin:0 0 10px}.desc{max-width:70ch}';
  document.head.appendChild(s);
}
export async function render(view, arg, ctx) {
  ensureCss();
  const [c, items] = await Promise.all([ctx.api.bounty(arg.slug), ctx.api.board()]);
  const open = items.filter(x => x.status === 'open')
    .sort((a, b) => {
      const da = new Date(a.deadline).getTime(), db = new Date(b.deadline).getTime(), n = Date.now();
      return ((da < n) - (db < n)) || da - db;
    });
  const leftTxt = x => { const t = left(new Date(x.deadline).getTime() - Date.now()); return t === 'closed' ? 'closed' : t + ' left'; };
  const finalPhase = (c.phases || []).find(p => p.key === 'final');
  const rewards = (c.rewardsNow || []).slice().sort((a, b) => a.place - b.place);
  const maxAmt = Math.max(1, ...rewards.map(r => Number(r.amountUsd || 0)));
  const desc = String(c.description || '').split(/\n\n+/).filter(Boolean);
  view.innerHTML = '<div class=split><aside aria-label="Bounty board"><h2>Board</h2>'
    + open.map(x => '<a href="#/bounty/' + esc(x.slug) + '"' + (x.slug === c.slug ? ' aria-current=page' : '') + '><span class=pot>' + usd0(x.potUsd || x.rewardAmount) + '</span>' + esc(x.title) + '<br><span style="color:#5b6470">' + leftTxt(x) + ' · ' + num(x.submissionCount || 0) + ' entries</span></a>').join('')
    + '</aside><article><h1>' + esc(c.title) + '</h1>'
    + '<p style="color:#5b6470">' + esc(c.sponsor ? c.sponsor.name : '') + ' · ' + esc(c.category || '') + ' · ' + (c.skills || []).map(esc).join(' · ') + '</p>'
    + '<div class=band><span>Live pot <b>' + usd0(c.potUsd || c.rewardAmount) + '</b></span><span><b>' + num(c.entryFeePayers || 0) + '</b> fee payers</span><span>Entry fee <b>$' + (c.entryFeeUsd || '0') + '</b></span><span><b>' + num(c.submissionCount || 0) + '</b> entries</span><span>Closes in <b>' + left(new Date(c.deadline).getTime() - Date.now()) + '</b></span></div>'
    + '<div class=dates><div><span>Opened</span><b>' + date(c.publishedAt || c.opensAt) + '</b></div><div><span>Deadline</span><b>' + date(c.deadline) + '</b></div><div><span>Results by</span><b>' + (finalPhase ? date(finalPhase.endsAt) : '—') + '</b></div></div>'
    + '<div class=cta><a class=btn href="https://make.fun/bounty/' + esc(c.slug) + '">Enter on make.fun ↗</a><a class=btn ghost href="#/leaderboard/' + esc(c.slug) + '">Full leaderboard</a><button class=btn ghost id=lbtab type=button>Leaderboard</button></div>'
    + '<div id=lbmini></div>'
    + '<h2>Rewards — ' + rewards.length + ' places, fee share included</h2>'
    + rewards.map(r => '<div class=rw><span>' + (r.place === 1 ? '🥇 1st' : r.place === 2 ? '🥈 2nd' : r.place === 3 ? '🥉 3rd' : r.place + 'th') + '</span><span><span class=bar2><i style="width:' + Math.round(100 * Number(r.amountUsd || 0) / maxAmt) + '%"></i></span><br><span class=fee>base ' + usd(r.baseUsd) + ' + ' + usd(r.feeShareUsd) + ' from fees</span></span><span class=amt><b>' + usd(r.amountUsd) + '</b></span></div>').join('')
    + '<h2>About this bounty</h2><div class=desc>' + desc.slice(0, 3).map(p => '<p>' + esc(p) + '</p>').join('') + '</div>'
    + '<p><a href="https://make.fun/bounty/' + esc(c.slug) + '">Read the full rules on make.fun ↗</a></p>'
    + '</article></div>';
  view.querySelector('#lbtab').addEventListener('click', async e => {
    const box = view.querySelector('#lbmini');
    e.target.disabled = true; e.target.textContent = 'Loading…';
    try {
      const lb = await ctx.api.leaderboard(c.slug);
      const rows = [...(lb.entries || []), ...(lb.rest || [])].sort((a, b) => a.rank - b.rank);
      e.target.textContent = 'Leaderboard · ' + rows.length + ' ranked';
      box.innerHTML = '<h2>Leaderboard — top ' + Math.min(10, rows.length) + ' of ' + rows.length + ' ranked</h2>'
        + rows.slice(0, 10).map(r => '<p style="margin:4px 0">#' + r.rank + ' <a href="#/profile/' + esc(r.handle) + '">' + esc(r.handle) + '</a> — ' + ((r.values ? r.values.judge : r.value) / 10000).toFixed(2) + '%</p>').join('')
        + '<p><a href="#/leaderboard/' + esc(c.slug) + '">Full leaderboard →</a></p>';
    } catch (err) { e.target.textContent = 'Leaderboard (unavailable)'; }
  });
}
