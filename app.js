// ============================================================
// Bingo 75 – Modo Automático (Lógica do Painel de Operador)
// ============================================================

// ====== Util ======
const LETTERS = ['B','I','N','G','O'];
const ranges = { B:[1,15], I:[16,30], N:[31,45], G:[46,60], O:[61,75] };
const all = Array.from({length:75}, (_,i)=>i+1);
const letterFor = (n)=> n<=15? 'B' : n<=30? 'I' : n<=45? 'N' : n<=60? 'G' : 'O';

const DEFAULT_PRIZES = {
  'Terno': '1 Frango Assado',
  'Quatro Cantos': '1 Caixa de Bombom',
  'Cinquina': '1 Liquidificador',
  'Cartela Cheia': 'R$ 500,00'
};

const PRIZE_ICONS = {
  'Terno': '🍗',
  'Quatro Cantos': '🍫',
  'Cinquina': '⚡',
  'Cartela Cheia': '💰'
};

function esc(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ====== Estado ======
let roundId = localStorage.getItem('bingo.activeRoundId') || 'round_1';
let drawn = [];
let last = null;
let muted = localStorage.getItem('bingo.panel.muted') === '1'; // Som independente do painel
let intervalMs = 6000;
let autoTimer = null;
let selectedVoiceName = null;
let rate = 0.95, pitch = 1.0;
let gameOver = false;
let roundName = 'Rodada 1';
let firstTs = null;
let lastTs = null;
let prizes = Object.assign({}, DEFAULT_PRIZES);
let adMode = false;

function isAutoOn(){ return !!autoTimer; }

// ====== UI ======
const elStatDrawn = document.getElementById('stat-drawn');
const elStatLeft = document.getElementById('stat-left');
const elProgress = document.getElementById('progress');
const elRoundBadge = document.getElementById('round-badge');
const elLast = document.getElementById('last');
const elGrid = document.getElementById('grid');
const elHist = document.getElementById('history');
const elStatus = document.getElementById('chip-status');
const elPrizesGrid = document.getElementById('prizes-grid');

const btnDraw = document.getElementById('btn-draw');
const btnUndo = document.getElementById('btn-undo');
const btnReset = document.getElementById('btn-reset');
const btnVoice = document.getElementById('btn-voice');
const btnFull = document.getElementById('btn-full');
const btnAuto = document.getElementById('btn-auto');
const autoIcon = document.getElementById('auto-icon');
const autoLabel = document.getElementById('auto-label');
const selInterval = document.getElementById('sel-interval');

const btnAdToggle = document.getElementById('btn-ad-toggle');
const adLabel = document.getElementById('ad-label');

const selVoice = document.getElementById('sel-voice');
const volDing = document.getElementById('vol-ding');
const btnTest = document.getElementById('btn-test');

// Ranking
const rankingBody = document.getElementById('ranking-body');
const btnExportPDF = document.getElementById('btn-export-pdf');

// Modal Prêmios
const modalPrizes = document.getElementById('modal-prizes');
const btnEditPrizes = document.getElementById('btn-edit-prizes');
const btnClosePrizes = document.getElementById('btn-close-prizes');
const btnClosePrizesX = document.getElementById('btn-close-prizes-x');
const formPrizes = document.getElementById('form-prizes');

// ====== Persistência ======
const LS = {
  save(){
    localStorage.setItem('bingo.adMode', adMode ? '1' : '0');
    let roundsList = [];
    try { roundsList = JSON.parse(localStorage.getItem('bingo.roundsList') || '[]'); } catch(e){}
    const activeId = localStorage.getItem('bingo.activeRoundId') || 'round_1';
    let rIndex = roundsList.findIndex(r => r.id === activeId);

    if (rIndex >= 0) {
      roundsList[rIndex].name = roundName;
      roundsList[rIndex].prizes = prizes;
      roundsList[rIndex].drawn = drawn;
      roundsList[rIndex].last = last;
      roundsList[rIndex].gameOver = gameOver;
      roundsList[rIndex].firstTs = firstTs;
      roundsList[rIndex].lastTs = lastTs;
    } else {
      roundsList.push({
        id: activeId,
        name: roundName,
        prizes: prizes,
        drawn: drawn,
        last: last,
        gameOver: gameOver,
        firstTs: firstTs,
        lastTs: lastTs
      });
      rIndex = roundsList.length - 1;
    }
    localStorage.setItem('bingo.roundsList', JSON.stringify(roundsList));

    const nextRound = rIndex >= 0 && rIndex + 1 < roundsList.length ? roundsList[rIndex + 1] : null;
    let adNotice = null;
    try { adNotice = JSON.parse(localStorage.getItem('bingo.adNotice') || 'null'); } catch (e) {}
    const data = { activeRoundId: activeId, roundName, nextRound, roundsList, drawn, last, intervalMs, selectedVoiceName, rate, pitch, gameOver, firstTs, lastTs, prizes, adMode, adNotice };
    localStorage.setItem('bingo.state', JSON.stringify(data));
    localStorage.setItem('bingo.prizes', JSON.stringify(prizes));
    window.BingoSync?.pushState(data);
  },
  load(){
    try{
      let roundsList = [];
      try { roundsList = JSON.parse(localStorage.getItem('bingo.roundsList') || '[]'); } catch(e){}
      const activeId = localStorage.getItem('bingo.activeRoundId') || 'round_1';
      const round = roundsList.find(r => r.id === activeId);
      const stateData = JSON.parse(localStorage.getItem('bingo.state') || '{}');

      if (round && Array.isArray(round.drawn)) {
        roundName = round.name || stateData.roundName || 'Rodada 1';
        drawn = round.drawn || [];
        last = typeof round.last !== 'undefined' ? round.last : (drawn.at(-1) ?? null);
        gameOver = !!round.gameOver;
        firstTs = round.firstTs ?? stateData.firstTs ?? null;
        lastTs = round.lastTs ?? stateData.lastTs ?? null;
        if (round.prizes) prizes = Object.assign({}, DEFAULT_PRIZES, round.prizes);
      } else {
        if(typeof stateData.roundName==='string') roundName = stateData.roundName;
        if(Array.isArray(stateData.drawn)) drawn = stateData.drawn;
        if(typeof stateData.last!=='undefined') last = stateData.last;
        if(typeof stateData.gameOver==='boolean') gameOver = stateData.gameOver;
        if(typeof stateData.firstTs!=='undefined') firstTs = stateData.firstTs;
        if(typeof stateData.lastTs!=='undefined') lastTs = stateData.lastTs;
        if(stateData.prizes) prizes = Object.assign({}, DEFAULT_PRIZES, stateData.prizes);
        else {
          const p = JSON.parse(localStorage.getItem('bingo.prizes') || 'null');
          if(p) prizes = Object.assign({}, DEFAULT_PRIZES, p);
        }
      }

      if(typeof stateData.intervalMs==='number') intervalMs = stateData.intervalMs;
      if(typeof stateData.selectedVoiceName==='string') selectedVoiceName = stateData.selectedVoiceName;
      if(typeof stateData.rate==='number') rate = stateData.rate;
      if(typeof stateData.pitch==='number') pitch = stateData.pitch;
      adMode = localStorage.getItem('bingo.adMode') === '1' || !!stateData.adMode;
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
  return s;
}
function loadVoices(){
  if(!selVoice || !('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices();
  if(!voices.length) return;
  selVoice.innerHTML = '';
  const sorted = voices.slice().sort((a,b)=> scoreVoice(b)-scoreVoice(a));
  for(const v of sorted){
    const opt = document.createElement('option');
    opt.value = v.name; opt.textContent = `${v.name} – ${v.lang}`;
    selVoice.appendChild(opt);
  }
  const savedVoice = localStorage.getItem('bingo.voice');
  const preferred = (savedVoice && sorted.find(v => v.name === savedVoice))
                 || sorted.find(v=>/Google/i.test(v.name) && /pt-BR/i.test(v.lang))
                 || sorted.find(v=>/pt-BR/i.test(v.lang))
                 || sorted[0];
  if(preferred){
    selectedVoiceName = preferred.name;
    selVoice.value = selectedVoiceName;
  }
}
selVoice?.addEventListener('change', (e)=>{
  selectedVoiceName = e.target.value;
  localStorage.setItem('bingo.voice', selectedVoiceName);
});

function sayLetter(L){ return L==='O' ? 'Ó' : L; }
function speakLongShort(L, n, force = false){
  if(muted && !force) return;
  if(!('speechSynthesis' in window)) return;
  try{ speechSynthesis.cancel(); speechSynthesis.resume(); }catch(e){}
  
  const voices = speechSynthesis.getVoices();
  const voiceName = selVoice?.value || selectedVoiceName || localStorage.getItem('bingo.voice');
  const chosen = voices.find(v=> v.name === voiceName) || voices.find(v=>/pt-BR/i.test(v.lang)) || voices[0];
  
  const savedRate = parseFloat(localStorage.getItem('bingo.rate') || '1.0');
  const actualRate = isNaN(savedRate) ? rate : savedRate;
  
  const mk = (text)=>{ 
    const u = new SpeechSynthesisUtterance(text); 
    if(chosen){ u.voice=chosen; u.lang=chosen.lang; } 
    u.rate = actualRate; 
    u.pitch = pitch; 
    return u; 
  };
  
  const u1 = mk(`Letra ${sayLetter(L)}, número ${n}`);
  const u2 = mk(`${sayLetter(L)} ${n}`);
  
  u1.onend = ()=>{
    try{ speechSynthesis.speak(u2); }catch(e){}
  };
  speechSynthesis.speak(u1);
}
if('speechSynthesis' in window){
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
  setTimeout(loadVoices, 250);
}

// ====== Sorteio ======
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
  updateAutoControls();
}
function stopAuto(){
  if(autoTimer){ clearInterval(autoTimer); autoTimer = null; }
  updateAutoControls();
}
function updateAutoControls(){
  const on = isAutoOn();
  if(autoIcon) autoIcon.innerHTML = on ? '<i data-lucide="pause" class="lucide"></i>' : '<i data-lucide="play" class="lucide"></i>';
  if(autoLabel) autoLabel.textContent = on ? 'Pausar' : 'Auto';
  if(btnAuto) btnAuto.className = 'btn-tool ' + (on ? 'btn-tool-ad' : '');
  if(window.lucide) lucide.createIcons();
}

// ====== Renderização de Prêmios Compactos (Apenas os configurados) ======
function renderPrizes(){
  if(!elPrizesGrid) return;
  elPrizesGrid.innerHTML = '';
  const ranking = LS.loadRanking();
  const winnersMap = {};
  ranking.forEach(r => { if(r.type && !winnersMap[r.type]) winnersMap[r.type] = r; });

  const modalities = ['Terno', 'Quatro Cantos', 'Cinquina', 'Cartela Cheia'];
  const customKeys = Object.keys(prizes || {}).filter(k => !modalities.includes(k));
  const allKeys = [...modalities, ...customKeys];

  let renderedCount = 0;
  allKeys.forEach(mod => {
    const prizeName = (prizes[mod] || '').trim();
    if (!prizeName) return;

    renderedCount++;
    const isCheia = mod.toLowerCase().includes('cheia') || mod.toLowerCase().includes('bingo');
    const winner = winnersMap[mod];
    const isWon = !!winner;

    const card = document.createElement('div');
    card.className = 'prize-card' + (isWon ? ' won' : '');

    if (isWon) {
      card.innerHTML = `
        <div class="p-left">
          <span class="p-type">${isCheia ? '<i data-lucide="trophy" class="lucide-sm text-success"></i>' : '<i data-lucide="gift" class="lucide-sm text-primary"></i>'} ${esc(mod)}</span>
          <span class="p-name">${esc(prizeName)}</span>
        </div>
        <span class="p-badge"><i data-lucide="check" class="lucide-sm text-success"></i> ${esc(winner.name || winner.player)}</span>
      `;
    } else {
      card.innerHTML = `
        <div class="p-left">
          <span class="p-type">${isCheia ? '<i data-lucide="trophy" class="lucide-sm text-success"></i>' : '<i data-lucide="gift" class="lucide-sm text-primary"></i>'} ${esc(mod)}</span>
          <span class="p-name">${esc(prizeName)}</span>
        </div>
        <span class="p-badge badge-open"><i data-lucide="sparkles" class="lucide-sm text-primary"></i> Em disputa</span>
      `;
    }
    elPrizesGrid.appendChild(card);
  });

  if (renderedCount === 0) {
    elPrizesGrid.innerHTML = '<div class="text-muted small py-1">Prêmios da rodada livres a anunciar.</div>';
  }
}

// ====== Renderização da Grade e Colunas ======
function renderColumns(){
  if(!elGrid) return;
  elGrid.innerHTML = '';
  const drawnSet = new Set(drawn);

  for(const L of LETTERS){
    const [a,b] = ranges[L];
    const numsAll = Array.from({length: b-a+1}, (_,i)=>a+i);
    const sortedCount = numsAll.filter(n=> drawnSet.has(n)).length;

    const col = document.createElement('div');
    col.className = `col`;
    const header = document.createElement('header');
    header.innerHTML = `<span class="letter">${L}</span><span class="sub">${sortedCount}/15</span>`;
    const body = document.createElement('div');
    body.className = 'body';

    for(const n of numsAll){
      const isDrawn = drawnSet.has(n);
      const cell = document.createElement('div');
      cell.className = 'cell tabnum' + (isDrawn ? ' drawn' : '') + (n===last? ' last' : '');
      cell.textContent = n;
      body.appendChild(cell);
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

function renderRanking(){
  if(!rankingBody) return;
  const list = LS.loadRanking();
  rankingBody.innerHTML = '';
  if(!list.length){
    rankingBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-1" style="font-size:0.8rem;">Nenhum vencedor registrado.</td></tr>';
    renderPrizes();
    return;
  }
  list.forEach((r, idx)=>{
    const tr = document.createElement('tr');
    const when = new Date(r.ts||Date.now());
    const whenStr = when.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    const prizeWon = prizes[r.type] || DEFAULT_PRIZES[r.type] || '—';
    tr.innerHTML = `
      <td class="tabnum fw-bold">${idx+1}</td>
      <td class="fw-bold">${esc(r.name)}</td>
      <td><span class="badge-type">${esc(r.type)}</span></td>
      <td class="fw-bold text-success" style="font-size:0.8rem;">🎁 ${esc(prizeWon)}</td>
      <td class="text-muted small">${esc(whenStr)}</td>
      <td>
        <button class="btn btn-sm btn-outline-danger py-0 px-1" data-action="del" data-idx="${idx}">×</button>
      </td>
    `;
    rankingBody.appendChild(tr);
  });
  renderPrizes();
}

function updateVoiceButton(){
  if(btnVoice) {
    btnVoice.innerHTML = muted ? '<i data-lucide="volume-x" class="lucide"></i>' : '<i data-lucide="volume-2" class="lucide"></i>';
    btnVoice.title = muted ? 'Voz do painel desligada (M)' : 'Voz do painel ativa (M)';
  }
}

function updateAdButton(){
  if(!btnAdToggle) return;
  if(adMode){
    btnAdToggle.classList.add('active');
    if(adLabel) adLabel.textContent = 'Propaganda: NO AR';
  } else {
    btnAdToggle.classList.remove('active');
    if(adLabel) adLabel.textContent = 'Propaganda: OFF';
  }
}

function updateUI(){
  if(elStatDrawn) elStatDrawn.textContent = `${drawn.length}/75`;
  if(elStatLeft) elStatLeft.textContent = `${75 - drawn.length}`;
  if(elProgress) elProgress.value = drawn.length;
  if(elRoundBadge) elRoundBadge.textContent = roundName || 'Rodada 1';

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
  renderHistory();
  renderRanking();
  renderPrizes();
  updateVoiceButton();
  updateAutoControls();
  updateAdButton();
  updateAuditorUI();
  renderAuditorPanel();

  if(elStatus){
    elStatus.innerHTML = gameOver ? '<i data-lucide="flag" class="lucide-sm"></i> Encerrado' : '<i data-lucide="clock" class="lucide-sm text-primary"></i> Em andamento';
  }
  if(window.lucide) lucide.createIcons();
  LS.save();
}

// ====== Auditoria em Tempo Real de Cartelas Armadas & Batidas ======
function getBallClass(n) {
  return n <= 15 ? 'ball-b' : n <= 30 ? 'ball-i' : n <= 45 ? 'ball-n' : n <= 60 ? 'ball-g' : 'ball-o';
}

function renderAuditorPanel() {
  const container = document.getElementById('auditor-live-container');
  const summaryBadge = document.getElementById('auditor-summary-badge');
  if (!container || !window.BingoCardsEngine) return;

  const currentRoundId = roundId || localStorage.getItem('bingo.activeRoundId') || null;
  const audit = window.BingoCardsEngine.auditAllCardsForRound(drawn, currentRoundId);

  if (summaryBadge) {
    summaryBadge.textContent = `${audit.totalCardsAudited} no lote`;
  }

  if (!audit.totalCardsAudited) {
    container.innerHTML = `
      <div class="text-muted small py-2 d-flex align-items-center gap-1" style="font-size:0.75rem;">
        <i data-lucide="info" class="lucide-sm text-primary"></i>
        <span>Nenhum lote associado a este bingo. Cadastre em <a href="cartelas.html" class="fw-bold text-primary">Cartelas</a>.</span>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  let html = '';

  // Se houver cartelas que BINGARAM (24/24)
  if (audit.hasBingou) {
    html += `
      <div class="p-2 rounded bg-success text-white d-flex align-items-center justify-content-between gap-2 shadow-sm mb-1">
        <div class="d-flex align-items-center gap-2">
          <span class="fs-5">🏆</span>
          <div>
            <div class="fw-bold" style="font-size:0.85rem;">BINGOU! (${audit.bingouCards.length} Cartela${audit.bingouCards.length > 1 ? 's' : ''})</div>
            <div class="small opacity-90">${audit.bingouCards.map(c => '#' + c.formattedSerial).join(', ')}</div>
          </div>
        </div>
        <a href="check.html" class="btn btn-sm btn-light fw-bold py-1 px-2 text-success d-inline-flex align-items-center gap-1" style="font-size:0.75rem;">
          <i data-lucide="check-square" class="lucide-sm"></i> Conferir
        </a>
      </div>
    `;
  }

  // Se houver cartelas ARMADAS (23/24)
  if (audit.hasArmada) {
    html += `
      <div class="d-flex align-items-center justify-content-between mb-1">
        <span class="text-danger fw-bold d-flex align-items-center gap-1" style="font-size:0.75rem;">
          <i data-lucide="flame" class="lucide-sm"></i> ${audit.armadaCards.length} armada${audit.armadaCards.length > 1 ? 's' : ''} (falta 1 pedra):
        </span>
      </div>
      <div class="d-flex flex-wrap gap-1" style="max-height:100px; overflow-y:auto;">
        ${audit.armadaCards.map(c => {
          const n = c.missingNumber;
          const L = letterFor(n);
          const bClass = getBallClass(n);
          return `
            <div class="d-flex align-items-center gap-1 p-1 px-2 rounded border bg-light" style="font-size:0.75rem; line-height:1;" title="Lote: ${esc(c.batchName)}">
              <span class="fw-bold text-dark">#${esc(c.formattedSerial)}</span>
              <span class="text-muted" style="font-size:0.68rem;">falta</span>
              <span class="ball-badge-sm ${bClass}" style="font-size:0.7rem; padding:1px 5px;">${L} ${n}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  if (!audit.hasBingou && !audit.hasArmada) {
    html = `
      <div class="d-flex align-items-center justify-content-between p-2 rounded bg-light border text-muted" style="font-size:0.75rem;">
        <span class="d-flex align-items-center gap-1">
          <i data-lucide="shield-check" class="lucide-sm text-success"></i> Nenhuma armada no momento.
        </span>
        <span class="text-secondary small font-monospace">${drawn.length}/75 pedras</span>
      </div>
    `;
  }

  container.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

function updateAuditorUI() {
  const chipArmada = document.getElementById('chip-armada');
  const armadaContent = document.getElementById('armada-content');
  if (!chipArmada || !armadaContent || !window.BingoCardsEngine) return;

  const currentRoundId = roundId || localStorage.getItem('bingo.activeRoundId') || null;
  const audit = window.BingoCardsEngine.auditAllCardsForRound(drawn, currentRoundId);

  if (!audit.totalCardsAudited) {
    chipArmada.style.display = 'none';
    return;
  }

  chipArmada.style.display = 'inline-flex';

  if (audit.hasBingou) {
    chipArmada.className = 'chip chip-auditor bg-success text-white fw-bold border border-success';
    armadaContent.innerHTML = `<i data-lucide="sparkles" class="lucide-sm"></i> <span>🏆 ${audit.bingouCards.length} BINGOU!</span>`;
  } else if (audit.hasArmada) {
    chipArmada.className = 'chip chip-auditor bg-danger-subtle text-danger fw-bold border border-danger';
    armadaContent.innerHTML = `<i data-lucide="flame" class="lucide-sm text-danger"></i> <span>🔥 ${audit.armadaCards.length} armada${audit.armadaCards.length > 1 ? 's' : ''}</span>`;
  } else {
    chipArmada.className = 'chip chip-auditor text-muted';
    armadaContent.innerHTML = `<i data-lucide="shield-check" class="lucide-sm text-secondary"></i> <span>0 armadas</span>`;
  }

  if (window.lucide) lucide.createIcons();
}

function openArmadasModal() {
  const modal = document.getElementById('modal-armadas');
  const body = document.getElementById('armadas-list-body');
  const subtitle = document.getElementById('armadas-subtitle');
  if (!modal || !body || !window.BingoCardsEngine) return;

  const currentRoundId = roundId || localStorage.getItem('bingo.activeRoundId') || null;
  const audit = window.BingoCardsEngine.auditAllCardsForRound(drawn, currentRoundId);

  if (subtitle) {
    subtitle.textContent = `${audit.totalCardsAudited} cartela(s) dos lotes oficiais auditadas nesta rodada.`;
  }

  let html = '';

  if (audit.hasBingou) {
    html += `
      <div class="p-3 rounded-3" style="background:#f0fdf4; border:1.5px solid #86efac;">
        <div class="d-flex align-items-center gap-2 mb-2">
          <span class="fs-5">🏆</span>
          <h4 class="fw-bold text-success m-0 fs-6">CARTELA CHEIA FECHADA (${audit.bingouCards.length})</h4>
        </div>
        <div class="d-flex flex-column gap-2">
          ${audit.bingouCards.map(c => `
            <div class="d-flex align-items-center justify-content-between p-2 rounded bg-white border border-success-subtle">
              <div>
                <span class="badge bg-success fw-bold me-1">SÉRIE Nº ${esc(c.formattedSerial)}</span>
                <span class="text-muted small">Lote: ${esc(c.batchName)}</span>
              </div>
              <a href="check.html" class="btn btn-sm btn-success py-0 px-2 fw-bold" style="font-size:0.75rem;">Conferir</a>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (audit.hasArmada) {
    html += `
      <div class="p-3 rounded-3" style="background:#fff7ed; border:1.5px solid #fdba74;">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="d-flex align-items-center gap-2">
            <span class="fs-5">🔥</span>
            <h4 class="fw-bold text-danger m-0 fs-6">CARTELAS ARMADAS (Falta 1 pedra para Cartela Cheia)</h4>
          </div>
          <span class="badge bg-danger">${audit.armadaCards.length} armada(s)</span>
        </div>
        <div class="d-flex flex-column gap-2 mt-2" style="max-height:240px; overflow-y:auto;">
          ${audit.armadaCards.map(c => {
            const n = c.missingNumber;
            const L = letterFor(n);
            const bClass = getBallClass(n);
            return `
              <div class="armada-item-card">
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-dark fw-bold" style="font-size:0.8rem;">#${esc(c.formattedSerial)}</span>
                  <span class="text-muted small text-truncate" style="max-width:140px;">${esc(c.batchName)}</span>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span class="text-muted small fw-semibold">Falta nº:</span>
                  <span class="ball-badge-sm ${bClass}">${L} ${n}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  if (!audit.hasBingou && !audit.hasArmada) {
    html = `
      <div class="text-center py-4 text-muted">
        <div class="fs-1 mb-2">🎯</div>
        <p class="m-0 fw-semibold">Nenhuma cartela armada no momento.</p>
        <p class="small text-muted mt-1">Conforme os números forem sorteados, as cartelas a 1 pedra de bater serão listadas aqui em tempo real.</p>
      </div>
    `;
  }

  body.innerHTML = html;
  modal.removeAttribute('hidden');
  if (window.lucide) lucide.createIcons();
}

document.getElementById('chip-armada')?.addEventListener('click', openArmadasModal);
document.getElementById('btn-close-armadas')?.addEventListener('click', () => document.getElementById('modal-armadas')?.setAttribute('hidden', ''));
document.getElementById('btn-close-armadas-x')?.addEventListener('click', () => document.getElementById('modal-armadas')?.setAttribute('hidden', ''));

// ====== Eventos ======
btnDraw?.addEventListener('click', drawOne);
btnUndo?.addEventListener('click', undo);
btnReset?.addEventListener('click', async ()=>{
  const confirmed = await BingoDialog.confirm({
    title: 'Reiniciar Sorteio',
    message: 'Deseja realmente reiniciar o sorteio desta rodada?<br><br>Isso <b>não apaga</b> o ranking de vencedores nem os prêmios configurados — só zera as pedras sorteadas.',
    confirmText: 'Sim, Reiniciar',
    cancelText: 'Cancelar',
    danger: true,
    icon: '🔄'
  });
  if(confirmed) resetAll();
});

btnVoice?.addEventListener('click', ()=>{
  muted = !muted;
  localStorage.setItem('bingo.panel.muted', muted ? '1' : '0');
  updateVoiceButton();
  if(muted) try{ speechSynthesis.cancel(); }catch(e){}
});

btnAuto?.addEventListener('click', ()=>{
  if(isAutoOn()){ stopAuto(); } else { startAuto(); }
});

selInterval?.addEventListener('change', (e)=>{
  intervalMs = Number(e.target.value);
  if(isAutoOn()){ startAuto(); }
  LS.save();
});

// ====== Modal de Configuração de Propaganda / Intervalo no Telão ======
const modalAdConfig = document.getElementById('modal-ad-config');
const btnCloseAd = document.getElementById('btn-close-ad');
const btnCloseAdX = document.getElementById('btn-close-ad-x');
const formAdConfig = document.getElementById('form-ad-config');
const adSelQueue = document.getElementById('ad-sel-queue');
const adCustomTitle = document.getElementById('ad-custom-title');
const adCustomDesc = document.getElementById('ad-custom-desc');

function openAdConfigModal() {
  if (!modalAdConfig) return;
  let queue = [];
  try { queue = JSON.parse(localStorage.getItem('bingo.roundsQueue') || '[]'); } catch (e) {}
  if (!queue.length) {
    try {
      const allRounds = JSON.parse(localStorage.getItem('bingo.roundsList') || '[]');
      const activeId = localStorage.getItem('bingo.activeRoundId') || 'round_1';
      const curIdx = allRounds.findIndex(r => r.id === activeId);
      if (curIdx >= 0 && curIdx + 1 < allRounds.length) {
        queue = allRounds.slice(curIdx + 1);
      }
    } catch (e) {}
  }

  if (adSelQueue) {
    adSelQueue.innerHTML = '<option value="">-- Personalizar texto abaixo ou escolher da fila --</option>';
    queue.forEach((r, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `Bingo #${idx + 1}: ${r.name || 'Rodada'}`;
      adSelQueue.appendChild(opt);
    });
  }

  let savedNotice = null;
  try { savedNotice = JSON.parse(localStorage.getItem('bingo.adNotice') || 'null'); } catch (e) {}
  if (savedNotice && savedNotice.title) {
    if (adCustomTitle) adCustomTitle.value = savedNotice.title;
    if (adCustomDesc) adCustomDesc.value = savedNotice.desc || '';
  } else if (queue.length > 0) {
    const next = queue[0];
    if (adCustomTitle) adCustomTitle.value = `👉 A SEGUIR: ${next.name || 'Próxima Rodada'}`;
    const p = next.prizes || {};
    const cheia = p['Cartela Cheia'] ? `🏆 Cartela Cheia: ${p['Cartela Cheia']}` : '';
    const outros = [
      p['Terno'] ? `Terno: ${p['Terno']}` : '',
      p['Quatro Cantos'] ? `4 Cantos: ${p['Quatro Cantos']}` : '',
      p['Cinquina'] ? `Cinquina: ${p['Cinquina']}` : ''
    ].filter(Boolean).join(' • ');
    if (adCustomDesc) adCustomDesc.value = `${cheia}${cheia && outros ? ' | ' : ''}${outros}`;
  } else {
    if (adCustomTitle) adCustomTitle.value = '👉 A SEGUIR: Próxima Rodada';
    if (adCustomDesc) adCustomDesc.value = 'Preparem suas cartelas para o próximo sorteio!';
  }

  modalAdConfig.removeAttribute('hidden');
}

btnAdToggle?.addEventListener('click', () => {
  if (adMode) {
    adMode = false;
    updateAdButton();
    LS.save();
    BingoDialog.toast('Intervalo comercial desativado no telão.', 'info');
  } else {
    openAdConfigModal();
  }
});

btnCloseAd?.addEventListener('click', () => modalAdConfig?.setAttribute('hidden', ''));
btnCloseAdX?.addEventListener('click', () => modalAdConfig?.setAttribute('hidden', ''));

// Presets Rápidos de 1 Clique para o Anúncio
document.getElementById('preset-ad-next')?.addEventListener('click', () => {
  if (adCustomTitle) adCustomTitle.value = '👉 A SEGUIR: Próxima Rodada';
  if (adCustomDesc) adCustomDesc.value = 'Preparem suas cartelas para o próximo sorteio do bingo!';
});
document.getElementById('preset-ad-break')?.addEventListener('click', () => {
  if (adCustomTitle) adCustomTitle.value = '☕ INTERVALO DE 15 MINUTOS';
  if (adCustomDesc) adCustomDesc.value = 'Momento de pausa! Logo mais retornaremos com mais sorteios!';
});
document.getElementById('preset-ad-food')?.addEventListener('click', () => {
  if (adCustomTitle) adCustomTitle.value = '🍔 PRAÇA DE ALIMENTAÇÃO ABERTA';
  if (adCustomDesc) adCustomDesc.value = 'Aproveite o intervalo para saborear nossos lanches e bebidas!';
});
document.getElementById('preset-ad-tickets')?.addEventListener('click', () => {
  if (adCustomTitle) adCustomTitle.value = '🎟️ GARANTA SUAS CARTELAS!';
  if (adCustomDesc) adCustomDesc.value = 'Adquira novas cartelas na mesa da organização para o próximo sorteio!';
});
document.getElementById('preset-ad-sponsors')?.addEventListener('click', () => {
  if (adCustomTitle) adCustomTitle.value = '🏆 NOSSOS PATROCINADORES OFICIAIS';
  if (adCustomDesc) adCustomDesc.value = 'Agradecemos a todos os parceiros que apoiam nosso evento!';
});

adSelQueue?.addEventListener('change', (e) => {
  const val = e.target.value;
  if (val === '') return;
  let queue = [];
  try { queue = JSON.parse(localStorage.getItem('bingo.roundsQueue') || '[]'); } catch (err) {}
  if (!queue.length) {
    try {
      const allRounds = JSON.parse(localStorage.getItem('bingo.roundsList') || '[]');
      const activeId = localStorage.getItem('bingo.activeRoundId') || 'round_1';
      const curIdx = allRounds.findIndex(r => r.id === activeId);
      if (curIdx >= 0 && curIdx + 1 < allRounds.length) queue = allRounds.slice(curIdx + 1);
    } catch (e) {}
  }
  const item = queue[parseInt(val, 10)];
  if (item) {
    if (adCustomTitle) adCustomTitle.value = `👉 A SEGUIR: ${item.name || 'Próximo Bingo'}`;
    const p = item.prizes || {};
    const cheia = p['Cartela Cheia'] ? `🏆 Cartela Cheia: ${p['Cartela Cheia']}` : '';
    const outros = [
      p['Terno'] ? `Terno: ${p['Terno']}` : '',
      p['Quatro Cantos'] ? `4 Cantos: ${p['Quatro Cantos']}` : '',
      p['Cinquina'] ? `Cinquina: ${p['Cinquina']}` : ''
    ].filter(Boolean).join(' • ');
    if (adCustomDesc) adCustomDesc.value = `${cheia}${cheia && outros ? ' | ' : ''}${outros}`;
  }
});

formAdConfig?.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = adCustomTitle?.value.trim() || '👉 A SEGUIR: Próxima Rodada';
  const desc = adCustomDesc?.value.trim() || '';
  const notice = { title, desc };
  localStorage.setItem('bingo.adNotice', JSON.stringify(notice));

  adMode = true;
  updateAdButton();
  LS.save();
  modalAdConfig?.setAttribute('hidden', '');
  BingoDialog.toast('Intervalo comercial iniciado no telão com sucesso!', 'success');
});

function toggleFull(){ const el = document.documentElement; if(!document.fullscreenElement){ el.requestFullscreen?.(); } else { document.exitFullscreen?.(); } }
btnFull?.addEventListener('click', toggleFull);

// Presets Rápidos
document.getElementById('preset-tradicional')?.addEventListener('click', () => {
  document.getElementById('prize-terno').value = '1 Frango Assado';
  document.getElementById('prize-cantos').value = '1 Caixa de Bombom';
  document.getElementById('prize-cinquina').value = '1 Liquidificador';
  document.getElementById('prize-cheia').value = 'R$ 500,00';
});
document.getElementById('preset-dinheiro')?.addEventListener('click', () => {
  document.getElementById('prize-terno').value = 'R$ 50,00';
  document.getElementById('prize-cantos').value = 'R$ 100,00';
  document.getElementById('prize-cinquina').value = 'R$ 200,00';
  document.getElementById('prize-cheia').value = 'R$ 1.000,00';
});
document.getElementById('preset-eletro')?.addEventListener('click', () => {
  document.getElementById('prize-terno').value = '1 Sanduicheira';
  document.getElementById('prize-cantos').value = '1 Ferro de Passar';
  document.getElementById('prize-cinquina').value = '1 Air Fryer';
  document.getElementById('prize-cheia').value = '1 Smart TV 43"';
});

// Modal de Prêmios
function openPrizesModal(){
  document.getElementById('round-name').value = roundName || 'Rodada 1';
  document.getElementById('prize-terno').value = prizes['Terno'] || '';
  document.getElementById('prize-cantos').value = prizes['Quatro Cantos'] || '';
  document.getElementById('prize-cinquina').value = prizes['Cinquina'] || '';
  document.getElementById('prize-cheia').value = prizes['Cartela Cheia'] || '';
  modalPrizes?.removeAttribute('hidden');
}

btnEditPrizes?.addEventListener('click', openPrizesModal);
btnClosePrizes?.addEventListener('click', ()=> modalPrizes?.setAttribute('hidden',''));
btnClosePrizesX?.addEventListener('click', ()=> modalPrizes?.setAttribute('hidden',''));

formPrizes?.addEventListener('submit', (e)=>{
  e.preventDefault();
  roundName = document.getElementById('round-name').value.trim() || 'Rodada 1';
  prizes = {
    'Terno': document.getElementById('prize-terno').value.trim(),
    'Quatro Cantos': document.getElementById('prize-cantos').value.trim(),
    'Cinquina': document.getElementById('prize-cinquina').value.trim(),
    'Cartela Cheia': document.getElementById('prize-cheia').value.trim()
  };
  LS.save();
  modalPrizes?.setAttribute('hidden','');
  renderPrizes();
  renderRanking();
  if(elRoundBadge) elRoundBadge.textContent = roundName;
});

// Export PDF & CSV
btnExportPDF?.addEventListener('click', async ()=>{
  if(typeof window.exportBingoPDF === 'function'){
    const list = LS.loadRanking();
    await window.exportBingoPDF({ drawn, ranking: list, last, firstTs, lastTs });
  } else {
    BingoDialog.toast('Biblioteca de PDF ainda carregando, tente de novo em instantes.', 'warning');
  }
});

function exportCSV(){
  const rows = LS.loadRanking();
  const header = ['pos','jogador','conquista','premio','quando'];
  const lines = [header.join(';')];
  rows.forEach((r,i)=>{
    const when = new Date(r.ts||Date.now()).toLocaleString();
    const prizeWon = prizes[r.type] || DEFAULT_PRIZES[r.type] || '';
    const safe = [String(i+1), r.name||'', r.type||'', prizeWon, when].map(s=>(''+s).replace(/;/g,','));
    lines.push(safe.join(';'));
  });
  const blob = new Blob([lines.join('\n')], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='ranking_bingo.csv'; a.click();
  URL.revokeObjectURL(url);
}
document.getElementById('btn-export-csv')?.addEventListener('click', exportCSV);

// Ding Áudio do Painel
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
  if(muted) return;
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

// Destrava o AudioContext no primeiro clique/tecla da página. Sem isso, o
// "ding" do primeiro número sorteado pode não tocar em navegadores que
// bloqueiam áudio antes de qualquer interação do usuário (ex.: Chrome).
document.addEventListener('click', () => {
  ensureDingCtx();
  if (dingCtx && dingCtx.state === 'suspended') dingCtx.resume().catch(() => {});
}, { once: true });

// ====== Modal de Configurações de Voz & Áudio ======
const modalVoice = document.getElementById('modal-voice');
const btnOpenVoice = document.getElementById('btn-open-voice');
const btnCloseVoice = document.getElementById('btn-close-voice');
const btnCloseVoiceX = document.getElementById('btn-close-voice-x');
const selRate = document.getElementById('sel-rate');
const valRateLbl = document.getElementById('val-rate-lbl');
const volDingSlider = document.getElementById('vol-ding');
const valDingLbl = document.getElementById('val-ding-lbl');

btnOpenVoice?.addEventListener('click', () => modalVoice?.removeAttribute('hidden'));
btnCloseVoice?.addEventListener('click', () => modalVoice?.setAttribute('hidden', ''));
btnCloseVoiceX?.addEventListener('click', () => modalVoice?.setAttribute('hidden', ''));

if (selRate && valRateLbl) {
  const savedRate = parseFloat(localStorage.getItem('bingo.rate') || '1.0');
  selRate.value = isNaN(savedRate) ? 1.0 : savedRate;
  valRateLbl.textContent = `${selRate.value}x`;
  rate = parseFloat(selRate.value);

  selRate.addEventListener('input', (e) => {
    rate = parseFloat(e.target.value);
    valRateLbl.textContent = `${rate.toFixed(2)}x`;
    localStorage.setItem('bingo.rate', String(rate));
  });
}

if (volDingSlider && valDingLbl) {
  const savedDing = parseFloat(localStorage.getItem('bingo.dingvol') || '0.6');
  volDingSlider.value = isNaN(savedDing) ? 0.6 : savedDing;
  valDingLbl.textContent = `${Math.round(volDingSlider.value * 100)}%`;

  volDingSlider.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    valDingLbl.textContent = `${Math.round(v * 100)}%`;
    localStorage.setItem('bingo.dingvol', String(v));
    if (dingGain) dingGain.gain.value = v;
  });
}

// Switches de Ativação de Voz (Painel e Telão)
const switchPanel = document.getElementById('switch-voice-panel');
const switchProj = document.getElementById('switch-voice-projector');

if (switchPanel) {
  switchPanel.checked = !muted;
  switchPanel.addEventListener('change', (e) => {
    muted = !e.target.checked;
    localStorage.setItem('bingo.panel.muted', muted ? '1' : '0');
    updateVoiceButton();
    if (muted) try { speechSynthesis.cancel(); } catch (err) {}
  });
}

if (switchProj) {
  switchProj.checked = localStorage.getItem('bingo.projector.muted') !== '1';
  switchProj.addEventListener('change', (e) => {
    localStorage.setItem('bingo.projector.muted', e.target.checked ? '0' : '1');
  });
}

// Testar Voz do Bingo
btnTest?.addEventListener('click', () => {
  ensureDingCtx();
  if (dingCtx && dingCtx.state === 'suspended') {
    dingCtx.resume().catch(() => {});
  }
  try { ding(880, 0.1); } catch (e) {}
  speakLongShort('B', 10, true);
});

// Ações do Ranking com Modal Padrão do Sistema
rankingBody?.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const idx = parseInt(btn.dataset.idx, 10);
  const list = LS.loadRanking();
  if (isNaN(idx) || !list[idx]) return;

  if (btn.dataset.action === 'del') {
    const item = list[idx];
    const confirmed = await BingoDialog.confirm({
      title: 'Excluir Vencedor',
      message: `Deseja realmente remover o registro de <b>${esc(item.name || item.player)}</b> (${esc(item.type)})?<br><br>O prêmio correspondente voltará ao status <b>"Em Disputa"</b>.`,
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar',
      danger: true,
      icon: '🗑️'
    });

    if (confirmed) {
      list.splice(idx, 1);
      LS.saveRanking(list);
      renderRanking();
      BingoDialog.toast('Registro de vencedor excluído com sucesso!', 'success');
    }
  }
});

// Atalhos
document.addEventListener('keydown', (e)=>{
  if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;
  if(e.code==='Space'){ e.preventDefault(); drawOne(); }
  else if(e.key==='a' || e.key==='A'){ btnAuto?.click(); }
  else if(e.key==='u' || e.key==='U'){ undo(); }
  else if(e.key==='r' || e.key==='R'){ btnReset?.click(); }
  else if(e.key==='m' || e.key==='M'){ btnVoice?.click(); }
  else if(e.key==='p' || e.key==='P'){ window.open('projetor.html', '_blank'); }
  else if(e.key==='f' || e.key==='F'){ toggleFull(); }
});

document.getElementById('btn-help')?.addEventListener('click', ()=> document.getElementById('shortcuts')?.removeAttribute('hidden'));
document.getElementById('btn-close-shortcuts')?.addEventListener('click', ()=> document.getElementById('shortcuts')?.setAttribute('hidden',''));

// ====== Sincronização Supabase ======
async function initCloudSync(){
  if(!window.BingoSync) return;
  BingoSync.init();
  if(!BingoSync.ready()) return;

  const [remoteState, remoteRanking] = await Promise.all([BingoSync.pullState(), BingoSync.pullRanking()]);

  if(remoteState){
    const localState = { activeRoundId: roundId, roundName, drawn, last, gameOver, firstTs, lastTs, prizes, adMode };
    const merged = BingoSync.mergeState(localState, remoteState);
    drawn = merged.drawn || [];
    last = merged.last ?? null;
    gameOver = !!merged.gameOver;
    firstTs = merged.firstTs ?? null;
    lastTs = merged.lastTs ?? null;
    if(merged.roundName) roundName = merged.roundName;
    if(merged.activeRoundId) roundId = merged.activeRoundId;
    if(typeof merged.adMode==='boolean') adMode = merged.adMode;
    if(merged.prizes) prizes = Object.assign({}, DEFAULT_PRIZES, merged.prizes);
    LS.save();
  }
  if(remoteRanking){
    const mergedRanking = BingoSync.mergeRanking(LS.loadRanking(), remoteRanking);
    localStorage.setItem('bingo.ranking', JSON.stringify(mergedRanking || []));
  }

  updateUI();

  BingoSync.subscribe(async ()=>{
    const rs = await BingoSync.pullState();
    if(rs){
      const localState = { activeRoundId: roundId, roundName, drawn, last, gameOver, firstTs, lastTs, prizes, adMode };
      const merged = BingoSync.mergeState(localState, rs);
      drawn = merged.drawn || [];
      last = merged.last ?? null;
      gameOver = !!merged.gameOver;
      firstTs = merged.firstTs ?? null;
      lastTs = merged.lastTs ?? null;
      if(merged.roundName) roundName = merged.roundName;
      if(merged.activeRoundId) roundId = merged.activeRoundId;
      if(typeof merged.adMode==='boolean') adMode = merged.adMode;
      if(merged.prizes) prizes = Object.assign({}, DEFAULT_PRIZES, merged.prizes);
      if(gameOver) stopAuto();

      localStorage.setItem('bingo.state', JSON.stringify(merged));
      if (Array.isArray(merged.roundsList) && merged.roundsList.length > 0) {
        localStorage.setItem('bingo.roundsList', JSON.stringify(merged.roundsList));
      }
    }
    const rr = await BingoSync.pullRanking();
    if(rr){
      const mergedR = BingoSync.mergeRanking(LS.loadRanking(), rr);
      localStorage.setItem('bingo.ranking', JSON.stringify(mergedR || []));
    }
    updateUI();
  });
}

// ====== Inicialização ======
(function init(){
  try { sessionStorage.setItem('bingo.lastMode', 'automatico.html'); } catch(e){}
  LS.load();
  if(gameOver) stopAuto();
  updateUI();

  window.addEventListener('load', () => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  });

  window.addEventListener('storage', (e)=>{
    if(e.key==='bingo.ranking' || e.key==='bingo.state' || e.key==='bingo.prizes' || e.key==='bingo.roundsList' || e.key==='bingo.activeRoundId'){
      LS.load();
      if(gameOver) stopAuto();
      updateUI();
    }
  });
  initCloudSync();
})();
