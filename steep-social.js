function goFriends(){ state.view='friends'; state.activeTeaId=null; saveView('friends'); state.social.loaded=false; render(); loadSocial(); }
async function loadSocial(){
  const so=state.social; if(so.busy) return; so.busy=true;
  try{
    so.profile = await window.SteepDB.getMyProfile();
    if(so.profile){
      // BOTH directions of the follow graph (v4.02). The circle draws people who follow you without
      // you following back — only getFollowers() can see them, and the shipped app never read it.
      const [feed, followers] = await Promise.all([window.SteepDB.getFeed(), window.SteepDB.getFollowers()]);
      so.feed = feed;
      so.following = feed.following || [];
      so.followers = followers || [];
      const ids = [...new Set(so.following.concat(so.followers))];
      so.profiles = { ...(feed.profiles||{}), ...(ids.length ? await window.SteepDB.getProfilesByIds(ids) : {}) };
      // Passes load SEPARATELY and fail SOFT: v3_10-pass-record.sql is hand-applied, so between a
      // push and the migration this read is the one that 404s. A missing pass shelf must not take
      // the circle down with it — and it must not render as "nothing yet", which would be a lie.
      try{
        const p = await window.SteepDB.getPasses();
        so.passes = p; so.passesFailed = false;
        so.profiles = { ...so.profiles, ...(p.profiles||{}) };
      }catch(pe){ so.passes=null; so.passesFailed=true; console.warn('[Steep] pass record unavailable', pe); }
    }
  }catch(e){ console.warn('[Steep] social load failed', e); }
  so.busy=false; so.loaded=true; render();
}
async function refreshFeed(){
  try{ const f=await window.SteepDB.getFeed(); state.social.feed=f; state.social.following=f.following||[]; }catch(e){}
  render();
}
function avatarHTML(p, size){
  size=size||40;
  const url=p&&p.avatarUrl;
  const letter=((p&&(p.displayName||p.username))||'?').slice(0,1).toUpperCase();
  return `<span class="avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size/2.6)}px;${url?`background-image:url(${escapeHtml(url)})`:''}">${url?'':escapeHtml(letter)}</span>`;
}
function editProfile(){ state.social.profileEditOpen=true; state._draftImage=state.social.profile?.avatarUrl||null; render(); }
function setProfileDraft(k, v){
  if(!state.social.draft) state.social.draft = {...(state.social.profile||{})};
  state.social.draft[k] = v;
}
function cancelProfileEdit(){ state.social.profileEditOpen=false; state._draftImage=null; state.social.draft=null; render(); }
let _profileSaving = false;
async function submitProfile(e){
  e.preventDefault();
  const f=e.target;
  const msg=document.getElementById('profileMsg');
  const btn=f.querySelector('button[type=submit]');
  const username=(f.username.value||'').trim().toLowerCase();
  if(!/^[a-z0-9_]{3,20}$/.test(username)){
    if(msg) msg.textContent='Username must be 3–20 characters: lowercase letters, numbers, or underscore.';
    return;
  }
  if(_profileSaving) return;   // guard re-entrant double-submit (async gap before save)
  _profileSaving = true;
  if(btn){ btn.disabled=true; btn.textContent='Saving…'; }
  if(msg){ msg.classList.remove('ok'); msg.textContent='Saving…'; }
  try{
    const avatarUrl = await resolveDraftImage();
    // saveProfile returns the written row, so we no longer depend on a read-back
    // that could momentarily come back empty (the old hard-reload bug).
    state.social.profile = await window.SteepDB.saveProfile({ username, displayName:f.displayName.value.trim(), avatarUrl, bio:f.bio.value.trim() });
    state.social.draft=null; state.social.profileEditOpen=false; state._draftImage=null;
    showToast('✓ Profile saved as @'+state.social.profile.username);
    try{ const fd=await window.SteepDB.getFeed(); state.social.feed=fd; state.social.following=fd.following||[]; }catch(_){}
    render();
  }catch(err){
    const m=((err&&err.message)||String(err)).toLowerCase();
    if(btn){ btn.disabled=false; btn.textContent=state.social.profile?'Save':'Create profile'; }
    if(msg){
      if(m.includes('duplicate')||err.code==='23505') msg.textContent='That username is taken — try another.';
      else if(m.includes('does not exist')||m.includes('relation')||m.includes('schema cache')) msg.textContent='Profiles table not found — run v3_0-social.sql in the Supabase SQL Editor, then try again.';
      else msg.textContent='Could not save: '+((err&&err.message)||err);
    }
  }finally{ _profileSaving = false; }
}
function profileSetupHTML(){
  const p=state.social.draft || state.social.profile || {};
  const editing=!!state.social.profile;
  return `
    <div class="section-title"><h2 style="font-family:var(--font-display);font-size:20px;">${editing?'Edit profile':'Create your profile'}</h2></div>
    <div class="card">
      <p style="font-size:12.5px;color:var(--ink-soft);margin-top:0;">Your username lets friends find you. Only your name and avatar are public — your tea log stays private unless you share individual sessions.</p>
      <form onsubmit="submitProfile(event)">
        <div class="field" style="margin-bottom:12px;">
          <label>Avatar</label>
          <div class="img-upload" id="imgUploadWrap" style="width:90px;height:90px;border-radius:50%;${state._draftImage?`background-image:url(${escapeHtml(state._draftImage)})`:''}">
            ${state._draftImage?'':'Photo'}
          </div>
          ${photoInputs()}
        </div>
        <div class="field" style="margin-bottom:12px;"><label>Username</label><input type="text" name="username" required value="${escapeHtml(p.username||'')}" oninput="setProfileDraft('username',this.value)" placeholder="teafiend"></div>
        <div class="field" style="margin-bottom:12px;"><label>Display name</label><input type="text" name="displayName" value="${escapeHtml(p.displayName||'')}" oninput="setProfileDraft('displayName',this.value)" placeholder="Optional"></div>
        <div class="field" style="margin-bottom:12px;"><label>Bio</label><textarea name="bio" oninput="setProfileDraft('bio',this.value)" placeholder="Optional">${escapeHtml(p.bio||'')}</textarea></div>
        <div id="profileMsg" class="auth-msg" style="text-align:left;"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">
          ${editing?`<button type="button" class="btn" onclick="cancelProfileEdit()">Cancel</button>`:''}
          <button type="submit" class="btn btn-primary">${editing?'Save':'Create profile'}</button>
        </div>
      </form>
    </div>`;
}
/* #08 Social rev 3 — one screen, four sections, in the board's order: the circle, then the two
   directions a cup travels (out, and in). Three shipped tabs are ABSORBED, not dropped: `following`
   became YOUR CIRCLE (which also draws people the old tab could not see), `find` became the ＋ row,
   and the feed is a section below Passed-to-you, since "shared with you" and "passed to you" are
   both what arrived. feedRowHTML and its paging are untouched. R61 protects the capability, not the
   chrome — every one of the three still renders. Presence is PARKED (R35): nothing is built. */
