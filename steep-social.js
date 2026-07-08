function goFriends(){ state.view='friends'; state.activeTeaId=null; saveView('friends'); state.social.loaded=false; render(); loadSocial(); }
async function loadSocial(){
  const so=state.social; if(so.busy) return; so.busy=true;
  try{
    so.profile = await window.SteepDB.getMyProfile();
    if(so.profile){
      const feed = await window.SteepDB.getFeed();
      so.feed = feed;
      so.following = feed.following || [];
    }
  }catch(e){ console.warn('[Steep] social load failed', e); }
  so.busy=false; so.loaded=true; render();
}
function setSocialTab(t){ state.social.tab=t; if(t==='feed'){ refreshFeed(); } else render(); }
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
  }
}
function profileSetupHTML(){
  const p=state.social.draft || state.social.profile || {};
  const editing=!!state.social.profile;
  return `
    <div class="section-title"><h2 style="font-family:'Fraunces',serif;font-size:20px;">${editing?'Edit profile':'Create your profile'}</h2></div>
    <div class="card">
      <p style="font-size:12.5px;color:var(--ink-soft);margin-top:0;">Your username lets friends find you. Only your name and avatar are public — your tea log stays private unless you share individual sessions.</p>
      <form onsubmit="submitProfile(event)">
        <div class="field" style="margin-bottom:12px;">
          <label>Avatar</label>
          <div class="img-upload" id="imgUploadWrap" style="width:90px;height:90px;border-radius:50%;${state._draftImage?`background-image:url(${escapeHtml(state._draftImage)})`:''}">
            ${state._draftImage?'':'Photo'}<input type="file" accept="image/*" class="js-img-input">
          </div>
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
function viewFriends(){
  const so=state.social;
  if(!so.loaded) return '<div class="card empty">Loading friends…</div>';
  if(!so.profile || so.profileEditOpen) return profileSetupHTML();
  const me=so.profile;
  const tabs=`<div class="tabs" style="margin-bottom:16px;">
    ${['feed','find','following'].map(t=>`<button class="tab ${so.tab===t?'active':''}" onclick="setSocialTab('${t}')">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}
  </div>`;
  let body='';
  if(so.tab==='feed') body=feedHTML();
  else if(so.tab==='find') body=findHTML();
  else body=followingHTML();
  return `
    <div class="section-title"><h2 style="font-family:'Fraunces',serif;font-size:20px;">Friends</h2>
      <button class="btn-ghost" onclick="editProfile()">edit profile</button></div>
    <div class="card" style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      ${avatarHTML(me,48)}
      <div><div style="font-weight:600;">${escapeHtml(me.displayName||me.username)}</div>
      <div style="font-size:12px;color:var(--ink-soft);">@${escapeHtml(me.username)} · following ${so.following.length}</div></div>
    </div>
    ${tabs}${body}`;
}
function feedHTML(){
  const so=state.social;
  if(!so.following.length) return `<div class="card empty">You're not following anyone yet. Use <strong>Find</strong> to search by username.</div>`;
  const feed=so.feed;
  if(!feed || !feed.sessions.length) return `<div class="card empty">No shared sessions yet from the people you follow.</div>`;
  return feed.sessions.map(s=>feedRowHTML(s, feed.profiles[s.userId])).join('');
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
function findHTML(){
  const results=state.social.search;
  const rows = results===null ? '<div class="empty" style="padding:12px 0;">Search for a friend by their username.</div>'
    : (results.length? results.map(userRowHTML).join('') : '<div class="empty" style="padding:12px 0;">No users found.</div>');
  return `<div class="card">
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
function followingHTML(){
  const so=state.social;
  if(!so.following.length) return '<div class="card empty">Not following anyone yet.</div>';
  const profs=(so.feed&&so.feed.profiles)||{};
  return `<div class="card">${so.following.map(id=>{
    const p=profs[id];
    return `<div class="user-row">
      ${avatarHTML(p,40)}
      <div style="flex:1;min-width:0;"><div style="font-weight:600;">${p?escapeHtml(p.displayName||p.username):'…'}</div>
      <div style="font-size:12px;color:var(--ink-soft);">${p?('@'+escapeHtml(p.username)):escapeHtml(id.slice(0,8))}</div></div>
      <button class="btn" onclick="doUnfollow('${escapeJsArg(id)}')">Unfollow</button>
    </div>`;
  }).join('')}</div>`;
}
async function doSearch(){
  const inp=document.getElementById('userSearch'); const q=inp?inp.value:'';
  try{ state.social.search = await window.SteepDB.searchProfiles(q); }catch(e){ state.social.search=[]; }
  render();
  setTimeout(()=>{ const i=document.getElementById('userSearch'); if(i){ i.value=q; i.focus(); } },0);
}
async function doFollow(id){
  try{ await window.SteepDB.follow(id); }
  catch(e){ return socialErr(e, 'follow'); }
  if(!state.social.following.includes(id)) state.social.following.push(id);
  render();
  try{ await refreshFeed(); }catch(e){ console.warn('[Steep] feed refresh after follow failed', e); }
}
async function doUnfollow(id){
  try{ await window.SteepDB.unfollow(id); }
  catch(e){ return socialErr(e, 'unfollow'); }
  state.social.following=state.social.following.filter(x=>x!==id);
  render();
  try{ await refreshFeed(); }catch(e){ console.warn('[Steep] feed refresh after unfollow failed', e); }
}

/* ================= SESSIONS (list + calendar) ================= */
