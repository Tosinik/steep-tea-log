/* ---------- boot ---------- */
window.SteepDB.boot(init);

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
