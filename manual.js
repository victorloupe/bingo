// ====== Bingo 75 – Modo Manual (sempre mostrar todas as pedras) ======

// ====== Util ======
const LETTERS = ['B','I','N','G','O'];
const ranges = { B:[1,15], I:[16,30], N:[31,45], G:[46,60], O:[61,75] };
const all = Array.from({length:75}, (_,i)=>i+1);
const letterFor = (n)=> n<=15? 'B' : n<=30? 'I' : n<=45? 'N' : n<=60? 'G' : 'O';
function esc(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ====== Estado (compartilhado com modo automático em 'bingo.state') ======
let drawn = [];
let last = null;
let muted = false;
let selectedVoiceName = null;
let rate = 0.95, pitch = 1.0;
let gameOver = false;
let firstTs = null;
let lastTs = null;

// ====== UI ======
const elStatDrawn = document.getElementById('stat-drawn');
const elStatLeft = document.getElementById('stat-left');
const elStatVoice = document.getElementById('stat-voice');
const elProgress = document.getElementById('progress');
const elLast = document.getElementById('last');
const elGrid = document.getElementById('grid');
const elHist = document.getElementById('history');
const elStatus = document.getElementById('chip-status');

const btnUndo = document.getElementById('btn-undo');
const btnReset = document.getElementById('btn-reset');
const btnVoice = document.getElementById('btn-voice');
const btnFull = document.getElementById('btn-full');
const btnTheme = document.getElementById('btn-theme');

const selVoice = document.getElementById('sel-voice');
const sliderRate = document.getElementById('slider-rate');
const sliderPitch = document.getElementById('slider-pitch');
const rateVal = document.getElementById('rate-val');
const pitchVal = document.getElementById('pitch-val');

// Ranking
const rankingBody = document.getElementById('ranking-body');
const btnExportPDF = document.getElementById('btn-export-pdf');

// ====== Persistência ======
const LS = {
  save(){
    const data = {
      drawn, last, muted, selectedVoiceName, rate, pitch, gameOver,
      theme: document.body.classList.contains('light') ? 'light':'dark',
      firstTs, lastTs
    };
    localStorage.setItem('bingo.state', JSON.stringify(data));
    window.BingoSync?.pushState(data);
  },
  load(){
    try{
      const data = JSON.parse(localStorage.getItem('bingo.state')||'{}');
      if(Array.isArray(data.drawn)) drawn = data.drawn;
      if(typeof data.last!=='undefined') last = data.last;
      if(typeof data.muted==='boolean') muted = data.muted;
      if(typeof data.selectedVoiceName==='string') selectedVoiceName = data.selectedVoiceName;
      if(typeof data.rate==='number') rate = data.rate;
      if(typeof data.pitch==='number') pitch = data.pitch;
      if(typeof data.gameOver==='boolean') gameOver = data.gameOver;
      if(data.theme){
        document.body.classList.toggle('light', data.theme==='light');
        document.body.classList.toggle('dark', data.theme!=='light');
      }
      if(typeof data.firstTs!=='undefined') firstTs = data.firstTs;
      if(typeof data.lastTs!=='undefined') lastTs = data.lastTs;
    }catch(e){}
  },
  saveRanking(list){
    localStorage.setItem('bingo.ranking', JSON.stringify(list||[]));
    window.BingoSync?.pushRanking(list||[]);
  },
  loadRanking(){
    try{ return JSON.parse(localStorage.getItem('bingo.ranking')||'[]'); }catch(e){ return []; }
  }
};

// ====== Voz ======
function scoreVoice(v){
  let s = 0;
  if(/pt-BR/i.test(v.lang)) s += 200;
  if(/Google/i.test(v.name)) s += 120;
  if(/(Natural|Neural)/i.test(v.name)) s += 60;
  if(/(Microsoft|Samsung|Amazon)/i.test(v.name)) s += 30;
  return s;
}
function loadVoices(){
  if(!selVoice) return;
  const voices = speechSynthesis.getVoices();
  selVoice.innerHTML = '';
  const sorted = voices.slice().sort((a,b)=> scoreVoice(b)-scoreVoice(a));
  for(const v of sorted){
    const opt = document.createElement('option');
    opt.value = v.name; opt.textContent = `${v.name} – ${v.lang}`;
    selVoice.appendChild(opt);
  }
  const preferred = sorted.find(v=>/Google/i.test(v.name) && /pt-BR/i.test(v.lang))
                   || sorted.find(v=>/pt-BR/i.test(v.lang))
                   || sorted[0];
  if(preferred){
    selectedVoiceName = selectedVoiceName || preferred.name;
    selVoice.value = selectedVoiceName;
    if(elStatVoice) elStatVoice.textContent = muted? 'mutada':'ativa';
  }
}
function sayLetter(L){ return L==='O' ? 'Ó' : L; }
function speakLongShort(L, n){
  if(muted) return;
  const voices = speechSynthesis.getVoices();
  const chosen = voices.find(v=> v.name === selectedVoiceName) || voices.find(v=>/pt-BR/i.test(v.lang)) || voices[0];
  const mk = (text)=>{ const u = new SpeechSynthesisUtterance(text); if(chosen){ u.voice=chosen; u.lang=chosen.lang; } u.rate=rate; u.pitch=pitch; return u; };
  const u1 = mk(`Letra ${sayLetter(L)}, número ${n}`);
  const u2 = mk(`${sayLetter(L)} ${n}`);
  try{ speechSynthesis.cancel(); }catch(e){}
  u1.onend = ()=> speechSynthesis.speak(u2);
  speechSynthesis.speak(u1);
}
window.speechSynthesis.onvoiceschanged = loadVoices;
setTimeout(loadVoices, 200);

// ====== Lógica ======
function selectNumber(n){
  if(gameOver) return;
  if(drawn.includes(n)) return; // já marcado
  drawn.push(n);
  last = n;
  const now = Date.now();
  if(!firstTs) firstTs = now;
  lastTs = now;
  const L = letterFor(n);
  speakLongShort(L, n);
  try{ ding(920, 0.08); }catch(e){}
  updateUI();
}
function undo(){
  if(drawn.length===0) return;
  drawn.pop();
  last = drawn.at(-1) ?? null;
  if(drawn.length===0){ firstTs = null; lastTs = null; }
  else { lastTs = Date.now(); }
  updateUI();
}
function resetAll(){
  drawn = []; last = null;
  gameOver = false;
  firstTs = null; lastTs = null;
  updateUI();
  try{ speechSynthesis.cancel(); }catch(e){}
}

// ====== Render ======
function lastInRange(arr, a, b){
  for(let i=arr.length-1;i>=0;i--){
    const n = arr[i];
    if(n>=a && n<=b) return n;
  }
  return null;
}
function renderColumns(){
  if(!elGrid) return;
  elGrid.innerHTML = '';
  const drawnSet = new Set(drawn);

  for(const L of LETTERS){
    const [a,b] = ranges[L];
    const numsAll = Array.from({length: b-a+1}, (_,i)=>a+i);

    const col = document.createElement('div');
    col.className = `col`;

    const header = document.createElement('header');
    const lastCol = lastInRange(drawn, a, b);
    const badge = lastCol? `<span class="last-badge ${lastCol===last? 'global':''}">${lastCol}</span>` : '';
    const sortedCount = numsAll.filter(n=> drawnSet.has(n)).length;
    header.innerHTML = `<span class="letter">${L}</span>${badge}<span class="sub"> ${sortedCount} sorteadas</span>`;

    const body = document.createElement('div');
    body.className = 'body';

    // SEM separação: sempre mostra TODAS as pedras desse intervalo
    numsAll.forEach(n=>{
      const isDrawn = drawnSet.has(n);
      const cell = document.createElement('div');
      cell.className = 'cell tabnum' + (isDrawn? ' drawn' : '') + (n===last? ' last' : '');
      cell.textContent = n;
      cell.setAttribute('role','button');
      cell.setAttribute('tabindex','0');
      cell.setAttribute('aria-label', `${L} ${n}${isDrawn? ' sorteado':''}`);

      if(!isDrawn){
        cell.addEventListener('click', ()=> selectNumber(n));
        cell.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') selectNumber(n); });
        cell.title = `Selecionar ${L} ${n}`;
      }else{
        cell.title = `${L} ${n} já sorteado`;
      }
      body.appendChild(cell);
    });

    col.appendChild(header); col.appendChild(body);
    elGrid.appendChild(col);
  }
}
function renderHistory(){
  if(!elHist) return;
  elHist.innerHTML = '';
  for(const n of drawn){
    const L = letterFor(n);
    const span = document.createElement('span');
    span.className = 'hchip tabnum' + (n===last ? ' last' : '');
    span.textContent = `${L} ${n}`;
    elHist.appendChild(span);
  }
  elHist.scrollTop = elHist.scrollHeight;
}
function renderRanking(){
  if(!rankingBody) return;
  const list = LS.loadRanking();
  rankingBody.innerHTML = '';
  list.forEach((r, idx)=>{
    const tr = document.createElement('tr');
    const when = new Date(r.ts||Date.now());
    const whenStr = when.toLocaleString();
    tr.innerHTML = `
      <td class="tabnum">${String(idx+1).padStart(2,'0')}</td>
      <td>${esc(r.name)}</td>
      <td><span class="badge-type">${esc(r.type)}</span></td>
      <td>${esc(whenStr)}</td>
      <td>
        <button class="btn btn-sm btn-outline-secondary" data-action="edit" data-idx="${idx}">Editar</button>
        <button class="btn btn-sm btn-outline-danger" data-action="del" data-idx="${idx}">Excluir</button>
      </td>`;
    rankingBody.appendChild(tr);
  });
}

// ====== UI ======
function updateThemeButton(){
  if(!btnTheme) return;
  const isLight = document.body.classList.contains('light');
  btnTheme.textContent = isLight ? '🌞 Claro' : '🌙 Escuro';
}
function updateUI(){
  elStatDrawn && (elStatDrawn.textContent = `${drawn.length}/75`);
  elStatLeft && (elStatLeft.textContent = `${75 - drawn.length}`);
  elProgress && (elProgress.value = drawn.length);

  if(elLast){
    if(last!=null){
      elLast.style.display = '';
      document.getElementById('last-letter').textContent = letterFor(last);
      document.getElementById('last-number').textContent = last;
    }else{
      elLast.style.display = 'none';
    }
  }

  btnUndo && (btnUndo.disabled = drawn.length===0);

  renderColumns();
  try{
    const cells = elGrid?.querySelectorAll?.('.cell') || [];
    cells.forEach((el,i)=> el.style.setProperty('--d', (Math.min(i*14,700))+'ms'));
  }catch(e){}
  renderHistory();
  renderRanking();
  updateDynamicFont?.();
  elStatus && (elStatus.textContent = gameOver? '🏁 Encerrado':'⏳ Em andamento');
  updateThemeButton();
  LS.save();
}

// ====== Eventos ======
btnUndo?.addEventListener('click', undo);
btnReset?.addEventListener('click', ()=>{ if(confirm('Reiniciar sorteio manual? Isso não apaga o ranking.')) resetAll(); });

btnVoice?.addEventListener('click', ()=>{
  muted = !muted;
  elStatVoice && (elStatVoice.textContent = muted? 'mutada' : 'ativa');
  btnVoice.textContent = muted? '🔇 Voz off' : '🔊 Voz on';
  if(muted) try{ speechSynthesis.cancel(); }catch(e){}
});

function toggleFull(){ const el = document.documentElement; if(!document.fullscreenElement){ el.requestFullscreen?.(); } else { document.exitFullscreen?.(); } }
btnFull?.addEventListener('click', toggleFull);

document.addEventListener('keydown', (e)=>{
  if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;
  if(e.key==='u' || e.key==='U'){ undo(); }
  if(e.key==='r' || e.key==='R'){ resetAll(); }
  if(e.key==='m' || e.key==='M'){ btnVoice?.click(); }
  if(e.key==='f' || e.key==='F'){ toggleFull(); }
  if(e.key==='t' || e.key==='T'){ btnTheme?.click(); }
});

if(selVoice){
  selVoice.addEventListener('change', (e)=>{ selectedVoiceName = e.target.value; LS.save(); });
  sliderRate?.addEventListener('input', (e)=>{ rate = Number(e.target.value); rateVal.textContent = rate.toFixed(2)+'×'; LS.save(); });
  sliderPitch?.addEventListener('input', (e)=>{ pitch = Number(e.target.value); pitchVal.textContent = pitch.toFixed(2)+'×'; LS.save(); });
  document.getElementById('btn-test')?.addEventListener('click', ()=>{
    const u = new SpeechSynthesisUtterance('Teste de voz: Letra Ó, número setenta e cinco.');
    const voices = speechSynthesis.getVoices();
    const chosen = voices.find(v=> v.name === selectedVoiceName) || voices.find(v=>/pt-BR/i.test(v.lang)) || voices[0];
    if(chosen){ u.voice = chosen; u.lang = chosen.lang; }
    try{ speechSynthesis.cancel(); }catch(e){}
    speechSynthesis.speak(u);
  });
}

// Theme toggle
btnTheme?.addEventListener('click', ()=>{
  const toLight = !document.body.classList.contains('light');
  document.body.classList.toggle('light', toLight);
  document.body.classList.toggle('dark', !toLight);
  updateThemeButton();
  LS.save();
});

// Export PDF
btnExportPDF?.addEventListener('click', async ()=>{
  if(typeof window.exportBingoPDF === 'function'){
    const list = LS.loadRanking();
    await window.exportBingoPDF({ drawn, ranking: list, last, firstTs, lastTs });
  } else {
    alert('Biblioteca de PDF ainda não carregou. Tente novamente em 1 segundo.');
  }
});

// CSV Export/Import (compartilhado)
function exportCSV(){
  const rows = LS.loadRanking();
  const header = ['pos','jogador','conquista','quando'];
  const lines = [header.join(';')];
  rows.forEach((r,i)=>{
    const when = new Date(r.ts||Date.now()).toLocaleString();
    const safe = [String(i+1), r.name||'', r.type||'', when].map(s=>(''+s).replace(/;/g,','));
    lines.push(safe.join(';'));
  });
  const blob = new Blob([lines.join('\n')], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='ranking_bingo.csv'; a.click();
  URL.revokeObjectURL(url);
}
function importCSVText(text){
  const lines = text.split(/\r?\n/).filter(Boolean);
  const out = [];
  for(let i=1;i<lines.length;i++){
    const cols = lines[i].split(';');
    const name = (cols[1]||'').trim();
    const type = (cols[2]||'').trim();
    const ts = new Date(cols[3]||Date.now()).toISOString();
    if(name && type) out.push({name, type, ts});
  }
  const cur = LS.loadRanking();
  LS.saveRanking(cur.concat(out));
  renderRanking();
}
document.getElementById('btn-export-csv')?.addEventListener('click', exportCSV);
document.getElementById('btn-import-csv')?.addEventListener('click', ()=> document.getElementById('input-import-csv')?.click());
document.getElementById('input-import-csv')?.addEventListener('change', async (e)=>{
  const f = e.target.files?.[0]; if(!f) return;
  const text = await f.text();
  importCSVText(text);
  e.target.value = '';
});

// Ding audio
let dingCtx, dingGain;
function ensureDingCtx(){
  if(dingCtx) return;
  dingCtx = new (window.AudioContext||window.webkitAudioContext)();
  dingGain = dingCtx.createGain();
  const v = parseFloat(localStorage.getItem('bingo.dingvol')||'0.6');
  dingGain.gain.value = isNaN(v)?0.6:v;
  dingGain.connect(dingCtx.destination);
}
function ding(freq=880, dur=0.08){
  ensureDingCtx();
  const o = dingCtx.createOscillator();
  const g = dingCtx.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.value = 0.001;
  o.connect(g); g.connect(dingGain);
  const t = dingCtx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.02);
}

// Ranking actions delegation
rankingBody?.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-action]');
  if(!btn) return;
  const idx = parseInt(btn.dataset.idx, 10);
  const list = LS.loadRanking();
  if(isNaN(idx) || !list[idx]) return;

  if(btn.dataset.action==='del'){
    if(confirm('Excluir registro?')){
      list.splice(idx,1);
      LS.saveRanking(list);
      renderRanking();
    }
  } else if(btn.dataset.action==='edit'){
    const name = prompt('Nome do jogador:', list[idx].name||'') ?? list[idx].name;
    const type = prompt('Conquista (Terno, Quatro Cantos, Cinquina, Cartela Cheia):', list[idx].type||'') ?? list[idx].type;
    if(name && type){
      list[idx].name = name.trim();
      list[idx].type = type.trim();
      LS.saveRanking(list);
      renderRanking();
    }
  }
});

