// ============================================================
// Bingo 75 — Sincronização com Supabase (Local + Nuvem)
// ============================================================
(function () {
  const urlParams = (typeof window !== 'undefined' && window.location && window.location.search) ? new URLSearchParams(window.location.search) : null;
  const rawRoomFromUrl = urlParams && (urlParams.get('sala') || urlParams.get('room') || urlParams.get('token'));
  const roomFromUrl = (rawRoomFromUrl && rawRoomFromUrl !== 'default') ? rawRoomFromUrl : null;

  if (rawRoomFromUrl === 'default') {
    try { localStorage.removeItem('bingo.room'); } catch (e) {}
  } else if (roomFromUrl) {
    try { localStorage.setItem('bingo.room', roomFromUrl); } catch (e) {}
  }

  const savedRoom = localStorage.getItem('bingo.room');
  const ROOM = roomFromUrl || (savedRoom && savedRoom !== 'default' ? savedRoom : 'default');

  // Limpa ?sala=default ou ?room=default da barra de navegação se estiver presente
  if (typeof window !== 'undefined' && window.history && window.history.replaceState && urlParams) {
    if (urlParams.get('sala') === 'default' || urlParams.get('room') === 'default') {
      urlParams.delete('sala');
      urlParams.delete('room');
      const newSearch = urlParams.toString() ? '?' + urlParams.toString() : '';
      const newUrl = window.location.pathname + newSearch + window.location.hash;
      window.history.replaceState(null, '', newUrl);
    }
  }

  let client = null;
  let configured = false;
  let statusResetTimer = null;
  let lastPushStateJson = '';
  let lastPushRankingJson = '';
  let broadcastChannel = null;
  let realtimeChannel = null;

  // Barramento local nativo do navegador para sincronização ultra-rápida entre abas (<1ms)
  let localBus = null;
  try {
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      localBus = new BroadcastChannel('bingo75_bus_' + ROOM);
    }
  } catch (e) {}

  const STATUS_LABEL = {
    disabled: '💻 Local apenas',
    offline: '📴 Offline (dados locais)',
    syncing: '🔄 Sincronizando…',
    online: '☁️ Sincronizado',
    error: '⚠️ Erro de sincronização'
  };

  let currentStatus = 'disabled';
  let lastErrorMsg = '';

  function setStatus(status, errorDetails = null) {
    currentStatus = status;
    if (errorDetails) lastErrorMsg = String(errorDetails);
    else if (status === 'online') lastErrorMsg = '';

    window.dispatchEvent(new CustomEvent('bingosync:status', { detail: { status, error: lastErrorMsg } }));
    const chip = document.getElementById('chip-sync');
    if (chip) {
      chip.textContent = STATUS_LABEL[status] || '☁️';
      chip.title = (status === 'error' && lastErrorMsg)
        ? 'Erro de sincronização: ' + lastErrorMsg + ' (Clique para ver diagnóstico)'
        : (ROOM !== 'default')
          ? 'Sincronização com a nuvem (Sala: ' + ROOM + '): ' + (STATUS_LABEL[status] || status)
          : 'Sincronização com a nuvem: ' + (STATUS_LABEL[status] || status);
      chip.className = chip.className.replace(/\bsync-\S+/g, '').trim() + ' sync-' + status;
      chip.style.cursor = 'pointer';
    }
    const line = document.getElementById('sync-line');
    if (line) line.textContent = STATUS_LABEL[status] || '';
  }

  function showSyncDiagnostic() {
    const key = operatorKey();
    if (currentStatus === 'error') {
      const isKeyError = lastErrorMsg.toLowerCase().includes('chave de operador') || lastErrorMsg.toLowerCase().includes('operator');
      let msg = '';
      if (isKeyError) {
        msg = `<b>Chave de Operador Inválida ou Divergente no Supabase!</b><br><br>` +
              `A chave de segurança no arquivo <code>operator-key.js</code> não coincide com o registro da tabela <code>bingo_admin_key</code> no seu Supabase.<br><br>` +
              `<b>Como corrigir em 10 segundos:</b><br>` +
              `1. Abra o painel do seu Supabase no <b>SQL Editor</b>.<br>` +
              `2. Cole e execute o comando abaixo:<br>` +
              `<pre style="background:#0f172a; color:#38bdf8; padding:10px; border-radius:6px; font-size:0.8rem; margin:8px 0; overflow-x:auto; user-select:all;">INSERT INTO bingo_admin_key (id, secret) VALUES (true, '${key}') ON CONFLICT (id) DO UPDATE SET secret = EXCLUDED.secret;</pre>` +
              `3. Recarregue esta página.`;
      } else {
        msg = `<b>Falha na comunicação com o Supabase:</b><br><code>${lastErrorMsg || 'Erro de conexão'}</code><br><br>Verifique a conexão de rede e as credenciais em <code>supabase-config.js</code>.`;
      }
      if (window.BingoDialog?.alert) {
        window.BingoDialog.alert({ title: '⚠️ Diagnóstico de Sincronização', message: msg });
      } else {
        alert(msg.replace(/<[^>]+>/g, ''));
      }
    } else if (currentStatus === 'online') {
      if (window.BingoDialog?.toast) {
        const roomMsg = (ROOM !== 'default') ? ` na Sala "${ROOM}"` : '';
        window.BingoDialog.toast(`☁️ Sincronização em Nuvem Ativa${roomMsg}. Tudo conectado e atualizado!`, 'success');
      }
    } else if (currentStatus === 'offline') {
      if (window.BingoDialog?.toast) {
        window.BingoDialog.toast('📴 Modo Offline: Sem conexão de rede. Os dados estão sendo salvos localmente.', 'warning');
      }
    }
  }

  document.addEventListener('click', (e) => {
    const chip = e.target.closest('#chip-sync');
    if (chip) showSyncDiagnostic();
  });

  function init() {
    const cfg = window.SUPABASE_CONFIG || {};
    if (!cfg.url || !cfg.anonKey || !window.supabase) {
      setStatus('disabled');
      return false;
    }
    try {
      client = window.supabase.createClient(cfg.url, cfg.anonKey);
      configured = true;
      setStatus(navigator.onLine ? 'online' : 'offline');
      return true;
    } catch (e) {
      console.warn('[BingoSync] Falha ao iniciar Supabase:', e);
      setStatus('error', e.message || e);
      return false;
    }
  }

  function ready() {
    return configured && navigator.onLine;
  }

  function room() {
    return ROOM;
  }

  function buildRoomUrl(target = window.location.href, absolute = false) {
    try {
      const url = new URL(target, window.location.href);
      if (ROOM && ROOM !== 'default') {
        url.searchParams.set('sala', ROOM);
      } else {
        url.searchParams.delete('sala');
        url.searchParams.delete('room');
      }
      return absolute ? url.href : (url.pathname.split('/').pop() + url.search + url.hash);
    } catch (e) {
      return target;
    }
  }

  function decorateRoomLinks(root = document) {
    if (!root || !root.querySelectorAll) return;
    if (!ROOM || ROOM === 'default') return; // Padrão limpo: não adiciona parâmetro de sala nos links internos
    root.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (!/\.html(\?|#|$)/i.test(href)) return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        url.searchParams.set('sala', ROOM);
        link.setAttribute('href', url.pathname.split('/').pop() + url.search + url.hash);
      } catch (e) {}
    });
  }

  function operatorKey() {
    return (
      (typeof window !== 'undefined' && window.BINGO_OPERATOR_KEY) ||
      (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.operatorKey) ||
      localStorage.getItem('bingo.operatorKey') ||
      'fb90cfc60a7eadaf52693d50b3817a8fb3e323053b029b3e'
    );
  }

  let pushTimer = null;
  function pushState(state, immediate = true) {
    if (pushTimer) clearTimeout(pushTimer);
    if (immediate) {
      return doPushState(state);
    }
    pushTimer = setTimeout(() => {
      doPushState(state);
    }, 50);
  }

  async function doPushState(state) {
    if (!ready()) return;
    const isAd = typeof state.adMode === 'boolean' ? state.adMode : (localStorage.getItem('bingo.adMode') === '1');
    const isConference = typeof state.conferenceMode === 'boolean' ? state.conferenceMode : (localStorage.getItem('bingo.conferenceMode') === '1');

    let adNoticeObj = {};
    if (state.adNotice && typeof state.adNotice === 'object') {
      adNoticeObj = Object.assign({}, state.adNotice);
    } else {
      try {
        adNoticeObj = JSON.parse(localStorage.getItem('bingo.adNotice') || '{}') || {};
      } catch (e) { adNoticeObj = {}; }
    }
    // Grava flags dinâmicas junto no ad_notice (jsonb) para garantir propagação perfeita
    adNoticeObj._conferenceMode = isConference;
    adNoticeObj._adMode = isAd;

    // Sponsors: preserva patrocinadores salvos caso state não passe explicitamente
    let sponsorsList = (Array.isArray(state.sponsors) && state.sponsors.length > 0) ? state.sponsors : null;
    if (!sponsorsList) {
      try {
        const localSp = JSON.parse(localStorage.getItem('bingo.sponsors') || 'null');
        if (Array.isArray(localSp) && localSp.length > 0) sponsorsList = localSp;
      } catch (e) {}
    }

    // RoundsList: preserva lista de rodadas
    let roundsListVal = (Array.isArray(state.roundsList) && state.roundsList.length > 0) ? state.roundsList : null;
    if (!roundsListVal) {
      try {
        const localRounds = JSON.parse(localStorage.getItem('bingo.roundsList') || 'null');
        if (Array.isArray(localRounds) && localRounds.length > 0) roundsListVal = localRounds;
      } catch (e) {}
    }

    // RoundsQueue: preserva fila de rodadas
    let roundsQueueVal = (Array.isArray(state.roundsQueue) && state.roundsQueue.length > 0) ? state.roundsQueue : null;
    if (!roundsQueueVal) {
      try {
        const localQueue = JSON.parse(localStorage.getItem('bingo.roundsQueue') || 'null');
        if (Array.isArray(localQueue) && localQueue.length > 0) roundsQueueVal = localQueue;
      } catch (e) {}
    }

    // Drawn & Last & ActiveRound & RoundName & Prizes: preserva se state não passar explicitamente
    let drawnVal = Array.isArray(state.drawn) ? state.drawn : null;
    let lastVal = typeof state.last !== 'undefined' ? state.last : undefined;
    let activeRoundIdVal = state.activeRoundId || null;
    let roundNameVal = state.roundName || null;
    let prizesVal = (state.prizes && typeof state.prizes === 'object' && Object.keys(state.prizes).length > 0) ? state.prizes : null;
    let nextRoundVal = (state.nextRound && typeof state.nextRound === 'object') ? state.nextRound : null;

    if (!drawnVal || lastVal === undefined || !activeRoundIdVal || !roundNameVal || !prizesVal) {
      try {
        const savedSt = JSON.parse(localStorage.getItem('bingo.state') || '{}');
        if (!drawnVal && Array.isArray(savedSt.drawn)) drawnVal = savedSt.drawn;
        if (lastVal === undefined && typeof savedSt.last !== 'undefined') lastVal = savedSt.last;
        if (!activeRoundIdVal) activeRoundIdVal = savedSt.activeRoundId || localStorage.getItem('bingo.activeRoundId') || 'round_1';
        if (!roundNameVal) roundNameVal = savedSt.roundName || 'Rodada 1';
        if (!prizesVal && savedSt.prizes) prizesVal = savedSt.prizes;
        if (!nextRoundVal && savedSt.nextRound) nextRoundVal = savedSt.nextRound;
      } catch (e) {}
    }

    const payload = {
      room: ROOM,
      active_round_id: activeRoundIdVal || 'round_1',
      round_name: roundNameVal || 'Rodada 1',
      rounds_list: roundsListVal || [],
      next_round: nextRoundVal || {},
      rounds_queue: roundsQueueVal || [],
      drawn: drawnVal || [],
      last: lastVal ?? null,
      game_over: typeof state.gameOver === 'boolean' ? state.gameOver : false,
      first_ts: state.firstTs ?? null,
      last_ts: state.lastTs ?? null,
      prizes: prizesVal || {},
      sponsors: sponsorsList || [],
      ad_mode: isAd,
      ad_notice: adNoticeObj
    };

    const str = JSON.stringify(payload);
    if (str === lastPushStateJson) return; // Não envia se não houve alteração real
    lastPushStateJson = str;

    // 1. Transmissão instantânea via Barramento Local do Navegador (< 1ms para todas as abas)
    if (localBus) {
      try {
        localBus.postMessage({
          type: 'state_update',
          payload: broadcastPayload
        });
      } catch (e) {}
    }

    // 2. Transmissão via Realtime Broadcast Supabase (< 20ms para outros aparelhos)
    if (realtimeChannel) {
      try {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'state_update',
          payload: broadcastPayload
        });
      } catch (e) {}
    }

    const key = operatorKey();
    if (!key) {
      console.warn('[BingoSync] BINGO_OPERATOR_KEY ausente — inclua operator-key.js antes de sync.js nesta página para sincronizar gravações.');
      return;
    }

    try {
      const { error } = await client.rpc('bingo_push_state', {
        p_key: key,
        p_room: payload.room,
        p_active_round_id: payload.active_round_id,
        p_round_name: payload.round_name,
        p_rounds_list: payload.rounds_list,
        p_next_round: payload.next_round,
        p_rounds_queue: payload.rounds_queue,
        p_drawn: payload.drawn,
        p_last: payload.last,
        p_game_over: payload.game_over,
        p_first_ts: payload.first_ts,
        p_last_ts: payload.last_ts,
        p_prizes: payload.prizes,
        p_sponsors: payload.sponsors,
        p_ad_mode: payload.ad_mode,
        p_ad_notice: payload.ad_notice
      });
      if (error) throw error;
      setStatus('online');
    } catch (e) {
      setStatus('error', e.message || e);
      lastPushStateJson = ''; // permite tentar de novo na próxima mudança
      console.warn('[BingoSync] push state falhou:', e.message || e);
    }
  }

  let pushRankingTimer = null;
  function pushRanking(list, immediate = true) {
    if (pushRankingTimer) clearTimeout(pushRankingTimer);
    if (immediate) {
      return doPushRanking(list);
    }
    pushRankingTimer = setTimeout(() => {
      doPushRanking(list);
    }, 100);
  }

  async function doPushRanking(list) {
    if (!ready()) return;
    const str = JSON.stringify(list || []);
    if (str === lastPushRankingJson) return;
    lastPushRankingJson = str;

    if (localBus) {
      try {
        localBus.postMessage({
          type: 'ranking_update',
          payload: list || []
        });
      } catch (e) {}
    }

    if (realtimeChannel) {
      try {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'ranking_update',
          payload: list || []
        });
      } catch (e) {}
    }

    const key = operatorKey();
    if (!key) {
      console.warn('[BingoSync] BINGO_OPERATOR_KEY ausente — inclua operator-key.js antes de sync.js nesta página para sincronizar gravações.');
      return;
    }

    try {
      const rows = (list || []).map((r) => ({ name: r.name, type: r.type, ts: r.ts || new Date().toISOString() }));
      
      if (broadcastChannel) {
        try {
          broadcastChannel.send({
            type: 'broadcast',
            event: 'ranking_update',
            payload: rows
          });
        } catch (e) {}
      }

      const { error } = await client.rpc('bingo_push_ranking', { p_key: key, p_room: ROOM, p_rows: rows });
      if (error) throw error;
      setStatus('online');
    } catch (e) {
      setStatus('error', e.message || e);
      lastPushRankingJson = '';
      console.warn('[BingoSync] push ranking falhou:', e.message || e);
    }
  }

  async function pushCardBatch(batch) {
    if (!ready() || !batch) return false;
    const key = operatorKey();
    if (!key) {
      console.warn('[BingoSync] BINGO_OPERATOR_KEY ausente — inclua operator-key.js antes de sync.js nesta página para sincronizar cartelas.');
      return false;
    }
    try {
      const { error } = await client.rpc('bingo_push_card_batch', {
        p_key: key,
        p_room: ROOM,
        p_id: batch.id,
        p_event_name: batch.eventName || '',
        p_round_name: batch.roundName || '',
        p_seed: batch.seed || '',
        p_total_cards: batch.totalCards ?? (Array.isArray(batch.cards) ? batch.cards.length : 0),
        p_start_serial: batch.startSerial ?? null,
        p_end_serial: batch.endSerial ?? null,
        p_cards: batch.cards || [],
        p_assigned_round_ids: batch.assignedRoundIds || [],
        p_assigned_round_names: batch.assignedRoundNames || [],
        p_cards_per_page: batch.cardsPerPage ?? null,
        p_color_theme: batch.colorTheme || null
      });
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[BingoSync] push de lote de cartelas falhou (cartela continua válida localmente):', e.message || e);
      return false;
    }
  }

  async function deleteCardBatchRemote(batchId) {
    if (!ready() || !batchId) return false;
    const key = operatorKey();
    if (!key) return false;
    try {
      const { error } = await client.rpc('bingo_delete_card_batch', { p_key: key, p_id: batchId });
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[BingoSync] exclusão remota de lote falhou:', e.message || e);
      return false;
    }
  }

  async function pullCardBatches() {
    if (!ready()) return null;
    try {
      const { data, error } = await client.from('bingo_card_batches').select('*').eq('room', ROOM);
      if (error || !data) return null;
      return data.map((row) => ({
        id: row.id,
        eventName: row.event_name || '',
        roundName: row.round_name || '',
        seed: row.seed || '',
        totalCards: row.total_cards || (Array.isArray(row.cards) ? row.cards.length : 0),
        startSerial: row.start_serial,
        endSerial: row.end_serial,
        cards: Array.isArray(row.cards) ? row.cards : [],
        assignedRoundIds: Array.isArray(row.assigned_round_ids) ? row.assigned_round_ids : [],
        assignedRoundNames: Array.isArray(row.assigned_round_names) ? row.assigned_round_names : [],
        cardsPerPage: row.cards_per_page,
        colorTheme: row.color_theme,
        createdAt: row.created_at
      }));
    } catch (e) {
      return null;
    }
  }

  async function pullState() {
    if (!ready()) return null;
    try {
      const { data, error } = await client.from('bingo_state').select('*').eq('room', ROOM).maybeSingle();
      if (error || !data) return null;
      const nRound = (data.next_round && typeof data.next_round === 'object' && data.next_round.name) ? data.next_round : null;
      const rawNotice = (data.ad_notice && typeof data.ad_notice === 'object') ? data.ad_notice : null;
      const confMode = rawNotice && typeof rawNotice._conferenceMode === 'boolean' ? rawNotice._conferenceMode : false;
      const adModeVal = typeof data.ad_mode === 'boolean' 
        ? data.ad_mode 
        : (rawNotice && typeof rawNotice._adMode === 'boolean' ? rawNotice._adMode : false);

      let cleanNotice = rawNotice ? {
        _conferenceMode: confMode,
        _adMode: adModeVal
      } : null;
      if (rawNotice && (rawNotice.title || rawNotice.desc)) {
        cleanNotice = {
          title: rawNotice.title || '',
          desc: rawNotice.desc || '',
          _conferenceMode: confMode,
          _adMode: adModeVal
        };
      }

      return {
        activeRoundId: data.active_round_id || 'round_1',
        roundName: data.round_name || 'Rodada 1',
        roundsList: Array.isArray(data.rounds_list) ? data.rounds_list : [],
        nextRound: nRound,
        roundsQueue: Array.isArray(data.rounds_queue) ? data.rounds_queue : [],
        drawn: Array.isArray(data.drawn) ? data.drawn : [],
        last: data.last,
        gameOver: !!data.game_over,
        firstTs: data.first_ts,
        lastTs: data.last_ts,
        prizes: data.prizes || {},
        sponsors: Array.isArray(data.sponsors) ? data.sponsors : [],
        adMode: adModeVal,
        adNotice: cleanNotice,
        conferenceMode: confMode
      };
    } catch (e) {
      return null;
    }
  }

  async function pullRanking() {
    if (!ready()) return null;
    try {
      const { data, error } = await client
        .from('bingo_ranking')
        .select('*')
        .eq('room', ROOM)
        .order('ts', { ascending: true });
      if (error || !data) return null;
      return data.map((r) => ({ name: r.name, type: r.type, ts: r.ts }));
    } catch (e) {
      return null;
    }
  }

  function mergeState(local, remote) {
    if (!remote) return local;
    // O banco de dados online é a fonte única da verdade absoluta.
    // Qualquer dado remoto substitui caches locais defasados.
    return remote;
  }

  function mergeRanking(local, remote) {
    // O ranking online do banco é a lista completa e definitiva
    if (Array.isArray(remote)) return remote;
    return Array.isArray(local) ? local : [];
  }

  let remoteCallbackTimer = null;
  function subscribe(onRemoteChange, onDirectStateChange, onDirectRankingChange) {
    // 1. Escuta no Barramento Local (comunicação instantânea <1ms entre abas no mesmo PC)
    if (localBus) {
      localBus.onmessage = (e) => {
        if (e && e.data) {
          if (e.data.type === 'state_update') {
            if (onDirectStateChange && e.data.payload) onDirectStateChange(e.data.payload);
            else if (onRemoteChange) onRemoteChange();
          } else if (e.data.type === 'ranking_update') {
            if (onDirectRankingChange && e.data.payload) onDirectRankingChange(e.data.payload);
            else if (onRemoteChange) onRemoteChange();
          }
        }
      };
    }

    if (!ready()) return;

    const handleRemoteChange = () => {
      if (remoteCallbackTimer) clearTimeout(remoteCallbackTimer);
      remoteCallbackTimer = setTimeout(() => {
        if (onRemoteChange) onRemoteChange();
      }, 50);
    };

    // 2. Escuta no Supabase Realtime (comunicação em rede entre aparelhos diferentes)
    try {
      if (realtimeChannel) {
        try { client.removeChannel(realtimeChannel); } catch (e) {}
      }
      const chanName = 'bingo-sync-' + ROOM + '-' + Math.random().toString(36).slice(2, 7);
      realtimeChannel = client.channel(chanName, { config: { broadcast: { self: false } } });
      realtimeChannel
        .on('broadcast', { event: 'state_update' }, (response) => {
          if (onDirectStateChange && response.payload) {
            onDirectStateChange(response.payload);
          } else if (onRemoteChange) {
            onRemoteChange();
          }
        })
        .on('broadcast', { event: 'ranking_update' }, (response) => {
          if (onDirectRankingChange && response.payload) {
            onDirectRankingChange(response.payload);
          } else if (onRemoteChange) {
            onRemoteChange();
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bingo_state', filter: `room=eq.${ROOM}` }, handleRemoteChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bingo_ranking', filter: `room=eq.${ROOM}` }, handleRemoteChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bingo_card_batches', filter: `room=eq.${ROOM}` }, handleRemoteChange)
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setStatus('online');
          }
        });
    } catch(e) {}

    // Polling de fallback a cada 1.5s
    setInterval(() => {
      if (onRemoteChange) onRemoteChange();
    }, 1500);
  }

  window.addEventListener('online', () => setStatus(configured ? 'online' : 'disabled'));
  window.addEventListener('offline', () => setStatus('offline'));

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => decorateRoomLinks());
  } else {
    decorateRoomLinks();
  }

  window.BingoSync = {
    init, ready, pushState, pushRanking, pullState, pullRanking, mergeState, mergeRanking, subscribe,
    pushCardBatch, deleteCardBatchRemote, pullCardBatches, room, buildRoomUrl, decorateRoomLinks
  };
})();
