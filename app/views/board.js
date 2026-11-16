// Board: sort + category chips + type-to-filter; keyed rows patched in place,
// never a full re-render. One endpoint: ROUTES.board.
import { esc, usd, usd0, num, left, leftClass, spanPct, date } from '../format.js';
const CSS = 'css-board';
function ensureCss() {
  if (document.getElementById(CSS)) return;
  const s = document.createElement('style'); s.id = CSS;
  s.textContent = '.strip{display:flex;gap:18px;flex-wrap:wrap;color:#5b6470;font-size:13px;margin:6px 0 10px}'
    + '.next{background:#fff7e6;border:1px solid #f2d492;border-radius:8px;padding:8px 12px;margin:0 0 12px}'
    + '.chips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}'
    + '.chip{border:1px solid #d5dae0;background:#fff;border-radius:20px;padding:4px 11px;cursor:pointer;font-size:13px}'
    + '.chip.on{background:#14181f;color:#fff;border-color:#14181f}'
    + '.filter{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #d5dae0;border-radius:8px;font-size:14px;margin:0 0 4px}'
    + '.count{color:#5b6470;font-size:12px;margin:0 0 10px}'
    + '.row{display:grid;grid-template-columns:1fr auto;gap:2px 14px;padding:11px 4px;border-top:1px solid #e5e8ec;text-decoration:none;color:inherit}'
    + '.row:hover{background:#f7f9fb}.row b{font-size:15px}.row .meta{color:#5b6470;font-size:12px}'
    + '.row .pot{font-weight:700;text-align:right}.row .tl{font-weight:700;text-align:right}'
    + '.row .tl.soon{color:#b26a00}.row .tl.urgent{color:#c81e1e}'
    + '.bar{grid-column:1/3;height:4px;background:#eef1f4;border-radius:2px;overflow:hidden}.bar i{display:block;height:100%;background:#2456d6}'
    + 'kbd{border:1px solid #d5dae0;border-radius:4px;padding:0 4px;font-size:11px;background:#f7f9fb}';
  document.head.appendChild(s);
}
const SORTS = [['closing', 'Closing soon'], ['pot', 'Biggest pot'], ['entries', 'Most entries']];
export async function render(view, arg, ctx) {
  ensureCss();
  const items = await ctx.api.board();
  const open = items.filter(c => c.status === 'open');
  const cats = ['All', ...new Set(open.map(c => c.category).filter(Boolean))];
  let sort = 'closing', cat = 'All', q = '';
  const now0 = Date.now();
  const next = open.filter(c => new Date(c.deadline).getTime() > now0).sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];
  const pot = open.reduce((s, c) => s + Number(c.potUsd || c.rewardAmount || 0), 0);
  view.innerHTML = '<h1>Live bounty board</h1>'
    + '<div class=strip><span><b>' + open.length + '</b> open bounties</span><span>Live pot <b>' + usd0(pot) + '</b></span><span><b>' + num(open.reduce((s, c) => s + Number(c.submissionCount || 0), 0)) + '</b> entries</span></div>'
    + (next ? '<p class=next>Next deadline: <a href="#/bounty/' + esc(next.slug) + '"><b>' + esc(next.title) + '</b></a> — closes in <b>' + left(new Date(next.deadline).getTime() - now0) + '</b> · pot ' + usd0(next.potUsd || next.rewardAmount) + '</p>' : '')
    + '<div class=chips id=sorts>' + SORTS.map(([k, t]) => '<button class=chip data-sort="' + k + '">' + t + '</button>').join('') + '</div>'
    + '<div class=chips id=cats>' + cats.map(c => '<button class=chip data-cat="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div>'
    + '<input class=filter id=filter type=search placeholder="Type to filter — / focuses, Esc clears" aria-label="Filter bounties">'
    + '<p class=count id=count></p><div id=rows></div>'
    + '<p class=count>Tip: press <kbd>/</kbd> to filter, <kbd>Esc</kbd> to clear. Rows update in place every second — no page rebuild.</p>';
  const rowsEl = view.querySelector('#rows'), countEl = view.querySelector('#count');
  const filterEl = view.querySelector('#filter');
  const nodes = new Map();
  function rowEl(c) {
    const a = document.createElement('a');
    a.className = 'row'; a.href = '#/bounty/' + c.slug; a.dataset.slug = c.slug;
    a.innerHTML = '<span><b></b><br><span class=meta></span></span><span><span class=pot></span><br><span class=tl></span></span><span class=bar><i></i></span>';
    nodes.set(c.slug, a);
    return a;
  }
  function patchList() {
    const needle = q.trim().toLowerCase();
    let list = open.filter(c => (cat === 'All' || c.category === cat)
      && (!needle || (c.title + ' ' + c.slug + ' ' + (c.category || '')).toLowerCase().includes(needle)));
    if (sort === 'closing') list.sort((a, b) => {
      const da = new Date(a.deadline).getTime(), db = new Date(b.deadline).getTime(), n = Date.now();
      return ((da < n) - (db < n)) || da - db;
    });
    if (sort === 'pot') list.sort((a, b) => Number(b.potUsd || b.rewardAmount || 0) - Number(a.potUsd || a.rewardAmount || 0));
    if (sort === 'entries') list.sort((a, b) => Number(b.submissionCount || 0) - Number(a.submissionCount || 0));
    const now = Date.now();
    for (const c of list) {
      let a = nodes.get(c.slug);
      if (!a) { a = rowEl(c); }
      a.querySelector('b').textContent = c.title;
      a.querySelector('.meta').textContent = c.category + ' · ' + num(c.submissionCount || 0) + ' entries · fee $' + (c.entryFeeUsd || '0') + ' · opened ' + date(c.publishedAt);
      a.querySelector('.pot').textContent = usd0(c.potUsd || c.rewardAmount) + ' pot';
      const tl = a.querySelector('.tl'), ms = new Date(c.deadline).getTime() - now;
      tl.textContent = left(ms); tl.className = 'tl ' + leftClass(ms);
      a.querySelector('.bar i').style.width = spanPct(c.publishedAt, c.deadline, now) + '%';
      rowsEl.appendChild(a);
    }
    for (const [slug, a] of nodes) if (!list.some(c => c.slug === slug)) a.remove();
    countEl.textContent = needle ? 'showing ' + list.length + ' of ' + open.length + ' bounties' : '';
  }
  function patchTimes() {
    const now = Date.now();
    for (const [slug, a] of nodes) {
      if (!a.isConnected) continue;
      const c = open.find(x => x.slug === slug);
      if (!c) continue;
      const ms = new Date(c.deadline).getTime() - now, tl = a.querySelector('.tl');
      tl.textContent = left(ms); tl.className = 'tl ' + leftClass(ms);
      a.querySelector('.bar i').style.width = spanPct(c.publishedAt, c.deadline, now) + '%';
    }
  }
  view.querySelector('#sorts').addEventListener('click', e => {
    const b = e.target.closest('[data-sort]'); if (!b) return;
    sort = b.dataset.sort; patchList(); paintChips();
  });
  view.querySelector('#cats').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    cat = b.dataset.cat; patchList(); paintChips();
  });
  function paintChips() {
    view.querySelectorAll('#sorts .chip').forEach(b => b.classList.toggle('on', b.dataset.sort === sort));
    view.querySelectorAll('#cats .chip').forEach(b => b.classList.toggle('on', b.dataset.cat === cat));
  }
  filterEl.addEventListener('input', () => { q = filterEl.value; patchList(); });
  if (!render.keyBound) {
    render.keyBound = true;
    document.addEventListener('keydown', function onKey(e) {
      const f = document.querySelector('#filter');
      if (!f) return;
      if (e.key === '/' && document.activeElement !== f) { e.preventDefault(); f.focus(); }
      if (e.key === 'Escape' && document.activeElement === f) { f.value = ''; f.dispatchEvent(new Event('input')); f.blur(); }
    });
  }
  paintChips();
  patchList();
  ctx.onTick(patchTimes);
}
