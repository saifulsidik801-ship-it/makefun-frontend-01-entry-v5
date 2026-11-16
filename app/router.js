// Router: hash routes, one view per dynamic import(), live request counter.
// First load is this file + index.html only; every view arrives later by import().
const view = document.getElementById('view');
let apiMod = null, tick = 0;
window.__shotReady = false;
async function getApi() { apiMod ??= await import('./api.js'); return apiMod; }
function stopTick() { if (tick) { clearInterval(tick); tick = 0; } }
async function go() {
  stopTick();
  const api = await getApi();
  api.resetStats();
  window.__shotReady = false;
  const parts = (location.hash || '#/').slice(2).split('/').filter(Boolean);
  let mod, arg = {};
  try {
    if (parts.length === 0) { mod = await import('./views/board.js'); }
    else if (parts[0] === 'bounty' && parts[1]) { mod = await import('./views/bounty.js'); arg = { slug: parts[1] }; }
    else if (parts[0] === 'leaderboard' && parts[1]) { mod = await import('./views/leaderboard.js'); arg = { slug: parts[1], page: parseInt(parts[2] || '1', 10) || 1 }; }
    else if (parts[0] === 'profile' && parts[1]) { mod = await import('./views/profile.js'); arg = { handle: parts[1] }; }
    else { view.innerHTML = '<h1>Not found</h1><p><a href="#/">Back to the board</a></p>'; window.__shotReady = true; return; }
    document.title = 'make.fun live — ' + (parts[0] || 'board');
    await mod.render(view, arg, { api, onTick(fn) { tick = setInterval(fn, 1000); } });
    api.paintStats();
    window.__shotReady = true;
  } catch (e) {
    view.innerHTML = '<h1>Could not load</h1><p>' + String(e && e.message || e) + '</p><p><a href="#/">Back to the board</a></p>';
    window.__shotReady = true;
  }
}
addEventListener('hashchange', go);
go();
