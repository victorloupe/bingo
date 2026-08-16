// ============================================================
// Bingo 75 — Lógica do Modo Telão / Projetor & Comerciais
// ============================================================

(function () {
  const LETTERS = ['B', 'I', 'N', 'G', 'O'];
  const ranges = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };
  const letterFor = (n) => (n <= 15 ? 'B' : n <= 30 ? 'I' : n <= 45 ? 'N' : n <= 60 ? 'G' : 'O');

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

  const SAMPLE_SPONSORS = [
    { id: '1', name: 'Supermercado Bom Preço', desc: 'Orgulho em apoiar a nossa comunidade!', img: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80' },
    { id: '2', name: 'Posto Alvorada', desc: 'Combustível de qualidade e troca de óleo garantida.', img: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80' },
    { id: '3', name: 'Padaria & Confeitaria Estrela', desc: 'Pães quentinhos e bolos especiais todos os dias!', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80' }
  ];

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Estado Local
  let drawn = [];
  let last = null;
  let gameOver = false;
  let roundName = 'Rodada 1';
  let prizes = Object.assign({}, DEFAULT_PRIZES);
  let sponsors = SAMPLE_SPONSORS;
  let adMode = false;
  let currentAdIndex = 0;
  let adIntervalTimer = null;

  let soundEnabled = localStorage.getItem('bingo.projector.sound') !== '0';
  let previousRankingCount = 0;
  let previousDrawnLength = 0;
  let previousLast = null;

  // Elementos DOM
  const elStatDrawn = document.getElementById('stat-drawn');
  const elStatLeft = document.getElementById('stat-left');
  const elStatClock = document.getElementById('stat-clock');
  const elStatStatus = document.getElementById('chip-status');
  const elRoundBadge = document.getElementById('proj-round-badge');
  const elBigLetter = document.getElementById('big-letter');
  const elBigNumber = document.getElementById('big-number');
  const elBallSphere = document.getElementById('ball-sphere');
  const elBallCaption = document.getElementById('ball-caption');
  const elHistory = document.getElementById('history');
  const elGrid = document.getElementById('grid');
  const elRankingBody = document.getElementById('ranking-body');
  const elPrizesGrid = document.getElementById('prizes-grid');
  const elUnmuteBanner = document.getElementById('unmute-banner');
  
  // Elementos da Barra de Avisos ao Vivo (Rodapé)
  const elLiveNoticeBar = document.getElementById('live-notice-bar');
  const elNoticeIcon = document.getElementById('notice-icon');
  const elNoticeBadge = document.getElementById('notice-badge');
  const elNoticeText = document.getElementById('notice-text');

  let activeCelebrationWinner = null;
  let celebrationClearTimer = null;

  // Elementos Comerciais / Propaganda
  const adOverlay = document.getElementById('ad-overlay');
  const adImg = document.getElementById('ad-img');
  const adName = document.getElementById('ad-name');
  const adDesc = document.getElementById('ad-desc');
  const adLastBall = document.getElementById('ad-last-ball');
  const adTotalDrawn = document.getElementById('ad-total-drawn');
  const adSlideBox = document.getElementById('ad-slide-box');

  // Botões
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const soundIcon = document.getElementById('sound-icon');
  const soundLabel = document.getElementById('sound-label');
  const btnFull = document.getElementById('btn-full');
  const btnShare = document.getElementById('btn-share');
  const modalShare = document.getElementById('modal-share');
  const btnCloseShare = document.getElementById('btn-close-share');
  const btnCopyLink = document.getElementById('btn-copy-link');
  const shareLinkInput = document.getElementById('share-link-input');

  // ====== Áudio & Síntese Sonora do Telão (Web Audio API) ======
  let audioCtx, masterGain;

  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.9;
      masterGain.connect(audioCtx.destination);
      if (elUnmuteBanner) elUnmuteBanner.setAttribute('hidden', '');
    } catch (e) {}
  }

  function unlockAudioOnUserGesture() {
    if (!audioCtx) initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (elUnmuteBanner) elUnmuteBanner.setAttribute('hidden', '');
  }

  function playTone(freq, duration = 0.1, delay = 0, type = 'sine') {
    const isMuted = localStorage.getItem('bingo.projector.muted') === '1';
    if (isMuted || !soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(masterGain);

      const dingVol = parseFloat(localStorage.getItem('bingo.dingvol') || '0.6');
      const actualVol = (isNaN(dingVol) ? 0.6 : dingVol) * 0.5;

      const startTime = audioCtx.currentTime + delay;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(actualVol, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    } catch (e) {}
  }

  function playDrawDing() {
    playTone(920, 0.12, 0);
    playTone(1380, 0.18, 0.07);
  }

  function playVictoryFanfare() {
    const isMuted = localStorage.getItem('bingo.projector.muted') === '1';
    if (isMuted || !soundEnabled || !audioCtx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, i) => playTone(freq, 0.22, i * 0.12, 'triangle'));
  }

  // ====== Síntese de Voz (TTS) — Mesma Voz e Taxa do Painel ======
  function sayLetter(L) { return L === 'O' ? 'Ó' : L; }

  function speakBall(L, n) {
    const isMuted = localStorage.getItem('bingo.projector.muted') === '1';
    if (isMuted || !soundEnabled || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      speechSynthesis.resume();
      
      const savedVoice = localStorage.getItem('bingo.voice');
      const savedRate = parseFloat(localStorage.getItem('bingo.rate') || '1.0');
      const voices = speechSynthesis.getVoices();
      const chosen = voices.find(v => v.name === savedVoice) ||
                     voices.find(v => /pt-BR/i.test(v.lang) && /Google|Natural|Neural/i.test(v.name)) ||
                     voices.find(v => /pt-BR/i.test(v.lang)) || voices[0];

      const mk = (text) => {
        const u = new SpeechSynthesisUtterance(text);
        if (chosen) { u.voice = chosen; u.lang = chosen.lang; } else { u.lang = 'pt-BR'; }
        u.rate = isNaN(savedRate) ? 1.0 : savedRate;
        u.pitch = 1.0;
        return u;
      };

      const u1 = mk(`Letra ${sayLetter(L)}, número ${n}`);
      const u2 = mk(`${sayLetter(L)} ${n}`);

      u1.onend = () => {
        try { speechSynthesis.speak(u2); } catch (e) {}
      };

      speechSynthesis.speak(u1);
    } catch (e) {}
  }

  // Elementos do Banner de Próxima Rodada
  const adNextBanner = document.getElementById('ad-next-banner');
  const adNextTitle = document.getElementById('ad-next-title');
  const adNextPrizes = document.getElementById('ad-next-prizes');
  const adLastRound = document.getElementById('ad-last-round');

  let nextRound = null;
  let roundsQueue = [];
  let adNotice = null;

  // ====== Modo Propaganda / Comercial Slider ======
  function updateAdCarousel() {
    if (!adOverlay) return;
    if (!adMode) {
      adOverlay.setAttribute('hidden', '');
      if (adIntervalTimer) { clearInterval(adIntervalTimer); adIntervalTimer = null; }
      return;
    }

    adOverlay.removeAttribute('hidden');
    if (adLastBall) adLastBall.textContent = last != null ? `${letterFor(last)} - ${last}` : '—';
    if (adTotalDrawn) adTotalDrawn.textContent = `${drawn.length}/75`;
    if (adLastRound) adLastRound.textContent = roundName || 'Rodada 1';

    // Banner de Intervalo / Próxima Rodada / Comunicado Personalizado
    let customNotice = adNotice;
    if (!customNotice) {
      try { customNotice = JSON.parse(localStorage.getItem('bingo.adNotice') || 'null'); } catch (e) {}
    }

    if (customNotice && customNotice.title && adNextBanner) {
      adNextBanner.style.display = 'flex';
      if (adNextTitle) adNextTitle.innerHTML = esc(customNotice.title);
      if (adNextPrizes) adNextPrizes.innerHTML = esc(customNotice.desc || '');
    } else {
      let nextItem = nextRound;
      if (!nextItem && Array.isArray(roundsQueue) && roundsQueue.length > 0) {
        nextItem = roundsQueue[0];
      }

      if (nextItem && adNextBanner) {
        adNextBanner.style.display = 'flex';
        if (adNextTitle) adNextTitle.innerHTML = `👉 A SEGUIR: <b>${esc(nextItem.name)}</b>`;
        const p = nextItem.prizes || {};
        const cheia = p['Cartela Cheia'] ? `🏆 Cartela Cheia: <b>${esc(p['Cartela Cheia'])}</b>` : '';
        const outros = [
          p['Terno'] ? `Terno: ${esc(p['Terno'])}` : '',
          p['Quatro Cantos'] ? `4 Cantos: ${esc(p['Quatro Cantos'])}` : '',
          p['Cinquina'] ? `Cinquina: ${esc(p['Cinquina'])}` : ''
        ].filter(Boolean).join(' • ');

        if (adNextPrizes) {
          adNextPrizes.innerHTML = `${cheia}${cheia && outros ? ' &nbsp;|&nbsp; ' : ''}${outros}`;
        }
      } else if (adNextBanner) {
        if (adNextTitle) adNextTitle.innerHTML = `👉 A SEGUIR: <b>Próxima Rodada</b>`;
        if (adNextPrizes) adNextPrizes.innerHTML = `Fiquem atentos para a próxima chamada de pedras!`;
      }
    }

    const spList = sponsors && sponsors.length ? sponsors : SAMPLE_SPONSORS;
    if (currentAdIndex >= spList.length) currentAdIndex = 0;
    const cur = spList[currentAdIndex];

    if (cur) {
      if (adImg) adImg.src = cur.img || 'favicon.svg';
      if (adName) adName.textContent = cur.name || 'Patrocinador Oficial';
      if (adDesc) adDesc.textContent = cur.desc || 'Apoio aos nossos eventos';
      
      if (adSlideBox) {
        adSlideBox.style.animation = 'none';
        void adSlideBox.offsetWidth;
        adSlideBox.style.animation = 'popInAd 0.5s cubic-bezier(0.2, 0.9, 0.2, 1)';
      }
    }

    if (!adIntervalTimer) {
      adIntervalTimer = setInterval(() => {
        const list = sponsors && sponsors.length ? sponsors : SAMPLE_SPONSORS;
        currentAdIndex = (currentAdIndex + 1) % list.length;
        updateAdCarousel();
      }, 5000);
    }
  }

  // ====== Renderização de Prêmios Compactos (Apenas prêmios configurados) ======
  function renderPrizes() {
    if (!elPrizesGrid) return;
    elPrizesGrid.innerHTML = '';

    let ranking = [];
    try { ranking = JSON.parse(localStorage.getItem('bingo.ranking') || '[]'); } catch (e) {}

    const winnersMap = {};
    ranking.forEach((r) => {
      if (r.type && !winnersMap[r.type]) winnersMap[r.type] = r;
    });

    const modalities = ['Terno', 'Quatro Cantos', 'Cinquina', 'Cartela Cheia'];
    const customKeys = Object.keys(prizes || {}).filter(k => !modalities.includes(k));
    const allKeys = [...modalities, ...customKeys];

    let renderedCount = 0;

    allKeys.forEach((mod) => {
      const prizeName = (prizes[mod] || '').trim();
      if (!prizeName) return; // Se o usuário apagou ou não configurou, não exibe!

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
      elPrizesGrid.innerHTML = '<div class="text-muted small py-1">Prêmio em disputa a ser anunciado pelo operador.</div>';
    }
  }

  // ====== Renderização da Interface ======
  function renderGrid() {
    if (!elGrid) return;
    elGrid.innerHTML = '';
    const drawnSet = new Set(drawn);

    for (const L of LETTERS) {
      const [min, max] = ranges[L];
      const colNums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      const drawnCount = colNums.filter((n) => drawnSet.has(n)).length;

      const col = document.createElement('div');
      col.className = 'col';

      const header = document.createElement('header');
      header.innerHTML = `<span class="letter">${L}</span><span class="sub">${drawnCount}/15</span>`;

      const body = document.createElement('div');
      body.className = 'body';

      colNums.forEach((n) => {
        const isDrawn = drawnSet.has(n);
        const isLast = n === last;
        const cell = document.createElement('div');
        cell.className = 'cell tabnum' + (isDrawn ? ' drawn' : '') + (isLast ? ' last' : '');
        cell.textContent = n;
        body.appendChild(cell);
      });

      col.appendChild(header);
      col.appendChild(body);
      elGrid.appendChild(col);
    }
  }

  function renderBigBall() {
    if (!elBigLetter || !elBigNumber) return;

    if (last != null) {
      const L = letterFor(last);
      elBigLetter.textContent = L;
      elBigNumber.textContent = last;
      elBallCaption.textContent = `${L} - ${last}`;
    } else {
      elBigLetter.textContent = '—';
      elBigNumber.textContent = '—';
      elBallCaption.textContent = 'Aguardando';
    }
  }

  function renderHistory() {
    if (!elHistory) return;
    elHistory.innerHTML = '';
    if (!drawn.length) {
      elHistory.innerHTML = '<span class="text-muted small">Nenhuma pedra sorteada ainda.</span>';
      return;
    }
    drawn.forEach((n) => {
      const L = letterFor(n);
      const span = document.createElement('span');
      span.className = 'hchip tabnum' + (n === last ? ' last' : '');
      span.textContent = `${L} ${n}`;
      elHistory.appendChild(span);
    });
    elHistory.scrollLeft = elHistory.scrollWidth;
  }

  function renderRanking() {
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem('bingo.ranking') || '[]');
    } catch (e) {
      list = [];
    }

    if (list.length > previousRankingCount) {
      const newest = list[list.length - 1];
      showVictoryCelebration(newest);
      previousRankingCount = list.length;
    } else {
      previousRankingCount = list.length;
    }

    renderPrizes();

    if (!elRankingBody) return;

    if (!list.length) {
      elRankingBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-2" style="font-size:0.8rem;">Nenhum vencedor registrado.</td></tr>';
      return;
    }

    const sorted = list.slice().sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0));
    elRankingBody.innerHTML = sorted.map((r, idx) => {
      const prizeWon = prizes[r.type] || DEFAULT_PRIZES[r.type] || '—';
      return `
        <tr>
          <td class="tabnum fw-bold">${idx + 1}</td>
          <td class="fw-bold">${esc(r.name || r.player)}</td>
          <td><span class="badge-type">${esc(r.type)}</span></td>
          <td class="fw-bold text-success" style="font-size:0.8rem;">${esc(prizeWon)}</td>
          <td class="text-muted small">${new Date(r.ts || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
        </tr>
      `;
    }).join('');
  }

  function updateLiveNoticeBar() {
    if (!elLiveNoticeBar || !elNoticeIcon || !elNoticeBadge || !elNoticeText) return;

    const isConference = localStorage.getItem('bingo.conferenceMode') === '1';

    if (activeCelebrationWinner) {
      const prizeWon = prizes[activeCelebrationWinner.type] || DEFAULT_PRIZES[activeCelebrationWinner.type] || '';
      elLiveNoticeBar.className = 'live-notice-bar state-winner';
      elNoticeIcon.innerHTML = '<i data-lucide="award" class="lucide-sm text-warning"></i>';
      elNoticeBadge.textContent = 'TEMOS GANHADOR!';
      elNoticeText.innerHTML = `<b>${esc(activeCelebrationWinner.name || activeCelebrationWinner.player)}</b> ganhou o <b>${esc(activeCelebrationWinner.type)}</b>! Prêmio: <b>${esc(prizeWon)}</b>!`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    if (isConference) {
      elLiveNoticeBar.className = 'live-notice-bar state-conference';
      elNoticeIcon.innerHTML = '<i data-lucide="search" class="lucide-sm text-warning"></i>';
      elNoticeBadge.textContent = 'CONFERÊNCIA EM ANDAMENTO';
      elNoticeText.innerHTML = `Mesa de Conferência ativa: Conferindo cartela no momento... Aguarde a validação dos números!`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    if (gameOver) {
      elLiveNoticeBar.className = 'live-notice-bar state-gameover';
      elNoticeIcon.innerHTML = '<i data-lucide="flag" class="lucide-sm"></i>';
      elNoticeBadge.textContent = 'ENCERRADO';
      elNoticeText.innerHTML = `Rodada encerrada com sucesso! Parabéns a todos os ganhadores da noite!`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    if (drawn.length > 0) {
      const L = last != null ? letterFor(last) : '';
      elLiveNoticeBar.className = 'live-notice-bar state-idle';
      elNoticeIcon.innerHTML = '<i data-lucide="dices" class="lucide-sm text-primary"></i>';
      elNoticeBadge.textContent = 'AO VIVO';
      elNoticeText.innerHTML = `Sorteio em andamento • <b>${drawn.length}/75</b> sorteadas (Restam <b>${75 - drawn.length}</b>). Última pedra sorteada: <b>${L} ${last ?? '—'}</b>.`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    elLiveNoticeBar.className = 'live-notice-bar state-idle';
    elNoticeIcon.innerHTML = '<i data-lucide="sparkles" class="lucide-sm text-primary"></i>';
    elNoticeBadge.textContent = 'BINGO 75';
    elNoticeText.innerHTML = `Aguardando início do sorteio desta rodada. Boa sorte a todos os participantes!`;
    if (window.lucide) lucide.createIcons();
  }

  function showVictoryCelebration(winner) {
    if (!winner) return;
    activeCelebrationWinner = winner;
    if (celebrationClearTimer) clearTimeout(celebrationClearTimer);

    if (typeof window.confetti === 'function') {
      try {
        confetti({ particleCount: 80, spread: 70, origin: { x: 0.2, y: 0.6 } });
        confetti({ particleCount: 80, spread: 70, origin: { x: 0.8, y: 0.6 } });
        setTimeout(() => {
          try { confetti({ particleCount: 120, spread: 100, origin: { y: 0.4 } }); } catch (e) {}
        }, 400);
      } catch (e) {}
    }

    playVictoryFanfare();
    updateLiveNoticeBar();

    celebrationClearTimer = setTimeout(() => {
      activeCelebrationWinner = null;
      updateLiveNoticeBar();
    }, 12000);
  }

  function updateUI(isDrawEvent = false) {
    if (elStatDrawn) elStatDrawn.textContent = `${drawn.length}/75`;
    if (elStatLeft) elStatLeft.textContent = `${75 - drawn.length}`;
    if (elRoundBadge) elRoundBadge.textContent = roundName || 'Rodada 1';
    if (elStatStatus) {
      elStatStatus.innerHTML = gameOver ? '<i data-lucide="flag" class="lucide-sm"></i> Encerrado' : (drawn.length > 0 ? '<i data-lucide="activity" class="lucide-sm text-success"></i> Em Andamento' : '<i data-lucide="clock" class="lucide-sm text-primary"></i> Aguardando');
      elStatStatus.className = 'chip d-inline-flex align-items-center gap-1 ' + (gameOver ? 'sync-disabled' : (drawn.length > 0 ? 'sync-online' : ''));
    }

    renderBigBall();
    renderGrid();
    renderHistory();
    renderRanking();
    renderPrizes();
    updateLiveNoticeBar();
    updateAdCarousel();
    if (window.lucide) lucide.createIcons();
  }

  function handleStateChange(newState) {
    if (!newState) return;
    const newDrawn = Array.isArray(newState.drawn) ? newState.drawn : [];
    const isNewBall = newDrawn.length > previousDrawnLength && newState.last != null && newState.last !== previousLast;

    drawn = newDrawn;
    last = newState.last ?? null;
    gameOver = !!newState.gameOver;
    if (newState.roundName) roundName = newState.roundName;
    nextRound = newState.nextRound ?? null;
    roundsQueue = Array.isArray(newState.roundsQueue) ? newState.roundsQueue : [];
    adNotice = newState.adNotice ?? null;
    
    // adMode é persistente
    if (typeof newState.adMode === 'boolean') {
      adMode = newState.adMode;
    } else {
      adMode = localStorage.getItem('bingo.adMode') === '1';
    }

    if (typeof newState.conferenceMode === 'boolean') {
      localStorage.setItem('bingo.conferenceMode', newState.conferenceMode ? '1' : '0');
    }

    if (newState.prizes) prizes = Object.assign({}, DEFAULT_PRIZES, newState.prizes);
    if (Array.isArray(newState.sponsors) && newState.sponsors.length > 0) sponsors = newState.sponsors;

    if (isNewBall) {
      const L = letterFor(last);
      playDrawDing();
      speakBall(L, last);
    }

    previousDrawnLength = drawn.length;
    previousLast = last;

    updateUI(isNewBall);
  }

  function loadLocalState() {
    try {
      const st = JSON.parse(localStorage.getItem('bingo.state') || '{}');
      const localPrizes = JSON.parse(localStorage.getItem('bingo.prizes') || 'null');
      if (localPrizes) prizes = Object.assign({}, DEFAULT_PRIZES, localPrizes);
      const localSponsors = JSON.parse(localStorage.getItem('bingo.sponsors') || 'null');
      if (Array.isArray(localSponsors) && localSponsors.length > 0) sponsors = localSponsors;
      const localQueue = JSON.parse(localStorage.getItem('bingo.roundsQueue') || 'null');
      if (Array.isArray(localQueue)) roundsQueue = localQueue;
      if (localStorage.getItem('bingo.adMode') === '1') adMode = true;
      handleStateChange(st);
    } catch (e) {}
  }

  // ====== Sincronização em Nuvem (Supabase) ======
  async function initSync() {
    if (!window.BingoSync) return;
    BingoSync.init();
    if (!BingoSync.ready()) return;

    try {
      const [remoteState, remoteRanking] = await Promise.all([
        BingoSync.pullState(),
        BingoSync.pullRanking()
      ]);

      if (remoteState) {
        const local = JSON.parse(localStorage.getItem('bingo.state') || '{}');
        const merged = BingoSync.mergeState(local, remoteState);
        localStorage.setItem('bingo.state', JSON.stringify(merged));
        handleStateChange(merged);
      }

      if (remoteRanking) {
        let localRank = [];
        try { localRank = JSON.parse(localStorage.getItem('bingo.ranking') || '[]'); } catch (e) {}
        const mergedRank = BingoSync.mergeRanking(localRank, remoteRanking);
        localStorage.setItem('bingo.ranking', JSON.stringify(mergedRank));
        renderRanking();
      }

      BingoSync.subscribe(async () => {
        const rs = await BingoSync.pullState();
        if (rs) {
          const cur = JSON.parse(localStorage.getItem('bingo.state') || '{}');
          const m = BingoSync.mergeState(cur, rs);
          localStorage.setItem('bingo.state', JSON.stringify(m));
          handleStateChange(m);
        }
        const rr = await BingoSync.pullRanking();
        if (rr) {
          let curRank = [];
          try { curRank = JSON.parse(localStorage.getItem('bingo.ranking') || '[]'); } catch (e) {}
          const mRank = BingoSync.mergeRanking(curRank, rr);
          localStorage.setItem('bingo.ranking', JSON.stringify(mRank));
          renderRanking();
        }
      });
    } catch (e) {}
  }

  // ====== Relógio ======
  function startClock() {
    function updateClock() {
      if (elStatClock) elStatClock.textContent = new Date().toLocaleTimeString();
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  // ====== Eventos e Controles ======
  document.addEventListener('click', unlockAudioOnUserGesture, { once: true });
  elUnmuteBanner?.addEventListener('click', unlockAudioOnUserGesture);

  function updateSoundButton() {
    if (soundIcon) soundIcon.innerHTML = soundEnabled ? '<i data-lucide="volume-2" class="lucide-sm"></i>' : '<i data-lucide="volume-x" class="lucide-sm"></i>';
    if (soundLabel) soundLabel.textContent = soundEnabled ? 'Som On' : 'Som Mudo';
    if (window.lucide) lucide.createIcons();
  }
  updateSoundButton();

  btnSoundToggle?.addEventListener('click', () => {
    unlockAudioOnUserGesture();
    soundEnabled = !soundEnabled;
    localStorage.setItem('bingo.projector.sound', soundEnabled ? '1' : '0');
    updateSoundButton();
  });

  function toggleFull() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }
  btnFull?.addEventListener('click', toggleFull);

  // Modal de Compartilhamento
  btnShare?.addEventListener('click', () => {
    if (!modalShare) return;
    const currentUrl = window.location.href;
    if (shareLinkInput) shareLinkInput.value = currentUrl;
    modalShare.removeAttribute('hidden');

    const qrContainer = document.getElementById('qrcode-container');
    if (qrContainer && window.QRCode) {
      qrContainer.innerHTML = '';
      new QRCode(qrContainer, {
        text: currentUrl,
        width: 140,
        height: 140,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }
  });

  btnCloseShare?.addEventListener('click', () => modalShare?.setAttribute('hidden', ''));
  modalShare?.addEventListener('click', (e) => { if (e.target === modalShare) modalShare.setAttribute('hidden', ''); });

  btnCopyLink?.addEventListener('click', () => {
    if (!shareLinkInput) return;
    shareLinkInput.select();
    navigator.clipboard?.writeText(shareLinkInput.value);
    btnCopyLink.textContent = 'Copiado!';
    setTimeout(() => { btnCopyLink.textContent = 'Copiar'; }, 2000);
  });

  // Atalhos
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === 'f' || e.key === 'F') { toggleFull(); }
    if (e.key === 'm' || e.key === 'M') { btnSoundToggle?.click(); }
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'bingo.state' || e.key === 'bingo.ranking' || e.key === 'bingo.prizes' || e.key === 'bingo.sponsors') {
      loadLocalState();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    loadLocalState();
    startClock();
    initSync();
  });
})();
