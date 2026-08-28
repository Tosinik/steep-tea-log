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
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState==='hidden'){ if(typeof onAppHidden==='function') onAppHidden(); _persistSessionDraft(); } // v4.18 (#30-B): freeze a running steep BEFORE persisting it
  else if(document.visibilityState==='visible'){ if(typeof onAppVisible==='function') onAppVisible(); } // v4.18 (#33/R142): re-acquire the lock only while running
});

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
      // Show the banner when ANY worker reaches 'installed' with a controller present (= an UPDATE, not a
      // first install). watchWorker closes the gap the old code left (#36): it checked reg.waiting ONCE
      // and otherwise only listened for updates found LATER (updatefound), so a worker still INSTALLING at
      // load — whose updatefound had already fired before the listener attached — was caught by neither,
      // and the banner surfaced only on a later load ("one version behind / didn't show this time"). Now
      // waiting, installing, and updatefound all route through one watcher; showUpdateBanner de-dupes.
      const watchWorker = (w)=>{
        if(!w) return;
        if(w.state === 'installed' && navigator.serviceWorker.controller){ showUpdateBanner(w); return; }
        w.addEventListener('statechange', ()=>{
          if(w.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner(w);
        });
      };
      if(reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg.waiting);
      watchWorker(reg.installing);                            // an update mid-install at page-load time
      reg.addEventListener('updatefound', ()=> watchWorker(reg.installing));
    }).catch(e=>console.log('SW registration failed', e));

    // Long-lived installed PWAs rarely reload; nudge a check hourly so updates surface.
    setInterval(()=>{ navigator.serviceWorker.getRegistration().then(r=>{ if(r) r.update(); }); }, 60*60*1000);
  });
}

// Ask a worker for its own {note, version} over a one-shot MessageChannel — the same client→worker path
// SKIP_WAITING already uses. Falls back (cb(null)) when MessageChannel is unavailable, the post throws, or
// no reply lands within the timeout, so the caller keeps the page-local note and the banner is never blocked.
function requestIncomingNote(worker, cb){
  if(!worker || typeof MessageChannel==='undefined'){ cb(null); return; }
  let done = false;
  const finish = (data)=>{ if(done) return; done = true; cb(data||null); };
  try {
    const ch = new MessageChannel();
    ch.port1.onmessage = (e)=> finish(e.data);
    worker.postMessage({ type:'GET_WHATS_NEW' }, [ch.port2]);
  } catch(e){ finish(null); return; }
  setTimeout(()=> finish(null), 800);
}

// The banner note must come from the INCOMING version, not this running page (R158, #36). At banner time
// the passed `worker` is the waiting worker — the incoming version — so we ask it for its own WHATS_NEW
// (it importScripts the same steep-version.js) and swap it into the sub-line when it replies. The
// page-local WHATS_NEW is the initial/fallback text, shown instantly and kept if no reply arrives — so the
// banner is never blocked on the round-trip and never worse than before.
function showUpdateBanner(worker){
  if(document.getElementById('updateBanner')) return;
  const localNote = (typeof WHATS_NEW==='string' && WHATS_NEW) ? WHATS_NEW : '';
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
    +   '<span id="updateNote" style="opacity:.72;font-size:12px;' + (localNote?'':'display:none;') + '"></span>'
    + '</span>'
    + '<span style="display:flex;gap:8px;flex-shrink:0;">'
    +   '<button id="updateLater" style="background:transparent;border:0;color:#fff;opacity:.8;font-size:13px;cursor:pointer;">Later</button>'
    +   '<button id="updateNow" style="background:#fff;color:var(--jade,#3F5E42);border:0;border-radius:8px;padding:7px 13px;font-weight:600;font-size:13px;cursor:pointer;">Refresh</button>'
    + '</span>';
  document.body.appendChild(bar);
  const noteEl = document.getElementById('updateNote');
  if(noteEl && localNote) noteEl.textContent = localNote;    // textContent, not innerHTML — the note is data
  requestIncomingNote(worker, (data)=>{
    const n = data && typeof data.note==='string' && data.note ? data.note : '';
    if(n && noteEl){ noteEl.textContent = n; noteEl.style.display = ''; }   // swap in the incoming note
  });
  document.getElementById('updateNow').onclick = ()=>{
    document.getElementById('updateNow').textContent = 'Refreshing…';
    if(worker){ worker.postMessage({ type:'SKIP_WAITING' }); }  // controllerchange → reload
    else { window.location.reload(); }
  };
  document.getElementById('updateLater').onclick = ()=> bar.remove();
}
