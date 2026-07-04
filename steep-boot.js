/* ---------- boot ---------- */
window.SteepDB.boot(init);

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js').catch(e=>console.log('SW registration failed', e));
  });
}