function viewFriends(){
  const so=state.social;
  if(!so.loaded) return '<div class="card empty">Loading your circle…</div>';
  if(!so.profile || so.profileEditOpen) return profileSetupHTML();
  const me=so.profile;
  // Sticky inline notice (v3.66) — replaces the old socialErr alert(). Setup diagnostics are
  // multi-sentence, so a toast is wrong; this stays until dismissed or the next action clears it.
  const notice = so.err ? `<div class="social-notice">
    <div class="social-notice-msg">${escapeHtml(so.err)}</div>
    <button class="social-notice-x" onclick="dismissSocialErr()" aria-label="Dismiss">×</button>
  </div>` : '';
  return `
    <div class="section-title"><h2 style="font-family:var(--font-display);font-size:20px;">Social</h2>
      <button class="btn-ghost" onclick="editProfile()">edit profile</button></div>
    ${notice}
    <div class="card" style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
      ${avatarHTML(me,48)}
      <div><div style="font-weight:600;">${escapeHtml(me.displayName||me.username)}</div>
      <div style="font-size:12px;color:var(--ink-soft);">@${escapeHtml(me.username)}</div></div>
    </div>
    <div class="social-lede">Some cups you send, some arrive. Small on purpose.</div>
    ${circleHTML()}
    ${sharedByYouHTML()}
    ${passesHTML()}
    ${circleFeedHTML()}
    ${findHTML()}`;
}
// R68 — the board's "A circle of three" is a claim about the graph, so it is counted, not written.
// Nobody in the circle yet → the count line is omitted rather than reading "a circle of 0".
function circleCountLine(mutual, total){
  if(!total) return '';
  const people = total===1 ? '1 person' : `${total} people`;
  return `<div class="circle-count mono">${people}${mutual?` · ${mutual} mutual`:''}</div>`;
}
function circleHTML(){
  const so=state.social;
  const following=new Set(so.following||[]), followers=new Set(so.followers||[]);
  const ids=[...new Set([...following, ...followers])];
  // Mutual threads first — the spine of a correspondence circle, and what the board draws first.
  const rank=id=>(following.has(id)&&followers.has(id))?0:(followers.has(id)?1:2);
  ids.sort((a,b)=>rank(a)-rank(b));
  const mutual=ids.filter(id=>following.has(id)&&followers.has(id)).length;
  const rows = ids.length ? ids.map(id=>{
    const p=(so.profiles||{})[id];
    const isMutual=following.has(id)&&followers.has(id);
    const rel = isMutual ? 'mutual · you write to each other' : (followers.has(id) ? 'follows you' : 'you follow');
    const glyph = isMutual ? '⇄' : (followers.has(id) ? '→ you' : '→');
    // doUnfollow is shipped capability and stays reachable: without it a follow could never be
    // undone in-app. Quiet, and only on edges you actually own.
    const undo = following.has(id) ? `<button class="btn-ghost circle-undo" onclick="doUnfollow('${escapeJsArg(id)}')">unfollow</button>` : '';
    return `<div class="circle-row${isMutual?' is-mutual':''}">
      ${avatarHTML(p,40)}
      <div style="flex:1;min-width:0;">
        <div class="circle-name">${p?escapeHtml(p.displayName||p.username):'…'}<span class="circle-handle mono">${p?('@'+escapeHtml(p.username)):escapeHtml(id.slice(0,8))}</span></div>
        <div class="circle-rel mono">${rel}</div>
      </div>
      ${undo}<span class="circle-glyph mono">${glyph}</span>
    </div>`;
  }).join('') : `<div class="empty" style="padding:12px 0;">Nobody in your circle yet — find someone by handle below.</div>`;
  return `<div class="card">
    <div class="eyebrow">Your circle</div>
    ${rows}
    ${circleCountLine(mutual, ids.length)}
  </div>`;
}
/* The small tile beside a tea name on the social surfaces. It is the shipped TYPE tint (six
   colours keyed on teas.type), NOT the liquor swatch the boards draw — that needs a per-tea colour
   column, a liquor value on all 55 catalog rows and the data model R82 found was never written, all
   of which R93 puts in R4. The CJK script rides in the tile when the catalog covers the tea, and is
   absent otherwise: script has no field either, and its only source is a CJK entry in a catalog
   row's `aka` (R98). So on R36's minimal-preview branch — which is by definition the no-catalog
   case — the script can never render, and the tile carries the tint alone. */
