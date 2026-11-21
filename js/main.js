(function () {
  var RM = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* Split headings into rising words */
  document.querySelectorAll('.split').forEach(function (h) {
    var n = 0;
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var f = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { f.appendChild(document.createTextNode(' ')); return; }
            var o = document.createElement('span'); o.className = 'wd';
            var w = document.createElement('span'); w.className = 'wi';
            w.style.transitionDelay = (n++ * 45) + 'ms';
            w.textContent = p;
            o.appendChild(w); f.appendChild(o);
          });
          node.replaceChild(f, c);
        } else if (c.nodeType === 1 && c.classList.contains('ul')) {
          var o2 = document.createElement('span'); o2.className = 'wd wd--ul';
          var w2 = document.createElement('span'); w2.className = 'wi';
          w2.style.transitionDelay = (n++ * 45) + 'ms';
          node.insertBefore(o2, c); w2.appendChild(c); o2.appendChild(w2);
        } else if (c.nodeType === 1 && c.tagName !== 'BR') {
          wrap(c);
        }
      });
    })(h);
    h.classList.add('rv');
  });

  /* Immediate reveal observer (no artificial preloader block) */
  var els = document.querySelectorAll('.rv,.steps');
  if ('IntersectionObserver' in window && !RM) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });
    els.forEach(function (e) { io.observe(e); });
  } else {
    els.forEach(function (e) { e.classList.add('in'); });
  }

  /* Header scroll state, progress bar, mobile menu & active nav highlight */
  var hh = document.querySelector('.hh'), tg = document.querySelector('.nav__toggle'), pg = document.querySelector('.prog'), last = 0;
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);

  function closeNav() {
    hh.classList.remove('is-open');
    tg.setAttribute('aria-expanded', 'false');
  }

  function onScroll() {
    var y = scrollY, m = document.body.scrollHeight - innerHeight;
    hh.classList.toggle('is-scrolled', y > 20);
    if (!hh.classList.contains('is-open')) hh.classList.toggle('is-hidden', y > last && y > 480);
    last = y;
    pg.style.transform = 'scaleX(' + (m > 0 ? y / m : 0) + ')';

    var current = '';
    sections.forEach(function (sec) {
      if (y + 140 >= sec.offsetTop) current = '#' + sec.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === current);
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  tg.addEventListener('click', function () {
    var open = hh.classList.toggle('is-open');
    hh.classList.remove('is-hidden');
    tg.setAttribute('aria-expanded', String(open));
  });
  navLinks.forEach(function (a) { a.addEventListener('click', closeNav); });

  /* Parallax */
  var par = document.querySelectorAll('[data-par]'), tick = false;
  function updateParallax() {
    tick = false;
    par.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      el.style.setProperty('--py', (p * -(parseFloat(el.getAttribute('data-par')) || 36)).toFixed(1) + 'px');
    });
  }
  if (par.length && !RM) {
    addEventListener('scroll', function () {
      if (!tick) { tick = true; requestAnimationFrame(updateParallax); }
    }, { passive: true });
    updateParallax();
  }

  /* Card spotlight on pointer devices */
  document.querySelectorAll('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* Hero build terminal synced with progress bar */
  var lines = [
    '<b>$</b> kiralyte init --product --growth',
    '<b>✓</b> Architecture: App Store &amp; Android ready',
    '<b>✓</b> Web &amp; SaaS: responsive, fast, conversion-first',
    '<b>✓</b> Visibility: SEO, GEO &amp; AEO indexed',
    '<b>✓</b> Campaigns: Google, Meta, TikTok, Pinterest, LinkedIn',
    '<b>→</b> Measured, improved &amp; scaling revenue'
  ];
  var term = document.getElementById('build'), prog = document.getElementById('build-prog'), idx = 0;
  function stepTerminal() {
    idx++;
    term.innerHTML = lines.slice(0, idx).join('\n');
    if (prog) prog.style.width = Math.round((idx / lines.length) * 100) + '%';
    var delay = idx < lines.length ? 850 : 3400;
    setTimeout(function () {
      if (idx >= lines.length) idx = 0;
      stepTerminal();
    }, delay);
  }
  if (RM) {
    term.innerHTML = lines.join('\n');
    if (prog) prog.style.width = '100%';
  } else {
    stepTerminal();
  }

  /* Service cards & Academy CTAs pre-fill contact form */
  var serviceSelect = document.getElementById('service');
  function selectServiceAndScroll(name) {
    if (serviceSelect && name) {
      var found = Array.prototype.some.call(serviceSelect.options, function (opt) { return opt.value === name; });
      if (found) serviceSelect.value = name;
    }
    document.getElementById('contact').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
    setTimeout(function () { document.getElementById('name').focus({ preventScroll: true }); }, 450);
  }
  document.querySelectorAll('[data-service]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectServiceAndScroll(btn.getAttribute('data-service'));
    });
  });

  /* Academy accordion */
  document.querySelectorAll('.row__head').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      btn.nextElementSibling.hidden = expanded;
    });
  });

  /* Case Study Modal */
  var CASES = {
    restaurant: {
      cat: 'Mobile App · iOS & Android',
      title: 'Restaurant & Delivery Platform',
      img: './assets/images/restaurant-app.png',
      challenge: 'Restaurants lose high-margin orders to third-party marketplaces and clunky mobile web checkouts.',
      solution: 'Engineered a native-feel mobile ordering experience with instant menu browsing, live delivery tracking, and store-ready builds for App Store & Google Play.',
      tags: ['iOS & Android', 'Real-time Dispatch', 'Conversion UX']
    },
    quizmaster: {
      cat: 'AI · EdTech Web App',
      title: 'QuizMaster AI Platform',
      img: './assets/images/quizmasterapp.png',
      challenge: 'Manual assessment creation and static quizzes lead to high learner drop-off and slow feedback cycles.',
      solution: 'Built an AI-assisted quiz and knowledge platform with dynamic question generation, instant analytics, and SEO-friendly landing architecture.',
      tags: ['Python', 'AI Generation', 'Responsive Web']
    },
    saas: {
      cat: 'SaaS · Cloud & Automation',
      title: 'SaaS Operations & Analytics Suite',
      img: './assets/images/saas.jpg',
      challenge: 'Growing teams waste hours stitching together spreadsheets, manual follow-ups, and disconnected ad reporting.',
      solution: 'Delivered a unified cloud SaaS platform with automated workflows, role-based dashboards, and multi-channel campaign attribution.',
      tags: ['SaaS Architecture', 'Workflow Automation', 'Analytics']
    }
  };

  var caseModal = document.getElementById('case-modal');
  var legalModal = document.getElementById('legal-modal');
  function closeAllModals() {
    caseModal.hidden = true;
    legalModal.hidden = true;
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-case]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var c = CASES[btn.getAttribute('data-case')];
      if (!c) return;
      document.getElementById('modal-cat').textContent = c.cat;
      document.getElementById('modal-title').textContent = c.title;
      var img = document.getElementById('modal-img');
      img.src = c.img; img.alt = c.title;
      document.getElementById('modal-challenge').textContent = c.challenge;
      document.getElementById('modal-solution').textContent = c.solution;
      document.getElementById('modal-tags').innerHTML = c.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('');
      caseModal.hidden = false;
      document.body.style.overflow = 'hidden';
    });
  });

  document.getElementById('modal-cta').addEventListener('click', function () {
    closeAllModals();
  });

  /* Legal Modal */
  var LEGAL = {
    privacy: {
      title: 'Privacy Policy',
      body: 'Kiralyte Technology Solutions respects your privacy. Information submitted through our project brief form or direct email (hello@kiralyte.com) is used solely to evaluate and respond to your enquiry. We never sell or share client data with third parties.'
    },
    terms: {
      title: 'Terms of Service',
      body: 'All software engineering, AI automation, and marketing engagements are governed by a written Statement of Work (SOW) outlining scope, milestones, intellectual property transfer, and payment terms.'
    }
  };
  document.querySelectorAll('[data-legal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var l = LEGAL[btn.getAttribute('data-legal')];
      if (!l) return;
      document.getElementById('legal-title').textContent = l.title;
      document.getElementById('legal-body').textContent = l.body;
      legalModal.hidden = false;
      document.body.style.overflow = 'hidden';
    });
  });
  document.querySelectorAll('[data-close-modal]').forEach(function (el) {
    el.addEventListener('click', closeAllModals);
  });

  /* Copy email helper */
  function copyText(text, btn) {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(function () {
      var orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = orig; }, 1800);
    });
  }
  var copyEmailBtn = document.getElementById('copy-email');
  if (copyEmailBtn) copyEmailBtn.addEventListener('click', function () { copyText('hello@kiralyte.com', copyEmailBtn); });
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () { copyText(btn.getAttribute('data-copy'), btn); });
  });

  /* Sticky contact widget */
  var sc = document.querySelector('.sticky-contact'), sb = sc.querySelector('.sticky-contact__btn');
  function closeSticky() {
    sc.classList.remove('open');
    sb.setAttribute('aria-expanded', 'false');
  }
  sb.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = sc.classList.toggle('open');
    sb.setAttribute('aria-expanded', String(open));
  });
  sc.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeSticky); });

  /* Global Escape & click-outside dismissal */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeNav(); closeSticky(); closeAllModals(); }
  });
  document.addEventListener('click', function (e) {
    if (!sc.contains(e.target)) closeSticky();
    if (!hh.contains(e.target)) closeNav();
  });

  /* Contact form */
  document.getElementById('enquiry').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, ok = document.getElementById('ok');
    if (!f.name.value.trim() || !f.email.validity.valid || !f.message.value.trim()) {
      ok.textContent = 'Please complete your name, a valid work email, and project details.';
      return;
    }
    var body = 'Name: ' + f.name.value.trim() +
      '\nEmail: ' + f.email.value.trim() +
      '\nService: ' + f.service.value +
      '\nBudget: ' + f.budget.value +
      '\n\nProject Brief:\n' + f.message.value.trim();
    location.href = 'mailto:hello@kiralyte.com?subject=' + encodeURIComponent('[' + f.budget.value + '] ' + f.service.value + ' — ' + f.name.value.trim()) + '&body=' + encodeURIComponent(body);
    ok.textContent = 'Opening your email app with your brief. Prefer instant chat? Use WhatsApp or Copy email.';
  });
})();
