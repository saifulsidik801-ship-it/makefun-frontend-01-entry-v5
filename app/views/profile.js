// Profile: avatar + name + @handle · joined date; tinted Prizes tile;
// solutions BEST PLACE FIRST (Place | Bounty/solution | Score | Prize).
// One endpoint: ROUTES.profile.
import { esc, usd, num, date, ord, pctMicro } from '../format.js';
const CSS = 'css-profile';
function ensureCss() {
  if (document.getElementById(CSS)) return;
  const s = document.createElement('style'); s.id = CSS;
  s.textContent = '.who{display:flex;gap:14px;align-items:center;margin:8px 0}'
    + '.who .avatar{width:72px;height:72px;border-radius:50%;background:#2456d6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;flex:none}'
    + '.who img{width:72px;height:72px;border-radius:50%;object-fit:cover;background:#eef1f4;flex:none}'
    + '.who .sub{color:#5b6470;font-size:13px}'
    + '.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:14px 0}'
    + '.tile{border:1px solid #e5e8ec;border-radius:8px;padding:10px}.tile b{font-size:18px;display:block}.tile span{color:#5b6470;font-size:12px}'
    + '.tile.prize{background:#fff4d6;border-color:#f2d492}'
    + 'table.sol{width:100%;border-collapse:collapse;font-size:13px}'
    + 'table.sol th,table.sol td{padding:7px 6px;border-top:1px solid #eef1f4;text-align:left;vertical-align:top}'
    + 'table.sol th{color:#5b6470;font-size:12px}table.sol td.r,table.sol th.r{text-align:right}';
  document.head.appendChild(s);
}
export async function render(view, arg, ctx) {
  ensureCss();
  const p = await ctx.api.profile(arg.handle);
  const rec = p.record || {};
  const img = (p.avatar && p.avatar.url) || p.image || '';
  const initials = esc((p.display_name || p.handle || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?');
  const sols = (p.solutions || []).slice().sort((a, b) => {
    const pa = a.placement == null ? 1e9 : a.placement, pb = b.placement == null ? 1e9 : b.placement;
    return pa - pb || new Date(b.entered_at) - new Date(a.entered_at);
  });
  view.innerHTML = '<div class=who><div class=avatar id=avatar>' + initials + '</div>'
    + '<div><h1 style="margin:0">' + esc(p.display_name || p.handle) + '</h1>'
    + '<div class=sub>@' + esc(p.handle) + ' · joined ' + date(p.joined_at) + '</div>'
    + (p.bio ? '<p style="margin:6px 0 0;max-width:60ch">' + esc(p.bio) + '</p>' : '') + '</div></div>'
    + '<div class=tiles>'
    + '<div class=tile><b>' + num(rec.competitions_entered || 0) + '</b><span>Bounties entered</span></div>'
    + '<div class=tile><b>' + (rec.best_placement ? ord(rec.best_placement) : '—') + '</b><span>Best place</span></div>'
    + '<div class=tile><b>' + num(rec.competitions_placed || 0) + '</b><span>Placements</span></div>'
    + '<div class=tile><b>' + num(rec.competitions_won || 0) + '</b><span>Wins</span></div>'
    + '<div class=tile prize><b>' + usd(rec.prize_usd || 0) + '</b><span>Prizes won</span></div>'
    + '</div>'
    + '<h2>Solutions — best place first (' + sols.length + ')</h2>'
    + (sols.length ? '<table class=sol><thead><tr><th>Place</th><th>Bounty / solution</th><th class=r>Score</th><th class=r>Prize</th></tr></thead><tbody>'
      + sols.map(s => '<tr><td><b>' + (s.placement ? ord(s.placement) : '—') + '</b></td><td><a href="#/bounty/' + esc(s.competition.slug) + '">' + esc(s.competition.title) + '</a><br><span style="color:#5b6470">' + esc(s.title || '') + '</span></td><td class=r>' + (s.score ? pctMicro(s.score.value) : '—') + '</td><td class=r><b>' + (s.prize_usd ? usd(s.prize_usd) : '—') + '</b></td></tr>').join('')
      + '</tbody></table>' : '<p>No solutions yet.</p>');
  // Avatars carry cross-origin-resource-policy: same-origin, so a plain <img>
  // is blocked; a CORS fetch + blob URL is allowed (Access-Control-Allow-Origin: *).
  if (img) {
    const load = (async () => {
      const blob = await (await fetch('https://make.fun' + img, { mode: 'cors' })).blob();
      const url = URL.createObjectURL(blob);
      await new Promise((ok, no) => { const im = new Image(); im.onload = ok; im.onerror = no; im.src = url; });
      const slot = view.querySelector('#avatar');
      if (slot) { const im = document.createElement('img'); im.src = url; im.alt = ''; slot.replaceWith(im); }
    })().catch(() => {});
    await Promise.race([load, new Promise(r => setTimeout(r, 4000))]);
  }
}