function socialTileHTML(type, name){
  const t=(type||'').toLowerCase();
  /* TIER 2 ONLY, and by construction. A passed tea is not on your shelf, so there is no `teas` row
     to carry a tier-1 correction — the pass record holds a denormalised name and type (R96), which
     is exactly what `liquorFor` needs to reach the catalog. A sender's own correction is deliberately
     NOT carried: it is their judgement of their jar, and R97's reasoning applies here too — the
     recipient reads the catalog live, so a later authoring reaches this tile as well. */
  return `<span ${swatchAttr('social-tile', liquorFor({name:name, type:t}), t)}>${escapeHtml(passScriptFor(name))}</span>`;
}
function passScriptFor(name){
  if(typeof matchTeaType!=='function' || typeof refScript!=='function') return '';
  const m = matchTeaType(name||''); return m ? refScript(m) : '';
}
// R36's destination, resolved at READ time against the bundled catalog (R97): covered → the Go
// Deeper entry, uncovered → the row itself IS the minimal preview. Coverage decides, not the user.
// The member→category walk is refCategoryFor's, not a second copy of it — a pass snapshot is
// {name}-shaped for exactly this question, and a duplicated walk is how deep links drift apart.
function passCategoryFor(name){
  if(typeof refCategoryFor!=='function' || !name) return null;
  return refCategoryFor({ name });
}
function sharedByYouHTML(){
  const all=(state.sessions||[]), shared=all.filter(s=>s.isShared).sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(!shared.length) return '';                    // absent, not an empty frame
  // R68 — generated, never the board's stamped "5 of 31 · 16%". The percentage keeps its half.
  const pct=Math.round((shared.length/all.length)*1000)/10;
  const rows=shared.map(s=>{
    const v=vesselById(s.vesselId);
    // "as stored" is literal here: an old sitting keeps the spelling it was committed with.
    // sessionMethodLabel is the R90 single writer: stored brew_style only, cold brew handled,
    // nothing at all on a null row. A second method-label writer here is what R90 forbids.
    const meta=[fmtDate(s.date), s.teaType?typeLabel(s.teaType):'', sessionMethodLabel(s), v?v.name:''].filter(Boolean).join(' · ');
    return `<div class="social-row">
      ${socialTileHTML(s.teaType, s.teaName)}
      <div style="flex:1;min-width:0;">
        <div class="social-row-name">${escapeHtml(s.teaName||'a tea')}</div>
        <div class="social-row-meta mono">${escapeHtml(meta)}</div>
      </div>
      <span class="social-badge">shared</span>
    </div>`;
  }).join('');
  return `<div class="card">
    <div class="social-head"><div class="eyebrow">Shared by you</div>
      <span class="mono social-frac">${shared.length} of ${all.length} · ${pct}%</span></div>
    ${rows}
    <div class="social-foot mono">the badge says only “shared” — a shared sitting has no recipient. Passing names one.</div>
  </div>`;
}
function passesHTML(){
  const so=state.social;
  // Honest about WHY it is empty. A failed read must not render as "nothing passed yet" — that
  // would be a lie shaped exactly like the truth.
  if(so.passesFailed) return `<div class="card">
    <div class="eyebrow">Passed to you</div>
    <div class="empty" style="padding:12px 0;">Passed cups aren't available yet — run <code>sql/v3_10-pass-record.sql</code> in the Supabase SQL editor.</div>
  </div>`;
  const got=(so.passes&&so.passes.received)||[];
  if(!got.length) return `<div class="card">
    <div class="eyebrow">Passed to you</div>
    <div class="empty" style="padding:12px 0;">Nothing passed your way yet. When someone in your circle sends a cup, it waits here.</div>
  </div>`;
  return `<div class="card">
    <div class="eyebrow">Passed to you</div>
    ${got.map(p=>passRowHTML(p, (so.profiles||{})[p.fromProfile])).join('')}
  </div>`;
}
function passRowHTML(p, prof){
  const who = prof ? (prof.displayName||prof.username) : 'Someone';
  // Generated from the row, never a placeholder: to-the-circle and to-you read differently.
  const line = `${who} passed ${p.toProfile ? 'you a cup' : 'this to the circle'} · ${fmtDate(p.createdAt)}`;
  const cat = passCategoryFor(p.teaName);
  const deeper = cat ? `<button class="btn-ghost pass-deeper" onclick="goDeeperCat('${escapeJsArg(cat)}')">open reference · ${escapeHtml(refCategoryLabel(cat))} ›</button>` : '';
  /* R109 — the primary action is the WISHLIST, not the shelf. R36 made Add-to-shelf the only action,
     and using it showed why that is wrong: a shelf row claims you OWN a tea you have merely been
     told about, and the claim propagates — it enters stock at 0 g, therefore reads `empty` under
     stockTier, therefore turns up in Shopping's running-low list, and takes a slot in "21 teas".
     None of that is true of a recommendation. The wishlist is the surface built for exactly this
     shape (a tea you want and do not have) and it needs no schema: name, tea_type, note and a
     nullable vendor are already there. Add-to-shelf stays as the quiet second action, because
     someone may already own the tea or buy it at once — it is just no longer the default.
     Applies to BOTH R36 tiers; this row is the only place either draws an action. */
  const onShelf = (state.teas||[]).some(t=>(t.name||'').trim().toLowerCase()===(p.teaName||'').trim().toLowerCase());
  const onList = (typeof wishHasTeaName==='function') && wishHasTeaName(p.teaName);
  const add = onShelf ? `<span class="pass-on-shelf mono">on your shelf ✓</span>`
    : onList ? `<span class="pass-on-shelf mono">on your list ✓</span>`
    : `<span class="pass-actions">
        <button class="btn pass-add" onclick="addPassToWishlist('${escapeJsArg(p.id)}')">Add to wishlist</button>
        <button class="btn-ghost pass-own" onclick="addPassToShelf('${escapeJsArg(p.id)}')">I have it ›</button>
      </span>`;
  return `<div class="pass-card">
    <div class="social-row" style="border:0;padding:0;">
      ${socialTileHTML(p.teaType, p.teaName)}
      <div style="flex:1;min-width:0;">
        <div class="social-row-name">${escapeHtml(p.teaName)}</div>
        <div class="social-row-meta mono">${escapeHtml(line)}</div>
        ${deeper}
      </div>
      ${add}
    </div>
    ${p.note?`<div class="kindred"><span class="kindred-tag mono">Kindred</span><span class="kindred-note">“${escapeHtml(p.note)}” <span class="kindred-who mono">— ${escapeHtml(who)}</span></span></div>`:''}
  </div>`;
}
function refCategoryLabel(slug){
  if(typeof resolveTeaType!=='function') return slug;
  const r=resolveTeaType(slug); return r ? r.display_name : slug;
}
/* R109's primary path. A pass becomes a WANT, with the sender's note carried onto the wishlist row
   rather than discarded — which is a better outcome than the shelf gave it, since a shelf row has
   nowhere to put "the second steep is where it opens". The onward path already exists and needs
   nothing new: teaFromWishItem moves the row to the shelf when the tea is actually acquired, R49's
   normalised-name join matches it, and SH1's overlap handling already draws a wishlist row that
   names a tea now on the shelf.
   The idempotency guard is at the WRITER, not the call site — the same lesson as addWishFromTea,
   whose guard had to move here after `rebuyYes` inherited the bug. */
