// ============================================================
// Bingo 75 — Sincronização com Supabase (Local + Nuvem)
// ============================================================
(function () {
  const ROOM = 'default';
  let client = null;
  let configured = false;
  let pushTimer = null;
  let statusResetTimer = null;
  let lastPushStateJson = '';
  let lastPushRankingJson = '';

  const STATUS_LABEL = {
    disabled: '💻 Local apenas',
    offline: '📴 Offline (dados locais)',
    syncing: '🔄 Sincronizando…',
    online: '☁️ Sincronizado',
    error: '⚠️ Erro de sincronização'
  };

  function setStatus(status) {
    window.dispatchEvent(new CustomEvent('bingosync:status', { detail: { status } }));
    const chip = document.getElementById('chip-sync');
    if (chip) {
      chip.textContent = STATUS_LABEL[status] || '☁️';
      chip.title = 'Sincronização com a nuvem: ' + (STATUS_LABEL[status] || status);
      chip.className = chip.className.replace(/\bsync-\S+/g, '').trim() + ' sync-' + status;
    }
    const line = document.getElementById('sync-line');
    if (line) line.textContent = STATUS_LABEL[status] || '';
  }

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
      setStatus('error');
      return false;
    }
  }

  function ready() {
    return configured && navigator.onLine;
  }

  function operatorKey() {
    return (typeof window !== 'undefined' && window.BINGO_OPERATOR_KEY) || '';
  }

  async function pushState(state) {
    if (!ready()) return;
    const isAd = typeof state.adMode === 'boolean' ? state.adMode : (localStorage.getItem('bingo.adMode') === '1');
    const payload = {
      room: ROOM,
      active_round_id: state.activeRoundId || 'round_1',
      round_name: state.roundName || 'Rodada 1',
      rounds_list: state.roundsList || [],
      next_round: state.nextRound || null,
      rounds_queue: state.roundsQueue || [],
      drawn: state.drawn || [],
      last: state.last ?? null,
      game_over: !!state.gameOver,
      first_ts: state.firstTs ?? null,
      last_ts: state.lastTs ?? null,
      prizes: state.prizes || {},
      sponsors: state.sponsors || [],
      ad_mode: isAd,
      ad_notice: state.adNotice || (JSON.parse(localStorage.getItem('bingo.adNotice') || 'null'))
    };

    const str = JSON.stringify(payload);
    if (str === lastPushStateJson) return; // Não envia se não houve alteração real
    lastPushStateJson = str;

    const key = operatorKey();
    if (!key) {
      // Sem chave de operador não dá pra gravar (as políticas do banco exigem).
      // Isso é esperado em páginas só-leitura (ex.: projetor.html).
      console.warn('[BingoSync] BINGO_OPERATOR_KEY ausente — inclua operator-key.js antes de sync.js nesta página para sincronizar gravações.');
      return;
    }

    try {
      // Gravação passa por uma função no banco (bingo_push_state) que confere
      // a chave de operador antes de escrever — ver supabase-schema.sql.
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
      setStatus('error');
      lastPushStateJson = ''; // permite tentar de novo na próxima mudança
      console.warn('[BingoSync] push state falhou:', e.message || e);
    }
  }

  async function pushRanking(list) {
    if (!ready()) return;
    const str = JSON.stringify(list || []);
    if (str === lastPushRankingJson) return;
    lastPushRankingJson = str;

    const key = operatorKey();
    if (!key) {
      console.warn('[BingoSync] BINGO_OPERATOR_KEY ausente — inclua operator-key.js antes de sync.js nesta página para sincronizar gravações.');
      return;
    }

    try {
      const rows = (list || []).map((r) => ({ name: r.name, type: r.type, ts: r.ts || new Date().toISOString() }));
      const { error } = await client.rpc('bingo_push_ranking', { p_key: key, p_room: ROOM, p_rows: rows });
      if (error) throw error;
      setStatus('online');
    } catch (e) {
      setStatus('error');
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
      return {
        activeRoundId: data.active_round_id || 'round_1',
        roundName: data.round_name || 'Rodada 1',
        roundsList: Array.isArray(data.rounds_list) ? data.rounds_list : [],
        nextRound: data.next_round || null,
        roundsQueue: Array.isArray(data.rounds_queue) ? data.rounds_queue : [],
        drawn: Array.isArray(data.drawn) ? data.drawn : [],
        last: data.last,
        gameOver: !!data.game_over,
        firstTs: data.first_ts,
        lastTs: data.last_ts,
        prizes: data.prizes || {},
        sponsors: Array.isArray(data.sponsors) ? data.sponsors : [],
        adMode: !!data.ad_mode,
        adNotice: data.ad_notice || null
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
    if (!local) return remote;

    const rDrawn = Array.isArray(remote.drawn) ? remote.drawn : [];
    const lDrawn = Array.isArray(local.drawn) ? local.drawn : [];
    const mergedPrizes = Object.assign({}, remote.prizes || {}, local.prizes || {});
    const sponsors = (remote.sponsors && remote.sponsors.length) ? remote.sponsors : (local.sponsors || []);
    
    const adMode = typeof remote.adMode !== 'undefined' ? remote.adMode : (localStorage.getItem('bingo.adMode') === '1');
    const roundsList = (local.roundsList && local.roundsList.length) ? local.roundsList : (remote.roundsList || []);
    const nextRound = local.nextRound || remote.nextRound || null;
    const roundsQueue = (local.roundsQueue && local.roundsQueue.length) ? local.roundsQueue : (remote.roundsQueue || []);

    // Prioridade para a rodada ativada localmente pelo operador
    const activeRoundId = local.activeRoundId || remote.activeRoundId || 'round_1';
    const roundName = local.roundName || remote.roundName || 'Rodada 1';

    let base = local;
    const rLastTs = Number(remote.lastTs) || 0;
    const lLastTs = Number(local.lastTs) || 0;

    // Um dispositivo que ainda não tem "activeRoundId" salvo no localStorage
    // (ex.: telão ou Mesa de Conferência aberta pela primeira vez num
    // computador novo, localStorage vazio) não tem de fato uma "rodada
    // ativada localmente" — é só um estado em branco. Sem este caso
    // especial, o bloco de baixo interpretava esse "local vazio" como uma
    // rodada DIFERENTE da da nuvem (undefined !== id da rodada real) e
    // preservava o "local" (vazio) em vez de adotar a nuvem — resultado:
    // o telão abria mostrando o jogo zerado (sem pedras, sem prêmios
    // ganhos) mesmo com a rodada já em andamento em outro computador, até
    // a pedra seguinte ser sorteada. Aqui, sem activeRoundId local, adota a
    // nuvem por completo.
    if (!local.activeRoundId) {
      return Object.assign({}, remote, {
        sponsors: (remote.sponsors && remote.sponsors.length) ? remote.sponsors : (local.sponsors || []),
        adMode: typeof remote.adMode !== 'undefined' ? remote.adMode : (localStorage.getItem('bingo.adMode') === '1')
      });
    }

    // Só mescla pedras sorteadas se ambas as pontas estiverem na MESMA rodada ativa
    const sameRound = (local.activeRoundId === remote.activeRoundId);

    if (sameRound) {
      if (rLastTs > 0 && lLastTs > 0) {
        base = rLastTs >= lLastTs ? remote : local;
      } else if (lDrawn.length > 0 && rDrawn.length === 0) {
        base = local;
      } else if (rDrawn.length > 0 && lDrawn.length === 0) {
        base = remote;
      } else if (rDrawn.length >= lDrawn.length) {
        base = remote;
      } else {
        base = local;
      }
    } else {
      // Rodadas diferentes: preserva a rodada ativada localmente
      base = local;
    }

    return Object.assign({}, base, {
      activeRoundId,
      roundName,
      roundsList,
      prizes: mergedPrizes,
      sponsors,
      adMode,
      adNotice: remote.adNotice || local.adNotice || null,
      nextRound,
      roundsQueue
    });
  }

  function mergeRanking(local, remote) {
    if (!remote) return local || [];
    const key = (r) => (r.name || '').trim().toLowerCase() + '|' + r.type;
    const map = new Map();
    (local || []).forEach((r) => map.set(key(r), r));
    (remote || []).forEach((r) => { if (!map.has(key(r))) map.set(key(r), r); });
    return Array.from(map.values()).sort((a, b) => new Date(a.ts) - new Date(b.ts));
  }

  let remoteCallbackTimer = null;
  function subscribe(onRemoteChange) {
    if (!ready()) return;
    
    // Throttled notification handler to prevent rapid event bounce
    const handleRemoteChange = () => {
      if (remoteCallbackTimer) clearTimeout(remoteCallbackTimer);
      remoteCallbackTimer = setTimeout(() => {
        if (onRemoteChange) onRemoteChange();
      }, 150);
    };

    client
      .channel('bingo-sync-' + ROOM)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bingo_state', filter: `room=eq.${ROOM}` }, handleRemoteChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bingo_ranking', filter: `room=eq.${ROOM}` }, handleRemoteChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bingo_card_batches', filter: `room=eq.${ROOM}` }, handleRemoteChange)
      .subscribe();
  }

  window.addEventListener('online', () => setStatus(configured ? 'online' : 'disabled'));
  window.addEventListener('offline', () => setStatus('offline'));

  window.BingoSync = {
    init, ready, pushState, pushRanking, pullState, pullRanking, mergeState, mergeRanking, subscribe,
    pushCardBatch, deleteCardBatchRemote, pullCardBatches
  };
})();
