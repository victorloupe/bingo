// ============================================================
// Bingo 75 — Sistema de Diálogos & Notificações Customizadas
// Substitui alert() e confirm() do navegador por modais modernos do sistema
// ============================================================

(function () {
  const ICONS = {
    info: `<svg class="lucide lucide-info" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
    success: `<svg class="lucide lucide-check-circle" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    warning: `<svg class="lucide lucide-alert-triangle" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    error: `<svg class="lucide lucide-alert-circle" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    trash: `<svg class="lucide lucide-trash-2" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    help: `<svg class="lucide lucide-help-circle" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
  };

  // Injeta o HTML do modal e container de toasts se não existirem
  function ensureElements() {
    if (!document.getElementById('bingo-dialog-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'bingo-dialog-overlay';
      overlay.className = 'dialog-overlay';
      overlay.setAttribute('hidden', '');
      overlay.innerHTML = `
        <div class="dialog-box" id="bingo-dialog-box" role="dialog" aria-modal="true">
          <div class="dialog-header">
            <div class="dialog-icon" id="bingo-dialog-icon">${ICONS.info}</div>
            <div class="dialog-title-wrap">
              <h3 class="dialog-title" id="bingo-dialog-title">Título</h3>
              <p class="dialog-msg" id="bingo-dialog-msg">Mensagem descritiva</p>
            </div>
          </div>
          <div class="dialog-actions" id="bingo-dialog-actions"></div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    if (!document.getElementById('bingo-toast-container')) {
      const toastContainer = document.createElement('div');
      toastContainer.id = 'bingo-toast-container';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  }

  function confirm({
    title = 'Confirmação',
    message = 'Deseja realmente prosseguir com esta ação?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    danger = false,
    icon = null
  } = {}) {
    ensureElements();
    return new Promise((resolve) => {
      const overlay = document.getElementById('bingo-dialog-overlay');
      const iconEl = document.getElementById('bingo-dialog-icon');
      const titleEl = document.getElementById('bingo-dialog-title');
      const msgEl = document.getElementById('bingo-dialog-msg');
      const actionsEl = document.getElementById('bingo-dialog-actions');

      if (icon && typeof icon === 'string' && icon.includes('<svg')) {
        iconEl.innerHTML = icon;
      } else if (danger) {
        iconEl.innerHTML = ICONS.trash;
      } else {
        iconEl.innerHTML = ICONS.help;
      }

      titleEl.textContent = title;
      msgEl.innerHTML = message.replace(/\n/g, '<br>');

      actionsEl.innerHTML = `
        <button type="button" class="btn-min" id="dialog-btn-cancel">${cancelText}</button>
        <button type="button" class="btn-min ${danger ? 'btn-min-danger-solid' : 'btn-min-primary'}" id="dialog-btn-confirm">${confirmText}</button>
      `;

      overlay.removeAttribute('hidden');

      const btnCancel = document.getElementById('dialog-btn-cancel');
      const btnConfirm = document.getElementById('dialog-btn-confirm');

      function close(result) {
        overlay.setAttribute('hidden', '');
        btnCancel.removeEventListener('click', onCancel);
        btnConfirm.removeEventListener('click', onConfirm);
        resolve(result);
      }

      function onCancel() { close(false); }
      function onConfirm() { close(true); }

      btnCancel.addEventListener('click', onCancel);
      btnConfirm.addEventListener('click', onConfirm);
      btnConfirm.focus();
    });
  }

  function alert({
    title = 'Aviso',
    message = '',
    confirmText = 'Entendido',
    type = 'info' // info, success, warning, error
  } = {}) {
    ensureElements();
    return new Promise((resolve) => {
      const overlay = document.getElementById('bingo-dialog-overlay');
      const iconEl = document.getElementById('bingo-dialog-icon');
      const titleEl = document.getElementById('bingo-dialog-title');
      const msgEl = document.getElementById('bingo-dialog-msg');
      const actionsEl = document.getElementById('bingo-dialog-actions');

      iconEl.innerHTML = ICONS[type] || ICONS.info;
      titleEl.textContent = title;
      msgEl.innerHTML = (message || '').replace(/\n/g, '<br>');

      actionsEl.innerHTML = `
        <button type="button" class="btn-min btn-min-primary" style="width:100%;" id="dialog-btn-alert-ok">${confirmText}</button>
      `;

      overlay.removeAttribute('hidden');

      const btnOk = document.getElementById('dialog-btn-alert-ok');
      function close() {
        overlay.setAttribute('hidden', '');
        btnOk.removeEventListener('click', close);
        resolve(true);
      }
      btnOk.addEventListener('click', close);
      btnOk.focus();
    });
  }

  function toast(message, type = 'info', duration = 3500) {
    ensureElements();
    const container = document.getElementById('bingo-toast-container');
    const toastEl = document.createElement('div');
    toastEl.className = `custom-toast toast-${type}`;
    toastEl.innerHTML = `
      <span class="toast-icon" style="display:inline-flex; align-items:center;">${ICONS[type] || ICONS.info}</span>
      <span class="toast-text">${message}</span>
    `;

    container.appendChild(toastEl);
    setTimeout(() => {
      toastEl.classList.add('toast-hide');
      setTimeout(() => toastEl.remove(), 300);
    }, duration);
  }

  window.BingoDialog = { confirm, alert, toast };
})();