// ====== Shortcuts help ======
(function helpModalBinding(){
  function isTypingTarget(el){
    if(!el) return false;
    const tag = el.tagName;
    return ['INPUT','SELECT','TEXTAREA'].includes(tag) || el.isContentEditable;
  }
  function getModal(){ return document.getElementById('shortcuts'); }
  function closeHelp(){
    const m = getModal();
    if(m) m.setAttribute('hidden','');
  }
  function openHelp(){
    const m = getModal();
    if(m) m.removeAttribute('hidden');
  }
  function toggleHelp(){
    const m = getModal();
    if(!m) return;
    if(m.hasAttribute('hidden')) m.removeAttribute('hidden'); else m.setAttribute('hidden','');
  }
  function bindShortcutsUI(){
    const m = getModal();
    if(!m || m.dataset.bound) return;
    m.addEventListener('click', (ev)=>{ if(ev.target === m) closeHelp(); });
    const ok = document.getElementById('btn-close-shortcuts');
    if(ok && !ok.dataset.bound){ ok.addEventListener('click', closeHelp); ok.dataset.bound = '1'; }
    const helpBtn = document.getElementById('btn-help');
    if(helpBtn && !helpBtn.dataset.bound){ helpBtn.addEventListener('click', openHelp); helpBtn.dataset.bound = '1'; }
    m.dataset.bound = '1';
  }
  document.addEventListener('keydown', (e)=>{
    if(isTypingTarget(e.target)) return;
    const isHelp = (e.key === '?') || (e.shiftKey && (e.key === '/' || e.code === 'Slash'));
    if(isHelp){ e.preventDefault(); toggleHelp(); }
    else if(e.key === 'Escape'){ closeHelp(); }
  });
  bindShortcutsUI();
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bindShortcutsUI);
  } else {
    setTimeout(bindShortcutsUI, 0);
  }
  window.__bingoHelp = { openHelp, closeHelp, toggleHelp };
})();

