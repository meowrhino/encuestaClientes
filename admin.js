(() => {
  const API_BASE = 'https://encuesta-worker.manuellatourf.workers.dev';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  let adminKey = '';

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showNotification(message, type = 'info') {
    const el = $('#notification');
    el.textContent = message;
    el.className = `notification notification-${type} show`;
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.classList.remove('show'), 3000);
  }

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }

  async function adminFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey,
        ...(options.headers || {}),
      },
    });
    return res.json();
  }

  // --- Auth ---

  function login() {
    const key = $('#adminKeyInput').value.trim();
    if (!key) {
      showNotification('introduce la clave', 'error');
      return;
    }
    adminKey = key;
    $('#authGate').style.display = 'none';
    $('#adminPanel').style.display = 'block';
    loadClients();
  }

  function logout() {
    adminKey = '';
    $('#authGate').style.display = '';
    $('#adminPanel').style.display = 'none';
    $('#adminKeyInput').value = '';
  }

  // --- Tabs ---

  function initTabs() {
    $$('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.tab-btn').forEach(b => b.classList.remove('active'));
        $$('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        $(`#tab${btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1)}`).classList.add('active');

        if (btn.dataset.tab === 'clients') loadClients();
        else if (btn.dataset.tab === 'surveys') loadSurveys();
        else if (btn.dataset.tab === 'coupons') loadCoupons();
      });
    });
  }

  // --- Clients ---

  async function loadClients() {
    try {
      const data = await adminFetch('/api/admin/clients');
      if (data.error) {
        showNotification(data.error, 'error');
        if (data.error === 'unauthorized') logout();
        return;
      }
      const tbody = $('#clientsBody');
      const empty = $('#clientsEmpty');

      if (!data.clients.length) {
        tbody.innerHTML = '';
        empty.style.display = '';
        return;
      }

      empty.style.display = 'none';
      tbody.innerHTML = data.clients.map(c => `
        <tr>
          <td>${escapeHtml(c.domain)}</td>
          <td>${formatDate(c.addedAt)}</td>
        </tr>
      `).join('');
    } catch {
      showNotification('error cargando clientes', 'error');
    }
  }

  async function addClient() {
    const domain = $('#newClientDomain').value.trim();
    if (!domain) {
      showNotification('introduce un dominio', 'error');
      return;
    }

    try {
      const data = await adminFetch('/api/admin/add-client', {
        method: 'POST',
        body: JSON.stringify({ domain }),
      });

      if (data.ok) {
        showNotification('cliente añadido', 'success');
        $('#newClientDomain').value = '';
        loadClients();
      } else {
        showNotification(data.error || 'error', 'error');
      }
    } catch {
      showNotification('error de conexión', 'error');
    }
  }

  // --- Surveys ---

  async function loadSurveys() {
    try {
      const data = await adminFetch('/api/admin/surveys');
      if (data.error) {
        showNotification(data.error, 'error');
        return;
      }
      const tbody = $('#surveysBody');
      const empty = $('#surveysEmpty');

      if (!data.surveys.length) {
        tbody.innerHTML = '';
        empty.style.display = '';
        return;
      }

      empty.style.display = 'none';
      tbody.innerHTML = data.surveys.map((s, i) => {
        const comments = Object.entries(s.comments || {})
          .filter(([, v]) => v)
          .map(([k, v]) => `<strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}`)
          .join('<br>');

        return `
          <tr>
            <td>${escapeHtml(s.domain)}</td>
            <td>${s.ratings.general}</td>
            <td>${s.ratings.trato}</td>
            <td>${s.ratings.diseno}</td>
            <td>${s.ratings.proceso}</td>
            <td>${s.ratings.resultado}</td>
            <td>${formatDate(s.submittedAt)}</td>
            <td>${comments ? `<button class="btn-toggle-comments" data-idx="${i}">ver</button>` : ''}</td>
          </tr>
          ${comments ? `<tr><td colspan="8"><div class="survey-comments" id="comments-${i}">${comments}</div></td></tr>` : ''}
        `;
      }).join('');

      tbody.querySelectorAll('.btn-toggle-comments').forEach(btn => {
        btn.addEventListener('click', () => {
          const div = $(`#comments-${btn.dataset.idx}`);
          div.classList.toggle('show');
          btn.textContent = div.classList.contains('show') ? 'ocultar' : 'ver';
        });
      });
    } catch {
      showNotification('error cargando encuestas', 'error');
    }
  }

  // --- Coupons ---

  async function loadCoupons() {
    try {
      const data = await adminFetch('/api/admin/coupons');
      if (data.error) {
        showNotification(data.error, 'error');
        return;
      }
      const tbody = $('#couponsBody');
      const empty = $('#couponsEmpty');

      if (!data.coupons.length) {
        tbody.innerHTML = '';
        empty.style.display = '';
        return;
      }

      empty.style.display = 'none';
      tbody.innerHTML = data.coupons.map(c => `
        <tr>
          <td style="font-family:ui-monospace,'Cascadia Code','Fira Code',monospace;letter-spacing:0.05em;">${escapeHtml(c.code)}</td>
          <td>${escapeHtml(c.domain)}</td>
          <td>${formatDate(c.createdAt)}</td>
          <td>
            ${c.used
              ? `<span class="badge-used">canjeado ${formatDate(c.usedAt)}</span>`
              : `<button class="btn-redeem" data-code="${escapeHtml(c.code)}">canjear</button>`
            }
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('.btn-redeem').forEach(btn => {
        btn.addEventListener('click', () => redeemCoupon(btn.dataset.code));
      });
    } catch {
      showNotification('error cargando cupones', 'error');
    }
  }

  async function redeemCoupon(code) {
    try {
      const data = await adminFetch('/api/admin/redeem', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });

      if (data.ok) {
        showNotification('cupón canjeado', 'success');
        loadCoupons();
      } else {
        showNotification(data.error || 'error', 'error');
      }
    } catch {
      showNotification('error de conexión', 'error');
    }
  }

  // --- Init ---

  $('#btnLogin').addEventListener('click', login);
  $('#adminKeyInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') login();
  });
  $('#btnLogout').addEventListener('click', logout);
  $('#btnAddClient').addEventListener('click', addClient);
  $('#newClientDomain').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addClient();
  });
  initTabs();
})();
