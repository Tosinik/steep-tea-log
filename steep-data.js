/* ============================================================================
   steep-data.js — Steep v2 data layer (Supabase, offline option A: online-only writes)
   ----------------------------------------------------------------------------
   Owns: Supabase client, email magic-link auth, the login + migration screens,
   and Supabase-backed loadKey/saveKey that keep the v1 blob-key signatures.

   app.js integration (see INTEGRATION.md) is only three edits:
     1. Delegate loadKey/saveKey to SteepDB.
     2. Replace the id generator uid() with SteepDB.newId (uuids).
     3. Boot through SteepDB.boot(startApp) instead of calling init() directly.
============================================================================ */
(function () {
  'use strict';

  const cfg = window.STEEP_CONFIG || {};
  if (!window.supabase || !cfg.url || !cfg.anonKey) {
    console.error('[Steep] Supabase library or config missing — check script order in index.html.');
  }

  const sb = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
  });

  let currentUser = null;
  let appStarted = false;

  const THEME_KEY = 'tealog_theme'; // stays local (device-specific, unsynced)

  /* ---------- ids ---------- */
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function newId() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  function userId() {
    if (!currentUser) throw new Error('Not authenticated');
    return currentUser.id;
  }

  /* ---------- offline read cache (option A: read-only when offline) ---------- */
  const cacheKey = k => 'tealog_cache_' + k;
  function readCache(k, fb) { try { const v = localStorage.getItem(cacheKey(k)); return v ? JSON.parse(v) : fb; } catch { return fb; } }
  function writeCache(k, v) { try { localStorage.setItem(cacheKey(k), JSON.stringify(v)); } catch {} }

  /* ---------- field mappers (snake_case DB  <->  camelCase JS) ---------- */
  const teaFromDb = r => ({
    id: r.id, name: r.name, type: r.type,
    amountGrams: Number(r.amount_grams) || 0, rating: Number(r.rating) || 0,
    harvestYear: r.harvest_year || '', harvestSeason: r.harvest_season || '',
    origin: r.origin || '', cultivar: r.cultivar || '', source: r.source || '',
    costTotal: Number(r.cost_total) || 0, costOriginalGrams: Number(r.cost_original_grams) || 0,
    brewGuide: r.brew_guide || '', description: r.description || '',
    isFavorite: !!r.is_favorite, wouldRebuy: !!r.would_rebuy,
    purchaseType: r.purchase_type || 'first', image: r.image_data || null,
    dateAdded: r.created_at
  });
  const teaToDb = t => ({
    id: t.id, user_id: userId(), name: t.name || '', type: t.type,
    amount_grams: t.amountGrams || 0, rating: t.rating || 0,
    harvest_year: t.harvestYear || null, harvest_season: t.harvestSeason || null,
    origin: t.origin || null, cultivar: t.cultivar || null, source: t.source || null,
    cost_total: t.costTotal || 0, cost_original_grams: t.costOriginalGrams || 0,
    brew_guide: t.brewGuide || null, description: t.description || null,
    is_favorite: !!t.isFavorite, would_rebuy: !!t.wouldRebuy,
    purchase_type: t.purchaseType || 'first', image_data: t.image || null
  });

  const vesselFromDb = r => ({ id: r.id, name: r.name, type: r.type || '', material: r.material || '', capacityMl: r.capacity_ml || null, image: r.image_data || null });
  const vesselToDb = v => ({ id: v.id, user_id: userId(), name: v.name || '', type: v.type || null, material: v.material || null, capacity_ml: v.capacityMl || null, image_data: v.image || null });

  const steepFromDb = r => ({ id: r.id, order: r.steep_order, tempC: r.temp_c != null ? Number(r.temp_c) : null, timeSeconds: r.time_seconds, description: r.description || '', tags: r.tags || [] });
  const steepToDb = (st, sessionId) => ({ id: st.id, session_id: sessionId, user_id: userId(), steep_order: st.order, temp_c: (st.tempC === '' || st.tempC == null) ? null : st.tempC, time_seconds: st.timeSeconds || 0, description: st.description || null, tags: st.tags || [] });

  const sessionFromDb = r => ({ id: r.id, teaId: r.tea_id, vesselId: r.vessel_id, date: r.session_date, isColdBrew: !!r.is_cold_brew, waterType: r.water_type || '', waterTDS: r.water_tds != null ? r.water_tds : null, gramsUsed: Number(r.grams_used) || 0, rating: Number(r.rating) || 0, description: r.description || '', tags: r.tags || [], steeps: [] });
  const sessionToDb = s => ({ id: s.id, user_id: userId(), tea_id: s.teaId || null, vessel_id: s.vesselId || null, session_date: s.date || new Date().toISOString(), is_cold_brew: !!s.isColdBrew, water_type: s.waterType || null, water_tds: (s.waterTDS === '' || s.waterTDS == null) ? null : s.waterTDS, grams_used: s.gramsUsed || 0, rating: s.rating || 0, description: s.description || null, tags: s.tags || [] });

  /* ---------- helper: delete this user's rows whose id isn't in keepIds ---------- */
  async function deleteMissing(table, keepIds) {
    let q = sb.from(table).delete().eq('user_id', userId());
    if (keepIds.length) {
      q = q.not('id', 'in', '(' + keepIds.map(id => `"${id}"`).join(',') + ')');
    }
    const { error } = await q;
    if (error) console.warn('[Steep] cleanup delete on', table, 'failed:', error.message);
  }

  /* ============================ loadKey ============================ */
  async function loadKey(key, fallback) {
    if (key === THEME_KEY || key === 'theme') {
      const v = localStorage.getItem(THEME_KEY);
      return v != null ? v : fallback;
    }
    // Accept both bare keys ('teas') and namespaced ('tealog_teas').
    const k = key.startsWith('tealog_') ? key : 'tealog_' + key;
    if (!currentUser) return fallback;

    try {
      if (k === 'tealog_teas') {
        const { data, error } = await sb.from('teas').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        const out = data.map(teaFromDb); writeCache(k, out); return out;
      }
      if (k === 'tealog_vessels') {
        const { data, error } = await sb.from('vessels').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        const out = data.map(vesselFromDb); writeCache(k, out); return out;
      }
      if (k === 'tealog_tagLibrary') {
        const { data, error } = await sb.from('tag_library').select('tag').order('tag', { ascending: true });
        if (error) throw error;
        const out = data.map(r => r.tag); writeCache(k, out); return out;
      }
      if (k === 'tealog_sessions') {
        const { data: ses, error: e1 } = await sb.from('sessions').select('*').order('session_date', { ascending: false });
        if (e1) throw e1;
        const { data: st, error: e2 } = await sb.from('steeps').select('*').order('steep_order', { ascending: true });
        if (e2) throw e2;
        const byId = {};
        const out = ses.map(r => { const o = sessionFromDb(r); byId[o.id] = o; return o; });
        st.forEach(r => { const s = byId[r.session_id]; if (s) s.steeps.push(steepFromDb(r)); });
        writeCache(k, out); return out;
      }
      return fallback;
    } catch (err) {
      console.warn('[Steep] load failed for', k, '— serving cached copy:', err.message);
      return readCache(k, fallback);
    }
  }

  /* ============================ saveKey ============================ */
  async function saveKey(key, val) {
    if (key === THEME_KEY || key === 'theme') { localStorage.setItem(THEME_KEY, val); return; }
    const k = key.startsWith('tealog_') ? key : 'tealog_' + key;
    if (!currentUser) throw new Error('Sign in to save changes (offline / not authenticated).');

    if (k === 'tealog_teas') {
      const rows = val.map(teaToDb);
      if (rows.length) { const { error } = await sb.from('teas').upsert(rows, { onConflict: 'id' }); if (error) throw error; }
      await deleteMissing('teas', rows.map(r => r.id));
      writeCache(k, val); return;
    }
    if (k === 'tealog_vessels') {
      const rows = val.map(vesselToDb);
      if (rows.length) { const { error } = await sb.from('vessels').upsert(rows, { onConflict: 'id' }); if (error) throw error; }
      await deleteMissing('vessels', rows.map(r => r.id));
      writeCache(k, val); return;
    }
    if (k === 'tealog_tagLibrary') {
      const rows = val.map(tag => ({ user_id: userId(), tag }));
      if (rows.length) { const { error } = await sb.from('tag_library').upsert(rows, { onConflict: 'user_id,tag' }); if (error) throw error; }
      const { data: existing } = await sb.from('tag_library').select('tag');
      const keep = new Set(val);
      const drop = (existing || []).filter(r => !keep.has(r.tag)).map(r => r.tag);
      if (drop.length) { await sb.from('tag_library').delete().eq('user_id', userId()).in('tag', drop); }
      writeCache(k, val); return;
    }
    if (k === 'tealog_sessions') {
      const sRows = val.map(sessionToDb);
      if (sRows.length) { const { error } = await sb.from('sessions').upsert(sRows, { onConflict: 'id' }); if (error) throw error; }
      await deleteMissing('sessions', sRows.map(r => r.id));
      const steepRows = [];
      val.forEach(s => (s.steeps || []).forEach(st => steepRows.push(steepToDb(st, s.id))));
      if (steepRows.length) { const { error } = await sb.from('steeps').upsert(steepRows, { onConflict: 'id' }); if (error) throw error; }
      await deleteMissing('steeps', steepRows.map(r => r.id));
      writeCache(k, val); return;
    }
    throw new Error('Unknown storage key: ' + key);
  }

  /* ============================ migration ============================ */
  function hasLegacyData() {
    try {
      return ['tealog_teas', 'tealog_vessels', 'tealog_sessions'].some(kk => {
        const raw = localStorage.getItem(kk);
        if (!raw) return false;
        const arr = JSON.parse(raw);
        return Array.isArray(arr) && arr.length > 0;
      });
    } catch { return false; }
  }

  async function migrateFromLocalStorage() {
    const teas = JSON.parse(localStorage.getItem('tealog_teas') || '[]');
    const vessels = JSON.parse(localStorage.getItem('tealog_vessels') || '[]');
    const sessions = JSON.parse(localStorage.getItem('tealog_sessions') || '[]');
    const tags = JSON.parse(localStorage.getItem('tealog_tagLibrary') || '[]');

    // Remap legacy (non-uuid) ids -> uuids, keeping foreign refs consistent.
    const map = {};
    const mid = old => { if (!old) return null; if (!map[old]) map[old] = newId(); return map[old]; };

    const teaRows = teas.map(t => teaToDb({ ...t, id: mid(t.id) }));
    const vesRows = vessels.map(v => vesselToDb({ ...v, id: mid(v.id) }));
    const sesRows = sessions.map(s => sessionToDb({ ...s, id: mid(s.id), teaId: map[s.teaId] || null, vesselId: map[s.vesselId] || null }));
    const steepRows = [];
    sessions.forEach(s => {
      const sid = map[s.id];
      (s.steeps || []).forEach(st => steepRows.push(steepToDb({ ...st, id: newId() }, sid)));
    });

    if (teaRows.length) { const { error } = await sb.from('teas').upsert(teaRows); if (error) throw error; }
    if (vesRows.length) { const { error } = await sb.from('vessels').upsert(vesRows); if (error) throw error; }
    if (sesRows.length) { const { error } = await sb.from('sessions').upsert(sesRows); if (error) throw error; }
    if (steepRows.length) { const { error } = await sb.from('steeps').upsert(steepRows); if (error) throw error; }
    if (tags.length) { const { error } = await sb.from('tag_library').upsert(tags.map(tag => ({ user_id: userId(), tag })), { onConflict: 'user_id,tag' }); if (error) throw error; }

    localStorage.setItem('tealog_migrated_' + userId(), new Date().toISOString());
  }

  /* ============================ settings (synced) ============================ */
  const SETTINGS_CACHE = 'tealog_cache_settings';
  async function loadSettings(defaults) {
    if (!currentUser) return { ...defaults, ...readCacheRaw(SETTINGS_CACHE, {}) };
    try {
      const { data, error } = await sb.from('user_settings').select('settings').eq('user_id', userId()).maybeSingle();
      if (error) throw error;
      const merged = { ...defaults, ...((data && data.settings) || {}) };
      try { localStorage.setItem(SETTINGS_CACHE, JSON.stringify(merged)); } catch {}
      return merged;
    } catch (err) {
      console.warn('[Steep] settings load failed, using cache:', err.message);
      return { ...defaults, ...readCacheRaw(SETTINGS_CACHE, {}) };
    }
  }
  async function saveSettings(obj) {
    try { localStorage.setItem(SETTINGS_CACHE, JSON.stringify(obj)); } catch {}
    if (!currentUser) throw new Error('Sign in to save settings.');
    const { error } = await sb.from('user_settings').upsert({ user_id: userId(), settings: obj, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
  }
  function readCacheRaw(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } }

  /* ============================ photo storage ============================ */
  const PHOTO_BUCKET = 'tea-photos';
  // Takes a compressed data: URL, uploads to Storage, returns a public URL.
  // Passes through anything that isn't a data: URL (already a URL, or null).
  async function uploadImage(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl || null;
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${userId()}/${newId()}.jpg`;
    const { error } = await sb.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    return sb.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  /* ============================ auth + boot ============================ */
  async function signIn(email) {
    return sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
  }
  async function signOut() {
    await sb.auth.signOut();
    currentUser = null; appStarted = false;
    renderLogin();
  }

  function boot(startApp) {
    // supabase-js v2 emits an INITIAL_SESSION event on subscribe, which covers first load.
    sb.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      if (currentUser) gateIntoApp(startApp);
      else { appStarted = false; renderLogin(); }
    });
  }

  function gateIntoApp(startApp) {
    if (appStarted) return;
    const migratedFlag = localStorage.getItem('tealog_migrated_' + currentUser.id);
    if (!migratedFlag && hasLegacyData()) { renderMigratePrompt(startApp); return; }
    appStarted = true;
    startApp();
  }

  /* ---------- minimal screens (styled by .auth-* rules in styles.css) ---------- */
  function shell(inner) {
    return `<div class="auth-wrap"><div class="auth-card">
      <div class="brand" style="justify-content:center;margin-bottom:14px;">
        <div class="brand-mark"></div><h1 style="font-family:'Fraunces',serif;font-size:26px;margin:0;">Steep</h1>
      </div>${inner}</div></div>`;
  }

  function renderLogin() {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = shell(`
      <p class="auth-sub">Your tea log, synced across every device. Sign in with a magic link — no password.</p>
      <div class="field" style="margin-bottom:12px;">
        <label>Email</label>
        <input type="email" id="authEmail" placeholder="you@example.com" autocomplete="email">
      </div>
      <button class="btn btn-primary" style="width:100%;" id="authSendBtn">Send magic link</button>
      <div id="authMsg" class="auth-msg"></div>
    `);
    const btn = document.getElementById('authSendBtn');
    const emailEl = document.getElementById('authEmail');
    const msg = document.getElementById('authMsg');
    const submit = async () => {
      const email = (emailEl.value || '').trim();
      if (!email) { msg.textContent = 'Enter your email first.'; return; }
      btn.disabled = true; btn.textContent = 'Sending…';
      const { error } = await signIn(email);
      btn.disabled = false; btn.textContent = 'Send magic link';
      if (error) { msg.textContent = 'Could not send: ' + error.message; }
      else { msg.textContent = 'Check your inbox — tap the link on this device to finish signing in.'; msg.classList.add('ok'); }
    };
    btn.onclick = submit;
    emailEl.onkeydown = e => { if (e.key === 'Enter') submit(); };
    emailEl.focus();
  }

  function renderMigratePrompt(startApp) {
    const app = document.getElementById('app');
    if (!app) return;
    let counts = { t: 0, s: 0 };
    try {
      counts.t = (JSON.parse(localStorage.getItem('tealog_teas') || '[]')).length;
      counts.s = (JSON.parse(localStorage.getItem('tealog_sessions') || '[]')).length;
    } catch {}
    app.innerHTML = shell(`
      <p class="auth-sub">This device has a local Steep log (${counts.t} teas, ${counts.s} sessions). Import it into your synced account?</p>
      <button class="btn btn-primary" style="width:100%;margin-bottom:8px;" id="mDo">Import my existing data</button>
      <button class="btn" style="width:100%;" id="mSkip">Start fresh (keep local backup)</button>
      <div id="mMsg" class="auth-msg"></div>
    `);
    const msg = document.getElementById('mMsg');
    document.getElementById('mDo').onclick = async () => {
      const b = document.getElementById('mDo'); b.disabled = true; b.textContent = 'Importing…';
      try {
        await migrateFromLocalStorage();
        appStarted = true; startApp();
      } catch (err) {
        b.disabled = false; b.textContent = 'Import my existing data';
        msg.textContent = 'Import failed: ' + err.message + ' — your local data is untouched.';
      }
    };
    document.getElementById('mSkip').onclick = () => {
      localStorage.setItem('tealog_migrated_' + userId(), 'skipped:' + new Date().toISOString());
      appStarted = true; startApp();
    };
  }

  /* ---------- public API ---------- */
  window.SteepDB = { loadKey, saveKey, loadSettings, saveSettings, uploadImage, boot, signIn, signOut, newId, migrateFromLocalStorage, getUser: () => currentUser };
})();
