/* ===================== DATA LAYER ===================== */
const APP_VERSION = '2026-09-01.1';
const STORE_KEYS = ['players','sessions','ratings','tests','plans','lineups'];
const DEFAULT_QUALITIES = ['Skudd','Pasning','Førstetouch','Bevegelse uten ball','Duellstyrke','Kommunikasjon','Holdning','Taktisk forståelse'];
const QUALITY_COLORS = ['#F0A93E','#7BC96F','#5FA8D8','#E2685C','#C58EDB','#D8C15F','#5FD8C0','#D87FA0'];
const CHART_TEXT = '#F3F1E6';
const CHART_MUTED = '#93A896';
const CHART_GRID = 'rgba(255,255,255,0.08)';
const DEFAULT_TEST_TYPES = [
  {id:'spenst', navn:'Spenst (vertikalhopp)', enhet:'cm'},
  {id:'hurtighet', navn:'Hurtighet (20m sprint)', enhet:'sek'},
  {id:'skudd', navn:'Skuddhastighet', enhet:'km/t'},
  {id:'utholdenhet', navn:'Utholdenhet (Yo-Yo IR1)', enhet:'m'},
];
const FORMATIONS = {
  '4-3-3': [
    {tag:'MV',x:50,y:92},
    {tag:'HB',x:82,y:74},{tag:'MS',x:62,y:78},{tag:'MS',x:38,y:78},{tag:'VB',x:18,y:74},
    {tag:'MM',x:50,y:58},{tag:'MM',x:32,y:52},{tag:'MM',x:68,y:52},
    {tag:'HW',x:80,y:26},{tag:'MF',x:50,y:20},{tag:'VW',x:20,y:26},
  ],
  '4-4-2': [
    {tag:'MV',x:50,y:92},
    {tag:'HB',x:82,y:74},{tag:'MS',x:62,y:78},{tag:'MS',x:38,y:78},{tag:'VB',x:18,y:74},
    {tag:'HY',x:82,y:48},{tag:'MM',x:60,y:52},{tag:'MM',x:40,y:52},{tag:'VY',x:18,y:48},
    {tag:'MF',x:62,y:20},{tag:'MF',x:38,y:20},
  ],
  '3-5-2': [
    {tag:'MV',x:50,y:92},
    {tag:'MS',x:70,y:76},{tag:'MS',x:50,y:78},{tag:'MS',x:30,y:76},
    {tag:'HY',x:86,y:52},{tag:'MM',x:62,y:56},{tag:'MM',x:38,y:56},{tag:'VY',x:14,y:52},
    {tag:'MF',x:62,y:20},{tag:'MF',x:38,y:20},{tag:'MM',x:50,y:38},
  ],
  '4-2-3-1': [
    {tag:'MV',x:50,y:92},
    {tag:'HB',x:82,y:74},{tag:'MS',x:62,y:78},{tag:'MS',x:38,y:78},{tag:'VB',x:18,y:74},
    {tag:'MM',x:62,y:58},{tag:'MM',x:38,y:58},
    {tag:'HW',x:78,y:34},{tag:'MF',x:50,y:30},{tag:'VW',x:22,y:34},
    {tag:'MF',x:50,y:14},
  ],
  '5-3-2': [
    {tag:'MV',x:50,y:92},
    {tag:'HB',x:88,y:70},{tag:'MS',x:68,y:78},{tag:'MS',x:50,y:80},{tag:'MS',x:32,y:78},{tag:'VB',x:12,y:70},
    {tag:'MM',x:64,y:50},{tag:'MM',x:36,y:50},{tag:'MM',x:50,y:42},
    {tag:'MF',x:62,y:18},{tag:'MF',x:38,y:18},
  ],
};

function load(key){ try{ return JSON.parse(localStorage.getItem('lu_'+key)) || []; }catch(e){ return []; } }
function save(key,val){ localStorage.setItem('lu_'+key, JSON.stringify(val)); }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

let players = load('players');
let sessions = load('sessions');
let ratings = load('ratings');
let tests = load('tests');
let plans = load('plans');
let lineups = load('lineups');
let testTypes = load('testTypes'); if(!testTypes.length){ testTypes = DEFAULT_TEST_TYPES; save('testTypes', testTypes); }
let qualities = load('qualities'); if(!qualities.length){ qualities = DEFAULT_QUALITIES; save('qualities', qualities); }

function persistAll(){
  save('players',players); save('sessions',sessions); save('ratings',ratings);
  save('tests',tests); save('plans',plans); save('lineups',lineups);
}

/* ===================== NAV ===================== */
function switchView(v){
  document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
  document.getElementById('view-'+v).classList.add('active');
  document.querySelectorAll('#sidenav .tab, #bottomnav button').forEach(b=>{
    b.classList.toggle('active', b.dataset.view===v);
  });
  if(v==='dashboard') renderDashboard();
  if(v==='spillere') renderPlayers();
  if(v==='okter') renderSessions();
  if(v==='vurdering') renderRatingView();
  if(v==='tester') renderTests();
  if(v==='planer') renderPlans();
  if(v==='oppstilling') renderLineupView();
  if(v==='innstillinger') renderSettings();
}
document.querySelectorAll('#sidenav .tab, #bottomnav button').forEach(b=>{
  b.addEventListener('click', ()=>switchView(b.dataset.view));
});

