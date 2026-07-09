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
    purchaseDate: r.purchase_date || null,
    leafForm: r.leaf_form || null,
    dateAdded: r.created_at
  });
  const teaToDb = t => {
    const row = {
      id: t.id, user_id: userId(), name: t.name || '', type: t.type,
      amount_grams: t.amountGrams || 0, rating: t.rating || 0,
      harvest_year: t.harvestYear || null, harvest_season: t.harvestSeason || null,
      origin: t.origin || null, cultivar: t.cultivar || null, source: t.source || null,
      cost_total: t.costTotal || 0, cost_original_grams: t.costOriginalGrams || 0,
      brew_guide: t.brewGuide || null, description: t.description || null,
      is_favorite: !!t.isFavorite, would_rebuy: !!t.wouldRebuy,
      purchase_type: t.purchaseType || 'first', image_data: t.image || null,
      purchase_date: t.purchaseDate || null,
      leaf_form: t.leafForm || null
    };
    // Preserve the original creation date across import/restore. dateAdded mirrors the DB
    // created_at for existing rows (see teaFromDb), so sending it is a no-op on an update and
    // an insert-time preserve for imported teas. Omitted when absent, so a genuinely new row
    // still gets the column default now() rather than a null timestamp.
    if (t.dateAdded) row.created_at = t.dateAdded;
    return row;
  };

  const vesselFromDb = r => ({ id: r.id, name: r.name, type: r.type || '', material: r.material || '', capacityMl: r.capacity_ml || null, image: r.image_data || null });
  const vesselToDb = v => ({ id: v.id, user_id: userId(), name: v.name || '', type: v.type || null, material: v.material || null, capacity_ml: v.capacityMl || null, image_data: v.image || null });

  const steepFromDb = r => ({ id: r.id, order: r.steep_order, tempC: r.temp_c != null ? Number(r.temp_c) : null, timeSeconds: r.time_seconds, description: r.description || '', tags: r.tags || [] });
  const steepToDb = (st, sessionId) => ({ id: st.id, session_id: sessionId, user_id: userId(), steep_order: st.order, temp_c: (st.tempC === '' || st.tempC == null) ? null : st.tempC, time_seconds: st.timeSeconds || 0, description: st.description || null, tags: st.tags || [] });

  const sessionFromDb = r => ({ id: r.id, userId: r.user_id, teaId: r.tea_id, vesselId: r.vessel_id, date: r.session_date, isColdBrew: !!r.is_cold_brew, waterType: r.water_type || '', waterTDS: r.water_tds != null ? r.water_tds : null, gramsUsed: Number(r.grams_used) || 0, rating: Number(r.rating) || 0, description: r.description || '', tags: r.tags || [], isShared: !!r.is_shared, teaName: r.tea_name || '', teaType: r.tea_type || '', vesselName: r.vessel_name || '', infusionCount: r.infusion_count != null ? Number(r.infusion_count) : null, photoUrl: r.photo_url || null, feedback: r.feedback || null, mood: r.mood || null, waterMl: r.water_ml != null ? Number(r.water_ml) : null, brewStyle: r.brew_style || null, steeps: [] });
  const sessionToDb = s => ({ id: s.id, user_id: userId(), tea_id: s.teaId || null, vessel_id: s.vesselId || null, session_date: s.date || new Date().toISOString(), is_cold_brew: !!s.isColdBrew, water_type: s.waterType || null, water_tds: (s.waterTDS === '' || s.waterTDS == null) ? null : s.waterTDS, grams_used: s.gramsUsed || 0, rating: s.rating || 0, description: s.description || null, tags: s.tags || [], is_shared: !!s.isShared, tea_name: s.teaName || null, tea_type: s.teaType || null, vessel_name: s.vesselName || null, infusion_count: (s.infusionCount === '' || s.infusionCount == null) ? null : Number(s.infusionCount), photo_url: s.photoUrl || null, feedback: s.feedback || null, mood: s.mood || null, water_ml: (s.waterMl === '' || s.waterMl == null) ? null : Number(s.waterMl), brew_style: s.brewStyle || null });

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
        // IMPORTANT: scope to the current user. A social RLS policy lets followers
        // read others' *shared* sessions, so an unfiltered select would pull those
        // into personal stats/insights. The feed uses getFeed() separately.
        const { data: ses, error: e1 } = await sb.from('sessions').select('*').eq('user_id', userId()).order('session_date', { ascending: false });
        if (e1) throw e1;
        const { data: st, error: e2 } = await sb.from('steeps').select('*').eq('user_id', userId()).order('steep_order', { ascending: true });
        if (e2) throw e2;
        const byId = {};
        const out = ses.map(r => { const o = sessionFromDb(r); byId[o.id] = o; return o; });
        st.forEach(r => { const s = byId[r.session_id]; if (s) s.steeps.push(steepFromDb(r)); });
        writeCache(k, out); return out;
      }
      if (k === 'tealog_wishlist') {
        const { data, error } = await sb.from('wishlist').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        const out = data.map(wishFromDb); writeCache(k, out); return out;
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

  /* ============================================================================
     Per-row writes (v3) — the scalability fix.
     ----------------------------------------------------------------------------
     saveKey() above upserts a whole array + diff-deletes on every change (a
     localStorage-era holdover). Every real mutation in the app touches exactly
     one row, so these write just that row and keep the offline read-cache in
     sync locally. saveKey/loadKey stay only for genuine bulk ops (import,
     migration), where replace-all is the actual intent.
  ============================================================================ */
  function cacheUpsert(k, item) {
    const arr = readCache(k, []);
    const i = arr.findIndex(x => x && x.id === item.id);
    if (i >= 0) arr[i] = item; else arr.push(item);
    writeCache(k, arr);
  }
  function cacheRemove(k, id) {
    writeCache(k, readCache(k, []).filter(x => x && x.id !== id));
  }
  function requireAuth() {
    if (!currentUser) throw new Error('Sign in to save changes (offline / not authenticated).');
  }

  /* ==========================================================================
     Offline write queue (v3.13, roadmap "Option B").
     Personal-data writes become local-first: on a genuine network failure we
     update the offline cache optimistically and queue the op, then replay it
     FIFO when connectivity returns. Every write is an upsert-by-id or
     delete-by-id, so replay is idempotent and FIFO order preserves foreign
     refs (a tea added offline is replayed before the session that uses it).
     Non-network errors (auth / RLS / validation) still throw and surface as
     before. Social actions and bulk put* (migration) stay online-only.
  ========================================================================== */
  const QUEUE_KEY = 'tealog_writeQueue';
  let flushing = false;

  function isOfflineError(err) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
    const m = ((err && (err.message || err.error_description)) || '') + '';
    return (err && err.name === 'TypeError') ||
      /failed to fetch|networkerror|load failed|fetch failed|network request failed|timeout/i.test(m);
  }
  function loadQueue() { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; } }
  function saveQueue(q) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch (e) { console.warn('[Steep] write-queue persist failed (storage full?):', e && e.message); } }
  function queueLength() { return loadQueue().length; }

  // data: URL images can't be uploaded offline and must never reach Postgres —
  // drop the inline image; the user re-adds it once online. (Belt to
  // commitSession's suspenders, and it covers the tea/vessel forms too.)
  function stripInlineImage(op, payload) {
    if (op !== 'putSession' && op !== 'putTea' && op !== 'putVessel') return payload;
    const p = { ...payload };
    if (op === 'putSession' && p.photoUrl && String(p.photoUrl).startsWith('data:')) p.photoUrl = null;
    if ((op === 'putTea' || op === 'putVessel') && p.image && String(p.image).startsWith('data:')) p.image = null;
    return p;
  }
  function enqueue(op, payload) {
    const q = loadQueue();
    q.push({ id: newId(), op, payload: stripInlineImage(op, payload), ts: Date.now() });
    saveQueue(q);
    updateSyncBadge();
  }
  function applyQueued(e) {
    switch (e.op) {
      case 'putTea':        return _netPutTea(e.payload);
      case 'removeTea':     return _netRemoveTea(e.payload);
      case 'putVessel':     return _netPutVessel(e.payload);
      case 'removeVessel':  return _netRemoveVessel(e.payload);
      case 'putSession':    return _netPutSession(e.payload);
      case 'removeSession': return _netRemoveSession(e.payload);
      case 'addTag':        return _netAddTag(e.payload);
      case 'putWish':       return _netPutWish(e.payload);
      case 'removeWish':    return _netRemoveWish(e.payload);
      case 'saveSettings':  return _netSaveSettings(e.payload);
      default:              return Promise.resolve();
    }
  }
  async function flushQueue() {
    if (flushing || !currentUser) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    let q = loadQueue();
    if (!q.length) return;
    flushing = true;
    let synced = 0;
    try {
      while (q.length) {
        const entry = q[0];
        try {
          await applyQueued(entry);
          q.shift(); saveQueue(q); synced++;
        } catch (err) {
          if (isOfflineError(err)) break; // offline again — stop, keep order, retry on next 'online'
          console.warn('[Steep] dropping unreplayable queued op', entry.op, err && err.message);
          q.shift(); saveQueue(q); // permanent error (e.g. row already gone) — drop and move on
        }
      }
    } finally {
      flushing = false;
      updateSyncBadge();
    }
    if (synced > 0 && typeof showToast === 'function') {
      showToast('Synced ' + synced + ' offline change' + (synced > 1 ? 's' : ''));
    }
  }
  function scheduleFlush() { if (queueLength() && (typeof navigator === 'undefined' || navigator.onLine !== false)) setTimeout(flushQueue, 0); }

  // A quiet, self-contained "waiting to sync" pill — no dependency on the app's render().
  function updateSyncBadge() {
    if (typeof document === 'undefined') return;
    const n = queueLength();
    let el = document.getElementById('steepSyncBadge');
    if (!n) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div');
      el.id = 'steepSyncBadge';
      el.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9998;' +
        'background:var(--white,#fff);color:var(--ink-soft,#5C5148);border:1px solid var(--line,#D8CFB9);' +
        'border-radius:999px;padding:7px 14px;font:500 12px/1 Inter,sans-serif;' +
        'box-shadow:0 4px 14px rgba(0,0,0,.12);display:flex;align-items:center;gap:7px;pointer-events:none;';
      document.body.appendChild(el);
    }
    el.innerHTML = '<span style="width:7px;height:7px;border-radius:50%;background:var(--amber,#C17A3E);"></span>' +
      n + ' change' + (n > 1 ? 's' : '') + ' waiting to sync';
  }
  if (typeof window !== 'undefined') window.addEventListener('online', flushQueue);

  /* ---------- teas ---------- */
  async function _netPutTea(tea) {
    const { error } = await sb.from('teas').upsert(teaToDb(tea), { onConflict: 'id' });
    if (error) throw error;
    cacheUpsert('tealog_teas', tea);
  }
  async function _netRemoveTea(id) {
    const { error } = await sb.from('teas').delete().eq('id', id).eq('user_id', userId());
    if (error) throw error;
    cacheRemove('tealog_teas', id);
  }
  async function putTea(tea) {
    requireAuth();
    try { await _netPutTea(tea); scheduleFlush(); }
    catch (err) {
      if (!isOfflineError(err)) throw err;
      const p = stripInlineImage('putTea', tea);
      cacheUpsert('tealog_teas', p); enqueue('putTea', p);
    }
  }
  async function removeTea(id) {
    requireAuth();
    try { await _netRemoveTea(id); scheduleFlush(); }
    catch (err) { if (!isOfflineError(err)) throw err; cacheRemove('tealog_teas', id); enqueue('removeTea', id); }
  }
  async function putTeas(teas) { // bulk upsert (migration/photo backfill) — online-only by design
    requireAuth();
    if (!teas.length) return;
    const { error } = await sb.from('teas').upsert(teas.map(teaToDb), { onConflict: 'id' });
    if (error) throw error;
    teas.forEach(t => cacheUpsert('tealog_teas', t));
  }

  /* ---------- vessels ---------- */
  async function _netPutVessel(v) {
    const { error } = await sb.from('vessels').upsert(vesselToDb(v), { onConflict: 'id' });
    if (error) throw error;
    cacheUpsert('tealog_vessels', v);
  }
  async function _netRemoveVessel(id) {
    const { error } = await sb.from('vessels').delete().eq('id', id).eq('user_id', userId());
    if (error) throw error;
    cacheRemove('tealog_vessels', id);
  }
  async function putVessel(v) {
    requireAuth();
    try { await _netPutVessel(v); scheduleFlush(); }
    catch (err) {
      if (!isOfflineError(err)) throw err;
      const p = stripInlineImage('putVessel', v);
      cacheUpsert('tealog_vessels', p); enqueue('putVessel', p);
    }
  }
  async function removeVessel(id) {
    requireAuth();
    try { await _netRemoveVessel(id); scheduleFlush(); }
    catch (err) { if (!isOfflineError(err)) throw err; cacheRemove('tealog_vessels', id); enqueue('removeVessel', id); }
  }
  async function putVessels(vessels) { // online-only bulk
    requireAuth();
    if (!vessels.length) return;
    const { error } = await sb.from('vessels').upsert(vessels.map(vesselToDb), { onConflict: 'id' });
    if (error) throw error;
    vessels.forEach(v => cacheUpsert('tealog_vessels', v));
  }

  /* ---------- sessions (+ their steeps) ---------- */
  async function _netPutSession(session) {
    const { error } = await sb.from('sessions').upsert(sessionToDb(session), { onConflict: 'id' });
    if (error) throw error;
    const steepRows = (session.steeps || []).map(st => steepToDb(st, session.id));
    if (steepRows.length) {
      const { error: e2 } = await sb.from('steeps').upsert(steepRows, { onConflict: 'id' });
      if (e2) throw e2;
    }
    // Prune steeps removed from THIS session only — a per-session diff-delete, not a
    // whole-table one. Cheap and correct (covers edited/quick sessions losing steeps).
    let dq = sb.from('steeps').delete().eq('session_id', session.id).eq('user_id', userId());
    const keep = steepRows.map(r => r.id);
    if (keep.length) dq = dq.not('id', 'in', '(' + keep.map(id => `"${id}"`).join(',') + ')');
    const { error: e3 } = await dq;
    if (e3) console.warn('[Steep] steep prune failed on', session.id, ':', e3.message);
    cacheUpsert('tealog_sessions', session);
  }
  async function _netRemoveSession(id) {
    // steeps cascade via FK (sessions on delete cascade)
    const { error } = await sb.from('sessions').delete().eq('id', id).eq('user_id', userId());
    if (error) throw error;
    cacheRemove('tealog_sessions', id);
  }
  async function putSession(session) {
    requireAuth();
    try { await _netPutSession(session); scheduleFlush(); }
    catch (err) {
      if (!isOfflineError(err)) throw err;
      const p = stripInlineImage('putSession', session);
      cacheUpsert('tealog_sessions', p); enqueue('putSession', p);
    }
  }
  async function removeSession(id) {
    requireAuth();
    try { await _netRemoveSession(id); scheduleFlush(); }
    catch (err) { if (!isOfflineError(err)) throw err; cacheRemove('tealog_sessions', id); enqueue('removeSession', id); }
  }

  /* ---------- tags ---------- */
  async function _netAddTag(tag) {
    const { error } = await sb.from('tag_library').upsert({ user_id: userId(), tag }, { onConflict: 'user_id,tag' });
    if (error) throw error;
    const arr = readCache('tealog_tagLibrary', []);
    if (!arr.includes(tag)) { arr.push(tag); writeCache('tealog_tagLibrary', arr); }
  }
  async function addTag(tag) {
    requireAuth();
    try { await _netAddTag(tag); scheduleFlush(); }
    catch (err) {
      if (!isOfflineError(err)) throw err;
      const arr = readCache('tealog_tagLibrary', []);
      if (!arr.includes(tag)) { arr.push(tag); writeCache('tealog_tagLibrary', arr); }
      enqueue('addTag', tag);
    }
  }

  /* ---------- wishlist (shopping list) ---------- */
  function wishToDb(w) {
    return { id: w.id, user_id: userId(), name: w.name, vendor: w.vendor || null,
      tea_type: w.type || null, note: w.note || null, done: !!w.done,
      created_at: w.createdAt || new Date().toISOString() };
  }
  function wishFromDb(r) {
    return { id: r.id, name: r.name, vendor: r.vendor || '', type: r.tea_type || '',
      note: r.note || '', done: !!r.done, createdAt: r.created_at };
  }
  async function _netPutWish(w) {
    const { error } = await sb.from('wishlist').upsert(wishToDb(w), { onConflict: 'id' });
    if (error) throw error;
    cacheUpsert('tealog_wishlist', w);
  }
  async function _netRemoveWish(id) {
    const { error } = await sb.from('wishlist').delete().eq('id', id).eq('user_id', userId());
    if (error) throw error;
    cacheRemove('tealog_wishlist', id);
  }
  async function putWishItem(w) {
    requireAuth();
    try { await _netPutWish(w); scheduleFlush(); }
    catch (err) { if (!isOfflineError(err)) throw err; cacheUpsert('tealog_wishlist', w); enqueue('putWish', w); }
  }
  async function removeWishItem(id) {
    requireAuth();
    try { await _netRemoveWish(id); scheduleFlush(); }
    catch (err) { if (!isOfflineError(err)) throw err; cacheRemove('tealog_wishlist', id); enqueue('removeWish', id); }
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

  /* ============================ social (v3) ============================ */
  const profileFromDb = r => ({ id: r.id, username: r.username, displayName: r.display_name || '', avatarUrl: r.avatar_url || null, bio: r.bio || '', createdAt: r.created_at });

  async function signInWithGoogle() {
    return sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } });
  }

  async function getMyProfile() {
    if (!currentUser) return null;
    const { data, error } = await sb.from('profiles').select('*').eq('id', userId()).maybeSingle();
    if (error) throw error;
    return data ? profileFromDb(data) : null;
  }
  async function saveProfile(p) {
    const row = { id: userId(), username: (p.username || '').trim().toLowerCase(), display_name: p.displayName || null, avatar_url: p.avatarUrl || null, bio: p.bio || null };
    // Return the written row directly (.select) so callers don't need a fragile
    // read-after-write that can race RLS/replication — this is what caused the
    // "saved but had to hard-reload to see it" bug.
    const { data, error } = await sb.from('profiles').upsert(row, { onConflict: 'id' }).select().maybeSingle();
    if (error) throw error;
    return data ? profileFromDb(data) : profileFromDb({ ...row, created_at: new Date().toISOString() });
  }
  async function searchProfiles(q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return [];
    const { data, error } = await sb.from('profiles').select('*').ilike('username', `%${q}%`).neq('id', userId()).limit(20);
    if (error) throw error;
    return (data || []).map(profileFromDb);
  }
  async function getProfilesByIds(ids) {
    const map = {};
    if (!ids.length) return map;
    const { data, error } = await sb.from('profiles').select('*').in('id', ids);
    if (error) throw error;
    (data || []).forEach(r => { map[r.id] = profileFromDb(r); });
    return map;
  }
  async function follow(id) { const { error } = await sb.from('follows').insert({ follower_id: userId(), followee_id: id }); if (error && error.code !== '23505') throw error; }
  async function unfollow(id) { const { error } = await sb.from('follows').delete().eq('follower_id', userId()).eq('followee_id', id); if (error) throw error; }
  async function getFollowing() { const { data, error } = await sb.from('follows').select('followee_id').eq('follower_id', userId()); if (error) throw error; return (data || []).map(r => r.followee_id); }

  async function getFeed(limit = 50) {
    const following = await getFollowing();
    if (!following.length) return { sessions: [], profiles: {}, following: [] };
    const { data: ses, error } = await sb.from('sessions').select('*')
      .in('user_id', following).eq('is_shared', true)
      .order('session_date', { ascending: false }).limit(limit);
    if (error) throw error;
    const sessions = (ses || []).map(sessionFromDb);
    const ids = sessions.map(s => s.id);
    if (ids.length) {
      const { data: st } = await sb.from('steeps').select('*').in('session_id', ids).order('steep_order', { ascending: true });
      const byId = {}; sessions.forEach(s => byId[s.id] = s);
      (st || []).forEach(r => { const s = byId[r.session_id]; if (s) s.steeps.push(steepFromDb(r)); });
    }
    const profiles = await getProfilesByIds(following);
    return { sessions, profiles, following };
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
  async function _netSaveSettings(obj) {
    const { error } = await sb.from('user_settings').upsert({ user_id: userId(), settings: obj, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
  }
  async function saveSettings(obj) {
    try { localStorage.setItem(SETTINGS_CACHE, JSON.stringify(obj)); } catch {}
    if (!currentUser) throw new Error('Sign in to save settings.');
    try { await _netSaveSettings(obj); scheduleFlush(); }
    catch (err) {
      if (!isOfflineError(err)) throw err;
      enqueue('saveSettings', obj); // local cache already written above
    }
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
      if (currentUser) { updateSyncBadge(); flushQueue(); gateIntoApp(startApp); }
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
        <div class="brand-mark"></div><h1 style="font-family:var(--font-display);font-size:26px;margin:0;">SlowCup</h1>
      </div>${inner}</div></div>`;
  }

  function renderLogin() {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = shell(`
      <p class="auth-sub">Your tea log, synced across every device. Sign in to get started.</p>
      <button class="btn" id="googleBtn" style="width:100%;margin-bottom:14px;font-weight:600;">Continue with Google</button>
      <div class="auth-divider"><span>or use email</span></div>
      <div class="field" style="margin:12px 0;">
        <label>Email</label>
        <input type="email" id="authEmail" placeholder="you@example.com" autocomplete="email">
      </div>
      <button class="btn btn-primary" style="width:100%;" id="authSendBtn">Send magic link</button>
      <div id="authMsg" class="auth-msg"></div>
    `);
    const gbtn = document.getElementById('googleBtn');
    if (gbtn) gbtn.onclick = async () => { gbtn.disabled = true; const { error } = await signInWithGoogle(); if (error) { gbtn.disabled = false; document.getElementById('authMsg').textContent = 'Google sign-in failed: ' + error.message; } };
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
      <p class="auth-sub">This device has a local SlowCup log (${counts.t} teas, ${counts.s} sessions). Import it into your synced account?</p>
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
  window.SteepDB = {
    loadKey, saveKey, loadSettings, saveSettings, uploadImage, boot, signIn, signInWithGoogle, signOut, newId, migrateFromLocalStorage,
    putTea, removeTea, putTeas, putVessel, removeVessel, putVessels, putSession, removeSession, addTag,
    putWishItem, removeWishItem,
    getMyProfile, saveProfile, searchProfiles, getProfilesByIds, follow, unfollow, getFollowing, getFeed,
    getUser: () => currentUser,
    flushQueue, pendingWrites: queueLength
  };
})();
