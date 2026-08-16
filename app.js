// ====== Util ======
const LETTERS = ['B','I','N','G','O'];
const ranges = { B:[1,15], I:[16,30], N:[31,45], G:[46,60], O:[61,75] };
const all = Array.from({length:75}, (_,i)=>i+1);
const letterFor = (n)=> n<=15? 'B' : n<=30? 'I' : n<=45? 'N' : n<=60? 'G' : 'O';
function esc(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ====== Estado ======
let drawn = [];
let last = null;
let muted = false;
let intervalMs = 6000;
let autoTimer = null;
let showOnlyDrawn = true;
let selectedVoiceName = null;
let rate = 0.95, pitch = 1.0;
let gameOver = false;
let firstTs = null;
let lastTs = null;


function isAutoOn(){ return !!autoTimer; }
function updateAutoButton(){
  if(!btnAutoToggle) return;
  btnAutoToggle.textContent = isAutoOn() ? '⏸️ Pausar Auto' : '▶️ Iniciar Auto';
  btnAutoToggle.title = isAutoOn() ? 'Pausar sorteio automático' : 'Iniciar sorteio automático';
}

// ====== UI ======

const elStatDrawn = document.getElementById('stat-drawn');
const elStatLeft = document.getElementById('stat-left');
const elStatVoice = document.getElementById('stat-voice');
const elProgress = document.getElementById('progress');
const elLast = document.getElementById('last');
const elGrid = document.getElementById('grid');
const elHist = document.getElementById('history');
const elStatus = document.getElementById('chip-status');

const btnDraw = document.getElementById('btn-draw');
const btnUndo = document.getElementById('btn-undo');
const btnReset = document.getElementById('btn-reset');
const btnVoice = document.getElementById('btn-voice');
const btnFull = document.getElementById('btn-full');
const btnTheme = document.getElementById('btn-theme');
const btnAutoToggle = document.getElementById('btn-auto');

const chkAuto = document.getElementById('chk-auto');
const selInterval = document.getElementById('sel-interval');
const chkOnlyDrawn = document.getElementById('chk-only-drawn');

const selVoice = document.getElementById('sel-voice');
const sliderRate = document.getElementById('slider-rate');
const sliderPitch = document.getElementById('slider-pitch');
const rateVal = document.getElementById('rate-val');
const pitchVal = document.getElementById('pitch-val');

// Ranking
const rankingBody = document.getElementById('ranking-body');
const btnExportPDF = document.getElementById('btn-export-pdf');
const btnClearRanking = document.getElementById('btn-clear-ranking');

// ====== Persistência ======
const LS = {
  save(){
    const data = { drawn, last, muted, intervalMs, showOnlyDrawn, selectedVoiceName, rate, pitch, gameOver, theme: document.body.classList.contains('light') ? 'light':'dark', firstTs, lastTs };
    localStorage.setItem('bingo.state', JSON.stringify(data));
    window.BingoSync?.pushState(data);
  },
  load(){
    try{
      const data = JSON.parse(localStorage.getItem('bingo.state')||'{}');
      if(Array.isArray(data.drawn)) drawn = data.drawn;
      if(typeof data.last!=='undefined') last = data.last;
      if(typeof data.muted==='boolean') muted = data.muted;
      if(typeof data.intervalMs==='number') intervalMs = data.intervalMs;
      if(typeof data.showOnlyDrawn==='boolean') showOnlyDrawn = data.showOnlyDrawn;
      if(typeof data.selectedVoiceName==='string') selectedVoiceName = data.selectedVoiceName;
      if(typeof data.rate==='number') rate = data.rate;
      if(typeof data.pitch==='number') pitch = data.pitch;
      if(typeof data.gameOver==='boolean') gameOver = data.gameOver;
      if(data.theme){ document.body.classList.toggle('light', data.theme==='light'); document.body.classList.toggle('dark', data.theme!=='light'); }
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
const remaining = ()=> all.filter(n=> !drawn.includes(n));

function drawOne(){
  if(gameOver) return;
  const left = remaining();
  if(left.length===0){ stopAuto(); return; }
  const n = left[Math.floor(Math.random()*left.length)];
  drawn.push(n);
  last = n;
  const now = Date.now();
  if(!firstTs) firstTs = now;
  lastTs = now;
  if (selInterval && chkAuto) {
  selInterval.disabled = !chkAuto.checked;
}
updateUI();
  const L = letterFor(n);
  speakLongShort(L, n);
  try{ ding(920, 0.08); }catch(e){}
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
  drawn = []; last = null; stopAuto();
  gameOver = false;
  firstTs = null; lastTs = null;
  updateUI();
  try{ speechSynthesis.cancel(); }catch(e){}
}

function startAuto(){
  stopAuto();
  autoTimer = setInterval(drawOne, Math.max(1500, intervalMs));
}
function stopAuto(){
  if(autoTimer){ clearInterval(autoTimer); autoTimer = null; }
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
  for(const L of LETTERS){
    const [a,b] = ranges[L];
    const numsAll = Array.from({length: b-a+1}, (_,i)=>a+i);

    const drawnSet = new Set(drawn);
    const drawnNums = numsAll.filter(n=> drawnSet.has(n));
    const leftNums  = numsAll.filter(n=> !drawnSet.has(n));

    const col = document.createElement('div');
    col.className = `col`;
    const header = document.createElement('header');
    const totalShown = (showOnlyDrawn ? drawnNums.length : numsAll.length);
    const lastCol = lastInRange(drawn, a, b);
    const badge = lastCol? `<span class=\"last-badge ${lastCol===last? 'global':''}\">${lastCol}</span>` : '';
    header.innerHTML = `<span class=\"letter\">${L}</span>${badge}<span class=\"sub\"> ${showOnlyDrawn ? drawnNums.length+' sorteadas' : totalShown+' itens'}</span>`;
    const body = document.createElement('div');
    body.className = 'body';

    if(showOnlyDrawn){
      if(drawnNums.length===0){
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = '—';
        body.appendChild(empty);
      } else {
        for(const n of drawnNums){
          const cell = document.createElement('div');
          cell.className = 'cell tabnum drawn' + (n===last? ' last' : '');
          cell.textContent = n;
          cell.setAttribute('aria-label', `${L} ${n} sorteado`);
          body.appendChild(cell);
        }
      }
    } else {
      if(drawnNums.length){
        const sep1 = document.createElement('div');
        sep1.className = 'sep';
        sep1.innerHTML = '<div class="line"></div><div class="label">Sorteadas</div><div class="line"></div>';
        body.appendChild(sep1);
        for(const n of drawnNums){
          const cell = document.createElement('div');
          cell.className = 'cell tabnum drawn' + (n===last? ' last' : '');
          cell.textContent = n;
          cell.setAttribute('aria-label', `${L} ${n} sorteado`);
          body.appendChild(cell);
        }
      }
      if(leftNums.length){
        const sep2 = document.createElement('div');
        sep2.className = 'sep';
        sep2.innerHTML = '<div class="line"></div><div class="label">Restantes</div><div class="line"></div>';
        body.appendChild(sep2);
        for(const n of leftNums){
          const cell = document.createElement('div');
          cell.className = 'cell tabnum' + (n===last? ' last' : '');
          cell.textContent = n;
          cell.setAttribute('aria-label', `${L} ${n}`);
          body.appendChild(cell);
        }
      }
    }

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

// Ranking
function renderRanking(){
  if(!rankingBody) return;
  const list = LS.loadRanking();
  rankingBody.innerHTML = '';
  list.forEach((r, idx)=>{
    const tr = document.createElement('tr');
    const when = new Date(r.ts||Date.now());
    const whenStr = when.toLocaleString();
    tr.innerHTML = `\n      <td class="tabnum">${String(idx+1).padStart(2,'0')}</td>\n      <td>${esc(r.name)}</td>\n      <td><span class="badge-type">${esc(r.type)}</span></td>\n      <td>${esc(whenStr)}</td>\n      <td><button class="btn btn-sm btn-outline-secondary" data-action="edit" data-idx="${idx}">Editar</button> <button class="btn btn-sm btn-outline-danger" data-action="del" data-idx="${idx}">Excluir</button></td>\n    `;
    rankingBody.appendChild(tr);
  });
  // habilita/desabilita o botão de limpar
  if(btnClearRanking){
    btnClearRanking.disabled = list.length === 0;
    btnClearRanking.title = list.length ? "Limpar apenas o ranking" : "Sem registros para limpar";
  }
}


// ====== UI ======

function updateThemeButton(){
  if(!btnTheme) return;
  const isLight = document.body.classList.contains('light');
  btnTheme.textContent = isLight ? '🌞 Claro' : '🌙 Escuro';
}
function updateUI(){
  if(elStatDrawn) elStatDrawn.textContent = `${drawn.length}/75`;
  if(elStatLeft) elStatLeft.textContent = `${75 - drawn.length}`;
  if(elProgress) elProgress.value = drawn.length;

  if(elLast){
    if(last!=null){
      elLast.style.display = '';
      document.getElementById('last-letter').textContent = letterFor(last);
      document.getElementById('last-number').textContent = last;
    }else{
      elLast.style.display = 'none';
    }
  }

  if(btnUndo) btnUndo.disabled = drawn.length===0;
  if(btnDraw) btnDraw.disabled = remaining().length===0 || gameOver;

  renderColumns();
  try{
    const cells = elGrid?.querySelectorAll?.('.cell') || [];
    cells.forEach((el,i)=> el.style.setProperty('--d', (Math.min(i*14,700))+'ms'));
  }catch(e){}
  renderHistory();
  renderRanking();
  updateDynamicFont();
  if(elStatus){
    elStatus.textContent = gameOver? '🏁 Encerrado':'⏳ Em andamento';
  }
  updateThemeButton();
  LS.save();
}

// ====== Eventos ======
btnDraw?.addEventListener('click', drawOne);
btnUndo?.addEventListener('click', undo);
btnReset?.addEventListener('click', ()=>{
  if(confirm('Reiniciar sorteio? Isso não apaga o ranking.')) resetAll();
});

btnVoice?.addEventListener('click', ()=>{
  muted = !muted;
  elStatVoice && (elStatVoice.textContent = muted? 'mutada' : 'ativa');
  btnVoice.textContent = muted? '🔇 Voz off' : '🔊 Voz on';
  if(muted) try{ speechSynthesis.cancel(); }catch(e){}
});

function toggleFull(){ const el = document.documentElement; if(!document.fullscreenElement){ el.requestFullscreen?.(); } else { document.exitFullscreen?.(); } }
btnFull?.addEventListener('click', toggleFull);
btnAutoToggle?.addEventListener('click', ()=>{
  if(isAutoOn()){
    chkAuto && (chkAuto.checked = false);
    stopAuto();
  }else{
    chkAuto && (chkAuto.checked = true);
    startAuto();
  }
  selInterval && (selInterval.disabled = !isAutoOn());
  updateAutoButton();
});
document.addEventListener('keydown', (e)=>{
  if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;
  if(e.code==='Space'){ e.preventDefault(); drawOne(); }
  if(e.key==='u' || e.key==='U'){ undo(); }
  if(e.key==='r' || e.key==='R'){ resetAll(); }
  if(e.key==='m' || e.key==='M'){ btnVoice?.click(); }
  if(e.key==='a' || e.key==='A'){ document.getElementById('btn-auto')?.click(); }
  if(e.key==='f' || e.key==='F'){ toggleFull(); }
  if(e.key==='t' || e.key==='T'){ btnTheme?.click(); }
});

chkAuto?.addEventListener('change', (e)=>{
  if(e.target.checked){ startAuto(); selInterval && (selInterval.disabled=false); } else { stopAuto(); selInterval && (selInterval.disabled=true); }
});
selInterval?.addEventListener('change', (e)=>{ intervalMs = Number(e.target.value); if(chkAuto?.checked){ startAuto(); } updateUI(); });
chkOnlyDrawn?.addEventListener('change', (e)=>{ showOnlyDrawn = e.target.checked; renderColumns(); updateDynamicFont(); updateUI(); });

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


// Clear ranking (FIX + snackbar undo)
let lastClearedRanking = [];
let undoTimer = null;


function openSnack(){

  const elSnack = document.getElementById('snackbar');
  const btnUndoClear = document.getElementById('btn-undo-clear');
  if(!elSnack) return;
  elSnack.classList.add('show');

if(btnUndoClear && !btnUndoClear.dataset.bound){

    btnUndoClear.addEventListener('click', ()=>{
      if(!lastClearedRanking.length){ elSnack.classList.remove('show'); return; }
      LS.saveRanking(lastClearedRanking);
      renderRanking();
      lastClearedRanking = [];
      elSnack.classList.remove('show');
      if(undoTimer) clearTimeout(undoTimer);
    });

  btnUndoClear.dataset.bound = "1";
}
const btnSnackOk = document.getElementById('btn-snack-ok');
if(btnSnackOk && !btnSnackOk.dataset.bound){
  btnSnackOk.addEventListener('click', ()=>{
    const elSnack2 = document.getElementById('snackbar');
    if(elSnack2){ elSnack2.classList.remove('show'); }
    // finalize: drop undo buffer immediately
    lastClearedRanking = [];
    if(undoTimer) clearTimeout(undoTimer);
  });
  btnSnackOk.dataset.bound = "1";
}

  if(undoTimer) clearTimeout(undoTimer);
  undoTimer = setTimeout(()=>{
    elSnack.classList.remove('show');
    lastClearedRanking = [];
  }, 10000);
}

btnClearRanking?.addEventListener('click', ()=>{
  const list = LS.loadRanking();
  if(!list.length){ return; }
  if(confirm('Tem certeza que deseja limpar o ranking? Isso NÃO afeta o sorteio em andamento.')){
    lastClearedRanking = list.slice();
    LS.saveRanking([]);
    renderRanking();
    openSnack();
  }
});


// Ding audio (draw sound)
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


// CSV Export/Import
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


// Hook buttons for CSV
document.getElementById('btn-export-csv')?.addEventListener('click', exportCSV);
document.getElementById('btn-import-csv')?.addEventListener('click', ()=> document.getElementById('input-import-csv')?.click());
document.getElementById('input-import-csv')?.addEventListener('change', async (e)=>{
  const f = e.target.files?.[0]; if(!f) return;
  const text = await f.text();
  importCSVText(text);
  e.target.value = '';
});


// Projector toggle
document.getElementById('btn-projector')?.addEventListener('click', ()=>{
  const on = !document.body.classList.contains('projector');
  document.body.classList.toggle('projector', on);
  localStorage.setItem('bingo.projector', on? '1':'0');
});


// Restore projector preference & bind help
window.addEventListener('load', ()=>{
  const pref = localStorage.getItem('bingo.projector')==='1';
  document.body.classList.toggle('projector', pref);
});
document.getElementById('btn-help')?.addEventListener('click', ()=>{
  document.getElementById('shortcuts')?.removeAttribute('hidden');
});
document.getElementById('btn-close-shortcuts')?.addEventListener('click', ()=>{
  document.getElementById('shortcuts')?.setAttribute('hidden','');
});


// Toggle help with '?'
document.addEventListener('keydown', (e)=>{
  if(e.shiftKey && e.key === '?'){
    const m = document.getElementById('shortcuts');
    if(!m) return;
    if(m.hasAttribute('hidden')) m.removeAttribute('hidden'); else m.setAttribute('hidden','');
  }
});


// Ding volume slider
(function(){
  const slider = document.getElementById('vol-ding');
  if(!slider) return;
  const saved = parseFloat(localStorage.getItem('bingo.dingvol')||'0.6');
  slider.value = isNaN(saved)?0.6:saved;
  slider.addEventListener('input', (e)=>{
    const v = parseFloat(e.target.value);
    localStorage.setItem('bingo.dingvol', String(v));
    if(dingGain) dingGain.gain.value = v;
  });
})();


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


// ====== Shortcut confirmation pop ======
(function(){
  const el = document.getElementById('shortcut-confirm');
  const txt = document.getElementById('confirm-text');
  const btnOk = document.getElementById('confirm-ok');
  const btnCancel = document.getElementById('confirm-cancel');
  let _cb = null;

  function openConfirm(message, cb){
    if(!el) return cb && cb(); // fallback: proceed without confirm
    txt && (txt.textContent = message || 'Confirmar ação?');
    _cb = cb || null;
    el.removeAttribute('hidden');
    btnOk?.focus();
  }
  function closeConfirm(){
    el?.setAttribute('hidden','');
    _cb = null;
  }
  btnOk?.addEventListener('click', ()=>{ try{ _cb && _cb(); }finally{ closeConfirm(); } });
  btnCancel?.addEventListener('click', closeConfirm);
  el?.addEventListener('click', (e)=>{ if(e.target===el) closeConfirm(); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && !el?.hasAttribute('hidden')) closeConfirm(); });

  // Intercept keyboard shortcuts to confirm (except Backspace for draw)
  document.addEventListener('keydown', (e)=>{
    if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;

    // Backspace -> draw immediately (no confirm)
    if(e.key === 'Backspace'){
      e.preventDefault();
      drawOne();
      return;
    }

    // Map of shortcuts requiring confirmation

const map = {
  ' ': {label:'Sortear pedra (Espaço)', msg:'Sortear uma pedra agora?', action: ()=> drawOne()},
  'A': {label:'Iniciar/pausar automático (A)', msg:'Ativar / pausar o sorteio automático?', action: ()=> document.getElementById('btn-auto')?.click()},
  'a': {label:'Iniciar/pausar automático (A)', msg:'Ativar / pausar o sorteio automático?', action: ()=> document.getElementById('btn-auto')?.click()},
  'U': {label:'Desfazer (U)', msg:'Desfazer a última pedra?', action: ()=> undo()},
  'u': {label:'Desfazer (U)', msg:'Desfazer a última pedra?', action: ()=> undo()},
  'R': {label:'Reiniciar sorteio (R)', msg:'Reiniciar o sorteio agora? (não apaga o ranking)', action: ()=> document.getElementById('btn-reset')?.click()},
  'r': {label:'Reiniciar sorteio (R)', msg:'Reiniciar o sorteio agora? (não apaga o ranking)', action: ()=> document.getElementById('btn-reset')?.click()},
  'F': {label:'Tela cheia (F)', msg:'Alternar modo de tela cheia?', action: ()=> document.getElementById('btn-full')?.click()},
  'f': {label:'Tela cheia (F)', msg:'Alternar modo de tela cheia?', action: ()=> document.getElementById('btn-full')?.click()},
  'T': {label:'Alternar tema (T)', msg:'Trocar entre tema claro/escuro?', action: ()=> document.getElementById('btn-theme')?.click()},
  't': {label:'Alternar tema (T)', msg:'Trocar entre tema claro/escuro?', action: ()=> document.getElementById('btn-theme')?.click()},
  'P': {label:'Modo projetor (P)', msg:'Ligar/Desligar o Modo Projetor?', action: ()=> document.getElementById('btn-projector')?.click()},
  'p': {label:'Modo projetor (P)', msg:'Ligar/Desligar o Modo Projetor?', action: ()=> document.getElementById('btn-projector')?.click()},
  '?': {label:'Ajuda (?)', msg:'Abrir a janela de ajuda?', action: ()=> document.getElementById('btn-help')?.click()}
};


    if(map[e.key]){
      e.preventDefault();
      openConfirm(map[e.key].msg || ('Confirmar: ' + map[e.key].label + '?'), map[e.key].action);
    }
  });

  // Ensure Help "OK" closes the help panel
  document.getElementById('btn-close-shortcuts')?.addEventListener('click', ()=>{
    document.getElementById('shortcuts')?.setAttribute('hidden','');
  });
})();

// ====== Autoescala segura (limites pequenos) ======
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

  updateUI(); // também envia o estado/ranking mesclados de volta para a nuvem

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

// ====== Inicial ======
(function init(){
  LS.load();
  if(!document.body.classList.contains('light') && !document.body.classList.contains('dark')){
    document.body.classList.add('dark');
  }
  if(gameOver){
    chkAuto && (chkAuto.checked = false);
    selInterval && (selInterval.disabled = true);
    stopAuto();
  }
  updateUI();
  if(chkAuto?.checked && !gameOver){ startAuto(); }
  // BUGFIX: o estado em memória precisa ser recarregado do localStorage antes de
  // re-renderizar; sem o LS.load() aqui, updateUI() chamava LS.save() com os
  // valores antigos e sobrescrevia o que outra aba/tela (ex.: check.html marcando
  // "Cartela Cheia") tinha acabado de gravar — por isso o encerramento automático
  // do jogo não surtia efeito nesta tela.
  window.addEventListener('storage', (e)=>{
    if(e.key==='bingo.ranking' || e.key==='bingo.state'){
      LS.load();
      if(gameOver) stopAuto();
      updateUI();
    }
  });
  initCloudSync();
})();

// Mostrar/esconder indicador do Modo Projetor
function updateProjectorIndicator(){
  const ind = document.getElementById('projector-indicator');
  if(!ind) return;
  if(document.body.classList.contains('projector')){
    ind.style.display = 'block';
  } else {
    ind.style.display = 'none';
  }
}

// Botão para sair do modo projetor
document.addEventListener('DOMContentLoaded', ()=>{
  const btnExit = document.getElementById('exit-projector');
  if(btnExit){
    btnExit.addEventListener('click', ()=>{
      document.body.classList.remove('projector');
      localStorage.setItem('bingo.projector', '0');
      updateProjectorIndicator();
    });
  }
  updateProjectorIndicator();
});


// ====== Projector banner indicator & exit ======
(function projectorBannerInit(){
  function syncBanner(){
    const b = document.getElementById('projector-banner');
    if(!b) return;
    if(document.body.classList.contains('projector')){
      b.removeAttribute('hidden');
    }else{
      b.setAttribute('hidden','');
    }
  }
  syncBanner();
  const btnExit = document.getElementById('btn-exit-projector');
  btnExit?.addEventListener('click', ()=>{
    document.body.classList.remove('projector');
    localStorage.setItem('bingo.projector','0');
    syncBanner();
  });
  // also resync after projector toggle button press
  document.getElementById('btn-projector')?.addEventListener('click', syncBanner);
})();


// --- boot init --- /*BOOT_MARKER_APP*/
window.addEventListener('load', ()=>{
  try{ LS.load(); }catch(e){}
  try{
    if(typeof chkAuto!=='undefined' && chkAuto){
      if(typeof selInterval!=='undefined' && selInterval){
        selInterval.disabled = !chkAuto.checked;
      }
      updateAutoButton?.();
    }
  }catch(e){}
  try{ updateUI?.(); }catch(e){}
});
