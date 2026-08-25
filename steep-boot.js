/* ---------- boot ---------- */
window.SteepDB.boot(init);

/* v4.17 (#35): persist an in-progress sitting when the page is hidden, so an OS eviction during a
   long backgrounded steep doesn't lose it. `pagehide` covers navigation/close; `visibilitychange`
   covers the phone being backgrounded — the actual eviction trigger. Only a DIRTY draft is written
   (a pristine setup draft clears the key), so a restore always lands on real work. Cheap, idempotent,
   fail-silent. */
function _persistSessionDraft(){
  try {
    if(window.SteepDB && SteepDB.saveDraft){
      const d = state && state.sessionDraft;
      SteepDB.saveDraft(sessionDraftDirty(d) ? d : null, state && state._draftImage);
    }
  } catch(e){}
}
window.addEventListener('pagehide', _persistSessionDraft);
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') _persistSessionDraft(); });

/* v4.17 (#34): the OS back gesture pops the app's own history instead of exiting the PWA. saveView
   pushes a state entry per navigable view; here we honour the pop by setting the view DIRECTLY —
   never via goView, which would call saveView and push again, turning Back into a loop. popstate is
   not cancellable, so the live session flow deliberately pushes nothing (saveView's HISTORY_VIEWS):
   Back from a running steep pops to the last tab, and the draft is persisted above, so nothing is
   lost. NON-AUTOMATABLE: no vm suite reaches pushState/popstate — the back gesture is verified on
   device (this slice's step 7, like landing-test's source-only limit). */
window.addEventListener('popstate', (e)=>{
  const st = e.state;
  if(!st || !st.view){ return; }                       // the initial page entry — let Back exit from home
  state.view = st.view;
  state.activeTeaId = st.activeTeaId || null;
  if(st.view==='tea-detail' && !(state.activeTeaId && (state.teas||[]).some(t=>t.id===state.activeTeaId))) state.view='teas'; // tea gone → its tab
  render();
});

/* Service worker + "new version available" prompt.
   The SW now waits (no auto-skipWaiting) so an in-progress session is never
   interrupted; when an update is installed we show a small banner, and only on
   tap do we tell the waiting worker to activate, then reload once it takes over.
   This ends the "deployed but still seeing the old UI" problem for good. */
if('serviceWorker' in navigator){
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', ()=>{
    if(refreshing) return; refreshing = true; window.location.reload();
  });
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js').then((reg)=>{
      // An update finished installing before this page loaded.
      if(reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg.waiting);
      reg.addEventListener('updatefound', ()=>{
        const nw = reg.installing; if(!nw) return;
        nw.addEventListener('statechange', ()=>{
          // 'installed' + an existing controller => this is an UPDATE, not first install.
          if(nw.state === 'installed' && navigator.serviceWorker.controller){
            showUpdateBanner(reg.waiting || nw);
          }
        });
      });
    }).catch(e=>console.log('SW registration failed', e));

    // Long-lived installed PWAs rarely reload; nudge a check hourly so updates surface.
    setInterval(()=>{ navigator.serviceWorker.getRegistration().then(r=>{ if(r) r.update(); }); }, 60*60*1000);
  });
}

function showUpdateBanner(worker){
  if(document.getElementById('updateBanner')) return;
  const bar = document.createElement('div');
  bar.id = 'updateBanner';
  bar.setAttribute('style',
    'position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:9999;'
    + 'display:flex;align-items:center;gap:12px;justify-content:space-between;padding:12px 14px;'
    + 'border-radius:12px;background:var(--jade,#3F5E42);color:#fff;box-shadow:0 6px 24px rgba(0,0,0,.25);'
    + 'max-width:520px;margin:0 auto;font-size:13.5px;');
  bar.innerHTML =
    '<span style="display:flex;flex-direction:column;gap:2px;">'
    +   '<span>A new version of SlowCup is ready.</span>'
    +   (typeof WHATS_NEW==='string' && WHATS_NEW ? '<span style="opacity:.72;font-size:12px;">'+WHATS_NEW+'</span>' : '')
    + '</span>'
    + '<span style="display:flex;gap:8px;flex-shrink:0;">'
    +   '<button id="updateLater" style="background:transparent;border:0;color:#fff;opacity:.8;font-size:13px;cursor:pointer;">Later</button>'
    +   '<button id="updateNow" style="background:#fff;color:var(--jade,#3F5E42);border:0;border-radius:8px;padding:7px 13px;font-weight:600;font-size:13px;cursor:pointer;">Refresh</button>'
    + '</span>';
  document.body.appendChild(bar);
  document.getElementById('updateNow').onclick = ()=>{
    document.getElementById('updateNow').textContent = 'Refreshing…';
    if(worker){ worker.postMessage({ type:'SKIP_WAITING' }); }  // controllerchange → reload
    else { window.location.reload(); }
  };
  document.getElementById('updateLater').onclick = ()=> bar.remove();
}