// ====== Ajuste dinâmico de fonte ======
function updateDynamicFont(){
  const sample = document.querySelector('.cell');
  let fs = 18;
  if(sample){
    const w = sample.clientWidth || 60;
    fs = Math.max(12, Math.min(18, Math.floor(w * 0.26)));
  }
  document.documentElement.style.setProperty('--cell-font', Math.max(12, Math.min(18, fs)) + 'px');

  const lastBox = document.querySelector('.tv-last .last');
  if(lastBox){
    const lw = lastBox.clientWidth || 420;
    const lfs = Math.max(36, Math.min(60, Math.floor(lw * 0.12)));
    lastBox.style.setProperty('--last-font', lfs + 'px');
  }
}
window.addEventListener('resize', updateDynamicFont, {passive:true});

// ====== Sincronização entre abas/telas ======
window.addEventListener('storage', (e)=>{
  if(e.key==='bingo.ranking' || e.key==='bingo.state'){
    try{ LS.load(); }catch(err){}
    updateUI();
  }
});

// ====== Sincronização com Supabase (opcional, ver sync.js) ======
async function initCloudSync(){
  if(!window.BingoSync) return;
  BingoSync.init();
  if(!BingoSync.ready()) return;

  const [remoteState, remoteRanking] = await Promise.all([BingoSync.pullState(), BingoSync.pullRanking()]);

  if(remoteState){
    const localState = { drawn, last, gameOver, firstTs, lastTs, theme: document.body.classList.contains('light')?'light':'dark' };
    const merged = BingoSync.mergeState(localState, remoteState);
    drawn = merged.drawn; last = merged.last; gameOver = merged.gameOver;
    firstTs = merged.firstTs; lastTs = merged.lastTs;
    if(merged.theme){ document.body.classList.toggle('light', merged.theme==='light'); document.body.classList.toggle('dark', merged.theme!=='light'); }
  }
  if(remoteRanking){
    const mergedRanking = BingoSync.mergeRanking(LS.loadRanking(), remoteRanking);
    LS.saveRanking(mergedRanking);
  }

  updateUI();

  BingoSync.subscribe(async ()=>{
    const rs = await BingoSync.pullState();
    if(rs && rs.drawn.length >= drawn.length){
      drawn = rs.drawn; last = rs.last; gameOver = rs.gameOver; firstTs = rs.firstTs; lastTs = rs.lastTs;
    }
    const rr = await BingoSync.pullRanking();
    if(rr) LS.saveRanking(BingoSync.mergeRanking(LS.loadRanking(), rr));
    updateUI();
  });
}

// ====== Start ======
LS.load();
updateUI();
initCloudSync();
