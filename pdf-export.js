
      (function(){
function countByLetter(drawn){
  const c = {B:0,I:0,N:0,G:0,O:0};
  (drawn||[]).forEach(n=>{
    const L = n<=15?'B':n<=30?'I':n<=45?'N':n<=60?'G':'O';
    c[L]++;
  });
  return c;
}

  function formatDuration(ms){
    if(!ms || ms < 0) return '—';
    const sec = Math.floor(ms/1000);
    const h = Math.floor(sec/3600);
    const m = Math.floor((sec%3600)/60);
    const s = sec%60;
    const parts = [];
    if(h) parts.push(h+'h');
    if(m) parts.push(m+'min');
    parts.push(String(s).padStart(2,'0')+'s');
    return parts.join(' ');
  }

  function countByType(ranking){
    const types = ['Terno','Quatro Cantos','Cinquina','Cartela Cheia'];
    const map = Object.fromEntries(types.map(t=>[t,0]));
    (ranking||[]).forEach(r=>{ if(map.hasOwnProperty(r.type)) map[r.type]++; });
    return map;
  }

  async function loadLogoDataURL(){
    return new Promise((resolve)=>{
      const img = new Image();
      img.onload = ()=>{
        try{
          const side = 72;
          const canvas = document.createElement('canvas');
          canvas.width = side; canvas.height = side;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff00'; ctx.fillRect(0,0,side,side);
          ctx.drawImage(img, 0, 0, side, side);
          resolve(canvas.toDataURL('image/png'));
        }catch(e){ resolve(null); }
      };
      img.onerror = ()=> resolve(null);
      img.src = 'favicon.svg';
    });
  }

  async function exportBingoPDF({ drawn = [], ranking = [], last = null, firstTs = null, lastTs = null } = {}){
    const { jsPDF } = window.jspdf || {};
    if(!jsPDF){ alert('jsPDF não carregado.'); return; }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const L = 48; // left margin
    let y = 56;

    // Header with logo
    const logoUrl = await loadLogoDataURL();
    if(logoUrl){
      try{ doc.addImage(logoUrl, 'PNG', W-96, 28, 56, 56); }catch(e){}
    }else{
      doc.setFillColor(0,94,245); doc.rect(W-96, 28, 56, 56, 'F');
      doc.setTextColor(255); doc.setFont('helvetica','bold'); doc.setFontSize(16);
      doc.text('B75', W-68, 62, {align:'center'});
      doc.setTextColor(0);
    }

    // Title
    doc.setFont('helvetica','bold'); doc.setFontSize(20);
    doc.text('Relatório do Bingo 75', L, y);
    doc.setFont('helvetica','normal'); doc.setFontSize(11);
    const now = new Date();
    doc.text(now.toLocaleString(), W - 200, y, {align:'left'});
    y += 18;
    doc.setDrawColor(40); doc.line(L, y, W - L, y); y += 18;

    // Summary
    const dur = (firstTs && lastTs) ? (lastTs - firstTs) : 0;
    const byType = countByType(ranking);
    doc.setFont('helvetica','bold'); doc.setFontSize(14);
    doc.text('Resumo', L, y); y += 14;
    doc.setFont('helvetica','normal'); doc.setFontSize(12);
    doc.text(`Total de pedras sorteadas: ${drawn.length}`, L, y); y += 14;
    doc.text(`Tempo total de jogo: ${formatDuration(dur)}`, L, y); y += 14;
    doc.text(`Vencedores: Terno ${byType['Terno']||0} · Quatro Cantos ${byType['Quatro Cantos']||0} · Cinquina ${byType['Cinquina']||0} · Cartela Cheia ${byType['Cartela Cheia']||0}`, L, y);
    y += 14;
    const cnt = countByLetter(drawn);
    doc.text(`Por letra: B ${cnt.B} · I ${cnt.I} · N ${cnt.N} · G ${cnt.G} · O ${cnt.O}`, L, y);
    y += 18;

    // Drawn numbers grouped with last highlight
    const groups = { B:[], I:[], N:[], G:[], O:[] };
    drawn.slice().sort((a,b)=>a-b).forEach(n=>{
      const letter = n<=15? 'B' : n<=30? 'I' : n<=45? 'N' : n<=60? 'G' : 'O';
      groups[letter].push(n);
    });

    doc.setFont('helvetica','bold'); doc.setFontSize(14);
    doc.text('Números sorteados', L, y); y += 12;
    doc.setFont('helvetica','normal'); doc.setFontSize(11);

    const colWidth = (W - L*2) / 5;
    const letters = ['B','I','N','G','O'];
    const chipW = 28, chipH = 18, gapX = 6, gapY = 6;
    const chipsPerRow = Math.floor((colWidth - 10) / (chipW + gapX));

    let colX = L;
    let maxColH = 0;

    letters.forEach(letter=>{
      let colY = y;
      doc.setFont('helvetica','bold'); doc.setTextColor(0);
      doc.text(letter, colX, colY); colY += 10;
      doc.setFont('helvetica','normal');
      const nums = groups[letter];
      if(!nums.length){
        doc.text('—', colX, colY+chipH/2);
        colX += colWidth;
        maxColH = Math.max(maxColH, chipH+gapY+12);
        return;
      }
      let cx = colX; let cy = colY;
      nums.forEach((n, idx)=>{
        const isLast = (n === last);
        if(isLast){
          doc.setDrawColor(230, 193, 77);
          doc.setFillColor(255, 209, 102);
          doc.setLineWidth(1.4);
        }else{
          doc.setDrawColor(180);
          doc.setFillColor(245);
          doc.setLineWidth(0.6);
        }
        doc.rect(cx, cy, chipW, chipH, 'FD');
        doc.setTextColor(isLast ? 10 : 0);
        doc.setFont(isLast ? 'helvetica' : 'helvetica', isLast ? 'bold' : 'normal');
        doc.text(String(n), cx + chipW/2, cy + chipH/2 + 3, {align:'center'});
        if(((idx+1) % chipsPerRow) === 0){
          cx = colX;
          cy += chipH + gapY;
        }else{
          cx += chipW + gapX;
        }
      });
      const colH = (Math.ceil(nums.length / chipsPerRow)) * (chipH + gapY) + 12;
      maxColH = Math.max(maxColH, colH);
      colX += colWidth;
    });
    y += maxColH + 12;

    // Winners
    doc.setFont('helvetica','bold'); doc.setFontSize(14);
    doc.text('Vencedores', L, y); y += 12;
    doc.setFont('helvetica','normal'); doc.setFontSize(11);

    if(!ranking.length){
      doc.text('Nenhum vencedor registrado.', L, y+12);
    } else {
      const headers = ['#','Jogador','Conquista','Quando'];
      const widths = [30, 260, 160, 200];
      let x = L;
      const headerY = y + 10;
      doc.setFillColor(235); doc.rect(L, y, W - L*2, 24, 'F');
      doc.setFont('helvetica','bold'); doc.setTextColor(0);
      headers.forEach((h, i)=>{ doc.text(h, x + 8, headerY); x += widths[i]; });
      y += 28;
      doc.setFont('helvetica','normal');

      ranking.forEach((r, i)=>{
        let rowX = L;
        const when = new Date(r.ts||Date.now()).toLocaleString();
        const row = [String(i+1).padStart(2,'0'), r.name||'', r.type||'', when];
        const rowH = 18;
        if(i % 2 === 0){ doc.setFillColor(248); doc.rect(L, y-12, W - L*2, rowH, 'F'); }
        row.forEach((cell, ci)=>{
          doc.text(String(cell), rowX + 8, y);
          rowX += widths[ci];
        });
        y += rowH;
        if(y > H - 60){
          doc.addPage('a4','landscape'); y = 56;
        }
      });
    }


// Timeline (order of draw)
doc.setFont('helvetica','bold'); doc.setFontSize(14);
doc.text('Linha do tempo do sorteio', L, y); y += 12;
doc.setFont('helvetica','normal'); doc.setFontSize(10);
if(!drawn.length){
  doc.text('—', L, y); y += 12;
}else{
  const perRow = 28;
  const rows = Math.ceil(drawn.length / perRow);
  for(let r=0;r<rows;r++){
    const slice = drawn.slice(r*perRow, (r+1)*perRow);
    const line = slice.map(n=> (n<=15?'B':n<=30?'I':n<=45?'N':n<=60?'G':'O')+' '+n).join('  ');
    doc.text(line, L, y); y += 12;
    if(y > H - 80){ doc.addPage('a4','landscape'); y = 56; }
  }
}

// Footer

    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text('Gerado automaticamente pelo Bingo 75', L, H - 24);

    doc.save('relatorio_bingo.pdf');
  }

  window.exportBingoPDF = exportBingoPDF;
})();