function addPassToWishlist(passId){
  const so = state.social, p = ((so.passes && so.passes.received)||[]).find(x=>x.id===passId); if(!p) return;
  if(typeof wishHasTeaName==='function' && wishHasTeaName(p.teaName)){
    showToast(`"${p.teaName}" is already on your list`); render(); return;
  }
  const prof = (so.profiles||{})[p.fromProfile];
  const who = prof ? (prof.displayName || prof.username) : 'someone in your circle';
  const note = (p.note||'').trim();
  const w = { id:uid(), name:p.teaName, vendor:'', type:p.teaType||'',
              note: note ? `${note} — ${who}` : `passed on by ${who}`,
              done:false, createdAt:new Date().toISOString() };
  state.wishlist = state.wishlist||[]; state.wishlist.push(w);
  persistWish(w); showToast(`Added "${p.teaName}" to your list`); render();
}
// The secondary path, kept for someone who already owns the passed tea or buys it at once. Opens the
// create form PREFILLED — the same gesture teaFromWishItem uses. Nothing is written until the user
// commits it themselves; a pass never silently grows your shelf.
function addPassToShelf(passId){
  const so=state.social, p=((so.passes&&so.passes.received)||[]).find(x=>x.id===passId); if(!p) return;
  state.teaPrefill = { name:p.teaName, type:p.teaType||'' };
  openTeaForm();
}
// JC-C — the feed keeps its renderer and its paging verbatim; only its home moved. "Shared with
// you" and "passed to you" are the same question asked twice, so they sit together.
function circleFeedHTML(){
  const so=state.social;
  if(!so.following.length) return '';
  const feed=so.feed;
  if(!feed || !feed.sessions.length) return '';
  return `<div class="social-head" style="margin:20px 0 8px;"><div class="eyebrow">Shared with you</div></div>${feedHTML()}`;
}
function dismissSocialErr(){ state.social.err=null; render(); }
const FEED_PAGE = 50; // page size for the shared-session feed (v3.66)
function feedHTML(){
  const so=state.social;
  if(!so.following.length) return `<div class="card empty">You're not following anyone yet. Use <strong>Find</strong> to search by username.</div>`;
  const feed=so.feed;
  if(!feed || !feed.sessions.length) return `<div class="card empty">No shared sessions yet from the people you follow.</div>`;
  const rows = feed.sessions.map(s=>feedRowHTML(s, feed.profiles[s.userId])).join('');
  const more = feed.hasMore
    ? `<div class="feed-more"><button class="btn-ghost" onclick="loadMoreFeed()"${so.feedLoadingMore?' disabled':''}>${so.feedLoadingMore?'Loading…':'Load more'}</button></div>`
    : '';
  return rows + more;
}
// Fetch the next page and APPEND, de-duping by session id so a row that shifted across the page
// boundary (a new session inserted up top between fetches) can't render twice. Manual, not infinite.
async function loadMoreFeed(){
  const so=state.social;
  if(so.feedLoadingMore || !so.feed || !so.feed.hasMore) return;
  so.err=null; so.feedLoadingMore=true; render();
  try{
    const next = await window.SteepDB.getFeed(FEED_PAGE, so.feed.sessions.length);
    const seen = new Set(so.feed.sessions.map(s=>s.id));
    const fresh = (next.sessions||[]).filter(s=>!seen.has(s.id));
    so.feed.sessions = so.feed.sessions.concat(fresh);
    so.feed.profiles = {...so.feed.profiles, ...(next.profiles||{})};
    so.feed.hasMore = next.hasMore;
  }catch(e){ so.feedLoadingMore=false; return socialErr(e, 'load more'); }
  so.feedLoadingMore=false; render();
}
function feedRowHTML(s, prof){
  const tags=(s.tags||[]).slice(0,5).map(t=>`<span class="tagchip">${escapeHtml(t)}</span>`).join(' ');
  const typePill = s.teaType?`<span class="pill t-${escapeHtml(s.teaType)}">${escapeHtml(typeLabel(s.teaType))}</span>`:'';
  const meta=[s.vesselName, brewCountLabel(s), s.isColdBrew?'cold brew':''].filter(Boolean).map(escapeHtml).join(' · ');
  const steepChips = s.steeps.length?`<div class="steep-tags" style="margin-top:8px;">${s.steeps.map((st,i)=>`<span class="tagchip">${i+1}: ${cToDisplay(st.tempC)!==''?cToDisplay(st.tempC)+tempUnitLabel()+' ':''}${fmtSec(st.timeSeconds)}</span>`).join(' ')}</div>`:'';
  return `<div class="card" style="margin-bottom:10px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      ${avatarHTML(prof,36)}
      <div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:13.5px;">${prof?escapeHtml(prof.displayName||prof.username):'Someone'}</div>
      <div style="font-size:11px;color:var(--ink-soft);">@${prof?escapeHtml(prof.username):'?'} · ${fmtDateTime(s.date)}</div></div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">${typePill}<strong>${escapeHtml(s.teaName||'a tea')}</strong>${s.rating?renderStarsStatic(s.rating,false):''}</div>
    ${s.photoUrl?`<img src="${escapeHtml(s.photoUrl)}" alt="session photo" class="session-photo" loading="lazy">`:''}
    ${meta?`<div style="font-size:12px;color:var(--ink-soft);margin-top:4px;">${meta}</div>`:''}
    ${s.description?`<div style="font-size:13px;margin-top:6px;white-space:pre-wrap;">${escapeHtml(s.description)}</div>`:''}
    ${steepChips}
    ${tags?`<div class="sess-tags" style="margin-top:6px;">${tags}</div>`:''}
  </div>`;
}
/* The board's "＋ Find someone by handle" — the shipped Find tab, folded to a quiet link that opens
   the same search. Quiet affordances: a fold, never a chip row (§0.5). */