function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 1800);
}
function closeModal(){ document.getElementById('modal-backdrop').classList.remove('active'); }
function openModal(html){
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-backdrop').classList.add('active');
}
// Custom in-app confirm dialog. Native window.confirm() is unreliable in
// standalone/home-screen PWA mode on iOS (can silently auto-dismiss),
// so all destructive/important actions route through this instead.
function customConfirm(message, onYes){
  openModal(`
    <h2>Bekreft</h2>
    <p style="margin-bottom:20px;line-height:1.5;">${message}</p>
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button class="ghost" id="confirm-no-btn">Avbryt</button>
      <button class="primary" id="confirm-yes-btn">Fortsett</button>
    </div>
  `);
  document.getElementById('confirm-no-btn').addEventListener('click', closeModal);
  document.getElementById('confirm-yes-btn').addEventListener('click', ()=>{
    closeModal();
    onYes();
  });
}
document.getElementById('modal-backdrop').addEventListener('click', e=>{
  if(e.target.id==='modal-backdrop') closeModal();
});

function playerName(id){ const p = players.find(x=>x.id===id); return p ? p.navn : '(slettet spiller)'; }
function fmtDate(d){ const dt=new Date(d); return dt.toLocaleDateString('nb-NO',{day:'2-digit',month:'short',year:'numeric'}); }

/* ===================== SPILLERE ===================== */
function renderPlayers(){
  const wrap = document.getElementById('players-table');
  if(players.length===0){
    wrap.innerHTML = `<div class="empty-state"><h3>Ingen spillere ennå</h3><p>Legg til spillerne dine for å komme i gang.</p></div>`;
    return;
  }
  let rows = players.map(p=>`
    <tr>
      <td><strong>${p.navn}</strong></td>
      <td>${p.posisjon||'—'}</td>
      <td>${p.fodselsar||'—'}</td>
      <td>${p.notat? p.notat : '<span class="small">—</span>'}</td>
      <td style="text-align:right;">
        <button class="icon-btn" onclick="openPlayerModal('${p.id}')" title="Rediger">✎</button>
        <button class="icon-btn" onclick="deletePlayer('${p.id}')" title="Slett">✕</button>
      </td>
    </tr>`).join('');
  wrap.innerHTML = `<thead><tr><th>Navn</th><th>Posisjon</th><th>Født</th><th>Notat</th><th></th></tr></thead><tbody>${rows}</tbody>`;
}
function openPlayerModal(id){
  const p = id ? players.find(x=>x.id===id) : null;
  openModal(`
    <h2>${p?'Rediger spiller':'Ny spiller'}</h2>
    <div class="field"><label>Navn</label><input type="text" id="f-navn" value="${p?p.navn:''}"></div>
    <div class="field"><label>Posisjon</label>
      <select id="f-posisjon">
        <option value="">Velg</option>
        ${['Keeper','Forsvar','Midtbane','Angrep'].map(x=>`<option ${p&&p.posisjon===x?'selected':''}>${x}</option>`).join('')}
      </select>
    </div>
    <div class="field"><label>Fødselsår</label><input type="number" id="f-fodselsar" value="${p?p.fodselsar||'':''}" placeholder="F.eks. 2012"></div>
    <div class="field"><label>Notat</label><textarea id="f-notat" rows="2">${p?p.notat||'':''}</textarea></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button class="ghost" onclick="closeModal()">Avbryt</button>
      <button class="primary" onclick="savePlayer('${id||''}')">Lagre</button>
    </div>
  `);
}
function savePlayer(id){
  const navn = document.getElementById('f-navn').value.trim();
  if(!navn){ toast('Skriv inn navn'); return; }
  const data = {
    navn,
    posisjon: document.getElementById('f-posisjon').value,
    fodselsar: document.getElementById('f-fodselsar').value,
    notat: document.getElementById('f-notat').value.trim(),
  };
  if(id){
    Object.assign(players.find(x=>x.id===id), data);
  } else {
    players.push({id:uid(), ...data});
  }
  save('players',players); closeModal(); renderPlayers(); toast('Lagret');
}
function deletePlayer(id){
  customConfirm('Slette spilleren? Dette fjerner ikke historiske vurderinger/tester.', ()=>{
    players = players.filter(x=>x.id!==id); save('players',players); renderPlayers();
  });
}

