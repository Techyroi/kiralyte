(function () {
  if (!window.firebase || !window.KIRALYTE_FIREBASE_CONFIG) return;
  if (!firebase.apps.length) firebase.initializeApp(window.KIRALYTE_FIREBASE_CONFIG);

  var auth = firebase.auth();
  var db = firebase.firestore();
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
    try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
    catch { return iso || ''; }
  }

  function esc(str) {
    return String(str || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  async function loadLeads() {
    listEl.innerHTML = '<p class="crm-empty">Loading visitor leads...</p>';
    try {
      var snap = await db.collection('leads').orderBy('createdAt', 'desc').get();
      leads = snap.docs.map(function (doc) { return Object.assign({ id: doc.id }, doc.data()); });
      updateStats();
      renderLeads();
    } catch (err) {
      listEl.innerHTML = '<div class="crm-empty">Access denied or network error: ' + esc(err.message) + '</div>';
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
            '<span class="crm-badge crm-badge--' + esc((l.status || 'New').toLowerCase()) + '">' + esc(l.status || 'New') + '</span>' +
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
    document.getElementById('lead-status').value = l.status || 'New';
    document.getElementById('lead-notes').value = l.notes || '';
    document.getElementById('lead-save-msg').textContent = '';

    document.getElementById('lead-reply-email').href =
      'mailto:' + l.email + '?subject=' + encodeURIComponent('Re: Your Kiralyte project brief (' + l.service + ')');

    var waBtn = document.getElementById('lead-reply-wa');
    var cleanPhone = (l.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone) { waBtn.hidden = false; waBtn.href = 'https://wa.me/' + cleanPhone; }
    else { waBtn.hidden = true; }

    modal.hidden = false;
    var closeBtn = modal.querySelector('.modal__close');
    if (closeBtn) closeBtn.focus();
  }

  auth.onAuthStateChanged(function (user) {
    if (user) {
      loginView.hidden = true;
      dashView.hidden = false;
      logoutBtn.hidden = false;
      loadLeads();
    } else {
      loginView.hidden = false;
      dashView.hidden = true;
      logoutBtn.hidden = true;
    }
  });

  authForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    authErr.textContent = '';
    var email = document.getElementById('crm-email').value.trim();
    var pass = document.getElementById('crm-password').value;
    try {
      await auth.signInWithEmailAndPassword(email, pass);
    } catch (err) {
      authErr.textContent = err.message;
    }
  });

  document.getElementById('crm-register').addEventListener('click', async function () {
    authErr.textContent = '';
    var email = document.getElementById('crm-email').value.trim();
    var pass = document.getElementById('crm-password').value;
    if (!email || pass.length < 6) {
      authErr.textContent = 'Enter your admin email and a password (6+ characters).';
      return;
    }
    try {
      await auth.createUserWithEmailAndPassword(email, pass);
    } catch (err) {
      authErr.textContent = err.message;
    }
  });

  logoutBtn.addEventListener('click', function () { auth.signOut(); });
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

  document.querySelectorAll('[data-close-lead]').forEach(function (el) { el.addEventListener('click', closeLeadModal); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeLeadModal(); });

  document.getElementById('lead-save').addEventListener('click', async function () {
    if (!activeLeadId) return;
    var status = document.getElementById('lead-status').value;
    var notes = document.getElementById('lead-notes').value;
    var updatedAt = new Date().toISOString();
    await db.collection('leads').doc(activeLeadId).update({ status: status, notes: notes, updatedAt: updatedAt });
    var idx = leads.findIndex(function (l) { return l.id === activeLeadId; });
    if (idx !== -1) { leads[idx].status = status; leads[idx].notes = notes; leads[idx].updatedAt = updatedAt; }
    updateStats();
    renderLeads();
    document.getElementById('lead-save-msg').textContent = 'Saved to cloud.';
  });

  document.getElementById('lead-delete').addEventListener('click', async function () {
    if (!activeLeadId || !confirm('Delete this lead permanently?')) return;
    await db.collection('leads').doc(activeLeadId).delete();
    leads = leads.filter(function (l) { return l.id !== activeLeadId; });
    closeLeadModal();
    updateStats();
    renderLeads();
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
})();