function toggleUserSearch(){ const so=state.social; so.searchOpen=!so.searchOpen; if(!so.searchOpen) so.search=null; render(); }
function findHTML(){
  const so=state.social;
  if(!so.searchOpen) return `<div class="find-row"><button class="btn-ghost find-open" onclick="toggleUserSearch()">＋ Find someone by handle</button></div>`;
  const results=so.search;
  const rows = results===null ? '<div class="empty" style="padding:12px 0;">Search for a friend by their username.</div>'
    : (results.length? results.map(userRowHTML).join('') : '<div class="empty" style="padding:12px 0;">No users found.</div>');
  return `<div class="card" style="margin-top:16px;">
    <div class="social-head"><div class="eyebrow">Find someone</div><button class="btn-ghost" onclick="toggleUserSearch()">close</button></div>
    <div style="display:flex;gap:8px;">
      <input type="text" id="userSearch" placeholder="username…" style="flex:1;border:1px solid var(--line);border-radius:8px;padding:9px 10px;font-size:13.5px;background:var(--porcelain);color:var(--ink);" onkeydown="if(event.key==='Enter'){event.preventDefault();doSearch();}">
      <button class="btn btn-primary" onclick="doSearch()">Search</button>
    </div>
    <div style="margin-top:8px;">${rows}</div>
  </div>`;
}
function userRowHTML(p){
  const following=state.social.following.includes(p.id);
  return `<div class="user-row">
    ${avatarHTML(p,40)}
    <div style="flex:1;min-width:0;"><div style="font-weight:600;">${escapeHtml(p.displayName||p.username)}</div>
    <div style="font-size:12px;color:var(--ink-soft);">@${escapeHtml(p.username)}</div></div>
    ${following?`<button class="btn" onclick="doUnfollow('${escapeJsArg(p.id)}')">Following</button>`:`<button class="btn btn-primary" onclick="doFollow('${escapeJsArg(p.id)}')">Follow</button>`}
  </div>`;
}
/* followingHTML() is GONE, not relocated: circleHTML draws every edge it drew and two it could not
   (a follower you don't follow back was invisible to the old tab), and it keeps doUnfollow on the
   rows that own one. The capability is preserved; only the tab that held it is replaced. */

