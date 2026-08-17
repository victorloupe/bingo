// ============================================================
// Bingo 75 — Motor de Geração & Validação Antifraude de Cartelas
// ============================================================

(function (global) {
  'use strict';

  // Seed / Segredo padrão para geração do Hash Antifraude
  const HASH_SALT = 'BINGO75_SECURE_AUTH_2026_';

  // Gerador de Hash Antifraude (Checksum de 8 caracteres formatado XXXX-XXXX)
  function generateAuthCode(serial, numbers, seed = 'LOTE1') {
    const raw = `${HASH_SALT}|${seed}|${serial}|${numbers.join(',')}`;
    let h1 = 0xdeadbeef ^ 0;
    let h2 = 0x41c6ce57 ^ 0;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const hex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).toUpperCase().padStart(8, '0');
    return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
  }

  // Gera uma cartela padrão de 75 números (5 colunas: B, I, N, G, O)
  function generateSingleCard(serial, seed = 'LOTE1') {
    function sampleUnique(min, max, count) {
      const pool = [];
      for (let i = min; i <= max; i++) pool.push(i);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return pool.slice(0, count).sort((a, b) => a - b);
    }

    const b = sampleUnique(1, 15, 5);
    const i = sampleUnique(16, 30, 5);
    const n = sampleUnique(31, 45, 4); // 4 números pois o centro é LIVRE
    const g = sampleUnique(46, 60, 5);
    const o = sampleUnique(61, 75, 5);

    // Estrutura em matriz 5x5: [linha][coluna]
    const grid = [
      [b[0], i[0], n[0], g[0], o[0]],
      [b[1], i[1], n[1], g[1], o[1]],
      [b[2], i[2], 'FREE', g[2], o[2]], // Centro livre
      [b[3], i[3], n[2], g[3], o[3]],
      [b[4], i[4], n[3], g[4], o[4]]
    ];

    // Lista plana de todos os 24 números jogáveis
    const numbers = [...b, ...i, ...n, ...g, ...o];
    const authCode = generateAuthCode(serial, numbers, seed);

    return {
      serial,
      formattedSerial: String(serial).padStart(4, '0'),
      authCode,
      grid,
      numbers,
      columns: { B: b, I: i, N: n, G: g, O: o }
    };
  }

  // Gera um lote completo de cartelas
  function generateBatch({
    count = 100,
    startSerial = 1,
    eventName = 'GRANDE BINGO BENEFICENTE',
    roundName = 'Rodada Oficial',
    seed = 'LOTE1'
  } = {}) {
    const cards = [];
    const generatedSignatures = new Set();

    let cur = startSerial;
    let attempts = 0;
    while (cards.length < count && attempts < count * 20) {
      attempts++;
      const card = generateSingleCard(cur, seed);
      const sig = card.numbers.join('-');
      if (!generatedSignatures.has(sig)) {
        generatedSignatures.add(sig);
        cards.push(card);
        cur++;
      }
    }

    const batch = {
      id: 'batch_' + Date.now(),
      createdAt: new Date().toISOString(),
      eventName,
      roundName,
      seed,
      totalCards: cards.length,
      startSerial,
      endSerial: cur - 1,
      cards
    };

    return batch;
  }

  // Avalia o status de uma cartela contra as pedras sorteadas
  function evaluateCard(card, drawnNumbers = []) {
    const drawnSet = new Set(drawnNumbers || []);
    const grid = card.grid;

    // Matriz de acertos booleanos (5x5)
    const hitsGrid = [
      [false, false, false, false, false],
      [false, false, false, false, false],
      [false, false, true, false, false], // Centro FREE sempre marcado
      [false, false, false, false, false],
      [false, false, false, false, false]
    ];

    let totalHits = 0;
    const missingNumbers = [];

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const val = grid[r][c];
        if (val === 'FREE') {
          hitsGrid[r][c] = true;
          totalHits++;
        } else if (drawnSet.has(val)) {
          hitsGrid[r][c] = true;
          totalHits++;
        } else {
          hitsGrid[r][c] = false;
          missingNumbers.push(val);
        }
      }
    }

    // 1. Checagem de Quatro Cantos: (0,0), (0,4), (4,0), (4,4)
    const cornerPositions = [[0, 0], [0, 4], [4, 0], [4, 4]];
    const cornerHits = cornerPositions.filter(([r, c]) => hitsGrid[r][c]).length;
    const isQuatroCantos = cornerHits === 4;
    const isArmadaQuatroCantos = cornerHits === 3;
    const missingCornerNumbers = cornerPositions.filter(([r, c]) => !hitsGrid[r][c]).map(([r, c]) => grid[r][c]);

    // 2. As 12 Linhas (5 Horizontais, 5 Verticais, 2 Diagonais)
    const linesCoords = [
      // Horizontais
      [[0,0],[0,1],[0,2],[0,3],[0,4]],
      [[1,0],[1,1],[1,2],[1,3],[1,4]],
      [[2,0],[2,1],[2,2],[2,3],[2,4]],
      [[3,0],[3,1],[3,2],[3,3],[3,4]],
      [[4,0],[4,1],[4,2],[4,3],[4,4]],
      // Verticais
      [[0,0],[1,0],[2,0],[3,0],[4,0]],
      [[0,1],[1,1],[2,1],[3,1],[4,1]],
      [[0,2],[1,2],[2,2],[3,2],[4,2]],
      [[0,3],[1,3],[2,3],[3,3],[4,3]],
      [[0,4],[1,4],[2,4],[3,4],[4,4]],
      // Diagonais
      [[0,0],[1,1],[2,2],[3,3],[4,4]],
      [[0,4],[1,3],[2,2],[3,1],[4,0]]
    ];

    let isCinquina = false;
    let isArmadaCinquina = false;
    const missingCinquinaNumbers = new Set();

    let isTerno = false;
    let isArmadaTerno = false;
    const missingTernoNumbers = new Set();

    linesCoords.forEach(line => {
      const hitsCount = line.filter(([r, c]) => hitsGrid[r][c]).length;
      if (hitsCount === 5) {
        isCinquina = true;
      } else if (hitsCount === 4) {
        isArmadaCinquina = true;
        line.forEach(([r, c]) => {
          if (!hitsGrid[r][c]) {
            const val = grid[r][c];
            if (val !== 'FREE') missingCinquinaNumbers.add(val);
          }
        });
      }

      // Checa Terno nas 3 fatias de 3 da linha ([0,1,2], [1,2,3], [2,3,4])
      for (let i = 0; i <= 2; i++) {
        const slice = [line[i], line[i+1], line[i+2]];
        const sliceHits = slice.filter(([r, c]) => hitsGrid[r][c]).length;
        if (sliceHits === 3) {
          isTerno = true;
        } else if (sliceHits === 2) {
          isArmadaTerno = true;
          slice.forEach(([r, c]) => {
            if (!hitsGrid[r][c]) {
              const val = grid[r][c];
              if (val !== 'FREE') missingTernoNumbers.add(val);
            }
          });
        }
      }
    });

    // 3. Cartela Cheia: todas as 25 casas (24 números + FREE)
    const isCartelaCheia = totalHits === 25;
    const isArmadaCheia = missingNumbers.length === 1;

    return {
      serial: card.serial,
      formattedSerial: card.formattedSerial,
      authCode: card.authCode,
      totalHits: totalHits - 1, // Desconsidera FREE para contagem numérica
      maxPlayable: 24,
      hitsGrid,
      missingNumbers,
      missingCount: missingNumbers.length,
      // Status de Batidas
      isCartelaCheia,
      isCinquina,
      isQuatroCantos,
      isTerno,
      // Status de Armadas
      isArmadaCheia,
      isArmadaCinquina,
      isArmadaQuatroCantos,
      isArmadaTerno,
      isArmada: isArmadaCheia || isArmadaCinquina || isArmadaQuatroCantos || isArmadaTerno,
      // Números faltantes por modalidade
      missingCheiaNumber: isArmadaCheia ? missingNumbers[0] : null,
      missingCinquinaNumbers: Array.from(missingCinquinaNumbers),
      missingCornerNumbers,
      missingTernoNumbers: Array.from(missingTernoNumbers)
    };
  }

  // Auditoria em Tempo Real de todos os lotes de cartelas para uma rodada
  function auditAllCardsForRound(drawnNumbers = [], roundId = null) {
    const batches = Storage.getAllBatches();
    let matchingBatches = batches.filter(b => {
      if (!roundId) return true;
      const ids = b.assignedRoundIds || b.roundIds;
      if (!ids || !ids.length || ids.includes('all')) return true;
      return ids.includes(roundId);
    });

    if (!matchingBatches.length && batches.length > 0) {
      matchingBatches = batches;
    }

    const bingouCards = []; // Cartela Cheia (24/24)
    const batidasCards = []; // Todas as batidas (Cheia, Cinquina, 4 Cantos, Terno)
    const armadaCards = []; // Todas as armadas
    let totalCardsAudited = 0;

    matchingBatches.forEach(batch => {
      if (!Array.isArray(batch.cards)) return;
      totalCardsAudited += batch.cards.length;

      batch.cards.forEach(card => {
        const ev = evaluateCard(card, drawnNumbers);
        const batchName = batch.roundName || batch.eventName || 'Lote';

        // 1. Batidas
        if (ev.isCartelaCheia) {
          const item = {
            serial: card.serial,
            formattedSerial: card.formattedSerial,
            authCode: card.authCode,
            batchName,
            category: 'Cartela Cheia',
            icon: '🏆',
            title: 'BINGOU! (Cartela Cheia 24/24)',
            missingNumbers: []
          };
          bingouCards.push(item);
          batidasCards.push(item);
        }
        if (ev.isCinquina && !ev.isCartelaCheia) {
          batidasCards.push({
            serial: card.serial,
            formattedSerial: card.formattedSerial,
            authCode: card.authCode,
            batchName,
            category: 'Cinquina',
            icon: '⚡',
            title: 'Cinquina (Linha Completa 5/5)',
            missingNumbers: []
          });
        }
        if (ev.isQuatroCantos && !ev.isCartelaCheia) {
          batidasCards.push({
            serial: card.serial,
            formattedSerial: card.formattedSerial,
            authCode: card.authCode,
            batchName,
            category: 'Quatro Cantos',
            icon: '🍫',
            title: 'Quatro Cantos (4/4)',
            missingNumbers: []
          });
        }
        if (ev.isTerno && !ev.isCinquina && !ev.isCartelaCheia) {
          batidasCards.push({
            serial: card.serial,
            formattedSerial: card.formattedSerial,
            authCode: card.authCode,
            batchName,
            category: 'Terno',
            icon: '🍗',
            title: 'Terno (3 em Linha)',
            missingNumbers: []
          });
        }

        // 2. Armadas (prioridade: Cheia > Cinquina > 4 Cantos > Terno)
        if (ev.isArmadaCheia) {
          armadaCards.push({
            serial: card.serial,
            formattedSerial: card.formattedSerial,
            authCode: card.authCode,
            batchName,
            category: 'Cartela Cheia',
            missingNumber: ev.missingCheiaNumber,
            missingNumbers: [ev.missingCheiaNumber],
            priority: 1
          });
        } else if (ev.isArmadaCinquina && !ev.isCinquina) {
          armadaCards.push({
            serial: card.serial,
            formattedSerial: card.formattedSerial,
            authCode: card.authCode,
            batchName,
            category: 'Cinquina',
            missingNumber: ev.missingCinquinaNumbers[0],
            missingNumbers: ev.missingCinquinaNumbers,
            priority: 2
          });
        } else if (ev.isArmadaQuatroCantos && !ev.isQuatroCantos) {
          armadaCards.push({
            serial: card.serial,
            formattedSerial: card.formattedSerial,
            authCode: card.authCode,
            batchName,
            category: 'Quatro Cantos',
            missingNumber: ev.missingCornerNumbers[0],
            missingNumbers: ev.missingCornerNumbers,
            priority: 3
          });
        } else if (ev.isArmadaTerno && !ev.isTerno) {
          armadaCards.push({
            serial: card.serial,
            formattedSerial: card.formattedSerial,
            authCode: card.authCode,
            batchName,
            category: 'Terno',
            missingNumber: ev.missingTernoNumbers[0],
            missingNumbers: ev.missingTernoNumbers,
            priority: 4
          });
        }
      });
    });

    armadaCards.sort((a, b) => (a.priority || 99) - (b.priority || 99));

    return {
      totalCardsAudited,
      bingouCards,
      batidasCards,
      armadaCards,
      hasBingou: bingouCards.length > 0 || batidasCards.length > 0,
      hasArmada: armadaCards.length > 0
    };
  }

  // Persistência Multi-Lotes de Cartelas
  //
  // Dois "compartimentos" separados no localStorage:
  //  - bingo.batchesList / bingo.activeCardsBatch: lotes CRIADOS NESTE
  //    dispositivo (cartelas.html). É a lista que o operador gerencia
  //    (criar/editar/excluir) e a única usada para decidir o "lote ativo".
  //  - bingo.remoteBatchesCache: um espelho somente-leitura dos lotes que
  //    existem na nuvem no momento da última sincronização (usado pela Mesa
  //    de Conferência para achar cartelas geradas em OUTRO dispositivo).
  // Manter isso separado (em vez de misturar tudo numa lista só) é o que
  // permite que uma exclusão de lote em outro aparelho realmente "some"
  // daqui também: mergeRemoteBatches substitui o cache inteiro a cada
  // sincronização, então um lote que não veio mais da nuvem desaparece do
  // cache — em vez de ficar preso pra sempre como aconteceria se ele tivesse
  // sido incorporado direto na lista local.
  const BATCHES_KEY = 'bingo.batchesList';
  const ACTIVE_BATCH_KEY = 'bingo.activeCardsBatch';
  const REMOTE_CACHE_KEY = 'bingo.remoteBatchesCache';

  const Storage = {
    getLocalBatches() {
      try {
        const list = JSON.parse(localStorage.getItem(BATCHES_KEY) || '[]');
        if (Array.isArray(list) && list.length > 0) return list;
        const single = JSON.parse(localStorage.getItem(ACTIVE_BATCH_KEY) || 'null');
        if (single && single.cards) {
          return [single];
        }
        return [];
      } catch (e) {
        return [];
      }
    },
    getRemoteCache() {
      try {
        const list = JSON.parse(localStorage.getItem(REMOTE_CACHE_KEY) || '[]');
        return Array.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    },
    // Lotes locais + lotes só-na-nuvem (sem duplicar por id; lote local
    // sempre vence se o mesmo id existir nos dois lados).
    getAllBatches() {
      const local = this.getLocalBatches();
      const remote = this.getRemoteCache();
      if (!remote.length) return local;
      const localIds = new Set(local.map((b) => b.id));
      const remoteOnly = remote.filter((b) => b && b.id && !localIds.has(b.id));
      return remoteOnly.length ? local.concat(remoteOnly) : local;
    },
    saveAllBatches(batches) {
      if (!Array.isArray(batches) || !batches.length) {
        localStorage.removeItem(BATCHES_KEY);
        localStorage.removeItem(ACTIVE_BATCH_KEY);
        return true;
      }
      try {
        localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
        localStorage.setItem(ACTIVE_BATCH_KEY, JSON.stringify(batches[0]));
        return true;
      } catch (e) {
        // Provavelmente estourou a cota do localStorage (lotes muito grandes
        // ou muitos lotes acumulados). Sem isso, o erro passava batido e o
        // lote parecia "salvo" na tela mas sumia ao recarregar a página.
        console.error('[BingoCardsEngine] Falha ao salvar lotes de cartelas (possível estouro de armazenamento):', e);
        if (global.BingoDialog?.toast) {
          global.BingoDialog.toast('Não foi possível salvar o lote: armazenamento do navegador cheio. Exclua lotes antigos ou reduza a quantidade de cartelas.', 'error', 6000);
        } else if (global.alert) {
          global.alert('Não foi possível salvar o lote: armazenamento do navegador cheio. Exclua lotes antigos ou reduza a quantidade de cartelas.');
        }
        return false;
      }
    },
    saveBatch(newBatch) {
      const list = this.getLocalBatches();
      const existingIdx = list.findIndex((b) => b.id === newBatch.id);
      if (existingIdx >= 0) {
        list[existingIdx] = newBatch;
      } else {
        list.unshift(newBatch);
      }
      const ok = this.saveAllBatches(list);
      // Envia uma cópia do lote para a nuvem (melhor esforço). Isso é o que
      // permite a Mesa de Conferência encontrar estas cartelas por número de
      // série mesmo rodando em outro aparelho/navegador. Se falhar (sem
      // internet, sem chave de operador, etc.) o lote continua 100% válido
      // localmente — só não vai aparecer em outro dispositivo até conseguir
      // sincronizar.
      if (ok && global.BingoSync?.pushCardBatch) {
        global.BingoSync.pushCardBatch(newBatch).catch(() => {});
      }
      return ok;
    },
    deleteBatch(batchId) {
      const list = this.getLocalBatches().filter((b) => b.id !== batchId);
      this.saveAllBatches(list);
      if (global.BingoSync?.deleteCardBatchRemote) {
        global.BingoSync.deleteCardBatchRemote(batchId).catch(() => {});
      }
    },
    // Espelha o cache de lotes vindos da nuvem com o que acabou de ser
    // recebido do servidor (substitui inteiro, não é uma mescla aditiva).
    // Chamar com a lista mais recente da nuvem — inclusive uma lista vazia,
    // caso todos os lotes remotos tenham sido excluídos — para que exclusões
    // feitas em outro aparelho também se reflitam aqui. Não mexe em nada de
    // bingo.batchesList (os lotes criados neste dispositivo).
    mergeRemoteBatches(remoteBatches) {
      const list = Array.isArray(remoteBatches) ? remoteBatches : [];
      try {
        if (list.length) {
          localStorage.setItem(REMOTE_CACHE_KEY, JSON.stringify(list));
        } else {
          localStorage.removeItem(REMOTE_CACHE_KEY);
        }
      } catch (e) {
        console.warn('[BingoCardsEngine] Falha ao atualizar cache de lotes remotos:', e);
      }
      return this.getAllBatches();
    },
    getActiveBatch(roundId = null) {
      const list = this.getAllBatches();
      if (!list.length) return null;

      if (roundId) {
        const matched = list.find((b) => {
          if (!b.assignedRoundIds || !b.assignedRoundIds.length) return false;
          return b.assignedRoundIds.includes(roundId) || b.assignedRoundIds.includes('all');
        });
        if (matched) return matched;
      }
      return list[0] || null;
    },
    findCardBySerial(serial, roundId = null) {
      const num = parseInt(serial, 10);
      if (isNaN(num)) return null;

      const activeBatch = this.getActiveBatch(roundId);
      if (activeBatch && Array.isArray(activeBatch.cards)) {
        const found = activeBatch.cards.find((c) => c.serial === num);
        if (found) return { card: found, batch: activeBatch };
      }

      const all = this.getAllBatches();
      for (const b of all) {
        if (b.id !== activeBatch?.id && Array.isArray(b.cards)) {
          const found = b.cards.find((c) => c.serial === num);
          if (found) return { card: found, batch: b };
        }
      }
      return null;
    }
  };

  function getLogoDataUrl() {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 256, 256);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = 'favicon.svg';
    });
  }

  // Exportador de PDF em A4 para Impressão
  async function generatePDF(batch, options = {}) {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      if (global.BingoDialog?.toast) global.BingoDialog.toast('Biblioteca de PDF ainda carregando, tente de novo em instantes.', 'warning');
      else alert('Biblioteca jsPDF não carregada.');
      return;
    }

    const cardsPerPage = options.cardsPerPage || 4; // 4 ou 2 por folha
    const colorTheme = options.colorTheme || 'blue'; // blue, green, red, amber, bw
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const themeColors = {
      blue: { primary: [30, 58, 138], bgHeader: [239, 246, 255], border: [147, 197, 253], textDark: [15, 23, 42] },
      green: { primary: [20, 83, 45], bgHeader: [240, 253, 244], border: [134, 239, 172], textDark: [15, 23, 42] },
      red: { primary: [153, 27, 27], bgHeader: [254, 242, 242], border: [252, 165, 165], textDark: [15, 23, 42] },
      amber: { primary: [146, 64, 14], bgHeader: [254, 243, 199], border: [252, 211, 77], textDark: [15, 23, 42] },
      bw: { primary: [0, 0, 0], bgHeader: [240, 240, 240], border: [0, 0, 0], textDark: [0, 0, 0] }
    };
    const c = themeColors[colorTheme] || themeColors.blue;

    const logoDataUrl = await getLogoDataUrl();
    const cards = batch.cards || [];
    const totalPages = Math.ceil(cards.length / cardsPerPage);

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) doc.addPage();

      const pageCards = cards.slice(p * cardsPerPage, (p + 1) * cardsPerPage);

      if (cardsPerPage === 4) {
        // Layout 2x2 em A4 (210 x 297 mm)
        const positions = [
          { x: 10, y: 10, w: 90, h: 133 },
          { x: 110, y: 10, w: 90, h: 133 },
          { x: 10, y: 153, w: 90, h: 133 },
          { x: 110, y: 153, w: 90, h: 133 }
        ];

        // Linhas guias pontilhadas de corte no centro
        doc.setDrawColor(200, 200, 200);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(105, 5, 105, 292);
        doc.line(5, 148, 205, 148);
        doc.setLineDashPattern([], 0); // restaura

        pageCards.forEach((card, idx) => {
          renderCardOnPDF(doc, card, batch, positions[idx], c, logoDataUrl);
        });
      } else {
        // Layout 2x1 em A4 (2 cartelas grandes por folha)
        const positions = [
          { x: 20, y: 15, w: 170, h: 125 },
          { x: 20, y: 155, w: 170, h: 125 }
        ];

        doc.setDrawColor(200, 200, 200);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(10, 148, 200, 148);
        doc.setLineDashPattern([], 0);

        pageCards.forEach((card, idx) => {
          renderCardOnPDF(doc, card, batch, positions[idx], c, logoDataUrl);
        });
      }
    }

    const fileName = `Cartelas_${(batch.eventName || 'Bingo').replace(/\s+/g, '_')}_Serie_${batch.startSerial}-${batch.endSerial}.pdf`;
    doc.save(fileName);
  }

  function renderCardOnPDF(doc, card, batch, pos, c, logoDataUrl) {
    const { x, y, w, h } = pos;

    // Fundo da Cartela (Quadrada/Retangular sem cantos arredondados)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...c.primary);
    doc.setLineWidth(0.8);
    doc.rect(x, y, w, h, 'FD');

    // Cabeçalho da Cartela (Quadrado sem arredondamento)
    doc.setFillColor(...c.bgHeader);
    doc.setDrawColor(...c.border);
    doc.setLineWidth(0.4);
    doc.rect(x, y, w, 15, 'FD');

    // Título do Evento
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(w > 120 ? 12 : 9.5);
    doc.setTextColor(...c.primary);
    doc.text((batch.eventName || 'BINGO 75').toUpperCase(), x + w / 2, y + 6, { align: 'center' });

    // Subtítulo e Rodada
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(w > 120 ? 9 : 7);
    doc.setTextColor(100, 116, 139);
    doc.text(batch.roundName || 'Cartela Oficial', x + w / 2, y + 11, { align: 'center' });

    // Faixa B-I-N-G-O (Cor Única baseada no Tema Escolhido)
    const letters = ['B', 'I', 'N', 'G', 'O'];

    const gridX = x + 3.5;
    const gridY = y + 17;
    const gridW = w - 7;
    const cellW = gridW / 5;
    const headerH = w > 120 ? 11 : 9;
    const cellH = (h - 36) / 5;

    // Desenha cabeçalho B I N G O com cor única do tema
    letters.forEach((L, idx) => {
      const cx = gridX + idx * cellW;
      doc.setFillColor(...c.primary);
      doc.rect(cx, gridY, cellW, headerH, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(w > 120 ? 15 : 12);
      doc.text(L, cx + cellW / 2, gridY + headerH / 2 + (w > 120 ? 4 : 3), { align: 'center' });
    });

    // Desenha Grade 5x5 de Números
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);

    for (let r = 0; r < 5; r++) {
      const cy = gridY + headerH + r * cellH;
      for (let col = 0; col < 5; col++) {
        const cx = gridX + col * cellW;
        const val = card.grid[r][col];

        if (val === 'FREE') {
          doc.setFillColor(254, 240, 138); // amarelo suave
          doc.rect(cx, cy, cellW, cellH, 'FD');

          if (logoDataUrl) {
            try {
              const logoSize = Math.min(cellW, cellH) * 0.52;
              const lx = cx + (cellW - logoSize) / 2;
              const ly = cy + (cellH - logoSize) / 2 - (w > 120 ? 2 : 1.5);
              doc.addImage(logoDataUrl, 'PNG', lx, ly, logoSize, logoSize);
            } catch (e) {}
          }

          doc.setTextColor(133, 77, 14);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(w > 120 ? 7.5 : 5.5);
          doc.text('GRÁTIS', cx + cellW / 2, cy + cellH - (w > 120 ? 2 : 1.2), { align: 'center' });
        } else {
          doc.setFillColor((r + col) % 2 === 0 ? 255 : 248, (r + col) % 2 === 0 ? 255 : 250, (r + col) % 2 === 0 ? 255 : 252);
          doc.rect(cx, cy, cellW, cellH, 'FD');
          doc.setTextColor(...c.textDark);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(w > 120 ? 19 : 15); // Número bem maior e legível
          doc.text(String(val), cx + cellW / 2, cy + cellH / 2 + (w > 120 ? 5.5 : 4.5), { align: 'center' });
        }
      }
    }

    // Rodapé da Cartela: Número de Série + Código Antifraude
    const footerY = y + h - 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(w > 120 ? 10 : 8);
    doc.setTextColor(...c.primary);
    doc.text(`SÉRIE Nº ${card.formattedSerial}`, x + 5, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(w > 120 ? 8 : 6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`AUT: ${card.authCode}`, x + w - 5, footerY, { align: 'right' });
  }

  // Exporta objeto global
  global.BingoCardsEngine = {
    generateSingleCard,
    generateBatch,
    generateAuthCode,
    evaluateCard,
    auditAllCardsForRound,
    generatePDF,
    Storage
  };
})(window);
