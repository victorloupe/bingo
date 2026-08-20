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
    'Terno': '',
    'Quatro Cantos': '',
    'Cinquina': '',
    'Cartela Cheia': ''
  };

  const SAMPLE_SPONSORS = [
    { id: '1', name: 'Supermercado Bom Preço', desc: 'Orgulho em apoiar a nossa comunidade!', img: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80' },
    { id: '2', name: 'Posto Alvorada', desc: 'Combustível de qualidade e troca de óleo garantida.', img: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80' },
    { id: '3', name: 'Padaria & Confeitaria Estrela', desc: 'Pães quentinhos e bolos especiais todos os dias!', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80' }
  ];

  const ICONS = {
    trophy: `<svg class="lucide lucide-trophy lucide-sm text-success" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.45.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
    gift: `<svg class="lucide lucide-gift lucide-sm text-primary" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>`,
    sparkles: `<svg class="lucide lucide-sparkles lucide-sm text-primary" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
    check: `<svg class="lucide lucide-check lucide-sm text-success" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg>`,
    award: `<svg class="lucide lucide-award lucide-sm text-warning" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
    search: `<svg class="lucide lucide-search lucide-sm text-warning" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    flag: `<svg class="lucide lucide-flag lucide-sm" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
    dices: `<svg class="lucide lucide-dices lucide-sm text-primary" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><rect width="12" height="12" x="2" y="10" rx="2" ry="2"/><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3.18l-5.74-5.74a2.24 2.24 0 0 0-3.18 0L9 5.08"/><path d="M6 14h.01"/><path d="M10 18h.01"/><path d="M14 6h.01"/><path d="M18 10h.01"/></svg>`,
    activity: `<svg class="lucide lucide-activity lucide-sm text-success" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    clock: `<svg class="lucide lucide-clock lucide-sm text-primary" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    volume2: `<svg class="lucide lucide-volume-2 lucide-sm" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
    volumeX: `<svg class="lucide lucide-volume-x lucide-sm" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>`
  };

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
  let conferenceMode = false;
  let previousConferenceMode = false;
  let currentAdIndex = 0;
  let lastRenderedSlideIndex = -1;
  let lastSponsorsJson = '';
  let adIntervalTimer = null;

  let soundEnabled = localStorage.getItem('bingo.projector.sound') !== '0';
  let previousRankingCount = 0;
  let previousDrawnLength = 0;
  let previousLast = null;
  let rankingList = [];

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
  const adLastRound = document.getElementById('ad-last-round');
  const adNextBanner = document.getElementById('ad-next-banner');
  const adNextTitle = document.getElementById('ad-next-title');
  const adNextPrizes = document.getElementById('ad-next-prizes');

  // Botões
  const btnAdToggle = document.getElementById('btn-ad-toggle');
  const adIcon = document.getElementById('ad-icon');
  const adLabel = document.getElementById('ad-label');
  const btnCloseAdOverlay = document.getElementById('btn-close-ad-overlay');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const soundIcon = document.getElementById('sound-icon');
  const soundLabel = document.getElementById('sound-label');
  const btnFull = document.getElementById('btn-full');
  const btnShare = document.getElementById('btn-share');
  const modalShare = document.getElementById('modal-share');
  const btnCloseShare = document.getElementById('btn-close-share');
  const btnCopyLink = document.getElementById('btn-copy-link');
  const shareLinkInput = document.getElementById('share-link-input');

  // Elementos do Destaque de Pedra Patrocinada
  const sponsoredOverlay = document.getElementById('sponsored-stone-overlay');
  const spProjLetter = document.getElementById('sp-proj-letter');
  const spProjNumber = document.getElementById('sp-proj-number');
  const spProjLogo = document.getElementById('sp-proj-logo');
  const spProjName = document.getElementById('sp-proj-name');
  const spProjMsg = document.getElementById('sp-proj-msg');
  const spProjProgress = document.getElementById('sp-proj-progress');
  const btnCloseSpOverlay = document.getElementById('btn-close-sp-overlay');

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

  // ====== Destaque Comemorativo de Pedra Patrocinada ======
  let sponsoredDismissTimer = null;
  let sponsoredProgressInterval = null;
  let lastHandledSponsoredTs = 0;

  function showSponsoredStoneCelebration(triggerData) {
    if (!triggerData || !triggerData.sponsor) return;
    if (triggerData.ts && triggerData.ts === lastHandledSponsoredTs) return;
    lastHandledSponsoredTs = triggerData.ts || Date.now();

    const { stone, letter, sponsor } = triggerData;
    const L = letter || letterFor(stone);

    if (spProjLetter) spProjLetter.textContent = L;
    if (spProjNumber) spProjNumber.textContent = String(stone);
    if (spProjLogo) {
      spProjLogo.onerror = () => { spProjLogo.src = 'favicon.svg'; };
      spProjLogo.src = sponsor.img || 'favicon.svg';
    }
    if (spProjName) spProjName.textContent = sponsor.name || 'Patrocinador Oficial';
    if (spProjMsg) {
      spProjMsg.textContent = sponsor.stoneMessage ? `"${sponsor.stoneMessage}"` : `"${sponsor.desc || 'Oferecimento Especial'}"`;
    }

    if (sponsoredOverlay) {
      sponsoredOverlay.removeAttribute('hidden');
      sponsoredOverlay.style.setProperty('display', 'flex', 'important');
      sponsoredOverlay.style.setProperty('visibility', 'visible', 'important');
      sponsoredOverlay.style.setProperty('opacity', '1', 'important');
      sponsoredOverlay.style.setProperty('z-index', '1000000', 'important');
    }

    // Desbloqueia e toca fanfarra festiva
    unlockAudioOnUserGesture();
    playVictoryFanfare();

    // Confetes na tela
    if (window.confetti) {
      try {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.55 } });
      } catch (e) {}
    }

    // Narração de Oferecimento Especial
    const isMuted = localStorage.getItem('bingo.projector.muted') === '1';
    if (!isMuted && soundEnabled && window.speechSynthesis) {
      try {
        speechSynthesis.cancel();
        speechSynthesis.resume();
        const msg = `Pedra ${sayLetter(L)}, número ${stone}! Em oferecimento a ${sponsor.name}! ${sponsor.stoneMessage || ''}`;
        const u = new SpeechSynthesisUtterance(msg);
        u.lang = 'pt-BR';
        const savedVoice = localStorage.getItem('bingo.voice');
        const savedRate = parseFloat(localStorage.getItem('bingo.rate') || '1.0');
        const voices = speechSynthesis.getVoices();
        const chosen = voices.find((v) => v.name === savedVoice) ||
                       voices.find((v) => /pt-BR/i.test(v.lang) && /Google|Natural|Neural/i.test(v.name)) ||
                       voices.find((v) => /pt-BR/i.test(v.lang)) || voices[0];
        if (chosen) { u.voice = chosen; u.lang = chosen.lang; }
        u.rate = isNaN(savedRate) ? 1.0 : savedRate;
        speechSynthesis.speak(u);
      } catch (e) {}
    }

    // Barra de progresso visual com auto-fechamento em 10s
    if (sponsoredDismissTimer) clearTimeout(sponsoredDismissTimer);
    if (sponsoredProgressInterval) clearInterval(sponsoredProgressInterval);

    const duration = 10000;
    const startTime = Date.now();

    if (spProjProgress) {
      spProjProgress.style.transform = 'scaleX(1)';
      sponsoredProgressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remainingRatio = Math.max(0, 1 - (elapsed / duration));
        spProjProgress.style.transform = `scaleX(${remainingRatio})`;
        if (remainingRatio <= 0) clearInterval(sponsoredProgressInterval);
      }, 40);
    }

    sponsoredDismissTimer = setTimeout(() => {
      closeSponsoredCelebration();
    }, duration);
  }

  function closeSponsoredCelebration() {
    if (sponsoredDismissTimer) clearTimeout(sponsoredDismissTimer);
    if (sponsoredProgressInterval) clearInterval(sponsoredProgressInterval);
    if (sponsoredOverlay) {
      sponsoredOverlay.setAttribute('hidden', '');
      sponsoredOverlay.style.setProperty('display', 'none', 'important');
      sponsoredOverlay.style.setProperty('visibility', 'hidden', 'important');
      sponsoredOverlay.style.setProperty('opacity', '0', 'important');
    }
  }

  btnCloseSpOverlay?.addEventListener('click', closeSponsoredCelebration);

  let nextRound = null;
  let roundsQueue = [];
  let adNotice = null;

  // ====== Modo Propaganda / Comercial Slider ======
  function renderCurrentSlide(force = false) {
    let spList = sponsors;
    if (!Array.isArray(spList) || spList.length === 0) {
      try {
        const localSp = JSON.parse(localStorage.getItem('bingo.sponsors') || '[]');
        if (Array.isArray(localSp) && localSp.length > 0) spList = localSp;
      } catch (e) {}
    }
    if (!Array.isArray(spList) || spList.length === 0) spList = SAMPLE_SPONSORS;
    if (!spList.length) return;
    if (currentAdIndex >= spList.length) currentAdIndex = 0;
    const cur = spList[currentAdIndex];
    if (!cur) return;

    if (adImg) {
      adImg.onerror = () => { adImg.src = 'favicon.svg'; };
      adImg.src = cur.img || 'favicon.svg';
    }
    if (adName) adName.textContent = cur.name || 'Patrocinador Oficial';
    if (adDesc) adDesc.textContent = cur.desc || 'Apoio aos nossos eventos';
    if (adSlideBox) {
      adSlideBox.style.opacity = '1';
    }
    lastRenderedSlideIndex = currentAdIndex;
  }

  function updateAdCarousel() {
    if (!adOverlay) return;
    if (!adMode) {
      adOverlay.setAttribute('hidden', '');
      adOverlay.style.setProperty('display', 'none', 'important');
      adOverlay.style.setProperty('visibility', 'hidden', 'important');
      adOverlay.style.setProperty('opacity', '0', 'important');
      if (adIntervalTimer) { clearInterval(adIntervalTimer); adIntervalTimer = null; }
      lastRenderedSlideIndex = -1;
      return;
    }

    adOverlay.removeAttribute('hidden');
    adOverlay.style.setProperty('display', 'flex', 'important');
    adOverlay.style.setProperty('visibility', 'visible', 'important');
    adOverlay.style.setProperty('opacity', '1', 'important');
    adOverlay.style.setProperty('z-index', '999999', 'important');

    if (adLastBall) adLastBall.textContent = last != null ? `${letterFor(last)} - ${last}` : '—';
    if (adTotalDrawn) adTotalDrawn.textContent = `${drawn.length}/75`;
    if (adLastRound) adLastRound.textContent = roundName || 'Rodada 1';

    // Banner de Intervalo / Próxima Rodada / Comunicado Personalizado
    const customNotice = adNotice;

    if (customNotice && (customNotice.title || customNotice.desc) && adNextBanner) {
      adNextBanner.style.display = 'flex';
      if (adNextTitle) adNextTitle.innerHTML = esc(customNotice.title || 'COMUNICADO');
      if (adNextPrizes) adNextPrizes.innerHTML = esc(customNotice.desc || '');
    } else {
      let nextItem = nextRound;
      if (!nextItem && Array.isArray(roundsQueue) && roundsQueue.length > 0) {
        nextItem = roundsQueue[0];
      }

      if (nextItem && adNextBanner) {
        adNextBanner.style.display = 'flex';
        if (adNextTitle) adNextTitle.innerHTML = `A SEGUIR: <b>${esc(nextItem.name)}</b>`;
        const p = nextItem.prizes || {};
        const cheia = p['Cartela Cheia'] ? `Cartela Cheia: <b>${esc(p['Cartela Cheia'])}</b>` : '';
        const outros = [
          p['Terno'] ? `Terno: ${esc(p['Terno'])}` : '',
          p['Quatro Cantos'] ? `4 Cantos: ${esc(p['Quatro Cantos'])}` : '',
          p['Cinquina'] ? `Cinquina: ${esc(p['Cinquina'])}` : ''
        ].filter(Boolean).join(' • ');

        if (adNextPrizes) {
          adNextPrizes.innerHTML = `${cheia}${cheia && outros ? ' &nbsp;|&nbsp; ' : ''}${outros}`;
        }
      } else if (adNextBanner) {
        adNextBanner.style.display = 'flex';
        if (adNextTitle) adNextTitle.innerHTML = `A SEGUIR: <b>Próxima Rodada</b>`;
        if (adNextPrizes) adNextPrizes.innerHTML = `Fiquem atentos para a próxima chamada de pedras!`;
      }
    }

    renderCurrentSlide();

    if (!adIntervalTimer) {
      adIntervalTimer = setInterval(() => {
        const list = sponsors && sponsors.length ? sponsors : SAMPLE_SPONSORS;
        currentAdIndex = (currentAdIndex + 1) % list.length;
        renderCurrentSlide(true);
      }, 6000);
    }
  }

  // ====== Renderização de Prêmios Compactos (Apenas prêmios configurados) ======
  function renderPrizes() {
    if (!elPrizesGrid) return;
    elPrizesGrid.innerHTML = '';

    const winnersMap = {};
    (rankingList || []).forEach((r) => {
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
      if (elBallCaption) elBallCaption.textContent = `${L} - ${last}`;
      if (elBallSphere) {
        elBallSphere.className = 'ball-sphere-compact has-ball letter-' + L;
      }
    } else {
      elBigLetter.textContent = '—';
      elBigNumber.textContent = '—';
      if (elBallCaption) elBallCaption.textContent = 'Aguardando';
      if (elBallSphere) {
        elBallSphere.className = 'ball-sphere-compact';
      }
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

  function renderRanking(newList) {
    if (Array.isArray(newList)) {
      rankingList = newList;
    }
    const list = rankingList || [];

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

    const isConference = typeof conferenceMode === 'boolean' ? conferenceMode : false;

    const elLiveDot = document.getElementById('live-indicator');
    if (elLiveDot) {
      if (isConference) {
        elLiveDot.className = 'chip d-inline-flex align-items-center gap-1';
        elLiveDot.style.background = '#0284c7';
        elLiveDot.style.color = '#ffffff';
        elLiveDot.style.borderColor = '#0369a1';
        elLiveDot.innerHTML = '<span class="live-dot" style="background:#38bdf8;"></span> CONFERÊNCIA';
      } else {
        elLiveDot.className = 'chip sync-online d-inline-flex align-items-center gap-1';
        elLiveDot.style.background = '';
        elLiveDot.style.color = '';
        elLiveDot.style.borderColor = '';
        elLiveDot.innerHTML = '<span class="live-dot"></span> AO VIVO';
      }
    }

    if (activeCelebrationWinner) {
      const prizeWon = prizes[activeCelebrationWinner.type] || DEFAULT_PRIZES[activeCelebrationWinner.type] || '';
      elLiveNoticeBar.className = 'live-notice-bar state-winner';
      elNoticeIcon.innerHTML = ICONS.award;
      elNoticeBadge.textContent = 'TEMOS GANHADOR!';
      elNoticeText.innerHTML = `<b>${esc(activeCelebrationWinner.name || activeCelebrationWinner.player)}</b> ganhou o <b>${esc(activeCelebrationWinner.type)}</b>! Prêmio: <b>${esc(prizeWon)}</b>!`;
      return;
    }

    if (isConference) {
      elLiveNoticeBar.className = 'live-notice-bar state-conference';
      elNoticeIcon.innerHTML = ICONS.search;
      elNoticeBadge.textContent = 'CONFERÊNCIA EM ANDAMENTO';
      elNoticeText.innerHTML = `Mesa de Conferência ativa: Conferindo cartela no momento... Aguarde a validação dos números!`;
      return;
    }

    if (gameOver) {
      elLiveNoticeBar.className = 'live-notice-bar state-gameover';
      elNoticeIcon.innerHTML = ICONS.flag;
      elNoticeBadge.textContent = 'ENCERRADO';
      elNoticeText.innerHTML = `Rodada encerrada com sucesso! Parabéns a todos os ganhadores da noite!`;
      return;
    }

    if (drawn.length > 0) {
      const L = last != null ? letterFor(last) : '';
      elLiveNoticeBar.className = 'live-notice-bar state-idle';
      elNoticeIcon.innerHTML = ICONS.dices;
      elNoticeBadge.textContent = 'AO VIVO';
      elNoticeText.innerHTML = `Sorteio em andamento • <b>${drawn.length}/75</b> sorteadas (Restam <b>${75 - drawn.length}</b>). Última pedra sorteada: <b>${L} ${last ?? '—'}</b>.`;
      return;
    }

    elLiveNoticeBar.className = 'live-notice-bar state-idle';
    elNoticeIcon.innerHTML = ICONS.sparkles;
    elNoticeBadge.textContent = 'BINGO 75';
    elNoticeText.innerHTML = `Aguardando início do sorteio desta rodada. Boa sorte a todos os participantes!`;
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
      elStatStatus.innerHTML = gameOver ? `${ICONS.flag} Encerrado` : (drawn.length > 0 ? `${ICONS.activity} Em Andamento` : `${ICONS.clock} Aguardando`);
      elStatStatus.className = 'chip d-inline-flex align-items-center gap-1 ' + (gameOver ? 'sync-disabled' : (drawn.length > 0 ? 'sync-online' : ''));
    }

    renderBigBall();
    renderGrid();
    renderHistory();
    renderRanking();
    renderPrizes();
    updateLiveNoticeBar();
    updateAdCarousel();
    updateAdButton();
  }

  function handleStateChange(newState) {
    if (!newState) return;
    const newDrawn = Array.isArray(newState.drawn) ? newState.drawn : drawn;
    const isNewBall = newDrawn.length > previousDrawnLength && newState.last != null && newState.last !== previousLast;

    drawn = newDrawn;
    if (newState.last !== undefined) last = newState.last;
    if (typeof newState.gameOver === 'boolean') gameOver = newState.gameOver;
    if (newState.roundName) roundName = newState.roundName;
    if (newState.nextRound !== undefined) nextRound = newState.nextRound;
    if (Array.isArray(newState.roundsQueue)) roundsQueue = newState.roundsQueue;
    const incomingNotice = (newState.adNotice && typeof newState.adNotice === 'object')
      ? newState.adNotice
      : ((newState.ad_notice && typeof newState.ad_notice === 'object') ? newState.ad_notice : null);

    if (incomingNotice !== null) {
      adNotice = incomingNotice;
    }
    
    // Tema do Telão (sincronizado do painel)
    if (newState.projectorTheme) {
      applyProjectorTheme(newState.projectorTheme);
    }

    // adMode (online + local) - prioriza flag encapsulada no adNotice
    let newAdMode = adMode;
    if (incomingNotice && typeof incomingNotice._adMode === 'boolean') {
      newAdMode = incomingNotice._adMode;
    } else if (typeof newState.adMode === 'boolean') {
      newAdMode = newState.adMode;
    } else if (typeof newState.ad_mode === 'boolean') {
      newAdMode = newState.ad_mode;
    }
    adMode = newAdMode;
    try { localStorage.setItem('bingo.adMode', adMode ? '1' : '0'); } catch(e){}

    // conferenceMode (online)
    let newConf = conferenceMode;
    if (incomingNotice && typeof incomingNotice._conferenceMode === 'boolean') {
      newConf = incomingNotice._conferenceMode;
    } else if (typeof newState.conferenceMode === 'boolean') {
      newConf = newState.conferenceMode;
    } else if (typeof newState.conference_mode === 'boolean') {
      newConf = newState.conference_mode;
    }

    if (newConf && !previousConferenceMode) {
      try { playDrawDing(); } catch (e) {}
    }
    conferenceMode = newConf;
    previousConferenceMode = newConf;

    if (newState.prizes && Object.keys(newState.prizes).length > 0) {
      prizes = Object.assign({}, DEFAULT_PRIZES, newState.prizes);
    }
    if (Array.isArray(newState.sponsors) && newState.sponsors.length > 0) {
      const newSpJson = JSON.stringify(newState.sponsors);
      if (newSpJson !== lastSponsorsJson) {
        lastSponsorsJson = newSpJson;
        sponsors = newState.sponsors;
        lastRenderedSlideIndex = -1;
      }
    }

    if (isNewBall) {
      const L = letterFor(last);
      playDrawDing();
      speakBall(L, last);
    }

    // Verifica evento de pedra patrocinada propagado via sync/nuvem
    const trig = newState.sponsoredTrigger || (newState.adNotice && newState.adNotice._sponsoredTrigger);
    if (trig && trig.ts && (Date.now() - trig.ts < 15000)) {
      showSponsoredStoneCelebration(trig);
    }

    previousDrawnLength = drawn.length;
    previousLast = last;

    updateUI(isNewBall);
  }

  // ====== Sincronização em Nuvem (Supabase 100% Online em Tempo Real) ======
  let lastStateSyncJson = '';
  let lastRankingSyncJson = '';

  async function fetchAndApplyRemote() {
    if (!window.BingoSync || !BingoSync.ready()) return;
    try {
      const [remoteState, remoteRanking] = await Promise.all([
        BingoSync.pullState(),
        BingoSync.pullRanking()
      ]);

      if (remoteState) {
        const sJson = JSON.stringify(remoteState);
        if (sJson !== lastStateSyncJson) {
          lastStateSyncJson = sJson;
          handleStateChange(remoteState);
        }
      }

      if (Array.isArray(remoteRanking)) {
        const rJson = JSON.stringify(remoteRanking);
        if (rJson !== lastRankingSyncJson) {
          lastRankingSyncJson = rJson;
          renderRanking(remoteRanking);
        }
      }
    } catch (e) {
      console.warn('[Projetor] Erro na sincronização online:', e);
    }
  }

  async function initSync() {
    if (!window.BingoSync) return;
    BingoSync.init();

    window.BingoSync._onSponsoredTrigger = (trig) => {
      if (trig && trig.ts && (Date.now() - trig.ts < 15000)) {
        showSponsoredStoneCelebration(trig);
      }
    };

    if (!BingoSync.ready()) return;

    await fetchAndApplyRemote();

    BingoSync.subscribe(
      () => {
        fetchAndApplyRemote();
      },
      (directState) => {
        lastStateSyncJson = JSON.stringify(directState);
        handleStateChange(directState);
      },
      (directRanking) => {
        lastRankingSyncJson = JSON.stringify(directRanking);
        renderRanking(directRanking);
      }
    );
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
    if (soundIcon) soundIcon.innerHTML = soundEnabled ? ICONS.volume2 : ICONS.volumeX;
    if (btnSoundToggle) btnSoundToggle.title = soundEnabled ? 'Som do Telão Ativado (Atalho M)' : 'Som do Telão Mutado (Atalho M)';
  }
  updateSoundButton();

  btnSoundToggle?.addEventListener('click', () => {
    unlockAudioOnUserGesture();
    soundEnabled = !soundEnabled;
    localStorage.setItem('bingo.projector.sound', soundEnabled ? '1' : '0');
    updateSoundButton();
  });

  // ====== Controle do Modo Patrocinadores / Propaganda no Telão ======
  function updateAdButton() {
    if (!btnAdToggle) return;
    if (adMode) {
      btnAdToggle.classList.add('active-ad');
      if (adIcon) adIcon.innerHTML = `<span class="live-dot" style="background:#ffffff; box-shadow:0 0 6px #ffffff;"></span>`;
      btnAdToggle.title = 'Patrocinadores NO AR no Telão! Clique ou pressione P para desativar';
    } else {
      btnAdToggle.classList.remove('active-ad');
      if (adIcon) adIcon.innerHTML = `<svg class="lucide lucide-megaphone" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`;
      btnAdToggle.title = 'Ativar Modo Patrocinadores no Telão (Atalho P)';
    }
  }
  updateAdButton();

  function toggleAdMode() {
    adMode = !adMode;
    try {
      localStorage.setItem('bingo.adMode', adMode ? '1' : '0');
      const st = JSON.parse(localStorage.getItem('bingo.state') || '{}');
      st.adMode = adMode;
      localStorage.setItem('bingo.state', JSON.stringify(st));
    } catch (e) {}

    updateAdButton();
    updateAdCarousel();

    if (window.BingoSync && BingoSync.ready()) {
      BingoSync.pushState({ adMode });
    }
  }

  btnAdToggle?.addEventListener('click', toggleAdMode);
  btnCloseAdOverlay?.addEventListener('click', toggleAdMode);

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
    const currentUrl = window.BingoSync?.buildRoomUrl('projetor.html', true) || window.location.href;
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

  // ====== Modo Noturno / Alto Contraste ======
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  function applyProjectorTheme(themeName) {
    const isDark = themeName === 'dark';
    if (isDark) {
      document.body.classList.add('theme-dark');
      if (themeIcon) themeIcon.setAttribute('data-lucide', 'sun');
      if (btnThemeToggle) btnThemeToggle.title = 'Alternar para Modo Claro (Atalho T)';
    } else {
      document.body.classList.remove('theme-dark');
      if (themeIcon) themeIcon.setAttribute('data-lucide', 'moon');
      if (btnThemeToggle) btnThemeToggle.title = 'Alternar para Modo Noturno / Alto Contraste (Atalho T)';
    }
    localStorage.setItem('bingo.projector.theme', isDark ? 'dark' : 'light');
    if (window.lucide) lucide.createIcons();
  }

  function toggleProjectorTheme() {
    const isCurrentlyDark = document.body.classList.contains('theme-dark');
    applyProjectorTheme(isCurrentlyDark ? 'light' : 'dark');
  }

  btnThemeToggle?.addEventListener('click', toggleProjectorTheme);

  // Inicializa tema salvo
  const savedTheme = localStorage.getItem('bingo.projector.theme') || 'light';
  applyProjectorTheme(savedTheme);

  // Atalhos
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === 'Escape') {
      closeSponsoredCelebration();
      if (modalShare) modalShare.setAttribute('hidden', '');
    } else if (e.key === 'f' || e.key === 'F') { toggleFull(); }
    else if (e.key === 'm' || e.key === 'M') { btnSoundToggle?.click(); }
    else if (e.key === 't' || e.key === 'T' || e.key === 'd' || e.key === 'D') {
      toggleProjectorTheme();
    }
    else if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      toggleAdMode();
    }
  });

  function loadLocalState() {
    try {
      const rawSt = localStorage.getItem('bingo.state');
      if (!rawSt) {
        const savedTheme = localStorage.getItem('bingo.projector.theme') || 'light';
        applyProjectorTheme(savedTheme);
        const savedAd = localStorage.getItem('bingo.adMode');
        if (savedAd !== null) {
          adMode = savedAd === '1';
          updateAdButton();
          updateAdCarousel();
        }
        return;
      }

      const st = JSON.parse(rawSt || '{}');
      const localPrizes = JSON.parse(localStorage.getItem('bingo.prizes') || 'null');
      if (localPrizes) prizes = Object.assign({}, DEFAULT_PRIZES, localPrizes);
      const localSponsors = JSON.parse(localStorage.getItem('bingo.sponsors') || 'null');
      if (Array.isArray(localSponsors) && localSponsors.length > 0) sponsors = localSponsors;
      const localQueue = JSON.parse(localStorage.getItem('bingo.roundsQueue') || 'null');
      if (Array.isArray(localQueue)) roundsQueue = localQueue;
      const localNotice = JSON.parse(localStorage.getItem('bingo.adNotice') || 'null');
      if (localNotice && typeof localNotice === 'object') adNotice = localNotice;
      
      const localRanking = JSON.parse(localStorage.getItem('bingo.ranking') || '[]');
      if (Array.isArray(localRanking)) rankingList = localRanking;

      if (localNotice && typeof localNotice._adMode === 'boolean') {
        adMode = localNotice._adMode;
      } else if (typeof st.adMode === 'boolean') {
        adMode = st.adMode;
      } else if (typeof st.ad_mode === 'boolean') {
        adMode = st.ad_mode;
      } else {
        const savedAd = localStorage.getItem('bingo.adMode');
        if (savedAd !== null) adMode = savedAd === '1';
      }
      st.adMode = adMode;

      if (localNotice && typeof localNotice._conferenceMode === 'boolean') {
        conferenceMode = localNotice._conferenceMode;
      } else if (typeof st.conferenceMode === 'boolean') {
        conferenceMode = st.conferenceMode;
      } else if (typeof st.conference_mode === 'boolean') {
        conferenceMode = st.conference_mode;
      } else {
        const savedConf = localStorage.getItem('bingo.conferenceMode');
        if (savedConf !== null) conferenceMode = savedConf === '1';
      }
      st.conferenceMode = conferenceMode;

      const localTheme = st.projectorTheme || localStorage.getItem('bingo.projector.theme') || 'light';
      applyProjectorTheme(localTheme);

      // Verifica disparo de pedra patrocinada
      try {
        const rawTrigger = localStorage.getItem('bingo.sponsoredTrigger');
        if (rawTrigger) {
          const trig = JSON.parse(rawTrigger);
          if (trig && trig.ts && (Date.now() - trig.ts < 12000)) {
            showSponsoredStoneCelebration(trig);
          }
        }
      } catch (e) {}

      handleStateChange(st);
      renderRanking(rankingList);
    } catch (e) {}
  }

  window.addEventListener('storage', (e) => {
    if (e.key === 'bingo.sponsoredTrigger') {
      try {
        const trig = JSON.parse(e.newValue || '{}');
        if (trig && trig.ts && (Date.now() - trig.ts < 12000)) {
          showSponsoredStoneCelebration(trig);
        }
      } catch (err) {}
    }
    if (e.key === 'bingo.projector.theme') {
      applyProjectorTheme(e.newValue || 'light');
    }
    if (['bingo.state', 'bingo.ranking', 'bingo.prizes', 'bingo.sponsors', 'bingo.adMode', 'bingo.conferenceMode', 'bingo.adNotice', 'bingo.projector.muted'].includes(e.key)) {
      loadLocalState();
    }
  });

  window.addEventListener('online', () => {
    initSync();
  });

  function startProjector() {
    loadLocalState();
    startClock();
    initSync();
    if (window.lucide) lucide.createIcons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startProjector);
  } else {
    startProjector();
  }
})();
