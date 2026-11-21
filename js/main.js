(function () {
  var RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var EMAIL = 'kiralytetechnology@gmail.com';

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

  /* Project Card Renderer */
  var GRAPHICS = {
    crm: { kicker: 'Revenue Operations SaaS', metric: 'Unified Sprint + Ad ROI', widths: ['92%', '78%', '86%'] },
    seo: { kicker: 'SEO · GEO · AEO', metric: 'Search & AI Citations', widths: ['96%', '88%', '82%'] },
    schema: { kicker: 'E-Com Technical SEO', metric: 'Rich Snippets & Organic', widths: ['94%', '84%', '79%'] },
    b2b: { kicker: 'LinkedIn + Google Ads', metric: 'B2B Pipeline Capture', widths: ['90%', '85%', '76%'] },
    dtc: { kicker: 'Meta · TikTok · Pinterest', metric: 'Omnichannel ROAS Scale', widths: ['95%', '87%', '81%'] },
    automation: { kicker: 'AI Intake & CRM Agent', metric: '24/7 Lead Qualification', widths: ['98%', '91%', '84%'] }
  };

  function buildCardVisual(p) {
    if (p.deviceFrame) {
      return '<div class="ph ph--device"><span class="pc__cat">' + p.categoryLabel + '</span>' +
        '<div class="phone-frame"><img src="' + p.img + '" alt="' + p.title + '" loading="lazy"></div></div>';
    }
    if (p.img) {
      return '<div class="ph"><span class="pc__cat">' + p.categoryLabel + '</span>' +
        '<img src="' + p.img + '" alt="' + p.title + '" loading="lazy"></div>';
    }
    var g = GRAPHICS[p.graphic] || GRAPHICS.seo;
    return '<div class="ph"><span class="pc__cat">' + p.categoryLabel + '</span>' +
      '<div class="graphic-preview"><div class="graphic-preview__inner">' +
      '<span class="graphic-preview__kicker">' + g.kicker + '</span>' +
      '<strong class="graphic-preview__metric">' + g.metric + '</strong>' +
      '<div class="graphic-preview__bars">' +
      g.widths.map(function (w) { return '<span style="width:' + w + '"></span>'; }).join('') +
      '</div></div></div></div>';
  }

  function createProjectCard(p, index) {
    var art = document.createElement('article');
    art.className = 'pc rv in';
    art.style.setProperty('--i', String(index % 3));
    art.innerHTML =
      '<button type="button" class="pc__trigger" data-case="' + p.id + '" aria-label="View ' + p.title + ' case study">' +
      buildCardVisual(p) +
      '<div class="pc__body">' +
      '<h3>' + p.title + '</h3>' +
      '<p>' + p.summary + '</p>' +
      '<div class="tags">' + p.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div>' +
      '<span class="card-spacer"></span>' +
      '<span class="more">Inspect case study <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>' +
      '</div></button>';
    return art;
  }

  var allProjects = window.KIRALYTE_PROJECTS || [];
  var featuredGrid = document.getElementById('featured-projects-grid');
  if (featuredGrid && allProjects.length) {
    allProjects.filter(function (p) { return p.featured; }).forEach(function (p, i) {
      featuredGrid.appendChild(createProjectCard(p, i));
    });
  }

  var allGrid = document.getElementById('all-projects-grid');
  var countEl = document.getElementById('proj-count');
  function renderCatalog(filter) {
    if (!allGrid) return;
    allGrid.innerHTML = '';
    var list = filter === 'all' ? allProjects : allProjects.filter(function (p) { return p.category === filter; });
    list.forEach(function (p, i) { allGrid.appendChild(createProjectCard(p, i)); });
    if (countEl) countEl.textContent = 'Showing ' + list.length + ' of ' + allProjects.length + ' projects';
  }
  if (allGrid && allProjects.length) {
    renderCatalog('all');
    document.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-btn').forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
        renderCatalog(btn.getAttribute('data-filter'));
      });
    });
  }

  /* Reveal observer */
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
  var sections = navLinks.map(function (a) {
    var href = a.getAttribute('href') || '';
    return href.charAt(0) === '#' ? document.querySelector(href) : null;
  }).filter(Boolean);

  function closeNav() {
    if (!hh || !tg) return;
    hh.classList.remove('is-open');
    tg.setAttribute('aria-expanded', 'false');
  }

  function onScroll() {
    var y = scrollY, m = document.body.scrollHeight - innerHeight;
    if (hh) {
      hh.classList.toggle('is-scrolled', y > 20);
      if (!hh.classList.contains('is-open')) hh.classList.toggle('is-hidden', y > last && y > 480);
    }
    last = y;
    if (pg) pg.style.transform = 'scaleX(' + (m > 0 ? y / m : 0) + ')';

    if (sections.length) {
      var current = '';
      sections.forEach(function (sec) {
        if (y + 140 >= sec.offsetTop) current = '#' + sec.id;
      });
      navLinks.forEach(function (a) {
        var href = a.getAttribute('href') || '';
        if (href.charAt(0) === '#') a.classList.toggle('is-active', href === current);
      });
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (tg && hh) {
    tg.addEventListener('click', function () {
      var open = hh.classList.toggle('is-open');
      hh.classList.remove('is-hidden');
      tg.setAttribute('aria-expanded', String(open));
    });
    navLinks.forEach(function (a) { a.addEventListener('click', closeNav); });
  }

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

  /* Card spotlight */
  document.querySelectorAll('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* Hero build terminal */
  var term = document.getElementById('build'), prog = document.getElementById('build-prog');
  if (term) {
    var lines = [
      '<b>$</b> kiralyte init --product --growth',
      '<b>✓</b> Architecture: App Store &amp; Android ready',
      '<b>✓</b> Web &amp; SaaS: responsive, fast, conversion-first',
      '<b>✓</b> Visibility: SEO, GEO &amp; AEO indexed',
      '<b>✓</b> Campaigns: Google, Meta, TikTok, Pinterest, LinkedIn',
      '<b>→</b> Measured, improved &amp; scaling revenue'
    ];
    var idx = 0;
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
  }

  /* Service cards & Academy CTAs pre-fill contact form */
  var serviceSelect = document.getElementById('service');
  function selectServiceAndScroll(name) {
    if (serviceSelect && name) {
      var found = Array.prototype.some.call(serviceSelect.options, function (opt) { return opt.value === name; });
      if (found) serviceSelect.value = name;
    }
    var contact = document.getElementById('contact');
    if (contact) {
      contact.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
      setTimeout(function () {
        var nameInput = document.getElementById('name');
        if (nameInput) nameInput.focus({ preventScroll: true });
      }, 450);
    }
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

  /* Case Study Modal (event delegation works for both index & catalog filter re-renders) */
  var caseModal = document.getElementById('case-modal');
  var legalModal = document.getElementById('legal-modal');
  function closeAllModals() {
    if (caseModal) caseModal.hidden = true;
    if (legalModal) legalModal.hidden = true;
    document.body.style.overflow = '';
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-case]');
    if (!trigger || !caseModal) return;
    var id = trigger.getAttribute('data-case');
    var c = allProjects.filter(function (p) { return p.id === id; })[0];
    if (!c) return;
    document.getElementById('modal-cat').textContent = c.categoryLabel;
    document.getElementById('modal-title').textContent = c.title;
    var imgWrap = document.getElementById('modal-img-wrap');
    var img = document.getElementById('modal-img');
    if (c.img) {
      imgWrap.hidden = false;
      img.src = c.img;
      img.alt = c.title;
    } else {
      imgWrap.hidden = true;
    }
    document.getElementById('modal-challenge').textContent = c.challenge;
    document.getElementById('modal-solution').textContent = c.solution;
    var delivEl = document.getElementById('modal-deliverables');
    if (delivEl) delivEl.innerHTML = (c.deliverables || []).map(function (d) { return '<span>' + d + '</span>'; }).join('');
    document.getElementById('modal-tags').innerHTML = c.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('');
    caseModal.hidden = false;
    document.body.style.overflow = 'hidden';
  });

  var modalCta = document.getElementById('modal-cta');
  if (modalCta) modalCta.addEventListener('click', closeAllModals);

  /* Legal Modal */
  var LEGAL = {
    privacy: {
      title: 'Privacy Policy',
      body: 'Kiralyte Technology Solutions respects your privacy. Information submitted through our project brief form or direct email (' + EMAIL + ') is used solely to evaluate and respond to your enquiry. We never sell or share client data with third parties.'
    },
    terms: {
      title: 'Terms of Service',
      body: 'All software engineering, AI automation, and marketing engagements are governed by a written Statement of Work (SOW) outlining scope, milestones, intellectual property transfer, and payment terms.'
    }
  };
  document.querySelectorAll('[data-legal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var l = LEGAL[btn.getAttribute('data-legal')];
      if (!l || !legalModal) return;
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
  if (copyEmailBtn) copyEmailBtn.addEventListener('click', function () { copyText(EMAIL, copyEmailBtn); });
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () { copyText(btn.getAttribute('data-copy'), btn); });
  });

  /* Sticky contact widget */
  var sc = document.querySelector('.sticky-contact'), sb = sc && sc.querySelector('.sticky-contact__btn');
  function closeSticky() {
    if (!sc || !sb) return;
    sc.classList.remove('open');
    sb.setAttribute('aria-expanded', 'false');
  }
  if (sc && sb) {
    sb.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = sc.classList.toggle('open');
      sb.setAttribute('aria-expanded', String(open));
    });
    sc.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeSticky); });
  }

  /* Global Escape & click-outside dismissal */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeNav(); closeSticky(); closeAllModals(); }
  });
  document.addEventListener('click', function (e) {
    if (sc && !sc.contains(e.target)) closeSticky();
    if (hh && !hh.contains(e.target)) closeNav();
  });

  /* Contact form */
  var enquiryForm = document.getElementById('enquiry');
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', function (e) {
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
      location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('[' + f.budget.value + '] ' + f.service.value + ' — ' + f.name.value.trim()) + '&body=' + encodeURIComponent(body);
      ok.textContent = 'Opening your email app with your brief. Prefer instant chat? Use WhatsApp or Copy email.';
    });
  }
})();