/* ================= R25 PASS RECORD — the send side ================= */
/* Both entry points (#03's ⋯ and #02b's ⋯) open this one sheet. It is deliberately the ONLY writer:
   two send surfaces sharing one control is the lesson slice A learned with methodLanesHTML.
   The circle is fetched on demand rather than at boot — a follower list on every launch is a real
   cost for an action taken rarely (JC-D). */
function openPassSheet(o){
  state.teaMenuOpen=false; state.sessionMenuOpen=false;
  state.passSheet={ teaId:o.teaId||null, sessionId:o.sessionId||null, teaName:o.teaName||'', teaType:o.teaType||'', to:'', note:'', busy:false, err:null };
  render();
  if(!state.social.loaded && !state.social.busy) loadSocial();
}
function closePassSheet(){ state.passSheet=null; render(); }
function setPassTo(id){ if(state.passSheet){ state.passSheet.to=id; state.passSheet.err=null; render(); } }
function setPassNote(v){ if(state.passSheet) state.passSheet.note=v; }   // no render: never fight the caret
function passSheetHTML(){
  const d=state.passSheet, so=state.social;
  const shell = inner => `<div class="hub-scrim" onclick="closePassSheet()"></div>
    <div class="hub-sheet pass-sheet" role="dialog" aria-label="Pass this tea">
      <div class="hub-grab"></div>
      <div class="pass-sheet-title">Pass <strong>${escapeHtml(d.teaName)}</strong></div>
      ${inner}
    </div>`;
  if(!so.loaded) return shell(`<div class="empty" style="padding:14px 0;">Looking up your circle…</div>`);
  // Two honest dead ends, each with the one thing that would fix it — never a disabled control.
  if(!so.profile) return shell(`<div class="empty" style="padding:14px 0;">You need a profile before you can pass a cup.
    <div style="margin-top:10px;"><button class="btn btn-primary" onclick="closePassSheet();goFriends()">Create one</button></div></div>`);
  const circle=(so.followers||[]);
  if(!circle.length) return shell(`<div class="empty" style="padding:14px 0;">Nobody in your circle yet — a cup needs someone to pass it to.
    <div style="margin-top:10px;"><button class="btn" onclick="closePassSheet();goFriends()">Find someone by handle</button></div></div>`);
  // Recipients are the people who FOLLOW you: they opted in by following, and it is the same set
  // the circle option reaches, so the two choices can never mean different audiences.
  const chips=circle.map(id=>{
    const p=(so.profiles||{})[id];
    return `<button type="button" class="when-chip${d.to===id?' active':''}" onclick="setPassTo('${escapeJsArg(id)}')">${p?escapeHtml(p.displayName||p.username):escapeHtml(id.slice(0,8))}</button>`;
  }).join('');
  return shell(`
    <div class="pass-field">
      <div class="eyebrow">Who</div>
      <div class="when-chips">${chips}<button type="button" class="when-chip${d.to==='*'?' active':''}" onclick="setPassTo('*')">Everyone in your circle</button></div>
    </div>
    <div class="pass-field">
      <div class="eyebrow">A line to go with it</div>
      <textarea class="pass-note" rows="2" placeholder="optional — “the second steep is where it opens”" oninput="setPassNote(this.value)">${escapeHtml(d.note)}</textarea>
    </div>
    ${d.err?`<div class="pass-err">${escapeHtml(d.err)}</div>`:''}
    <div class="pass-actions">
      <button class="btn" onclick="closePassSheet()">Cancel</button>
      <button class="btn btn-primary" onclick="submitPass()"${d.busy?' disabled':''}>${d.busy?'Passing…':'Pass it on'}</button>
    </div>`);
}
let _passSending=false;
async function submitPass(){
  const d=state.passSheet; if(!d || _passSending) return;
  if(!d.to){ d.err='Choose who this goes to.'; render(); return; }
  _passSending=true; d.busy=true; d.err=null; render();
  const so=state.social;
  const toId = d.to==='*' ? null : d.to;
  try{
    await window.SteepDB.sendPass({
      toProfile: toId, teaId: d.teaId, sessionId: d.sessionId,
      teaName: d.teaName, teaType: d.teaType, note: d.note
    });
    const p = toId ? (so.profiles||{})[toId] : null;
    const who = toId ? (p ? (p.displayName||p.username) : 'them') : 'your circle';
    state.passSheet=null;
    showToast(`✓ Passed to ${who}`);
    try{ const fresh=await window.SteepDB.getPasses(); so.passes=fresh; so.passesFailed=false; }catch(_){}
    render();
  }catch(e){
    d.busy=false;
    const m=((e&&e.message)||String(e)).toLowerCase();
    d.err = (m.includes('does not exist')||m.includes('relation')||m.includes('schema cache'))
      ? 'Passing needs sql/v3_10-pass-record.sql run in the Supabase SQL editor.'
      : 'Could not pass it on: '+((e&&e.message)||e);
    render();
  }finally{ _passSending=false; }
}
async function doSearch(){
  const inp=document.getElementById('userSearch'); const q=inp?inp.value:'';
  try{ state.social.search = await window.SteepDB.searchProfiles(q); }catch(e){ state.social.search=[]; }
  render();
  setTimeout(()=>{ const i=document.getElementById('userSearch'); if(i){ i.value=q; i.focus(); } },0);
}
async function doFollow(id){
  state.social.err=null;
  try{ await window.SteepDB.follow(id); }
  catch(e){ return socialErr(e, 'follow'); }
  if(!state.social.following.includes(id)) state.social.following.push(id);
  render();
  try{ await refreshFeed(); }catch(e){ console.warn('[Steep] feed refresh after follow failed', e); }
}
async function doUnfollow(id){
  state.social.err=null;
  try{ await window.SteepDB.unfollow(id); }
  catch(e){ return socialErr(e, 'unfollow'); }
  state.social.following=state.social.following.filter(x=>x!==id);
  render();
  try{ await refreshFeed(); }catch(e){ console.warn('[Steep] feed refresh after unfollow failed', e); }
}

/* ================= SESSIONS (list + calendar) ================= */