/* ===================== ØKTER & KAMPER ===================== */
function renderSessions(){
  const wrap = document.getElementById('sessions-list');
  if(sessions.length===0){
    wrap.innerHTML = `<div class="empty-state"><h3>Ingen økter registrert</h3><p>Legg til en trening eller kamp for å ta oppmøte.</p></div>`;
    return;
  }
  const sorted = [...sessions].sort((a,b)=> new Date(b.dato)-new Date(a.dato));
  wrap.innerHTML = sorted.map(s=>{
    const attended = Object.values(s.oppmote||{}).filter(Boolean).length;
    return `<div class="card">
      <div class="flex-between">
        <div>
          <span class="pill ${s.type}">${s.type==='kamp'?'Kamp':'Trening'}</span>
          <strong style="margin-left:8px;">${s.tittel||''}</strong>
          <div class="small" style="margin-top:4px;">${fmtDate(s.dato)} · ${attended}/${players.length} møtte</div>
        </div>
        <div>
          <button class="icon-btn" onclick="openSessionModal('${s.id}')" title="Rediger">✎</button>
          <button class="icon-btn" onclick="deleteSession('${s.id}')" title="Slett">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');
}
function openSessionModal(id){
  const s = id ? sessions.find(x=>x.id===id) : null;
  const checks = players.map(p=>`
    <label class="checklist-item" style="cursor:pointer;">
      <input type="checkbox" data-pid="${p.id}" ${s&&s.oppmote&&s.oppmote[p.id]?'checked':''}>
      <span>${p.navn}</span>
    </label>`).join('') || '<p class="small">Legg til spillere først under "Spillere".</p>';
  openModal(`
    <h2>${s?'Rediger':'Ny'} økt/kamp</h2>
    <div class="grid cols-2">
      <div class="field"><label>Type</label>
        <select id="f-type">
          <option value="trening" ${s&&s.type==='trening'?'selected':''}>Trening</option>
          <option value="kamp" ${s&&s.type==='kamp'?'selected':''}>Kamp</option>
        </select>
      </div>
      <div class="field"><label>Dato</label><input type="date" id="f-dato" value="${s?s.dato:new Date().toISOString().slice(0,10)}"></div>
    </div>
    <div class="field"><label>Tittel</label><input type="text" id="f-tittel" value="${s?s.tittel||'':''}" placeholder="F.eks. Kamp mot Nord IL"></div>
    <div class="field"><label>Oppmøte</label><div style="max-height:220px;overflow-y:auto;border:1px solid var(--line-white);border-radius:8px;padding:4px 12px;">${checks}</div></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button class="ghost" onclick="closeModal()">Avbryt</button>
      <button class="primary" onclick="saveSession('${id||''}')">Lagre</button>
    </div>
  `);
}
function saveSession(id){
  const oppmote = {};
  document.querySelectorAll('#modal-content [data-pid]').forEach(chk=>{ oppmote[chk.dataset.pid] = chk.checked; });
  const data = {
    type: document.getElementById('f-type').value,
    dato: document.getElementById('f-dato').value,
    tittel: document.getElementById('f-tittel').value.trim(),
    oppmote,
  };
  if(id){ Object.assign(sessions.find(x=>x.id===id), data); }
  else { sessions.push({id:uid(), ...data}); }
  save('sessions',sessions); closeModal(); renderSessions(); toast('Lagret');
}
function deleteSession(id){
  customConfirm('Slette denne økten? Vurderinger knyttet til den blir også slettet.', ()=>{
    sessions = sessions.filter(x=>x.id!==id);
    ratings = ratings.filter(r=>r.sessionId!==id);
    save('sessions',sessions); save('ratings',ratings); renderSessions();
  });
}

/* ===================== VURDERING ===================== */
function renderRatingView(){
  const sel = document.getElementById('rate-session-select');
  const sorted = [...sessions].sort((a,b)=> new Date(b.dato)-new Date(a.dato));
  sel.innerHTML = sorted.map(s=>`<option value="${s.id}">${fmtDate(s.dato)} — ${s.type==='kamp'?'Kamp':'Trening'}${s.tittel? ' · '+s.tittel:''}</option>`).join('') || '<option value="">Ingen økter</option>';
  renderRatingForm();
}
function renderRatingForm(){
  const sessionId = document.getElementById('rate-session-select').value;
  const form = document.getElementById('rating-form');
  if(!sessionId){ form.innerHTML = `<div class="empty-state"><h3>Ingen økt valgt</h3><p>Opprett en økt under "Økter &amp; kamper" først.</p></div>`; return; }
  const s = sessions.find(x=>x.id===sessionId);
  const attendedIds = Object.entries(s.oppmote||{}).filter(([,v])=>v).map(([k])=>k);
  const list = attendedIds.length ? attendedIds : players.map(p=>p.id);
  if(list.length===0){ form.innerHTML = `<div class="empty-state"><h3>Ingen spillere å vurdere</h3></div>`; return; }
  form.innerHTML = list.map(pid=>{
    const existing = ratings.find(r=>r.sessionId===sessionId && r.playerId===pid) || {kvaliteter:{},kommentar:''};
    const stars = qualities.map(q=>{
      const val = existing.kvaliteter[q]||0;
      const starBtns = [1,2,3,4,5].map(n=>`<button class="${n<=val?'on':''}" onclick="setStar('${sessionId}','${pid}','${q}',${n})">★</button>`).join('');
      return `<div class="flex-between" style="padding:6px 0;"><span style="font-size:14px;">${q}</span><div class="star-rate">${starBtns}</div></div>`;
    }).join('');
    return `<div class="card">
      <strong>${playerName(pid)}</strong>
      <div style="margin-top:10px;">${stars}</div>
      <div class="field" style="margin-top:12px;"><label>Kommentar</label>
        <textarea rows="2" onchange="setComment('${sessionId}','${pid}', this.value)">${existing.kommentar||''}</textarea>
      </div>
    </div>`;
  }).join('');
}
function getOrCreateRating(sessionId, playerId){
  let r = ratings.find(x=>x.sessionId===sessionId && x.playerId===playerId);
  if(!r){ r = {id:uid(), sessionId, playerId, kvaliteter:{}, kommentar:''}; ratings.push(r); }
  return r;
}
function setStar(sessionId, playerId, quality, val){
  const r = getOrCreateRating(sessionId, playerId);
  r.kvaliteter[quality] = (r.kvaliteter[quality]===val) ? val : val; // click sets value
  save('ratings',ratings); renderRatingForm();
}
function setComment(sessionId, playerId, val){
  const r = getOrCreateRating(sessionId, playerId);
  r.kommentar = val; save('ratings',ratings);
}

/* ===================== TESTER ===================== */
function renderTests(){
  const wrap = document.getElementById('tests-list');
  if(tests.length===0){
    wrap.innerHTML = `<div class="empty-state"><h3>Ingen tester registrert</h3><p>Registrer spenst, hurtighet, skuddhastighet eller utholdenhet for å følge utvikling.</p></div>`;
    return;
  }
  const sorted = [...tests].sort((a,b)=> new Date(b.dato)-new Date(a.dato));
  wrap.innerHTML = `<div class="card" style="padding:0;overflow-x:auto;"><table>
    <thead><tr><th>Dato</th><th>Spiller</th><th>Test</th><th>Resultat</th><th></th></tr></thead>
    <tbody>${sorted.map(t=>{
      const tt = testTypes.find(x=>x.id===t.typeId) || {navn:t.typeId, enhet:''};
      return `<tr><td>${fmtDate(t.dato)}</td><td>${playerName(t.playerId)}</td><td>${tt.navn}</td><td><strong>${t.verdi} ${tt.enhet}</strong></td>
      <td style="text-align:right;"><button class="icon-btn" onclick="deleteTest('${t.id}')">✕</button></td></tr>`;
    }).join('')}</tbody>
  </table></div>`;
}
function openTestModal(){
  openModal(`
    <h2>Registrer test</h2>
    <div class="field"><label>Spiller</label>
      <select id="f-tplayer">${players.map(p=>`<option value="${p.id}">${p.navn}</option>`).join('') || '<option value="">Legg til spillere først</option>'}</select>
    </div>
    <div class="field"><label>Testtype</label>
      <select id="f-ttype" onchange="updateTestUnitLabel()">
        ${testTypes.map(t=>`<option value="${t.id}">${t.navn}</option>`).join('')}
        <option value="__custom__">+ Ny egendefinert test</option>
      </select>
    </div>
    <div class="field" id="custom-test-fields" style="display:none;">
      <label>Navn på ny test</label><input type="text" id="f-customname" placeholder="F.eks. Balltrilling 20m">
      <label style="margin-top:8px;">Enhet</label><input type="text" id="f-customunit" placeholder="F.eks. sek">
    </div>
    <div class="grid cols-2">
      <div class="field"><label>Resultat <span id="unit-label" class="small"></span></label><input type="number" step="0.01" id="f-tverdi"></div>
      <div class="field"><label>Dato</label><input type="date" id="f-tdato" value="${new Date().toISOString().slice(0,10)}"></div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button class="ghost" onclick="closeModal()">Avbryt</button>
      <button class="primary" onclick="saveTest()">Lagre</button>
    </div>
  `);
  document.getElementById('f-ttype').addEventListener('change', function(){
    document.getElementById('custom-test-fields').style.display = this.value==='__custom__' ? 'block':'none';
    updateTestUnitLabel();
  });
  updateTestUnitLabel();
}
function updateTestUnitLabel(){
  const sel = document.getElementById('f-ttype');
  if(!sel) return;
  const tt = testTypes.find(t=>t.id===sel.value);
  document.getElementById('unit-label').textContent = tt ? `(${tt.enhet})` : '';
}
function saveTest(){
  const playerId = document.getElementById('f-tplayer').value;
  if(!playerId){ toast('Legg til en spiller først'); return; }
  let typeId = document.getElementById('f-ttype').value;
  if(typeId==='__custom__'){
    const navn = document.getElementById('f-customname').value.trim();
    const enhet = document.getElementById('f-customunit').value.trim();
    if(!navn){ toast('Gi testen et navn'); return; }
    typeId = 'custom_'+uid();
    testTypes.push({id:typeId, navn, enhet});
    save('testTypes', testTypes);
  }
  const verdi = parseFloat(document.getElementById('f-tverdi').value);
  if(isNaN(verdi)){ toast('Skriv inn et resultat'); return; }
  tests.push({id:uid(), playerId, typeId, verdi, dato:document.getElementById('f-tdato').value});
  save('tests',tests); closeModal(); renderTests(); toast('Test registrert');
}
function deleteTest(id){ tests = tests.filter(x=>x.id!==id); save('tests',tests); renderTests(); }

/* ===================== ØKTPLAN ===================== */
function renderPlans(){
  const wrap = document.getElementById('plans-list');
  if(plans.length===0){
    wrap.innerHTML = `<div class="empty-state"><h3>Ingen øktplaner ennå</h3><p>Lag en huskeliste for neste trening.</p></div>`;
    return;
  }
  const sorted = [...plans].sort((a,b)=> new Date(b.dato)-new Date(a.dato));
  wrap.innerHTML = sorted.map(pl=>{
    const done = pl.punkter.filter(x=>x.done).length;
    return `<div class="card">
      <div class="flex-between">
        <div><strong>${pl.tittel}</strong><div class="small">${fmtDate(pl.dato)} · ${done}/${pl.punkter.length} fullført</div></div>
        <button class="icon-btn" onclick="deletePlan('${pl.id}')">✕</button>
      </div>
      <div style="margin-top:10px;">
        ${pl.punkter.map((pt,i)=>`
          <label class="checklist-item ${pt.done?'done':''}" style="cursor:pointer;">
            <input type="checkbox" ${pt.done?'checked':''} onchange="togglePlanItem('${pl.id}',${i})">
            <span>${pt.tekst}</span>
          </label>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <input type="text" id="newitem-${pl.id}" placeholder="Legg til punkt..." style="flex:1;" onkeydown="if(event.key==='Enter') addPlanItem('${pl.id}')">
        <button class="ghost" onclick="addPlanItem('${pl.id}')">Legg til</button>
      </div>
    </div>`;
  }).join('');
}
function openPlanModal(){
  openModal(`
    <h2>Ny øktplan</h2>
    <div class="field"><label>Tittel</label><input type="text" id="f-ptittel" placeholder="F.eks. Trening tirsdag - avslutninger"></div>
    <div class="field"><label>Dato</label><input type="date" id="f-pdato" value="${new Date().toISOString().slice(0,10)}"></div>
    <div class="field"><label>Punkter (ett pr. linje)</label><textarea id="f-ppunkter" rows="5" placeholder="Oppvarming 15 min&#10;Pasningsøvelser&#10;4v4 smålagsspill&#10;Avslutninger&#10;Nedjogg"></textarea></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button class="ghost" onclick="closeModal()">Avbryt</button>
      <button class="primary" onclick="savePlan()">Lagre</button>
    </div>
  `);
}
function savePlan(){
  const tittel = document.getElementById('f-ptittel').value.trim();
  if(!tittel){ toast('Gi økten en tittel'); return; }
  const punkter = document.getElementById('f-ppunkter').value.split('\n').map(x=>x.trim()).filter(Boolean).map(tekst=>({tekst,done:false}));
  plans.push({id:uid(), tittel, dato:document.getElementById('f-pdato').value, punkter});
  save('plans',plans); closeModal(); renderPlans(); toast('Plan lagret');
}
function togglePlanItem(planId, idx){
  const pl = plans.find(x=>x.id===planId); pl.punkter[idx].done = !pl.punkter[idx].done;
  save('plans',plans); renderPlans();
}
function addPlanItem(planId){
  const input = document.getElementById('newitem-'+planId);
  const val = input.value.trim(); if(!val) return;
  plans.find(x=>x.id===planId).punkter.push({tekst:val,done:false});
  save('plans',plans); renderPlans();
}
function deletePlan(id){ plans = plans.filter(x=>x.id!==id); save('plans',plans); renderPlans(); }

/* ===================== OPPSTILLING ===================== */
function renderLineupView(){
  document.getElementById('lineup-title').value='';
  renderPitch();
  renderSavedLineups();
}
function renderPitch(){
  const formation = document.getElementById('lineup-formation').value;
  const slots = FORMATIONS[formation];
  const pitch = document.getElementById('pitch');
  pitch.innerHTML = slots.map((s,i)=>`
    <div class="pos-slot" style="left:${s.x}%;top:${s.y}%;">
      <div class="tag">${s.tag}</div>
      <select data-slot="${i}">
        <option value="">–</option>
        ${players.map(p=>`<option value="${p.id}">${p.navn}</option>`).join('')}
      </select>
    </div>`).join('');
}
function saveLineup(){
  const title = document.getElementById('lineup-title').value.trim() || 'Uten navn';
  const formation = document.getElementById('lineup-formation').value;
  const slots = FORMATIONS[formation];
  const plasseringer = [];
  document.querySelectorAll('#pitch [data-slot]').forEach(sel=>{
    const idx = parseInt(sel.dataset.slot);
    plasseringer.push({tag:slots[idx].tag, playerId: sel.value});
  });
  lineups.push({id:uid(), tittel:title, formasjon:formation, plasseringer, dato:new Date().toISOString().slice(0,10)});
  save('lineups',lineups); toast('Oppstilling lagret'); renderSavedLineups();
}
function renderSavedLineups(){
  const wrap = document.getElementById('saved-lineups');
  if(lineups.length===0){ wrap.innerHTML=''; return; }
  const sorted=[...lineups].sort((a,b)=> new Date(b.dato)-new Date(a.dato));
  wrap.innerHTML = `<h3 style="font-size:15px;">Lagrede oppstillinger</h3>` + sorted.map(l=>`
    <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--line-white);">
      <div><strong>${l.tittel}</strong><div class="small">${l.formasjon} · ${fmtDate(l.dato)}</div></div>
      <button class="icon-btn" onclick="deleteLineup('${l.id}')">✕</button>
    </div>`).join('');
}
function deleteLineup(id){ lineups = lineups.filter(x=>x.id!==id); save('lineups',lineups); renderSavedLineups(); }

/* ===================== DASHBOARD ===================== */
let chartOppmote, chartKvaliteter, chartSpillerTester, chartSpillerKvalitetTid, chartLagKvalitetTid;
function renderDashboard(){
  const statsWrap = document.getElementById('dash-stats');
  const lastSessions = [...sessions].sort((a,b)=> new Date(b.dato)-new Date(a.dato)).slice(0,8);
  const avgAttendance = lastSessions.length ? Math.round(lastSessions.reduce((sum,s)=> sum + Object.values(s.oppmote||{}).filter(Boolean).length,0)/lastSessions.length) : 0;
  const upcomingPlans = plans.filter(p=> p.punkter.some(x=>!x.done)).length;
  statsWrap.innerHTML = `
    <div class="stat-box"><div class="val num">${players.length}</div><div class="lbl">Spillere</div></div>
    <div class="stat-box"><div class="val num">${sessions.length}</div><div class="lbl">Registrerte økter</div></div>
    <div class="stat-box"><div class="val num">${avgAttendance}</div><div class="lbl">Snitt oppmøte (siste 8)</div></div>
    <div class="stat-box"><div class="val num">${upcomingPlans}</div><div class="lbl">Aktive øktplaner</div></div>
  `;

  // Oppmøte chart
  const ordered = [...lastSessions].reverse();
  const ctx1 = document.getElementById('chart-oppmote');
  if(chartOppmote) chartOppmote.destroy();
  chartOppmote = new Chart(ctx1, {
    type:'bar',
    data:{ labels: ordered.map(s=>fmtDate(s.dato)),
      datasets:[{label:'Oppmøtte', data: ordered.map(s=>Object.values(s.oppmote||{}).filter(Boolean).length), backgroundColor:'#7BC96F', borderRadius:4}]},
    options:{ plugins:{legend:{display:false}}, scales:{
      y:{ beginAtZero:true, ticks:{precision:0, color:CHART_MUTED}, grid:{color:CHART_GRID} },
      x:{ ticks:{color:CHART_MUTED}, grid:{display:false} } } }
  });

  // Player picker drives radar + quality trend + test trend
  const psel = document.getElementById('dash-player-select');
  const prevValue = psel.value;
  psel.innerHTML = players.map(p=>`<option value="${p.id}">${p.navn}</option>`).join('') || '<option value="">Ingen spillere ennå</option>';
  if(players.some(p=>p.id===prevValue)){ psel.value = prevValue; }
  psel.removeEventListener('change', renderPlayerCharts);
  psel.addEventListener('change', renderPlayerCharts);
  renderPlayerCharts();

  renderTeamQualityTrend();
}

function qualityAverages(playerId){
  return qualities.map(q=>{
    const vals = ratings.filter(r=> playerId ? r.playerId===playerId : true).map(r=>r.kvaliteter[q]).filter(v=>v>0);
    return vals.length ? +(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2) : 0;
  });
}

function renderPlayerCharts(){
  const pid = document.getElementById('dash-player-select').value;
  const name = pid ? playerName(pid) : '';
  document.getElementById('radar-subtitle').textContent = pid
    ? `${name} sammenlignet med lagsnittet, basert på alle registrerte vurderinger.`
    : 'Velg en spiller over for å se sammenligning.';
  document.getElementById('quality-trend-subtitle').textContent = pid
    ? `${name}s snittkarakter pr. vurderte økt, én linje pr. kvalitet.`
    : 'Velg en spiller over for å se utvikling.';
  document.getElementById('test-subtitle').textContent = pid
    ? `Fysiske testresultater for ${name} over tid.`
    : 'Velg en spiller over for å se testresultater.';
  renderRadarChart(pid);
  renderPlayerQualityTrend(pid);
  renderPlayerTestChart(pid);
}

function renderRadarChart(pid){
  const ctx = document.getElementById('chart-kvaliteter');
  const emptyMsg = document.getElementById('radar-empty');
  if(chartKvaliteter) chartKvaliteter.destroy();
  if(qualities.length===0){ return; }
  const hasPlayerData = pid && ratings.some(r=>r.playerId===pid);
  emptyMsg.classList.toggle('hidden', !pid || hasPlayerData);
  const datasets = [
    { label:'Lagsnitt', data: qualityAverages(null), backgroundColor:'rgba(240,169,62,0.15)', borderColor:'#F0A93E', pointBackgroundColor:'#F0A93E' },
  ];
  if(pid){
    datasets.push({ label: playerName(pid), data: qualityAverages(pid), backgroundColor:'rgba(123,201,111,0.22)', borderColor:'#7BC96F', pointBackgroundColor:'#7BC96F' });
  }
  chartKvaliteter = new Chart(ctx, {
    type:'radar',
    data:{ labels: qualities, datasets },
    options:{
      scales:{ r:{ min:0, max:5, ticks:{ stepSize:1, color:CHART_MUTED, backdropColor:'transparent' },
        grid:{color:CHART_GRID}, angleLines:{color:CHART_GRID}, pointLabels:{color:CHART_TEXT, font:{size:11}} } },
      plugins:{ legend:{ position:'bottom', labels:{color:CHART_TEXT} } }
    }
  });
}

function renderPlayerQualityTrend(pid){
  const ctx = document.getElementById('chart-spiller-kvalitet-tid');
  const emptyMsg = document.getElementById('quality-trend-empty');
  if(chartSpillerKvalitetTid) chartSpillerKvalitetTid.destroy();
  if(!pid || qualities.length===0){ emptyMsg.classList.add('hidden'); return; }
  const rows = ratings.filter(r=>r.playerId===pid)
    .map(r=>({ ...r, session: sessions.find(s=>s.id===r.sessionId) }))
    .filter(r=>r.session)
    .sort((a,b)=> new Date(a.session.dato)-new Date(b.session.dato));
  emptyMsg.classList.toggle('hidden', rows.length>0);
  if(rows.length===0){ return; }
  const labels = rows.map(r=>fmtDate(r.session.dato));
  const datasets = qualities.map((q,i)=>({
    label:q, data: rows.map(r=> r.kvaliteter[q] || null),
    borderColor: QUALITY_COLORS[i%QUALITY_COLORS.length], backgroundColor:QUALITY_COLORS[i%QUALITY_COLORS.length],
    spanGaps:true, tension:0.3, pointRadius:3,
  }));
  chartSpillerKvalitetTid = new Chart(ctx, {
    type:'line', data:{labels,datasets},
    options:{ scales:{
      y:{ min:0, max:5, ticks:{stepSize:1, color:CHART_MUTED}, grid:{color:CHART_GRID} },
      x:{ ticks:{color:CHART_MUTED}, grid:{display:false} } },
      plugins:{ legend:{ position:'bottom', labels:{color:CHART_TEXT, boxWidth:12, font:{size:11}} } } }
  });
}

function renderTeamQualityTrend(){
  const ctx = document.getElementById('chart-lag-kvalitet-tid');
  if(chartLagKvalitetTid) chartLagKvalitetTid.destroy();
  const sessionsWithRatings = sessions.filter(s=> ratings.some(r=>r.sessionId===s.id)).sort((a,b)=> new Date(a.dato)-new Date(b.dato));
  if(sessionsWithRatings.length===0 || qualities.length===0){ return; }
  const labels = sessionsWithRatings.map(s=>fmtDate(s.dato));
  const datasets = qualities.map((q,i)=>({
    label:q,
    data: sessionsWithRatings.map(s=>{
      const vals = ratings.filter(r=>r.sessionId===s.id).map(r=>r.kvaliteter[q]).filter(v=>v>0);
      return vals.length ? +(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2) : null;
    }),
    borderColor: QUALITY_COLORS[i%QUALITY_COLORS.length], backgroundColor:QUALITY_COLORS[i%QUALITY_COLORS.length],
    spanGaps:true, tension:0.3, pointRadius:3,
  }));
  chartLagKvalitetTid = new Chart(ctx, {
    type:'line', data:{labels,datasets},
    options:{ scales:{
      y:{ min:0, max:5, ticks:{stepSize:1, color:CHART_MUTED}, grid:{color:CHART_GRID} },
      x:{ ticks:{color:CHART_MUTED}, grid:{display:false} } },
      plugins:{ legend:{ position:'bottom', labels:{color:CHART_TEXT, boxWidth:12, font:{size:11}} } } }
  });
}

function renderPlayerTestChart(pid){
  const ctx = document.getElementById('chart-spiller-tester');
  const emptyMsg = document.getElementById('test-empty');
  if(chartSpillerTester) chartSpillerTester.destroy();
  if(!pid){ emptyMsg.classList.add('hidden'); return; }
  const playerTests = tests.filter(t=>t.playerId===pid).sort((a,b)=> new Date(a.dato)-new Date(b.dato));
  emptyMsg.classList.toggle('hidden', playerTests.length>0);
  if(playerTests.length===0){ return; }
  const byType = {};
  playerTests.forEach(t=>{ (byType[t.typeId] = byType[t.typeId]||[]).push(t); });
  const datasets = Object.keys(byType).map((typeId,i)=>{
    const tt = testTypes.find(x=>x.id===typeId) || {navn:typeId};
    return { label: tt.navn, data: byType[typeId].map(t=>({x:t.dato, y:t.verdi})),
      borderColor: QUALITY_COLORS[i%QUALITY_COLORS.length], backgroundColor:QUALITY_COLORS[i%QUALITY_COLORS.length], tension:0.25, pointRadius:3 };
  });
  chartSpillerTester = new Chart(ctx, {
    type:'line',
    data:{ datasets },
    options:{ parsing:false, scales:{
      x:{ type:'time', time:{unit:'month'}, ticks:{source:'auto', color:CHART_MUTED}, grid:{color:CHART_GRID} },
      y:{ ticks:{color:CHART_MUTED}, grid:{color:CHART_GRID} } },
      plugins:{ legend:{ position:'bottom', labels:{color:CHART_TEXT} } } }
  });
}


/* ===================== INNSTILLINGER / BACKUP / OPPDATERING ===================== */
function renderSettings(){
  const label = `Versjon ${APP_VERSION}`;
  document.getElementById('version-label-main').textContent = label;
  renderQualitiesSettings();
}
function allDataKeys(){
  return [...STORE_KEYS, 'testTypes', 'qualities'];
}
function exportAllData(){
  const data = {};
  allDataKeys().forEach(k=>{ data[k] = JSON.parse(localStorage.getItem('lu_'+k) || 'null'); });
  data._version = APP_VERSION;
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `lagutvikling-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  toast('Backup lastet ned');
}
function importBackupFile(file){
  const reader = new FileReader();
  reader.onload = e=>{
    try{
      const data = JSON.parse(e.target.result);
      allDataKeys().forEach(k=>{
        if(data[k] !== undefined && data[k] !== null){ localStorage.setItem('lu_'+k, JSON.stringify(data[k])); }
      });
      toast('Backup importert – laster på nytt …');
      setTimeout(()=> window.location.reload(), 800);
    }catch(err){
      toast('Kunne ikke lese backup-filen');
    }
  };
  reader.readAsText(file);
}

function renderQualitiesSettings(){
  const wrap = document.getElementById('qualities-list');
  if(qualities.length===0){ wrap.innerHTML = `<p class="small">Ingen kvaliteter lagt til ennå.</p>`; return; }
  wrap.innerHTML = qualities.map(q=>`
    <span class="quality-chip">${q}
      <button onclick="removeQuality('${q.replace(/'/g,"\\'")}')" title="Fjern">✕</button>
    </span>`).join('');
}
function addQualityFromInput(){
  const input = document.getElementById('new-quality-input');
  const val = input.value.trim();
  if(!val) return;
  if(qualities.includes(val)){ toast('Finnes allerede'); return; }
  qualities.push(val); save('qualities', qualities);
  input.value=''; renderQualitiesSettings(); toast('Lagt til');
}
function removeQuality(q){
  customConfirm(`Fjerne "${q}"? Tidligere vurderinger beholdes i historikken, men kvaliteten vises ikke lenger i nye vurderinger.`, ()=>{
    qualities = qualities.filter(x=>x!==q); save('qualities', qualities); renderQualitiesSettings();
  });
}

/* ---- Demo data ---- */
function generateDemoData(){
  customConfirm('Dette legger til et fiktivt demo-lag med spillere, økter, vurderinger og tester, slik at du kan se hvordan grafene ser ut ferdig utfylt. Du kan fjerne det igjen når som helst uten at dine egne data påvirkes. Fortsette?', ()=>{
    doGenerateDemoData();
  });
}
function doGenerateDemoData(){
  const demoQualities = ['Skudd','Pasning','Førstetouch','Bevegelse uten ball','Duellstyrke','Kommunikasjon','Holdning','Taktisk forståelse'];
  demoQualities.forEach(q=>{ if(!qualities.includes(q)) qualities.push(q); });
  save('qualities', qualities);

  const demoNames = [
    {navn:'Emma Haugen', posisjon:'Keeper', fodselsar:2012},
    {navn:'Olav Berg', posisjon:'Forsvar', fodselsar:2012},
    {navn:'Sofie Dahl', posisjon:'Forsvar', fodselsar:2012},
    {navn:'Noah Kristiansen', posisjon:'Forsvar', fodselsar:2013},
    {navn:'Ingrid Solheim', posisjon:'Forsvar', fodselsar:2012},
    {navn:'Markus Vik', posisjon:'Midtbane', fodselsar:2012},
    {navn:'Thea Nygård', posisjon:'Midtbane', fodselsar:2013},
    {navn:'Jonas Strand', posisjon:'Midtbane', fodselsar:2012},
    {navn:'Maja Lien', posisjon:'Midtbane', fodselsar:2012},
    {navn:'Sander Moe', posisjon:'Angrep', fodselsar:2012},
    {navn:'Live Fossen', posisjon:'Angrep', fodselsar:2013},
    {navn:'Kasper Rud', posisjon:'Angrep', fodselsar:2012},
  ];
  const demoPlayers = demoNames.map(p=>({ id:uid(), demo:true, notat:'', ...p }));
  players.push(...demoPlayers);

  const today = new Date();
  const rawSessions = [];
  const numWeeks = 9;
  for(let w=numWeeks; w>=0; w--){
    const base = new Date(today); base.setDate(base.getDate() - w*7);
    const tue = new Date(base); tue.setDate(tue.getDate() - ((tue.getDay()+5)%7));
    rawSessions.push({date:new Date(tue), type:'trening', tittel:'Trening'});
    if(w%2===0){
      const sat = new Date(base); sat.setDate(sat.getDate() + ((6-sat.getDay()+7)%7));
      const motstander = ['Nord IL','Sør FK','Bygdø BK','Fjell United'][w%4];
      rawSessions.push({date:new Date(sat), type:'kamp', tittel:'Kamp mot '+motstander});
    }
  }
  rawSessions.sort((a,b)=>a.date-b.date);
  const demoSessions = rawSessions.map((s,idx)=>{
    const oppmote = {};
    demoPlayers.forEach(p=>{ oppmote[p.id] = Math.random() > 0.15; });
    return { id:uid(), demo:true, type:s.type, dato:s.date.toISOString().slice(0,10), tittel:s.tittel, oppmote };
  });
  sessions.push(...demoSessions);

  const playerBaseline = {};
  demoPlayers.forEach(p=>{ playerBaseline[p.id] = 2 + Math.random()*1.2; });
  const total = demoSessions.length;
  demoSessions.forEach((s, idx)=>{
    const progress = idx/(total-1||1);
    demoPlayers.forEach(p=>{
      if(!s.oppmote[p.id]) return;
      if(Math.random() > 0.7) return;
      const base = playerBaseline[p.id] + progress*1.3;
      const kvaliteter = {};
      demoQualities.forEach(q=>{
        kvaliteter[q] = Math.round(Math.min(5, Math.max(1, base + (Math.random()-0.5)*1.2)));
      });
      ratings.push({id:uid(), demo:true, sessionId:s.id, playerId:p.id, kvaliteter, kommentar:''});
    });
  });

  const testDates = [demoSessions[0].dato, demoSessions[Math.floor(total/2)].dato, demoSessions[total-1].dato];
  demoPlayers.forEach(p=>{
    const spenstBase = 28 + Math.random()*10;
    const hurtighetBase = 3.6 + Math.random()*0.5;
    const skuddBase = 55 + Math.random()*15;
    const utholdenhetBase = 800 + Math.random()*400;
    testDates.forEach((dato, i)=>{
      tests.push({id:uid(), demo:true, playerId:p.id, typeId:'spenst', verdi: Math.round(spenstBase + i*2.2), dato});
      tests.push({id:uid(), demo:true, playerId:p.id, typeId:'hurtighet', verdi: +(hurtighetBase - i*0.12).toFixed(2), dato});
      tests.push({id:uid(), demo:true, playerId:p.id, typeId:'skudd', verdi: Math.round(skuddBase + i*3), dato});
      tests.push({id:uid(), demo:true, playerId:p.id, typeId:'utholdenhet', verdi: Math.round(utholdenhetBase + i*120), dato});
    });
  });

  plans.push({id:uid(), demo:true, tittel:'Trening tirsdag – avslutninger', dato:new Date().toISOString().slice(0,10), punkter:[
    {tekst:'Oppvarming 15 min', done:true},
    {tekst:'Pasningsøvelser i par', done:true},
    {tekst:'4v4 smålagsspill', done:false},
    {tekst:'Avslutninger fra kant', done:false},
    {tekst:'Nedjogg og tøying', done:false},
  ]});

  persistAll();
  toast('Demo-data lagt til');
  switchView('dashboard');
}
function clearDemoData(){
  customConfirm('Fjerne alt demo-data? Dine egne registrerte spillere, økter, vurderinger og tester påvirkes ikke.', ()=>{
    players = players.filter(x=>!x.demo);
    sessions = sessions.filter(x=>!x.demo);
    ratings = ratings.filter(x=>!x.demo);
    tests = tests.filter(x=>!x.demo);
    plans = plans.filter(x=>!x.demo);
    lineups = lineups.filter(x=>!x.demo);
    persistAll();
    toast('Demo-data fjernet');
    switchView('dashboard');
  });
}
document.getElementById('loadDemoBtn').addEventListener('click', generateDemoData);
document.getElementById('clearDemoBtn').addEventListener('click', clearDemoData);
document.getElementById('exportBtn').addEventListener('click', exportAllData);
document.getElementById('importBtn').addEventListener('click', ()=> document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', e=>{
  if(e.target.files[0]) importBackupFile(e.target.files[0]);
});
document.getElementById('forceUpdateBtn').addEventListener('click', async ()=>{
  try{
    if('serviceWorker' in navigator){
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
    }
    if('caches' in window){
      const keys = await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    }
    toast('Oppdaterer …');
    setTimeout(()=> window.location.reload(true), 400);
  }catch(err){
    toast('Fikk ikke tvunget oppdatering — prøv å lukke og åpne appen på nytt');
  }
});

/* Show version in sidebar too */
document.getElementById('version-label-side').textContent = 'v'+APP_VERSION;

/* Register service worker for offline/PWA support.
   Data lives in localStorage, completely separate from the SW cache,
   so app updates never touch spillere/økter/vurderinger/tester. */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}

/* ===================== INIT ===================== */
switchView('dashboard');
