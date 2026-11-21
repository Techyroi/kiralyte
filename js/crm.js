(function () {
  var TOKEN_KEY = 'kiralyte_crm_token';
  var LOCAL_KEY = 'kiralyte_local_leads';
  var MODE_KEY = 'kiralyte_crm_mode';
  var DEFAULT_PIN = 'kiralyte2026';

  var token = sessionStorage.getItem(TOKEN_KEY) || '';
  var mode = sessionStorage.getItem(MODE_KEY) || 'api';
  var leads = [];
  var activeStatus = 'All';
  var activeLeadId = null;

  var loginView = document.getElementById('crm-login-view');
  var dashView = document.getElementById('crm-dashboard');
  var logoutBtn = document.getElementById('crm-logout');
  var authForm = document.getElementById('crm-auth-form');
  var authErr = document.getElementById('crm-auth-err');
  var listEl = document.getElementById('crm-list');
  var searchEl = document.getElementById('crm-search');
  var modal = document.getElementById('lead-modal');

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch { return iso || ''; }
  }

  function esc(str) {
    return String(str || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function getLocalLeads() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; }
  }

  function saveLocalLeads(arr) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
  }

  function showDashboard() {
    loginView.hidden = true;
    dashView.hidden = false;
    logoutBtn.hidden = false;
    loadLeads();
  }

  function showLogin(msg) {
    token = '';
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(MODE_KEY);
    loginView.hidden = false;
    dashView.hidden = true;
    logoutBtn.hidden = true;
    if (msg) authErr.textContent = msg;
  }

  async function api(url, opts) {
    var headers = Object.assign({ 'Content-Type': 'application/json', 'x-crm-token': token }, (opts && opts.headers) || {});
    var res = await fetch(url, Object.assign({}, opts, { headers: headers }));
    if (res.status === 401) { showLogin('Session expired. Please enter your PIN again.'); throw new Error('Unauthorized'); }
    return res.json();
  }

  async function loadLeads() {
    listEl.innerHTML = '<p class="crm-empty">Loading visitor leads...</p>';
    if (mode === 'local') {
      leads = getLocalLeads();
      updateStats();
      renderLeads();
      return;
    }
    try {
      var data = await api('/api/leads');
      leads = data.leads || [];
      updateStats();
      renderLeads();
    } catch (e) {
      if (e.message !== 'Unauthorized') {
        mode = 'local';
        sessionStorage.setItem(MODE_KEY, 'local');
        leads = getLocalLeads();
        updateStats();
        renderLeads();
      }
    }
  }

  function updateStats() {
    document.getElementById('stat-total').textContent = leads.length;
    document.getElementById('stat-new').textContent = leads.filter(function (l) { return l.status === 'New'; }).length;
    document.getElementById('stat-qualified').textContent = leads.filter(function (l) { return l.status === 'Qualified'; }).length;
    document.getElementById('stat-won').textContent = leads.filter(function (l) { return l.status === 'Won'; }).length;
  }

  function renderLeads() {
    var q = (searchEl.value || '').trim().toLowerCase();
    var filtered = leads.filter(function (l) {
      if (activeStatus !== 'All' && l.status !== activeStatus) return false;
      if (!q) return true;
      return [l.name, l.email, l.phone, l.service, l.budget, l.message, l.notes].join(' ').toLowerCase().indexOf(q) !== -1;
    });

    var banner = mode === 'local'
      ? '<div class="crm-empty" style="padding:14px 20px;text-align:left;border-style:solid;border-color:rgba(244,123,32,.35);color:#ffd5b0">Browser-only CRM mode (no Node backend on this port/host). For shared file-backed storage (<code>data/leads.json</code>), open <strong>http://localhost:4173/crm.html</strong> after running <code>npm start</code>.</div>'
      : '';

    if (!filtered.length) {
      listEl.innerHTML = banner + '<div class="crm-empty">No leads match this filter yet. Visitor submissions from your website will appear here automatically.</div>';
      return;
    }

    listEl.innerHTML = banner + filtered.map(function (l) {
      return '<article class="card crm-row">' +
        '<div class="crm-row__main">' +
          '<div class="crm-row__head">' +
            '<h3>' + esc(l.name) + '</h3>' +
            '<span class="crm-badge crm-badge--' + esc(l.status.toLowerCase()) + '">' + esc(l.status) + '</span>' +
            '<span class="crm-date">' + esc(fmtDate(l.createdAt)) + '</span>' +
          '</div>' +
          '<div class="crm-row__meta">' +
            '<span>' + esc(l.email) + '</span>' +
            (l.phone ? '<span>' + esc(l.phone) + '</span>' : '') +
            '<span>' + esc(l.service) + '</span>' +
            '<span>' + esc(l.budget) + '</span>' +
          '</div>' +
          '<p class="crm-row__msg">' + esc(l.message) + '</p>' +
        '</div>' +
        '<div class="crm-row__actions">' +
          '<button type="button" class="btn btn--p btn--sm" data-open-lead="' + esc(l.id) + '">Open &amp; Manage</button>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  var lastFocusedEl = null;
  function closeLeadModal() {
    modal.hidden = true;
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      lastFocusedEl.focus();
      lastFocusedEl = null;
    }
  }

  function openLead(id) {
    var l = leads.find(function (x) { return x.id === id; });
    if (!l) return;
    lastFocusedEl = document.activeElement;
    activeLeadId = id;
    document.getElementById('lead-modal-date').textContent = 'Received ' + fmtDate(l.createdAt);
    document.getElementById('lead-modal-name').textContent = l.name;
    var emailEl = document.getElementById('lead-modal-email');
    emailEl.textContent = l.email;
    emailEl.href = 'mailto:' + l.email;
    document.getElementById('lead-modal-phone').textContent = l.phone || 'Not provided';
    document.getElementById('lead-modal-service').textContent = l.service;
    document.getElementById('lead-modal-budget').textContent = l.budget;
    document.getElementById('lead-modal-message').textContent = l.message;
    document.getElementById('lead-status').value = l.status;
    document.getElementById('lead-notes').value = l.notes || '';
    document.getElementById('lead-save-msg').textContent = '';

    document.getElementById('lead-reply-email').href =
      'mailto:' + l.email + '?subject=' + encodeURIComponent('Re: Your Kiralyte project brief (' + l.service + ')');

    var waBtn = document.getElementById('lead-reply-wa');
    var cleanPhone = (l.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone) {
      waBtn.hidden = false;
      waBtn.href = 'https://wa.me/' + cleanPhone;
    } else {
      waBtn.hidden = true;
    }
    modal.hidden = false;
    var closeBtn = modal.querySelector('.modal__close');
    if (closeBtn) closeBtn.focus();
  }

  authForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    authErr.textContent = '';
    var pin = document.getElementById('crm-pin').value;
    try {
      var res = await fetch('/api/crm/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin })
      });
      var ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Static host');
      var data = await res.json();
      if (!res.ok) { authErr.textContent = data.error || 'Invalid PIN'; return; }
      mode = 'api';
      token = data.token;
      sessionStorage.setItem(MODE_KEY, 'api');
      sessionStorage.setItem(TOKEN_KEY, token);
      showDashboard();
    } catch {
      /* Fallback for static hosting / Live Server (port 5500) / file:// */
      if (pin !== DEFAULT_PIN) {
        authErr.textContent = 'Invalid PIN (default: kiralyte2026)';
        return;
      }
      mode = 'local';
      token = 'local';
      sessionStorage.setItem(MODE_KEY, 'local');
      sessionStorage.setItem(TOKEN_KEY, token);
      showDashboard();
    }
  });

  logoutBtn.addEventListener('click', function () { showLogin(''); });
  document.getElementById('crm-refresh').addEventListener('click', loadLeads);
  searchEl.addEventListener('input', renderLeads);

  document.querySelectorAll('.crm-filters .filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.crm-filters .filter-btn').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      activeStatus = btn.getAttribute('data-status');
      renderLeads();
    });
  });

  listEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-open-lead]');
    if (btn) openLead(btn.getAttribute('data-open-lead'));
  });

  document.querySelectorAll('[data-close-lead]').forEach(function (el) {
    el.addEventListener('click', closeLeadModal);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeLeadModal();
  });

  document.getElementById('lead-save').addEventListener('click', async function () {
    if (!activeLeadId) return;
    var status = document.getElementById('lead-status').value;
    var notes = document.getElementById('lead-notes').value;
    if (mode === 'local') {
      var idx = leads.findIndex(function (l) { return l.id === activeLeadId; });
      if (idx !== -1) {
        leads[idx].status = status;
        leads[idx].notes = notes;
        leads[idx].updatedAt = new Date().toISOString();
        saveLocalLeads(leads);
      }
      updateStats();
      renderLeads();
      document.getElementById('lead-save-msg').textContent = 'Saved.';
      return;
    }
    var res = await api('/api/leads/' + activeLeadId, {
      method: 'PATCH',
      body: JSON.stringify({ status: status, notes: notes })
    });
    if (res.ok) {
      var i = leads.findIndex(function (l) { return l.id === activeLeadId; });
      if (i !== -1) leads[i] = res.lead;
      updateStats();
      renderLeads();
      document.getElementById('lead-save-msg').textContent = 'Saved.';
    }
  });

  document.getElementById('lead-delete').addEventListener('click', async function () {
    if (!activeLeadId || !confirm('Delete this lead permanently?')) return;
    if (mode === 'local') {
      leads = leads.filter(function (l) { return l.id !== activeLeadId; });
      saveLocalLeads(leads);
      closeLeadModal();
      updateStats();
      renderLeads();
      return;
    }
    var res = await api('/api/leads/' + activeLeadId, { method: 'DELETE' });
    if (res.ok) {
      leads = leads.filter(function (l) { return l.id !== activeLeadId; });
      closeLeadModal();
      updateStats();
      renderLeads();
    }
  });

  document.getElementById('crm-export').addEventListener('click', function () {
    var headers = ['Date', 'Name', 'Email', 'Phone', 'Service', 'Budget', 'Status', 'Message', 'Notes'];
    var rows = leads.map(function (l) {
      return [l.createdAt, l.name, l.email, l.phone, l.service, l.budget, l.status, l.message, l.notes]
        .map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(',');
    });
    var csv = [headers.join(',')].concat(rows).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = 'kiralyte-leads-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
  });

  if (token) showDashboard();
})();
