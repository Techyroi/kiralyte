(function () {
  var TOKEN_KEY = 'kiralyte_crm_token';
  var token = sessionStorage.getItem(TOKEN_KEY) || '';
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

  function showDashboard() {
    loginView.hidden = true;
    dashView.hidden = false;
    logoutBtn.hidden = false;
    loadLeads();
  }

  function showLogin(msg) {
    token = '';
    sessionStorage.removeItem(TOKEN_KEY);
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
    try {
      var data = await api('/api/leads');
      leads = data.leads || [];
      updateStats();
      renderLeads();
    } catch (e) {
      if (e.message !== 'Unauthorized') listEl.innerHTML = '<p class="crm-empty">Could not load leads. Ensure Node server is running.</p>';
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

    if (!filtered.length) {
      listEl.innerHTML = '<div class="crm-empty">No leads match this filter yet. Visitor submissions from your website will appear here automatically.</div>';
      return;
    }

    listEl.innerHTML = filtered.map(function (l) {
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

  function openLead(id) {
    var l = leads.find(function (x) { return x.id === id; });
    if (!l) return;
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
      var data = await res.json();
      if (!res.ok) { authErr.textContent = data.error || 'Invalid PIN'; return; }
      token = data.token;
      sessionStorage.setItem(TOKEN_KEY, token);
      showDashboard();
    } catch {
      authErr.textContent = 'Cannot reach CRM server. Start it with: npm start';
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
    el.addEventListener('click', function () { modal.hidden = true; });
  });

  document.getElementById('lead-save').addEventListener('click', async function () {
    if (!activeLeadId) return;
    var status = document.getElementById('lead-status').value;
    var notes = document.getElementById('lead-notes').value;
    var res = await api('/api/leads/' + activeLeadId, {
      method: 'PATCH',
      body: JSON.stringify({ status: status, notes: notes })
    });
    if (res.ok) {
      var idx = leads.findIndex(function (l) { return l.id === activeLeadId; });
      if (idx !== -1) leads[idx] = res.lead;
      updateStats();
      renderLeads();
      document.getElementById('lead-save-msg').textContent = 'Saved.';
    }
  });

  document.getElementById('lead-delete').addEventListener('click', async function () {
    if (!activeLeadId || !confirm('Delete this lead permanently?')) return;
    var res = await api('/api/leads/' + activeLeadId, { method: 'DELETE' });
    if (res.ok) {
      leads = leads.filter(function (l) { return l.id !== activeLeadId; });
      modal.hidden = true;
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
