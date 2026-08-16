// ============================================================
// Bingo 75 — Sincronização com Supabase (opcional)
// ============================================================
// Regra de ouro: o localStorage é SEMPRE a fonte garantida (o app tem que
// funcionar 100% offline). Quando window.SUPABASE_CONFIG estiver preenchido
// (ver supabase-config.js) e houver rede, os dados também são replicados
// na nuvem para permitir múltiplos dispositivos vendo o mesmo jogo.
//
// Se algum elemento com id="chip-sync" ou id="sync-line" existir na página,
// este arquivo atualiza o texto dele sozinho — nenhuma outra tela precisa
// escutar eventos manualmente.
(function () {
  const ROOM = 'default';
  let client = null;
  let configured = false;

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

  async function pushState(state) {
    if (!ready()) return;
    setStatus('syncing');
    try {
      const { error } = await client.from('bingo_state').upsert({
        room: ROOM,
        drawn: state.drawn || [],
        last: state.last ?? null,
        game_over: !!state.gameOver,
        first_ts: state.firstTs ?? null,
        last_ts: state.lastTs ?? null,
        theme: state.theme || 'dark',
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      setStatus('online');
    } catch (e) {
      setStatus('error');
      console.warn('[BingoSync] push state falhou:', e.message || e);
    }
  }

  async function pushRanking(list) {
    if (!ready()) return;
    setStatus('syncing');
    try {
      // Ranking costuma ter poucas dezenas de linhas: substituir tudo a
      // cada mudança é mais simples e robusto do que reconciliar diffs.
      const del = await client.from('bingo_ranking').delete().eq('room', ROOM);
      if (del.error) throw del.error;
      if (list.length) {
        const ins = await client.from('bingo_ranking').insert(
          list.map((r) => ({ room: ROOM, name: r.name, type: r.type, ts: r.ts }))
        );
        if (ins.error) throw ins.error;
      }
      setStatus('online');
    } catch (e) {
      setStatus('error');
      console.warn('[BingoSync] push ranking falhou:', e.message || e);
    }
  }

  async function pullState() {
    if (!ready()) return null;
    try {
      const { data, error } = await client.from('bingo_state').select('*').eq('room', ROOM).maybeSingle();
      if (error || !data) return null;
      return {
        drawn: Array.isArray(data.drawn) ? data.drawn : [],
        last: data.last,
        gameOver: !!data.game_over,
        firstTs: data.first_ts,
        lastTs: data.last_ts,
        theme: data.theme
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

  // O sorteio normalmente é conduzido por UM dispositivo (a TV/tela rodando
  // o modo automático ou manual); as demais telas (ex.: celular na tela de
  // conferência) apenas leem. Por isso o merge do estado usa "quem tem mais
  // pedras sorteadas" como critério — evita que um dispositivo secundário
  // desatualizado sobrescreva o sorteio em andamento em outro.
  function mergeState(local, remote) {
    if (!remote) return local;
    if (!local) return remote;
    return remote.drawn.length >= local.drawn.length ? remote : local;
  }

  // Ranking é aditivo: cada vitória registrada em qualquer dispositivo deve
  // aparecer para todos, então o merge é uma união deduplicada por jogador+tipo.
  function mergeRanking(local, remote) {
    if (!remote) return local || [];
    const key = (r) => (r.name || '').trim().toLowerCase() + '|' + r.type;
    const map = new Map();
    (local || []).forEach((r) => map.set(key(r), r));
    (remote || []).forEach((r) => { if (!map.has(key(r))) map.set(key(r), r); });
    return Array.from(map.values()).sort((a, b) => new Date(a.ts) - new Date(b.ts));
  }

  function subscribe(onRemoteChange) {
    if (!ready()) return;
    client
      .channel('bingo-sync-' + ROOM)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bingo_state', filter: `room=eq.${ROOM}` }, () => onRemoteChange && onRemoteChange())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bingo_ranking', filter: `room=eq.${ROOM}` }, () => onRemoteChange && onRemoteChange())
      .subscribe();
  }

  window.addEventListener('online', () => setStatus(configured ? 'online' : 'disabled'));
  window.addEventListener('offline', () => setStatus('offline'));

  window.BingoSync = { init, ready, pushState, pushRanking, pullState, pullRanking, mergeState, mergeRanking, subscribe };
})();
