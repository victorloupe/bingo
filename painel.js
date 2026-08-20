// ============================================================
// Bingo 75 – Painel de Sorteio Unificado Oficial
// (Modo Automático e Modo Manual em Tela Única)
// ============================================================

(() => {
  'use strict';

  // ====== Constantes & Util ======
  const LETTERS = ['B', 'I', 'N', 'G', 'O'];
  const ranges = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };
  const all = Array.from({ length: 75 }, (_, i) => i + 1);
  const letterFor = (n) => (n <= 15 ? 'B' : n <= 30 ? 'I' : n <= 45 ? 'N' : n <= 60 ? 'G' : 'O');

  const DEFAULT_PRIZES = {
    'Terno': '1 Frango Assado',
    'Quatro Cantos': '1 Caixa de Bombom',
    'Cinquina': '1 Liquidificador',
    'Cartela Cheia': 'R$ 500,00'
  };

  const ICONS = {
    trophy: `<svg class="lucide lucide-trophy lucide-sm text-warning" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.45.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
    gift: `<svg class="lucide lucide-gift lucide-sm text-primary" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>`,
    sparkles: `<svg class="lucide lucide-sparkles lucide-sm text-primary" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
    check: `<svg class="lucide lucide-check lucide-sm text-success" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg>`,
    zap: `<svg class="lucide lucide-zap lucide-sm text-warning" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    award: `<svg class="lucide lucide-award lucide-sm text-primary" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
    layoutGrid: `<svg class="lucide lucide-layout-grid lucide-sm text-primary" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`,
    flame: `<svg class="lucide lucide-flame lucide-xs text-danger" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    shieldCheck: `<svg class="lucide lucide-shield-check lucide-xs text-success" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`,
    info: `<svg class="lucide lucide-info lucide-xs text-primary" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
    alertTriangle: `<svg class="lucide lucide-alert-triangle lucide-xs text-warning" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    checkSquare: `<svg class="lucide lucide-check-square lucide-xs" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`
  };

  const PRIZE_ICONS = {
    'Terno': ICONS.award,
    'Quatro Cantos': ICONS.layoutGrid,
    'Cinquina': ICONS.zap,
    'Cartela Cheia': ICONS.trophy
  };

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  // ====== Estado ======
  const initUrlParams = new URLSearchParams(window.location.search);
  const initUrlMode = initUrlParams.get('modo');
  let mode = (initUrlMode === 'manual' || initUrlMode === 'auto')
    ? initUrlMode
    : (localStorage.getItem('bingo.panelMode') === 'manual' ? 'manual' : 'auto');
  let roundId = localStorage.getItem('bingo.activeRoundId') || 'round_1';
  let drawn = [];
  let last = null;
  let muted = localStorage.getItem('bingo.panel.muted') === '1';
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
  let lastUserActionTs = 0;
  let gridBuilt = false;

  function isAutoOn() { return !!autoTimer; }
  function remaining() { return all.filter((n) => !drawn.includes(n)); }

  // ====== Elementos DOM ======
  const elStatDrawn = document.getElementById('stat-drawn');
  const elStatLeft = document.getElementById('stat-left');
  const elProgress = document.getElementById('progress');
  const elRoundBadge = document.getElementById('round-badge');
  const elLast = document.getElementById('last');
  const elLastLetter = document.getElementById('last-letter');
  const elLastNumber = document.getElementById('last-number');
  const elGrid = document.getElementById('grid');
  const elHist = document.getElementById('history');
  const elStatus = document.getElementById('chip-status');
  const elSync = document.getElementById('chip-sync');
  const elPrizesGrid = document.getElementById('prizes-grid');
  const elHistoryTitle = document.getElementById('history-title');

  // Alternador de Modo com Glider Animado
  const modeCapsule = document.getElementById('mode-capsule');
  const btnModeAuto = document.getElementById('btn-mode-auto');
  const btnModeManual = document.getElementById('btn-mode-manual');
  const controlsAuto = document.getElementById('controls-auto');
  const controlsManual = document.getElementById('controls-manual');

  // Botões de Ação
  const btnDraw = document.getElementById('btn-draw');
  const btnAuto = document.getElementById('btn-auto');
  const autoIcon = document.getElementById('auto-icon');
  const autoLabel = document.getElementById('auto-label');
  const selInterval = document.getElementById('sel-interval');
  const inpQuick = document.getElementById('manual-number-input');
  const btnManualMark = document.getElementById('btn-manual-mark');
  const btnUndo = document.getElementById('btn-undo');
  const btnReset = document.getElementById('btn-reset');
  const btnVoice = document.getElementById('btn-voice');
  const btnOpenVoice = document.getElementById('btn-open-voice');
  const btnFull = document.getElementById('btn-full');
  const btnHelp = document.getElementById('btn-help');

  const btnAdToggle = document.getElementById('btn-ad-toggle');
  const adLabel = document.getElementById('ad-label');

  // Ranking
  const rankingBody = document.getElementById('ranking-body');
  const btnExportPDF = document.getElementById('btn-export-pdf');
  const btnExportCSV = document.getElementById('btn-export-csv');

  // Modais
  const modalPrizes = document.getElementById('modal-prizes');
  const btnClosePrizes = document.getElementById('btn-close-prizes');
  const btnClosePrizesX = document.getElementById('btn-close-prizes-x');
  const formPrizes = document.getElementById('form-prizes');

  const modalVoice = document.getElementById('modal-voice');
  const btnCloseVoice = document.getElementById('btn-close-voice');
  const btnCloseVoiceX = document.getElementById('btn-close-voice-x');
  const selVoice = document.getElementById('sel-voice');
  const rngRate = document.getElementById('rng-rate');
  const rngPitch = document.getElementById('rng-pitch');
  const rngDingVol = document.getElementById('rng-dingvol');
  const lblVoiceRate = document.getElementById('lbl-voice-rate');
  const lblVoicePitch = document.getElementById('lbl-voice-pitch');
  const lblDingVol = document.getElementById('lbl-ding-vol');
  const btnTestVoice = document.getElementById('btn-test-voice');

  // Auditoria & Mesa de Conferência
  const chipArmada = document.getElementById('chip-armada');
  const armadaContent = document.getElementById('armada-content');
  const auditorSummaryBadge = document.getElementById('auditor-summary-badge');
  const auditorLiveContainer = document.getElementById('auditor-live-container');
  const btnOpenConferencia = document.getElementById('btn-open-conferencia');

  const modalArmadasDetail = document.getElementById('modal-armadas-detail');
  const btnCloseArmadas = document.getElementById('btn-close-armadas');
  const btnCloseArmadasX = document.getElementById('btn-close-armadas-x');

  const modalCardSerialInput = document.getElementById('modal-card-serial-input');
  const btnModalSearchCard = document.getElementById('btn-modal-search-card');

  const btnFilterBatidas = document.getElementById('btn-filter-batidas');
  const btnFilterArmadas = document.getElementById('btn-filter-armadas');
  const btnFilterAll = document.getElementById('btn-filter-all');

  const modalCountBatidas = document.getElementById('modal-count-batidas');
  const modalCountArmadas = document.getElementById('modal-count-armadas');
  const modalCountAll = document.getElementById('modal-count-all');
  const modalAuditCardsList = document.getElementById('modal-audit-cards-list');

  const modalViewCardTitle = document.getElementById('modal-view-card-title');
  const modalViewCardBadge = document.getElementById('modal-view-card-badge');
  const modalViewCardBatch = document.getElementById('modal-view-card-batch');
  const modalViewCardPlayer = document.getElementById('modal-view-card-player');
  const modalBingoMatrix = document.getElementById('modal-bingo-matrix');
  const modalViewCardAuth = document.getElementById('modal-view-card-auth');
  const modalViewCardHits = document.getElementById('modal-view-card-hits');
  const btnModalClaimWinner = document.getElementById('btn-modal-claim-winner');

  // ====== Áudio & Síntese Sonora (Web Audio API) ======
  let audioCtx = null;
  let dingVol = 0.6;

  function getAudioCtx() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) audioCtx = new AudioCtxClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function ding(freq = 880, dur = 0.15) {
    if (muted) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(dingVol * 0.4, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur + 0.01);
    } catch (e) {}
  }

  // ====== Voz do Painel (TTS) ======
  function scoreVoice(v) {
    let s = 0;
    if (/pt-BR/i.test(v.lang)) s += 200;
    if (/Google/i.test(v.name)) s += 120;
    if (/(Natural|Neural)/i.test(v.name)) s += 60;
    return s;
  }

  function loadVoices() {
    if (!selVoice || !('speechSynthesis' in window)) return;
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return;
    selVoice.innerHTML = '';
    const sorted = voices.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a));
    for (const v of sorted) {
      const opt = document.createElement('option');
      opt.value = v.name;
      opt.textContent = `${v.name} – ${v.lang}`;
      selVoice.appendChild(opt);
    }
    const savedVoice = localStorage.getItem('bingo.voice');
    const preferred =
      (savedVoice && sorted.find((v) => v.name === savedVoice)) ||
      sorted.find((v) => /Google/i.test(v.name) && /pt-BR/i.test(v.lang)) ||
      sorted.find((v) => /pt-BR/i.test(v.lang)) ||
      sorted[0];
    if (preferred) {
      selectedVoiceName = preferred.name;
      selVoice.value = selectedVoiceName;
    }
  }

  function sayLetter(L) { return L === 'O' ? 'Ó' : L; }
  let speechTimer = null;

  function speakLongShort(L, n, force = false) {
    if (muted && !force) return;
    if (!('speechSynthesis' in window)) return;

    if (speechTimer) clearTimeout(speechTimer);
    speechTimer = setTimeout(() => {
      try {
        speechSynthesis.cancel();
        const voices = speechSynthesis.getVoices();
        const voiceName = selVoice?.value || selectedVoiceName || localStorage.getItem('bingo.voice');
        const chosen = voices.find((v) => v.name === voiceName) || voices.find((v) => /pt-BR/i.test(v.lang)) || voices[0];

        const savedRate = parseFloat(localStorage.getItem('bingo.rate') || '0.95');
        const actualRate = isNaN(savedRate) ? rate : savedRate;

        const mk = (text) => {
          const u = new SpeechSynthesisUtterance(text);
          if (chosen) { u.voice = chosen; u.lang = chosen.lang; }
          u.rate = actualRate;
          u.pitch = pitch;
          return u;
        };

        const u1 = mk(`Letra ${sayLetter(L)}, número ${n}`);
        const u2 = mk(`${sayLetter(L)} ${n}`);

        u1.onend = () => {
          try { speechSynthesis.speak(u2); } catch (e) {}
        };
        speechSynthesis.speak(u1);
      } catch (e) {}
    }, 20);
  }

  if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    setTimeout(loadVoices, 250);
  }

  // ====== Persistência Local & Sincronização ======
  const LS = {
    save(force = false) {
      localStorage.setItem('bingo.adMode', adMode ? '1' : '0');
      localStorage.setItem('bingo.panelMode', mode);
      let roundsList = [];
      try { roundsList = JSON.parse(localStorage.getItem('bingo.roundsList') || '[]'); } catch (e) {}
      const activeId = localStorage.getItem('bingo.activeRoundId') || 'round_1';
      let rIndex = roundsList.findIndex((r) => r.id === activeId);

      const currentRank = LS.loadRanking();
      if (rIndex >= 0) {
        roundsList[rIndex].name = roundName;
        roundsList[rIndex].prizes = prizes;
        roundsList[rIndex].drawn = drawn;
        roundsList[rIndex].last = last;
        roundsList[rIndex].gameOver = gameOver;
        roundsList[rIndex].firstTs = firstTs;
        roundsList[rIndex].lastTs = lastTs;
        roundsList[rIndex].ranking = currentRank;
      } else {
        roundsList.push({
          id: activeId,
          name: roundName,
          prizes: prizes,
          drawn: drawn,
          last: last,
          gameOver: gameOver,
          firstTs: firstTs,
          lastTs: lastTs,
          ranking: currentRank
        });
        rIndex = roundsList.length - 1;
      }
      localStorage.setItem('bingo.roundsList', JSON.stringify(roundsList));

      const nextRound = rIndex >= 0 && rIndex + 1 < roundsList.length ? roundsList[rIndex + 1] : null;
      let adNotice = null;
      try { adNotice = JSON.parse(localStorage.getItem('bingo.adNotice') || 'null'); } catch (e) {}
      if (!adNotice || typeof adNotice !== 'object') adNotice = {};
      adNotice._adMode = adMode;
      adNotice._conferenceMode = false;
      let sponsors = [];
      try { sponsors = JSON.parse(localStorage.getItem('bingo.sponsors') || '[]'); } catch (e) {}
      let roundsQueue = [];
      try { roundsQueue = JSON.parse(localStorage.getItem('bingo.roundsQueue') || '[]'); } catch (e) {}

      let spTrigger = null;
      try {
        const rawSp = JSON.parse(localStorage.getItem('bingo.sponsoredTrigger') || 'null');
        if (rawSp && rawSp.ts && (Date.now() - rawSp.ts < 15000)) spTrigger = rawSp;
      } catch (e) {}

      const data = {
        activeRoundId: activeId,
        roundName,
        nextRound,
        roundsList,
        roundsQueue,
        drawn,
        last,
        intervalMs,
        selectedVoiceName,
        rate,
        pitch,
        gameOver,
        firstTs,
        lastTs,
        prizes,
        sponsors,
        adMode,
        adNotice,
        conferenceMode: false,
        panelMode: mode,
        projectorTheme: localStorage.getItem('bingo.projector.theme') || 'light',
        sponsoredTrigger: spTrigger
      };
      localStorage.setItem('bingo.state', JSON.stringify(data));
      localStorage.setItem('bingo.prizes', JSON.stringify(prizes));
      window.BingoSync?.pushState(data, true, force);
    },
    load() {
      try {
        let roundsList = [];
        try { roundsList = JSON.parse(localStorage.getItem('bingo.roundsList') || '[]'); } catch (e) {}
        const activeId = localStorage.getItem('bingo.activeRoundId') || 'round_1';
        const round = roundsList.find((r) => r.id === activeId);
        const stateData = JSON.parse(localStorage.getItem('bingo.state') || '{}');

        if (round && Array.isArray(round.drawn)) {
          roundName = round.name || stateData.roundName || 'Rodada 1';
          drawn = round.drawn || [];
          last = typeof round.last !== 'undefined' ? round.last : (drawn.at(-1) ?? null);
          gameOver = !!round.gameOver;
          firstTs = round.firstTs ?? stateData.firstTs ?? null;
          lastTs = round.lastTs ?? stateData.lastTs ?? null;
          if (round.prizes) prizes = Object.assign({}, DEFAULT_PRIZES, round.prizes);
          if (Array.isArray(round.ranking)) {
            localStorage.setItem('bingo.ranking', JSON.stringify(round.ranking));
          }
        } else {
          if (typeof stateData.roundName === 'string') roundName = stateData.roundName;
          if (Array.isArray(stateData.drawn)) drawn = stateData.drawn;
          if (typeof stateData.last !== 'undefined') last = stateData.last;
          if (typeof stateData.gameOver === 'boolean') gameOver = stateData.gameOver;
          if (typeof stateData.firstTs !== 'undefined') firstTs = stateData.firstTs;
          if (typeof stateData.lastTs !== 'undefined') lastTs = stateData.lastTs;
          if (stateData.prizes) prizes = Object.assign({}, DEFAULT_PRIZES, stateData.prizes);
          else {
            const p = JSON.parse(localStorage.getItem('bingo.prizes') || 'null');
            if (p) prizes = Object.assign({}, DEFAULT_PRIZES, p);
          }
        }

        if (typeof stateData.intervalMs === 'number') intervalMs = stateData.intervalMs;
        if (typeof stateData.selectedVoiceName === 'string') selectedVoiceName = stateData.selectedVoiceName;
        if (typeof stateData.rate === 'number') rate = stateData.rate;
        if (typeof stateData.pitch === 'number') pitch = stateData.pitch;

        let loadedNotice = null;
        try { loadedNotice = JSON.parse(localStorage.getItem('bingo.adNotice') || 'null'); } catch (e) {}
        if (loadedNotice && typeof loadedNotice._adMode === 'boolean') {
          adMode = loadedNotice._adMode;
          localStorage.setItem('bingo.adMode', adMode ? '1' : '0');
        } else if (typeof stateData.adMode === 'boolean') {
          adMode = stateData.adMode;
          localStorage.setItem('bingo.adMode', adMode ? '1' : '0');
        } else if (typeof stateData.ad_mode === 'boolean') {
          adMode = stateData.ad_mode;
          localStorage.setItem('bingo.adMode', adMode ? '1' : '0');
        } else {
          adMode = localStorage.getItem('bingo.adMode') === '1';
        }

        // Lê modo de jogo da URL ou LocalStorage
        const urlParams = new URLSearchParams(window.location.search);
        const urlMode = urlParams.get('modo');
        if (urlMode === 'manual' || urlMode === 'auto') {
          mode = urlMode;
        } else if (stateData.panelMode === 'manual' || stateData.panelMode === 'auto') {
          mode = stateData.panelMode;
        } else if (localStorage.getItem('bingo.panelMode') === 'manual') {
          mode = 'manual';
        }
      } catch (e) {}
    },
    saveRanking(list) {
      const sanitized = Array.isArray(list) ? list : [];
      localStorage.setItem('bingo.ranking', JSON.stringify(sanitized));
      try {
        let roundsList = JSON.parse(localStorage.getItem('bingo.roundsList') || '[]');
        const activeId = localStorage.getItem('bingo.activeRoundId') || 'round_1';
        const rIdx = roundsList.findIndex((r) => r.id === activeId);
        if (rIdx >= 0) {
          roundsList[rIdx].ranking = sanitized;
          localStorage.setItem('bingo.roundsList', JSON.stringify(roundsList));
        }
      } catch (e) {}
      window.BingoSync?.pushRanking(sanitized);
      LS.save();
    },
    loadRanking() {
      try {
        return JSON.parse(localStorage.getItem('bingo.ranking') || '[]');
      } catch (e) {
        return [];
      }
    }
  };

  // ====== Alternância de Modo com Animação (Automático / Manual) ======
  function switchControlsAnimated(toMode, immediate = false) {
    if (!controlsAuto || !controlsManual) return;
    
    if (immediate) {
      if (toMode === 'auto') {
        controlsAuto.className = 'mode-controls-pane';
        controlsManual.className = 'mode-controls-pane is-hidden';
      } else {
        controlsManual.className = 'mode-controls-pane';
        controlsAuto.className = 'mode-controls-pane is-hidden';
        setTimeout(() => inpQuick?.focus(), 50);
      }
      return;
    }

    if (toMode === 'auto') {
      controlsManual.className = 'mode-controls-pane anim-out';
      setTimeout(() => {
        controlsManual.className = 'mode-controls-pane is-hidden';
        controlsAuto.className = 'mode-controls-pane anim-in';
      }, 130);
    } else {
      controlsAuto.className = 'mode-controls-pane anim-out';
      setTimeout(() => {
        controlsAuto.className = 'mode-controls-pane is-hidden';
        controlsManual.className = 'mode-controls-pane anim-in';
        setTimeout(() => returnFocusToManualInput(), 50);
      }, 130);
    }
  }

  function returnFocusToManualInput() {
    if (mode === 'manual' && inpQuick) {
      setTimeout(() => {
        try {
          inpQuick.focus();
          inpQuick.select();
        } catch (e) {}
      }, 50);
    }
  }

  function closeAllModals() {
    modalPrizes?.setAttribute('hidden', '');
    modalVoice?.setAttribute('hidden', '');
    document.getElementById('shortcuts')?.setAttribute('hidden', '');
    modalArmadasDetail?.setAttribute('hidden', '');
    modalSponsoredAlert?.setAttribute('hidden', '');
    returnFocusToManualInput();
  }

  function setMode(newMode, shouldSave = true) {
    const prevMode = mode;
    mode = (newMode === 'manual') ? 'manual' : 'auto';
    if (mode === 'manual' && autoTimer) {
      stopAuto();
    }

    if (mode === 'auto') {
      btnModeAuto?.classList.add('active');
      btnModeManual?.classList.remove('active');
      modeCapsule?.classList.remove('is-manual');
      if (elGrid) {
        elGrid.classList.add('mode-auto');
        elGrid.classList.remove('mode-manual');
      }
      if (elHistoryTitle) elHistoryTitle.textContent = 'Sequência de Sorteio';
    } else {
      btnModeManual?.classList.add('active');
      btnModeAuto?.classList.remove('active');
      modeCapsule?.classList.add('is-manual');
      if (elGrid) {
        elGrid.classList.add('mode-manual');
        elGrid.classList.remove('mode-auto');
      }
      if (elHistoryTitle) elHistoryTitle.textContent = 'Sequência de Marcação';
    }

    const isUserSwitch = shouldSave && (prevMode !== mode);
    switchControlsAnimated(mode, !isUserSwitch);

    renderColumns();
    updateAutoControls();

    if (mode === 'manual') {
      returnFocusToManualInput();
    }

    if (shouldSave) {
      localStorage.setItem('bingo.panelMode', mode);
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('modo', mode);
        window.history.replaceState(null, '', url.toString());
      } catch (e) {}
      LS.save();
    }
  }

  // ====== Modal de Alerta de Pedra Patrocinada ======
  const modalSponsoredAlert = document.getElementById('modal-sponsored-alert');
  const btnCloseSponsoredX = document.getElementById('btn-close-sponsored-x');
  const btnConfirmSponsoredShow = document.getElementById('btn-confirm-sponsored-show');
  const btnSkipSponsoredShow = document.getElementById('btn-skip-sponsored-show');
  const spAlertLetter = document.getElementById('sp-alert-letter');
  const spAlertNumber = document.getElementById('sp-alert-number');
  const spAlertLogo = document.getElementById('sp-alert-logo');
  const spAlertName = document.getElementById('sp-alert-name');
  const spAlertMsg = document.getElementById('sp-alert-msg');

  let pendingSponsoredStone = null;

  function checkAndPromptSponsoredStone(n) {
    let sponsors = [];
    try { sponsors = JSON.parse(localStorage.getItem('bingo.sponsors') || '[]'); } catch (e) {}
    const sp = sponsors.find((s) => s.stoneNum != null && parseInt(s.stoneNum, 10) === n);
    if (!sp) return false;

    // Pausa sorteio automático se estiver rodando
    if (isAutoOn()) stopAuto();

    pendingSponsoredStone = { num: n, sponsor: sp };
    const L = letterFor(n);
    if (spAlertLetter) spAlertLetter.textContent = L;
    if (spAlertNumber) spAlertNumber.textContent = String(n);
    if (spAlertLogo) spAlertLogo.src = sp.img || 'favicon.svg';
    if (spAlertName) spAlertName.textContent = sp.name || 'Patrocinador Oficial';
    if (spAlertMsg) {
      spAlertMsg.textContent = sp.stoneMessage ? `"${sp.stoneMessage}"` : (sp.desc ? `"${sp.desc}"` : 'Oferecimento Especial');
    }

    modalSponsoredAlert?.removeAttribute('hidden');
    if (window.lucide) lucide.createIcons();
    return true;
  }

  // ====== Ações de Sorteio ======
  function executeDrawNumber(n) {
    if (gameOver) return;
    if (drawn.includes(n)) return;
    lastUserActionTs = Date.now();
    drawn.push(n);
    last = n;
    const now = Date.now();
    if (!firstTs) firstTs = now;
    lastTs = now;
    LS.save();
    updateUI();
    const L = letterFor(n);
    speakLongShort(L, n);
    try { ding(920, 0.08); } catch (e) {}
  }

  function drawOne() {
    if (gameOver) return;
    const left = remaining();
    if (left.length === 0) {
      gameOver = true;
      stopAuto();
      LS.save();
      updateUI();
      return;
    }
    const n = left[Math.floor(Math.random() * left.length)];
    if (checkAndPromptSponsoredStone(n)) {
      return; // Pausa e aguarda decisão do operador no modal!
    }
    executeDrawNumber(n);
  }

  async function unmarkNumberWithConfirmation(n) {
    const L = letterFor(n);
    const ok = await window.BingoDialog?.confirm({
      title: 'Desmarcar Pedra?',
      message: `Tem certeza que deseja desmarcar a pedra <b>${L}-${n}</b>?<br><br><span style="color:#b91c1c; font-size:0.85rem; font-weight:600;">${ICONS.alertTriangle} <b>Atenção:</b> Esta ação removerá a pedra do sorteio e recalculará a conferência de todas as cartelas em tempo real.</span>`,
      confirmText: `Sim, Desmarcar ${L}-${n}`,
      cancelText: 'Cancelar',
      danger: true,
      icon: 'alert-triangle'
    });
    if (!ok) return false;

    lastUserActionTs = Date.now();
    const idx = drawn.indexOf(n);
    if (idx >= 0) {
      drawn.splice(idx, 1);
      last = drawn.at(-1) ?? null;
      if (drawn.length === 0) { firstTs = null; lastTs = null; }
      else { lastTs = Date.now(); }
      gameOver = false;
      LS.save();
      updateUI();
      window.BingoDialog?.toast(`Pedra ${L}-${n} desmarcada.`, 'info');
      returnFocusToManualInput();
    }
    return true;
  }

  async function selectNumber(n) {
    if (gameOver) return;
    if (drawn.includes(n)) {
      // Solicita confirmação de segurança para desmarcar
      await unmarkNumberWithConfirmation(n);
      return;
    }
    if (checkAndPromptSponsoredStone(n)) {
      return; // Pausa e aguarda decisão do operador no modal!
    }
    executeDrawNumber(n);
    returnFocusToManualInput();
  }

  async function toggleNumber(n) {
    if (drawn.includes(n)) {
      await unmarkNumberWithConfirmation(n);
    } else {
      selectNumber(n);
    }
  }

  function markManualInput() {
    if (!inpQuick) return;
    const val = parseInt(inpQuick.value, 10);
    if (isNaN(val) || val < 1 || val > 75) {
      window.BingoDialog?.toast('Digite um número válido de 1 a 75.', 'warning');
      returnFocusToManualInput();
      return;
    }
    toggleNumber(val);
    inpQuick.value = '';
    returnFocusToManualInput();
  }

  async function undo() {
    if (drawn.length === 0) return;
    const lastNum = drawn.at(-1);
    const L = letterFor(lastNum);
    const ok = await window.BingoDialog?.confirm({
      title: 'Desfazer Última Pedra?',
      message: `Deseja desfazer a última pedra sorteada (<b>${L}-${lastNum}</b>)?<br><br><span style="color:#b91c1c; font-size:0.85rem; font-weight:600;">${ICONS.alertTriangle} Isso removerá o número do sorteio e da conferência das cartelas.</span>`,
      confirmText: `Sim, Desfazer ${L}-${lastNum}`,
      cancelText: 'Cancelar',
      danger: true,
      icon: 'alert-triangle'
    });
    if (!ok) {
      returnFocusToManualInput();
      return;
    }

    lastUserActionTs = Date.now();
    drawn.pop();
    last = drawn.at(-1) ?? null;
    if (drawn.length === 0) { firstTs = null; lastTs = null; }
    else { lastTs = Date.now(); }
    LS.save();
    updateUI();
    window.BingoDialog?.toast(`Pedra ${L}-${lastNum} desfeita.`, 'info');
    returnFocusToManualInput();
  }

  async function resetAll() {
    const ok = await window.BingoDialog?.confirm(
      'Tem certeza que deseja zerar o sorteio desta rodada?',
      'Reiniciar Rodada',
      'Sim, Zerar',
      'Cancelar'
    );
    if (!ok) return;

    lastUserActionTs = Date.now();
    drawn = [];
    last = null;
    stopAuto();
    gameOver = false;
    firstTs = null;
    lastTs = null;
    LS.save();
    updateUI();
    try { speechSynthesis.cancel(); } catch (e) {}
    window.BingoDialog?.toast('Rodada reiniciada!', 'success');
  }

  // ====== Auto Controls ======
  function startAuto() {
    if (mode !== 'auto' || gameOver) return;
    stopAuto();
    drawOne();
    autoTimer = setInterval(drawOne, Math.max(1500, intervalMs));
    updateAutoControls();
  }

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
    updateAutoControls();
  }

  function toggleAuto() {
    if (isAutoOn()) stopAuto();
    else startAuto();
  }

  function updateAutoControls() {
    const on = isAutoOn();
    if (autoIcon) autoIcon.innerHTML = on ? '<i data-lucide="pause" class="lucide"></i>' : '<i data-lucide="play" class="lucide"></i>';
    if (autoLabel) autoLabel.textContent = on ? 'Pausar' : 'Auto';
    if (btnAuto) btnAuto.className = 'btn-tool ' + (on ? 'btn-tool-ad' : '');
    if (window.lucide) lucide.createIcons();
  }

  // ====== Propaganda (Patrocinadores) ======
  function syncAdModeWithRetry(expectedAdMode) {
    LS.save(true);
    // Verificações com checagem ativa no Supabase e reenvio com force se houver divergência
    [300, 800, 1800].forEach((delay) => {
      setTimeout(async () => {
        if (adMode !== expectedAdMode) return;
        LS.save(true);
        if (window.BingoSync && BingoSync.ready() && typeof BingoSync.pullState === 'function') {
          try {
            const remote = await BingoSync.pullState();
            if (remote && typeof remote.adMode === 'boolean' && remote.adMode !== expectedAdMode && adMode === expectedAdMode) {
              LS.save(true);
            }
          } catch (e) {}
        }
      }, delay);
    });
  }

  function updateAdButton() {
    if (!btnAdToggle) return;
    if (adMode) {
      btnAdToggle.classList.add('active');
      if (adLabel) adLabel.textContent = 'Propaganda: NO AR';
    } else {
      btnAdToggle.classList.remove('active');
      if (adLabel) adLabel.textContent = 'Propaganda: OFF';
    }
  }

  function toggleAdMode() {
    adMode = !adMode;
    lastUserActionTs = Date.now();
    localStorage.setItem('bingo.adMode', adMode ? '1' : '0');
    updateAdButton();
    LS.save(true);
    syncAdModeWithRetry(adMode);
    window.BingoDialog?.toast(`Propaganda ${adMode ? 'ATIVADA no Telão' : 'DESATIVADA'}`, adMode ? 'warning' : 'info');
  }

  // ====== Renderização da Grade & Componentes ======
  function initGrid() {
    if (!elGrid) return;
    elGrid.innerHTML = '';

    for (const L of LETTERS) {
      const [a, b] = ranges[L];
      const col = document.createElement('div');
      col.className = 'col';

      const header = document.createElement('header');
      header.innerHTML = `<span class="letter">${L}</span><span class="sub" data-sub="${L}">0/15</span>`;

      const body = document.createElement('div');
      body.className = 'body';

      for (let n = a; n <= b; n++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cell tabnum';
        cell.textContent = n;
        cell.dataset.num = String(n);
        cell.setAttribute('aria-pressed', 'false');
        cell.setAttribute('title', `Pedra ${L}-${n}`);
        body.appendChild(cell);
      }

      col.appendChild(header);
      col.appendChild(body);
      elGrid.appendChild(col);
    }

    // Event delegation para cliques na grade
    elGrid.addEventListener('click', (e) => {
      if (mode !== 'manual') return;
      const btn = e.target.closest('button.cell');
      if (!btn) return;
      const numStr = btn.dataset.num;
      if (numStr) {
        const n = parseInt(numStr, 10);
        if (!isNaN(n)) toggleNumber(n);
      }
    });

    gridBuilt = true;
  }

  function renderColumns() {
    if (!elGrid) return;
    if (!gridBuilt) initGrid();

    const drawnSet = new Set(drawn);

    for (const L of LETTERS) {
      const [a, b] = ranges[L];
      let count = 0;

      for (let n = a; n <= b; n++) {
        const isDrawn = drawnSet.has(n);
        if (isDrawn) count++;
        const cell = elGrid.querySelector(`button.cell[data-num="${n}"]`);
        if (cell) {
          const isLast = (n === last);
          cell.classList.toggle('drawn', isDrawn);
          cell.classList.toggle('last', isLast);
          cell.setAttribute('aria-pressed', isDrawn ? 'true' : 'false');
          if (mode === 'manual') {
            cell.style.cursor = 'pointer';
            cell.setAttribute('title', isDrawn ? `Clique para desmarcar ${L}-${n}` : `Clique para marcar ${L}-${n}`);
          } else {
            cell.style.cursor = 'default';
            cell.setAttribute('title', isDrawn ? `Pedra ${L}-${n} sorteada` : `Pedra ${L}-${n}`);
          }
        }
      }

      const subEl = elGrid.querySelector(`.sub[data-sub="${L}"]`);
      if (subEl) subEl.textContent = `${count}/15`;
    }
  }

  function renderHistory() {
    if (!elHist) return;
    elHist.innerHTML = '';
    for (const n of drawn) {
      const L = letterFor(n);
      const span = document.createElement('span');
      span.className = 'hchip tabnum' + (n === last ? ' last' : '');
      span.textContent = `${L} ${n}`;
      span.dataset.num = String(n);
      span.title = `Pedra ${L}-${n} (clique para desmarcar)`;
      elHist.appendChild(span);
    }
    elHist.scrollTop = elHist.scrollHeight;
  }

  elHist?.addEventListener('click', (e) => {
    const chip = e.target.closest('.hchip');
    if (!chip) return;
    const n = parseInt(chip.dataset.num, 10);
    if (!isNaN(n)) unmarkNumberWithConfirmation(n);
  });

  let lastPrizesRenderJson = '';
  function renderPrizes() {
    if (!elPrizesGrid) return;
    const ranking = LS.loadRanking();
    const winnersMap = {};
    ranking.forEach((r) => { if (r.type && !winnersMap[r.type]) winnersMap[r.type] = r; });

    const currentKey = JSON.stringify(prizes) + '_' + JSON.stringify(winnersMap);
    if (currentKey === lastPrizesRenderJson) return;
    lastPrizesRenderJson = currentKey;

    elPrizesGrid.innerHTML = '';
    const modalities = ['Terno', 'Quatro Cantos', 'Cinquina', 'Cartela Cheia'];
    const customKeys = Object.keys(prizes || {}).filter((k) => !modalities.includes(k));
    const allKeys = [...modalities, ...customKeys];

    let renderedCount = 0;
    allKeys.forEach((mod) => {
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
            <span class="p-type">${isCheia ? ICONS.trophy : ICONS.gift} ${esc(mod)}</span>
            <span class="p-name">${esc(prizeName)}</span>
          </div>
          <span class="p-badge">${ICONS.check} ${esc(winner.name || winner.player)}</span>
        `;
      } else {
        card.innerHTML = `
          <div class="p-left">
            <span class="p-type">${isCheia ? ICONS.trophy : ICONS.gift} ${esc(mod)}</span>
            <span class="p-name">${esc(prizeName)}</span>
          </div>
          <span class="p-badge badge-open">${ICONS.sparkles} Em disputa</span>
        `;
      }
      elPrizesGrid.appendChild(card);
    });

    if (renderedCount === 0) {
      elPrizesGrid.innerHTML = '<div class="text-muted small py-1">Prêmios da rodada livres a anunciar.</div>';
    }
  }

  function renderRanking() {
    if (!rankingBody) return;
    const list = LS.loadRanking();
    rankingBody.innerHTML = '';
    if (!list.length) {
      rankingBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-1" style="font-size:0.8rem;">Nenhum vencedor registrado.</td></tr>';
      return;
    }
    list.forEach((r, idx) => {
      const tr = document.createElement('tr');
      let whenStr = '—';
      if (r.time) {
        whenStr = r.time;
      } else if (r.ts) {
        const d = new Date(r.ts);
        whenStr = !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
      }
      const prizeWon = prizes[r.type] || r.prize || '—';

      tr.innerHTML = `
        <td class="tabnum fw-bold">${idx + 1}</td>
        <td class="fw-bold">${esc(r.name)}</td>
        <td><span class="badge-type">${esc(r.type)}</span></td>
        <td class="fw-bold text-success" style="font-size:0.8rem;">${ICONS.gift} ${esc(prizeWon)}</td>
        <td class="text-muted small">${esc(whenStr)}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger py-0 px-1" data-action="del" data-idx="${idx}">×</button>
        </td>
      `;
      rankingBody.appendChild(tr);
    });
  }

  rankingBody?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action="del"]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx, 10);
    const list = LS.loadRanking();
    if (isNaN(idx) || !list[idx]) return;

    const item = list[idx];
    const confirmed = await window.BingoDialog?.confirm({
      title: 'Excluir Vencedor',
      message: `Deseja realmente remover <b>${esc(item.name || item.player || 'Jogador')}</b> (${esc(item.type)})?<br><br>O prêmio correspondente voltará ao status <b>"Em Disputa"</b>.`,
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar',
      danger: true,
      icon: 'trash'
    });

    if (!confirmed) return;

    list.splice(idx, 1);
    LS.saveRanking(list);
    renderRanking();
    lastPrizesRenderJson = '';
    renderPrizes();
    window.BingoDialog?.toast('Registro de vencedor excluído com sucesso!', 'success');
  });

  // ====== Auditoria em Tempo Real de Cartelas ======
  function getBallClass(n) {
    return n <= 15 ? 'ball-b' : n <= 30 ? 'ball-i' : n <= 45 ? 'ball-n' : n <= 60 ? 'ball-g' : 'ball-o';
  }

  let lastAuditorHtmlKey = '';
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
        <div class="text-muted py-1 d-flex align-items-center gap-1" style="font-size:0.68rem; line-height:1.2;">
          ${ICONS.info}
          <span>Nenhum lote associado. Cadastre em <a href="cartelas.html" class="fw-bold text-primary">Cartelas</a>.</span>
        </div>
      `;
      return;
    }

    let html = '';

    if (audit.hasBingou && audit.batidasCards && audit.batidasCards.length > 0) {
      const isCheia = audit.bingouCards.length > 0;
      const bannerClass = isCheia ? 'auditor-bingou-banner' : 'auditor-batida-banner';
      html += `
        <div class="${bannerClass}">
          <div class="d-flex align-items-center gap-1 min-w-0">
            <span class="d-inline-flex align-items-center">${isCheia ? ICONS.trophy : ICONS.zap}</span>
            <strong style="font-size:0.75rem; letter-spacing:0.3px; color:#ffffff !important;">${isCheia ? 'BINGOU!' : 'BATIDA!'}</strong>
            <span class="auditor-bingou-serial-pill">${audit.batidasCards.map((c) => '#' + c.formattedSerial + ' (' + c.category + ')').join(', ')}</span>
          </div>
          <button type="button" class="auditor-btn-conferir" title="Abrir Mesa de Conferência">
            ${ICONS.checkSquare} Conferir
          </button>
        </div>
      `;
    }

    if (audit.hasArmada && audit.armadaCards && audit.armadaCards.length > 0) {
      html += `
        <div class="auditor-armadas-wrap">
          <div class="auditor-armadas-title">
            ${ICONS.flame}
            <span>${audit.armadaCards.length} armada${audit.armadaCards.length > 1 ? 's' : ''} (falta 1):</span>
          </div>
          <div class="auditor-armadas-grid">
            ${audit.armadaCards.map((c) => {
              const n = c.missingNumber;
              const L = letterFor(n);
              const bClass = getBallClass(n);
              const catLabel = c.category === 'Cartela Cheia' ? 'Cheia' : c.category;
              return `
                <div class="auditor-armada-chip" title="Lote: ${esc(c.batchName)} • ${esc(c.category)}">
                  <span class="armada-serial">#${esc(c.formattedSerial)}</span>
                  <span class="badge bg-white text-secondary border px-1" style="font-size:0.58rem; padding:0 3px;">${esc(catLabel)}</span>
                  <span class="armada-ball-badge ${bClass}">${L} ${n}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    if (!audit.hasBingou && !audit.hasArmada) {
      html = `
        <div class="d-flex align-items-center justify-content-between p-1 px-2 rounded bg-light border text-muted" style="font-size:0.68rem; line-height:1.2;">
          <span class="d-flex align-items-center gap-1">
            ${ICONS.shieldCheck} Nenhuma armada.
          </span>
          <span class="text-secondary small font-monospace" style="font-size:0.65rem;">${drawn.length}/75 sorteadas</span>
        </div>
      `;
    }

    if (html !== lastAuditorHtmlKey) {
      lastAuditorHtmlKey = html;
      container.innerHTML = html;
    }
  }

  function updateAuditorUI() {
    if (!chipArmada || !armadaContent || !window.BingoCardsEngine) return;
    const currentRoundId = roundId || localStorage.getItem('bingo.activeRoundId') || null;
    const audit = window.BingoCardsEngine.auditAllCardsForRound(drawn, currentRoundId);

    if (!audit.totalCardsAudited) {
      chipArmada.style.display = 'none';
      return;
    }

    chipArmada.style.display = 'inline-flex';
    chipArmada.style.cursor = 'pointer';

    if (audit.hasBingou && audit.batidasCards && audit.batidasCards.length > 0) {
      const isCheia = audit.bingouCards.length > 0;
      chipArmada.className = 'chip chip-auditor bg-success text-white fw-bold border border-success';
      armadaContent.innerHTML = isCheia
        ? `${ICONS.trophy} <span>${audit.bingouCards.length} BINGO BATIDO!</span>`
        : `${ICONS.zap} <span>${audit.batidasCards.length} BATIDA(S)!</span>`;
    } else if (audit.hasArmada && audit.armadaCards && audit.armadaCards.length > 0) {
      chipArmada.className = 'chip chip-auditor bg-warning-subtle text-dark border border-warning';
      armadaContent.innerHTML = `${ICONS.flame} <span><b>${audit.armadaCards.length}</b> armada${audit.armadaCards.length > 1 ? 's' : ''} (falta 1)</span>`;
    } else {
      chipArmada.className = 'chip chip-auditor bg-light text-muted border';
      armadaContent.innerHTML = `${ICONS.shieldCheck} <span>${audit.totalCardsAudited} cartelas ativas</span>`;
    }
  }

  function updateVoiceButton() {
    if (btnVoice) {
      btnVoice.innerHTML = muted ? '<i data-lucide="volume-x" class="lucide"></i>' : '<i data-lucide="volume-2" class="lucide"></i>';
      btnVoice.title = muted ? 'Voz do painel desligada (M)' : 'Voz do painel ativa (M)';
    }
  }

  function updateUI() {
    if (elStatDrawn) elStatDrawn.textContent = `${drawn.length}/75`;
    if (elStatLeft) elStatLeft.textContent = `${75 - drawn.length}`;
    if (elProgress) elProgress.value = drawn.length;
    if (elRoundBadge) elRoundBadge.textContent = roundName || 'Rodada 1';

    if (elLast) {
      if (last != null) {
        elLast.style.display = '';
        const L = letterFor(last);
        if (elLastLetter) {
          elLastLetter.textContent = L;
          elLastLetter.className = 'badge-letter letter-' + L;
        }
        if (elLastNumber) elLastNumber.textContent = last;
        elLast.className = 'last has-ball letter-' + L;
      } else {
        elLast.style.display = 'none';
      }
    }

    document.querySelectorAll('#btn-undo, #btn-undo-manual, .btn-action-undo').forEach((btn) => {
      btn.disabled = drawn.length === 0;
    });
    if (btnDraw) btnDraw.disabled = remaining().length === 0 || gameOver;

    renderColumns();
    renderHistory();
    renderRanking();
    renderPrizes();
    updateVoiceButton();
    updateAutoControls();
    updateAdButton();
    updateAuditorUI();
    renderAuditorPanel();
    if (window.lucide) lucide.createIcons();
  }

  // ====== Sincronização Supabase ======
  function applyRemoteState(remoteState, remoteRanking) {
    if (remoteState) {
      const isRecentLocalAction = Date.now() - lastUserActionTs < 3000;
      if (!isRecentLocalAction) {
        if (Array.isArray(remoteState.drawn)) drawn = remoteState.drawn;
        if (typeof remoteState.last !== 'undefined') last = remoteState.last;
        if (typeof remoteState.gameOver === 'boolean') gameOver = remoteState.gameOver;
        if (typeof remoteState.firstTs !== 'undefined') firstTs = remoteState.firstTs;
        if (typeof remoteState.lastTs !== 'undefined') lastTs = remoteState.lastTs;
      }
      if (remoteState.roundName) roundName = remoteState.roundName;
      if (remoteState.activeRoundId) roundId = remoteState.activeRoundId;
      if (remoteState.prizes) prizes = Object.assign({}, DEFAULT_PRIZES, remoteState.prizes);

      const rNotice = remoteState.adNotice || remoteState.ad_notice;
      let remoteAdMode = null;
      if (rNotice && typeof rNotice._adMode === 'boolean') {
        remoteAdMode = rNotice._adMode;
      } else if (typeof remoteState.adMode === 'boolean') {
        remoteAdMode = remoteState.adMode;
      } else if (typeof remoteState.ad_mode === 'boolean') {
        remoteAdMode = remoteState.ad_mode;
      }
      if (remoteAdMode !== null && !isRecentLocalAction) {
        adMode = remoteAdMode;
        localStorage.setItem('bingo.adMode', adMode ? '1' : '0');
      }

      if (typeof remoteState.intervalMs === 'number') {
        intervalMs = remoteState.intervalMs;
        if (selInterval) selInterval.value = String(intervalMs);
      }
      updateUI();
    }
    if (Array.isArray(remoteRanking)) {
      const curLocal = LS.loadRanking();
      if (JSON.stringify(curLocal) !== JSON.stringify(remoteRanking)) {
        localStorage.setItem('bingo.ranking', JSON.stringify(remoteRanking));
        try {
          let roundsList = JSON.parse(localStorage.getItem('bingo.roundsList') || '[]');
          const activeId = localStorage.getItem('bingo.activeRoundId') || 'round_1';
          const rIdx = roundsList.findIndex((r) => r.id === activeId);
          if (rIdx >= 0) {
            roundsList[rIdx].ranking = remoteRanking;
            localStorage.setItem('bingo.roundsList', JSON.stringify(roundsList));
          }
        } catch (e) {}
        renderRanking();
        lastPrizesRenderJson = '';
        renderPrizes();
      }
    }
  }

  async function initCloudSync() {
    if (!window.BingoSync) return;
    BingoSync.init();
    if (!BingoSync.ready()) return;

    if (elSync) {
      elSync.innerHTML = '<i data-lucide="cloud" class="lucide-sm text-success"></i> Sincronizado';
    }

    try {
      const [remoteState, remoteRanking] = await Promise.all([
        BingoSync.pullState(),
        BingoSync.pullRanking()
      ]);
      if (remoteState || remoteRanking) {
        applyRemoteState(remoteState, remoteRanking);
      }
      BingoSync.subscribe(
        async () => {
          const [rs, rr] = await Promise.all([
            BingoSync.pullState(),
            BingoSync.pullRanking()
          ]);
          applyRemoteState(rs, rr);
        },
        (directState) => {
          applyRemoteState(directState, null);
        },
        (directRanking) => {
          applyRemoteState(null, directRanking);
        }
      );
    } catch (e) {}
  }

  // ====== Inicialização & Eventos ======
  LS.load();

  // Alternador de Modo
  btnModeAuto?.addEventListener('click', () => setMode('auto'));
  btnModeManual?.addEventListener('click', () => setMode('manual'));

  // Ações de Sorteio
  btnDraw?.addEventListener('click', drawOne);
  btnAuto?.addEventListener('click', toggleAuto);
  document.querySelectorAll('#btn-undo, #btn-undo-manual, .btn-action-undo').forEach((btn) => {
    btn.addEventListener('click', undo);
  });
  document.querySelectorAll('#btn-reset, #btn-reset-manual, .btn-action-reset').forEach((btn) => {
    btn.addEventListener('click', resetAll);
  });
  btnAdToggle?.addEventListener('click', toggleAdMode);

  selInterval?.addEventListener('change', (e) => {
    intervalMs = parseInt(e.target.value, 10) || 6000;
    if (isAutoOn()) startAuto();
    LS.save();
  });

  btnManualMark?.addEventListener('click', markManualInput);
  inpQuick?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      markManualInput();
    }
  });

  // Áudio e Voz
  btnVoice?.addEventListener('click', () => {
    muted = !muted;
    localStorage.setItem('bingo.panel.muted', muted ? '1' : '0');
    updateVoiceButton();
    if (muted && 'speechSynthesis' in window) speechSynthesis.cancel();
    if (window.lucide) lucide.createIcons();
  });

  // Modal de Configurações de Voz, Som & Telão
  const btnToggleProjAudio = document.getElementById('btn-toggle-proj-audio');
  const lblProjAudio = document.getElementById('lbl-proj-audio');
  const btnTogglePanelAudio = document.getElementById('btn-toggle-panel-audio');
  const lblPanelAudio = document.getElementById('lbl-panel-audio');
  const btnToggleProjTheme = document.getElementById('btn-toggle-proj-theme');
  const lblProjThemeIcon = document.getElementById('lbl-proj-theme-icon');
  const lblProjThemeText = document.getElementById('lbl-proj-theme-text');

  function updateAudioModalOutputs() {
    const isProjMuted = localStorage.getItem('bingo.projector.muted') === '1';
    if (btnToggleProjAudio) {
      if (isProjMuted) {
        btnToggleProjAudio.className = 'btn btn-sm btn-outline-danger fw-bold px-3 py-1';
        btnToggleProjAudio.innerHTML = '<i data-lucide="volume-x" class="lucide-xs"></i> <span>Mutado</span>';
      } else {
        btnToggleProjAudio.className = 'btn btn-sm btn-outline-success fw-bold px-3 py-1';
        btnToggleProjAudio.innerHTML = '<i data-lucide="volume-2" class="lucide-xs"></i> <span>Ativado</span>';
      }
    }

    if (btnTogglePanelAudio) {
      if (muted) {
        btnTogglePanelAudio.className = 'btn btn-sm btn-outline-danger fw-bold px-3 py-1';
        btnTogglePanelAudio.innerHTML = '<i data-lucide="volume-x" class="lucide-xs"></i> <span>Mutado</span>';
      } else {
        btnTogglePanelAudio.className = 'btn btn-sm btn-outline-success fw-bold px-3 py-1';
        btnTogglePanelAudio.innerHTML = '<i data-lucide="volume-2" class="lucide-xs"></i> <span>Ativado</span>';
      }
    }

    // Atualiza botão do tema do telão
    const curTheme = localStorage.getItem('bingo.projector.theme') || 'light';
    const isDark = curTheme === 'dark';
    if (btnToggleProjTheme) {
      if (isDark) {
        btnToggleProjTheme.className = 'btn btn-sm btn-dark fw-bold px-3 py-1 d-inline-flex align-items-center gap-1.5';
        if (lblProjThemeText) lblProjThemeText.textContent = 'Modo Noturno';
        if (lblProjThemeIcon) lblProjThemeIcon.setAttribute('data-lucide', 'moon');
      } else {
        btnToggleProjTheme.className = 'btn btn-sm btn-outline-primary fw-bold px-3 py-1 d-inline-flex align-items-center gap-1.5';
        if (lblProjThemeText) lblProjThemeText.textContent = 'Modo Claro';
        if (lblProjThemeIcon) lblProjThemeIcon.setAttribute('data-lucide', 'sun');
      }
    }

    if (window.lucide) lucide.createIcons();
  }

  btnOpenVoice?.addEventListener('click', () => {
    loadVoices();
    if (rngRate) rngRate.value = rate;
    if (rngPitch) rngPitch.value = pitch;
    if (rngDingVol) rngDingVol.value = dingVol;
    if (lblVoiceRate) lblVoiceRate.textContent = `${rate}x`;
    if (lblVoicePitch) lblVoicePitch.textContent = `${pitch}`;
    if (lblDingVol) lblDingVol.textContent = `${Math.round(dingVol * 100)}%`;
    updateAudioModalOutputs();
    modalVoice?.removeAttribute('hidden');
    if (window.lucide) lucide.createIcons();
  });

  btnToggleProjAudio?.addEventListener('click', () => {
    const isMuted = localStorage.getItem('bingo.projector.muted') === '1';
    const newMuted = !isMuted;
    localStorage.setItem('bingo.projector.muted', newMuted ? '1' : '0');
    updateAudioModalOutputs();
    LS.save();
    window.BingoDialog?.toast(newMuted ? 'Som do Telão MUTADO' : 'Som do Telão ATIVADO', newMuted ? 'warning' : 'success');
  });

  btnTogglePanelAudio?.addEventListener('click', () => {
    muted = !muted;
    localStorage.setItem('bingo.panel.muted', muted ? '1' : '0');
    updateVoiceButton();
    updateAudioModalOutputs();
    if (muted && 'speechSynthesis' in window) speechSynthesis.cancel();
    window.BingoDialog?.toast(muted ? 'Som do Painel MUTADO' : 'Som do Painel ATIVADO', muted ? 'warning' : 'success');
  });

  btnToggleProjTheme?.addEventListener('click', () => {
    const curTheme = localStorage.getItem('bingo.projector.theme') || 'light';
    const newTheme = curTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('bingo.projector.theme', newTheme);
    updateAudioModalOutputs();

    try {
      const st = JSON.parse(localStorage.getItem('bingo.state') || '{}');
      st.projectorTheme = newTheme;
      localStorage.setItem('bingo.state', JSON.stringify(st));
    } catch (e) {}

    LS.save();
    if (window.BingoSync && BingoSync.ready()) {
      BingoSync.pushState({ projectorTheme: newTheme });
    }

    window.BingoDialog?.toast(`Telão alternado para ${newTheme === 'dark' ? 'Modo Noturno (Escuro)' : 'Modo Claro'}!`, 'success');
  });

  btnCloseVoice?.addEventListener('click', () => modalVoice?.setAttribute('hidden', ''));
  btnCloseVoiceX?.addEventListener('click', () => modalVoice?.setAttribute('hidden', ''));

  btnTestVoice?.addEventListener('click', () => {
    try { ding(920, 0.08); } catch (e) {}
    setTimeout(() => speakLongShort('B', 11, true), 200);
  });

  rngRate?.addEventListener('input', (e) => {
    rate = parseFloat(e.target.value);
    if (lblVoiceRate) lblVoiceRate.textContent = `${rate.toFixed(1)}x`;
    localStorage.setItem('bingo.rate', String(rate));
    LS.save();
  });

  rngPitch?.addEventListener('input', (e) => {
    pitch = parseFloat(e.target.value);
    if (lblVoicePitch) lblVoicePitch.textContent = `${pitch.toFixed(1)}`;
    LS.save();
  });

  rngDingVol?.addEventListener('input', (e) => {
    dingVol = parseFloat(e.target.value);
    if (lblDingVol) lblDingVol.textContent = `${Math.round(dingVol * 100)}%`;
    localStorage.setItem('bingo.dingvol', String(dingVol));
    LS.save();
  });

  selVoice?.addEventListener('change', (e) => {
    selectedVoiceName = e.target.value;
    localStorage.setItem('bingo.voice', selectedVoiceName);
    LS.save();
  });

  // Modal de Pedra Patrocinada
  btnConfirmSponsoredShow?.addEventListener('click', () => {
    if (!pendingSponsoredStone) return;
    const { num, sponsor } = pendingSponsoredStone;
    modalSponsoredAlert?.setAttribute('hidden', '');
    
    // Dispara o evento de oferecimento especial para o Telão
    const triggerData = {
      stone: num,
      letter: letterFor(num),
      sponsor: sponsor,
      ts: Date.now()
    };
    try { localStorage.setItem('bingo.sponsoredTrigger', JSON.stringify(triggerData)); } catch (e) {}
    
    // Transmissão direta via BroadcastChannel e Supabase Realtime
    if (window.BingoSync?.triggerSponsoredStone) {
      window.BingoSync.triggerSponsoredStone(triggerData);
    }
    
    // Salva estado e propaga para nuvem com force=true
    LS.save(true);
    
    executeDrawNumber(num);
    pendingSponsoredStone = null;
    window.BingoDialog?.toast(`⭐ Destaque de oferecimento enviado ao Telão!`, 'success');
  });

  btnSkipSponsoredShow?.addEventListener('click', () => {
    if (!pendingSponsoredStone) return;
    const { num } = pendingSponsoredStone;
    modalSponsoredAlert?.setAttribute('hidden', '');
    executeDrawNumber(num);
    pendingSponsoredStone = null;
  });

  btnCloseSponsoredX?.addEventListener('click', () => {
    modalSponsoredAlert?.setAttribute('hidden', '');
    pendingSponsoredStone = null;
  });

  // ====== MODAL DE CONFERÊNCIA & AUDITORIA DE CARTELAS (AO VIVO) ======
  let currentAuditFilter = 'batidas'; // 'batidas' | 'armadas' | 'all'
  let currentSelectedCardData = null;

  function openConferenciaModal(preselectedSerial = null) {
    if (!window.BingoCardsEngine) {
      window.BingoDialog?.toast('Mecanismo de cartelas ainda carregando...', 'warning');
      return;
    }
    const currentRoundId = roundId || localStorage.getItem('bingo.activeRoundId') || null;
    const audit = window.BingoCardsEngine.auditAllCardsForRound(drawn, currentRoundId);

    if (preselectedSerial != null) {
      currentAuditFilter = 'all';
    } else if (audit.batidasCards && audit.batidasCards.length > 0) {
      currentAuditFilter = 'batidas';
    } else if (audit.armadaCards && audit.armadaCards.length > 0) {
      currentAuditFilter = 'armadas';
    } else {
      currentAuditFilter = 'all';
    }

    renderConferenciaModal(preselectedSerial);
    modalArmadasDetail?.removeAttribute('hidden');
    if (window.lucide) lucide.createIcons();
  }

  function closeConferenciaModal() {
    modalArmadasDetail?.setAttribute('hidden', '');
    returnFocusToManualInput();
  }

  function renderConferenciaModal(preselectedSerial = null) {
    if (!window.BingoCardsEngine) return;
    const currentRoundId = roundId || localStorage.getItem('bingo.activeRoundId') || null;
    const audit = window.BingoCardsEngine.auditAllCardsForRound(drawn, currentRoundId);
    const activeBatch = window.BingoCardsEngine.Storage.getActiveBatch(currentRoundId);

    const batidasList = audit.batidasCards || [];
    const armadasList = audit.armadaCards || [];

    // Contadores
    if (modalCountBatidas) modalCountBatidas.textContent = batidasList.length;
    if (modalCountArmadas) modalCountArmadas.textContent = armadasList.length;
    if (modalCountAll) modalCountAll.textContent = audit.totalCardsAudited || 0;

    // Atualiza classes dos botões de filtro
    [btnFilterBatidas, btnFilterArmadas, btnFilterAll].forEach((btn) => {
      if (!btn) return;
      btn.className = 'btn btn-sm py-0.5 px-2.5 fw-bold';
      btn.style.borderRadius = '999px';
      btn.style.fontSize = '0.75rem';
    });

    if (currentAuditFilter === 'batidas') {
      if (btnFilterBatidas) btnFilterBatidas.className += ' btn-success text-white';
      if (btnFilterArmadas) btnFilterArmadas.className += ' btn-light border text-dark';
      if (btnFilterAll) btnFilterAll.className += ' btn-light border text-muted';
    } else if (currentAuditFilter === 'armadas') {
      if (btnFilterBatidas) btnFilterBatidas.className += ' btn-light border text-muted';
      if (btnFilterArmadas) btnFilterArmadas.className += ' btn-warning text-dark border-warning';
      if (btnFilterAll) btnFilterAll.className += ' btn-light border text-muted';
    } else {
      if (btnFilterBatidas) btnFilterBatidas.className += ' btn-light border text-muted';
      if (btnFilterArmadas) btnFilterArmadas.className += ' btn-light border text-dark';
      if (btnFilterAll) btnFilterAll.className += ' btn-primary text-white';
    }

    // Lista de cartelas a exibir
    let listToDisplay = [];
    if (currentAuditFilter === 'batidas') {
      listToDisplay = batidasList;
    } else if (currentAuditFilter === 'armadas') {
      listToDisplay = armadasList;
    } else {
      if (activeBatch && Array.isArray(activeBatch.cards)) {
        listToDisplay = activeBatch.cards.map((c) => {
          const evalRes = window.BingoCardsEngine.evaluateCard(c, drawn);
          return {
            serial: c.serial,
            formattedSerial: c.formattedSerial || String(c.serial).padStart(4, '0'),
            batchId: activeBatch.id,
            batchName: activeBatch.name,
            player: c.player || '',
            category: evalRes.isBingou ? 'Batida' : (evalRes.isArmada ? 'Armada' : `${evalRes.hits}/24 Acertos`),
            missingNumber: evalRes.missingNumbers?.[0] || null,
            hits: evalRes.hits,
            isBingou: evalRes.isBingou,
            isArmada: evalRes.isArmada,
            card: c,
            batch: activeBatch
          };
        });
      }
    }

    if (!modalAuditCardsList) return;

    if (!audit.totalCardsAudited) {
      modalAuditCardsList.innerHTML = `
        <div class="text-muted text-center py-4 small">
          Nenhum lote de cartelas cadastrado para esta rodada.<br>
          Gere um lote no menu <a href="cartelas.html" class="fw-bold text-primary">Cartelas</a>.
        </div>
      `;
      renderEmptyCardView();
      return;
    }

    if (!listToDisplay.length) {
      const label = currentAuditFilter === 'batidas' ? 'Nenhuma cartela batida no momento.' : (currentAuditFilter === 'armadas' ? 'Nenhuma cartela armada no momento.' : 'Nenhuma cartela encontrada.');
      modalAuditCardsList.innerHTML = `<div class="text-muted text-center py-4 small">${label}</div>`;
      if (!preselectedSerial) renderEmptyCardView();
    } else {
      modalAuditCardsList.innerHTML = listToDisplay.map((item) => {
        const isBatida = item.isBingou || item.category?.includes('Cheia') || item.category?.includes('Terno') || item.category?.includes('Cinquina') || item.category?.includes('Quatro');
        const badgeClass = isBatida ? 'bg-success text-white' : (item.isArmada ? 'bg-warning text-dark border border-warning' : 'bg-light text-secondary border');
        const iconSvg = isBatida ? ICONS.trophy : (item.isArmada ? ICONS.zap : ICONS.info);
        const subText = item.isArmada && item.missingNumber ? `Falta: ${letterFor(item.missingNumber)}-${item.missingNumber}` : (isBatida ? 'Batida Confirmada!' : `${item.hits || 0}/24 sorteadas`);

        return `
          <div class="modal-card-item" data-card-serial="${item.serial}">
            <div class="d-flex align-items-center gap-2 min-w-0 flex-grow-1">
              <span class="badge bg-dark text-white fw-bold font-monospace" style="font-size:0.78rem;">#${esc(item.formattedSerial || item.serial)}</span>
              <div class="min-w-0 flex-grow-1">
                <div class="fw-bold text-dark text-truncate" style="font-size:0.82rem;">${esc(item.player || item.batchName || 'Cartela Oficial')}</div>
                <div class="text-muted text-truncate" style="font-size:0.72rem;">${subText}</div>
              </div>
            </div>
            <div class="d-flex align-items-center gap-1.5 flex-shrink-0">
              <span class="badge rounded-pill ${badgeClass} fw-bold d-inline-flex align-items-center gap-1" style="font-size:0.68rem;">${iconSvg} <span>${esc(item.category || 'Ativa')}</span></span>
              <a href="check.html?serial=${item.serial}" target="_blank" class="btn btn-sm btn-light border py-0 px-1.5 text-primary fw-bold" style="font-size:0.7rem;" title="Abrir na Mesa Completa">
                ↗
              </a>
            </div>
          </div>
        `;
      }).join('');
    }

    // Seleção de Cartela
    let targetCardObj = null;
    if (preselectedSerial != null) {
      const found = window.BingoCardsEngine.Storage.findCardBySerial(preselectedSerial, currentRoundId);
      if (found) targetCardObj = found;
    }

    if (!targetCardObj && listToDisplay.length > 0) {
      const firstSerial = listToDisplay[0].serial;
      const found = window.BingoCardsEngine.Storage.findCardBySerial(firstSerial, currentRoundId);
      if (found) targetCardObj = found;
    }

    if (targetCardObj) {
      renderSelectedCardView(targetCardObj.card, targetCardObj.batch);
    }
  }

  function renderEmptyCardView() {
    if (modalViewCardTitle) modalViewCardTitle.textContent = 'Nenhuma cartela selecionada';
    if (modalViewCardBadge) {
      modalViewCardBadge.textContent = '--';
      modalViewCardBadge.className = 'badge bg-secondary';
    }
    if (modalViewCardBatch) modalViewCardBatch.textContent = 'Lote: --';
    if (modalViewCardPlayer) modalViewCardPlayer.textContent = 'Jogador: --';
    if (modalBingoMatrix) modalBingoMatrix.innerHTML = '<div class="text-muted small text-center py-4 w-100">Selecione uma cartela para visualizar</div>';
    if (modalViewCardAuth) modalViewCardAuth.textContent = 'Cód: --';
    if (modalViewCardHits) modalViewCardHits.textContent = '0/24 acertos';
    if (btnModalClaimWinner) {
      btnModalClaimWinner.disabled = true;
      btnModalClaimWinner.textContent = 'Registrar Como Ganhador';
    }
    const btnModalOpenCheckPage = document.getElementById('btn-modal-open-check-page');
    if (btnModalOpenCheckPage) btnModalOpenCheckPage.href = 'check.html';
    currentSelectedCardData = null;
  }

  function renderSelectedCardView(card, batch) {
    if (!card || !window.BingoCardsEngine) return;
    currentSelectedCardData = { card, batch };

    const evalRes = window.BingoCardsEngine.evaluateCard(card, drawn);
    const serialStr = card.formattedSerial || String(card.serial).padStart(4, '0');
    const hits = evalRes.totalHits != null ? evalRes.totalHits : (evalRes.hits || 0);

    document.querySelectorAll('.modal-card-item').forEach((el) => {
      if (parseInt(el.dataset.cardSerial, 10) === card.serial) el.classList.add('selected');
      else el.classList.remove('selected');
    });

    if (modalViewCardTitle) modalViewCardTitle.textContent = `Cartela #${serialStr}`;
    if (modalViewCardBatch) modalViewCardBatch.textContent = `Lote: ${batch?.name || 'Principal'}`;
    if (modalViewCardPlayer) modalViewCardPlayer.textContent = `Jogador: ${card.player || 'Não atribuído'}`;
    if (modalViewCardAuth) modalViewCardAuth.textContent = `Cód: ${card.authCode || 'OFICIAL-VALIDADO'}`;
    if (modalViewCardHits) modalViewCardHits.textContent = `${hits}/24 acertos (${Math.round((hits / 24) * 100)}%)`;

    const btnModalOpenCheckPage = document.getElementById('btn-modal-open-check-page');
    if (btnModalOpenCheckPage) {
      btnModalOpenCheckPage.href = `check.html?serial=${card.serial}`;
    }

    const isCheia = evalRes.isCartelaCheia || evalRes.categories?.cartelaCheia;
    const isTerno = evalRes.isTerno || evalRes.categories?.terno;
    const isCinquina = evalRes.isCinquina || evalRes.categories?.cinquina;
    const isCantos = evalRes.isQuatroCantos || evalRes.categories?.quatroCantos;
    const isBatida = isCheia || isTerno || isCinquina || isCantos || evalRes.isBingou;

    let bestCategory = isCheia ? 'Cartela Cheia' : (isCinquina ? 'Cinquina' : (isCantos ? 'Quatro Cantos' : (isTerno ? 'Terno' : '')));

    const missingArr = [
      ...(evalRes.missingCheiaNumber ? [evalRes.missingCheiaNumber] : []),
      ...(evalRes.missingCinquinaNumbers || []),
      ...(evalRes.missingCornerNumbers || []),
      ...(evalRes.missingTernoNumbers || []),
      ...(evalRes.missingNumbers || [])
    ];
    const missingSet = new Set(missingArr);

    if (modalViewCardBadge) {
      if (isBatida) {
        modalViewCardBadge.innerHTML = `<span class="d-inline-flex align-items-center gap-1">${ICONS.trophy} <span>BATIDA: ${esc(bestCategory || 'BINGO')}</span></span>`;
        modalViewCardBadge.className = 'badge bg-success fw-bold px-2 py-1';
      } else if (evalRes.isArmada) {
        const missShort = Array.from(missingSet).slice(0, 3).map((n) => letterFor(n) + '-' + n).join(', ');
        const extra = missingSet.size > 3 ? ` +${missingSet.size - 3}` : '';
        modalViewCardBadge.innerHTML = `<span class="d-inline-flex align-items-center gap-1">${ICONS.zap} <span>ARMADA (Falta: ${esc(missShort + extra)})</span></span>`;
        modalViewCardBadge.className = 'badge bg-warning text-dark border border-warning fw-bold px-2 py-1';
      } else {
        modalViewCardBadge.textContent = `${hits}/24 Acertos`;
        modalViewCardBadge.className = 'badge bg-secondary fw-bold px-2 py-1';
      }
    }

    if (btnModalClaimWinner) {
      if (isBatida) {
        btnModalClaimWinner.disabled = false;
        btnModalClaimWinner.className = 'btn btn-success flex-grow-1 fw-bold py-1.5 shadow-sm d-flex align-items-center justify-content-center gap-1';
        btnModalClaimWinner.innerHTML = `<i data-lucide="trophy" class="lucide-sm"></i> Registrar Vitória (${bestCategory || 'Ganhador'})`;
      } else {
        btnModalClaimWinner.disabled = true;
        btnModalClaimWinner.className = 'btn btn-light border flex-grow-1 fw-bold text-muted py-1.5 d-flex align-items-center justify-content-center gap-1';
        btnModalClaimWinner.innerHTML = `Cartela em Jogo (${hits}/24 Acertos)`;
      }
    }

    if (modalBingoMatrix) {
      let html = `
        <div class="card-col-header header-b">B</div>
        <div class="card-col-header header-i">I</div>
        <div class="card-col-header header-n">N</div>
        <div class="card-col-header header-g">G</div>
        <div class="card-col-header header-o">O</div>
      `;

      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (row === 2 && col === 2) {
            html += `<div class="card-grid-cell free hit">FREE</div>`;
            continue;
          }

          const num = (card.grid && card.grid[row] && card.grid[row][col] != null)
            ? card.grid[row][col]
            : (card.numbers && card.numbers[col] && card.numbers[col][row] != null ? card.numbers[col][row] : null);

          if (!num) {
            html += `<div class="card-grid-cell empty">—</div>`;
            continue;
          }

          const isHit = drawn.includes(num);
          const isMissing = missingSet.has(num);

          if (isHit) {
            html += `<div class="card-grid-cell hit">${num}</div>`;
          } else if (isMissing) {
            html += `<div class="card-grid-cell missing">${num}</div>`;
          } else {
            html += `<div class="card-grid-cell normal">${num}</div>`;
          }
        }
      }

      modalBingoMatrix.innerHTML = html;
    }

    if (window.lucide) lucide.createIcons();
  }

  // Event Listeners do Modal de Conferência
  btnOpenConferencia?.addEventListener('click', () => openConferenciaModal());
  chipArmada?.addEventListener('click', () => openConferenciaModal());
  btnCloseArmadas?.addEventListener('click', closeConferenciaModal);
  btnCloseArmadasX?.addEventListener('click', closeConferenciaModal);

  document.getElementById('tv-auditor-panel')?.addEventListener('click', (e) => {
    const btnConferir = e.target.closest('.auditor-btn-conferir');
    const chipArmadaEl = e.target.closest('.auditor-armada-chip');
    const banner = e.target.closest('.auditor-bingou-banner, .auditor-batida-banner');

    if (btnConferir || banner) {
      e.preventDefault();
      openConferenciaModal();
      return;
    }

    if (chipArmadaEl) {
      e.preventDefault();
      const serialTxt = chipArmadaEl.querySelector('.armada-serial')?.textContent?.replace('#', '');
      const serialNum = parseInt(serialTxt, 10);
      openConferenciaModal(isNaN(serialNum) ? null : serialNum);
      return;
    }
  });

  btnFilterBatidas?.addEventListener('click', () => {
    currentAuditFilter = 'batidas';
    renderConferenciaModal();
  });
  btnFilterArmadas?.addEventListener('click', () => {
    currentAuditFilter = 'armadas';
    renderConferenciaModal();
  });
  btnFilterAll?.addEventListener('click', () => {
    currentAuditFilter = 'all';
    renderConferenciaModal();
  });

  function handleCardSearch() {
    if (!modalCardSerialInput) return;
    const val = parseInt(modalCardSerialInput.value, 10);
    if (isNaN(val) || val < 1) {
      window.BingoDialog?.toast('Digite um número de cartela válido.', 'warning');
      return;
    }
    const currentRoundId = roundId || localStorage.getItem('bingo.activeRoundId') || null;
    const found = window.BingoCardsEngine.Storage.findCardBySerial(val, currentRoundId);
    if (found) {
      renderSelectedCardView(found.card, found.batch);
    } else {
      window.BingoDialog?.toast(`Cartela #${val} não encontrada no lote desta rodada.`, 'warning');
    }
  }

  btnModalSearchCard?.addEventListener('click', handleCardSearch);
  modalCardSerialInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCardSearch();
    }
  });

  modalAuditCardsList?.addEventListener('click', (e) => {
    const item = e.target.closest('.modal-card-item');
    if (!item) return;
    const serial = parseInt(item.dataset.cardSerial, 10);
    if (isNaN(serial)) return;
    const currentRoundId = roundId || localStorage.getItem('bingo.activeRoundId') || null;
    const found = window.BingoCardsEngine.Storage.findCardBySerial(serial, currentRoundId);
    if (found) {
      renderSelectedCardView(found.card, found.batch);
    }
  });

  btnModalClaimWinner?.addEventListener('click', async () => {
    if (!currentSelectedCardData) return;
    const { card, batch } = currentSelectedCardData;
    const evalRes = window.BingoCardsEngine.evaluateCard(card, drawn);
    const isCheia = evalRes.isCartelaCheia || evalRes.categories?.cartelaCheia;
    const isCinquina = evalRes.isCinquina || evalRes.categories?.cinquina;
    const isCantos = evalRes.isQuatroCantos || evalRes.categories?.quatroCantos;
    const isTerno = evalRes.isTerno || evalRes.categories?.terno;
    const bestCat = isCheia ? 'Cartela Cheia' : (isCinquina ? 'Cinquina' : (isCantos ? 'Quatro Cantos' : (isTerno ? 'Terno' : 'Cartela Cheia')));

    let playerName = card.player;
    if (!playerName || !playerName.trim()) {
      if (window.BingoDialog?.prompt) {
        playerName = await window.BingoDialog.prompt({
          title: 'Registrar Vencedor Oficial',
          message: `Informe o nome do jogador da <b>Cartela #${card.formattedSerial || card.serial}</b> para registrar a vitória em <b>${bestCat}</b>:`,
          placeholder: 'Ex: João da Silva',
          defaultValue: '',
          confirmText: 'Confirmar Vitória',
          cancelText: 'Cancelar',
          icon: 'trophy'
        });
      } else {
        playerName = 'Jogador Oficial';
      }
    }
    if (!playerName || !playerName.trim()) return;

    const ranking = LS.loadRanking();
    const prizeDesc = (prizes && prizes[bestCat]) ? prizes[bestCat] : 'Prêmio Oficial';
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const nowTs = now.getTime();

    ranking.unshift({
      id: String(nowTs),
      ts: nowTs,
      time: timeStr,
      name: playerName.trim(),
      cardNum: card.formattedSerial || String(card.serial),
      type: bestCat,
      prize: prizeDesc,
      round: roundName || 'Rodada 1'
    });

    LS.saveRanking(ranking);
    LS.save();
    updateUI();

    closeConferenciaModal();
    window.BingoDialog?.toast(`Vencedor da Cartela #${card.serial} (${bestCat}) registrado com sucesso!`, 'success');
  });

  // Modal de Atalhos & Tela Cheia
  function toggleFull() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
  btnFull?.addEventListener('click', toggleFull);
  btnHelp?.addEventListener('click', () => document.getElementById('shortcuts')?.removeAttribute('hidden'));

  // Exportação PDF / CSV
  btnExportPDF?.addEventListener('click', () => {
    if (window.BingoPDFExport) window.BingoPDFExport.exportRankingPDF();
  });
  btnExportCSV?.addEventListener('click', () => {
    if (window.BingoPDFExport) window.BingoPDFExport.exportRankingCSV();
  });

  // Teclado Global
  document.addEventListener('keydown', (e) => {
    const isEditing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName);
    
    // Se o operador estiver no campo de digitação rápida manual
    if (e.target === inpQuick) {
      if (e.key === 'Escape') {
        inpQuick.value = '';
        inpQuick.blur();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        markManualInput();
        return;
      }
      // Atalho Ctrl+Z mesmo dentro do campo de digitação
      if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        undo();
        return;
      }
      // Se for apenas digitação normal de número, deixa o input processar
      return;
    }

    // Se estiver em outro campo de texto de algum modal
    if (isEditing) {
      if (e.key === 'Escape') {
        closeAllModals();
      }
      return;
    }

    // Se pressionar Escape fora de inputs: fecha qualquer modal aberto
    if (e.key === 'Escape') {
      closeAllModals();
      return;
    }

    // Atalhos Globais:
    if (e.code === 'Space') {
      e.preventDefault();
      if (mode === 'auto') {
        if (!isAutoOn()) {
          drawOne();
        } else {
          stopAuto();
        }
      } else {
        returnFocusToManualInput();
      }
    } else if (e.key === 'c' || e.key === 'C') {
      e.preventDefault();
      if (modalArmadasDetail && !modalArmadasDetail.hasAttribute('hidden')) {
        closeConferenciaModal();
      } else {
        openConferenciaModal();
      }
    } else if ((e.ctrlKey && (e.key === 'z' || e.key === 'Z')) || (!e.ctrlKey && (e.key === 'u' || e.key === 'U'))) {
      e.preventDefault();
      undo();
    } else if (e.key === 'a' || e.key === 'A') {
      if (mode === 'auto') {
        e.preventDefault();
        btnAuto?.click();
      }
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      btnReset?.click();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      btnVoice?.click();
    } else if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      btnAdToggle?.click();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFull();
    } else if (e.key === '?' || e.key === 'h' || e.key === 'H') {
      e.preventDefault();
      document.getElementById('shortcuts')?.removeAttribute('hidden');
    } else if (mode === 'manual' && !e.ctrlKey && !e.altKey && !e.metaKey && e.key >= '0' && e.key <= '9') {
      // Digitação direta no modo manual redireciona para o campo rápido
      if (inpQuick && document.activeElement !== inpQuick) {
        inpQuick.focus();
        inpQuick.value = e.key;
        e.preventDefault();
      }
    }
  });

  // Storage
  window.addEventListener('storage', (e) => {
    if (['bingo.ranking', 'bingo.state', 'bingo.prizes', 'bingo.roundsList', 'bingo.activeRoundId', 'bingo.adMode'].includes(e.key)) {
      LS.load();
      if (gameOver) stopAuto();
      updateUI();
    }
  });

  // Início Imediato sem piscar
  function initApp() {
    LS.load();
    setMode(mode, false);
    if (selInterval) selInterval.value = String(intervalMs);
    updateUI();
    if (window.lucide) lucide.createIcons();
    returnFocusToManualInput();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  window.addEventListener('load', () => {
    if (window.lucide) lucide.createIcons();
  });

  initCloudSync();
})();
