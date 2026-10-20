/* Lusitano — shared behaviour for all pages. Every block checks its elements exist. */
(function () {
  'use strict';
  var doc = document.documentElement;

  /* year */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- mobile menu ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  var scrim = document.querySelector('.scrim');
  var closeBtn = document.querySelector('.menu-close');
  function setMenu(open) {
    if (!menuBtn) return;
    doc.classList.toggle('menu-open', open);
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) { var first = nav.querySelector('a'); if (first) first.focus(); }
    else menuBtn.focus({ preventScroll: true });
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); });
    if (scrim) scrim.addEventListener('click', function () { setMenu(false); });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { if (doc.classList.contains('menu-open')) setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && doc.classList.contains('menu-open')) setMenu(false);
    });
  }

  /* ---------- shelf tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function selectTab(name, focus) {
    tabs.forEach(function (t) {
      var on = t.dataset.tab === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
      if (on && focus) t.focus();
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t.dataset.tab); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      selectTab(tabs[(i + d + tabs.length) % tabs.length].dataset.tab, true);
    });
  });
  /* window tags open the matching shelf */
  document.querySelectorAll('a.tag[data-tab]').forEach(function (a) {
    a.addEventListener('click', function () { if (tabs.length) selectTab(a.dataset.tab); });
  });

  /* ---------- counter slip ---------- */
  var slipEl = document.querySelector('[data-slip]');
  if (!slipEl) return;
  var KEY = 'lusitano-slip';
  var list = slipEl.querySelector('[data-slip-list]');
  var summary = slipEl.querySelector('[data-slip-summary]');
  var status = slipEl.querySelector('.slip-status');
  var toggle = slipEl.querySelector('.slip-toggle');
  var labels = Array.prototype.slice.call(document.querySelectorAll('.scent[data-scent]'));
  var items = [];

  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(v)) items = v.filter(function (x) { return x && x.name && x.fmt; }); }
    catch (e) { items = []; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* private mode: keep in memory */ } }
  function keyOf(x) { return x.name + '|' + x.fmt; }
  function has(x) { return items.some(function (y) { return keyOf(y) === keyOf(x); }); }

  function render() {
    var n = items.length;
    doc.classList.toggle('has-slip', n > 0);
    document.querySelectorAll('[data-slip-count]').forEach(function (el) { el.textContent = n; });
    document.querySelectorAll('[data-slip-cta]').forEach(function (el) { el.textContent = n ? 'Your slip: ' + n + (n === 1 ? ' scent' : ' scents') : 'Start your slip'; });
    summary.textContent = n + (n === 1 ? ' scent' : ' scents');
    list.innerHTML = '';
    items.forEach(function (x) {
      var li = document.createElement('li');
      var t = document.createElement('div');
      t.innerHTML = '<b></b><span></span>';
      t.firstChild.textContent = 'Lusitano ' + x.name;
      t.lastChild.textContent = x.fmt;
      var rm = document.createElement('button');
      rm.type = 'button';
      rm.setAttribute('aria-label', 'Remove ' + x.name + ' ' + x.fmt.toLowerCase());
      rm.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
      rm.addEventListener('click', function () { remove(x); });
      li.appendChild(t); li.appendChild(rm);
      list.appendChild(li);
    });
    labels.forEach(function (b) {
      b.setAttribute('aria-pressed', String(has({ name: b.dataset.scent, fmt: b.dataset.fmt })));
    });
  }
  function add(x) { if (!has(x)) items.push(x); save(); render(); say(x.name + ' added to your slip'); }
  function remove(x) { items = items.filter(function (y) { return keyOf(y) !== keyOf(x); }); save(); render(); say(x.name + ' removed'); }
  function say(msg) { if (status) { status.textContent = msg; clearTimeout(say.t); say.t = setTimeout(function () { status.textContent = ''; }, 2600); } }

  labels.forEach(function (b) {
    b.addEventListener('click', function () {
      var x = { name: b.dataset.scent, fmt: b.dataset.fmt };
      if (has(x)) remove(x);
      else { add(x); setMin(small()); if (window.lusitanoPuff) window.lusitanoPuff(b); }
    });
  });
  function small() { return window.matchMedia('(max-width: 600px)').matches; }
  function setMin(min) {
    slipEl.classList.toggle('min', min);
    toggle.setAttribute('aria-expanded', String(!min));
    toggle.setAttribute('aria-label', min ? 'Expand slip' : 'Collapse slip');
  }
  toggle.addEventListener('click', function () { setMin(!slipEl.classList.contains('min')); });
  document.querySelectorAll('[data-open-slip]').forEach(function (b) {
    b.addEventListener('click', function () { setMin(false); toggle.focus(); });
  });
  document.querySelectorAll('[data-start-slip]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (items.length) { e.preventDefault(); setMin(false); toggle.focus(); }
    });
  });
  slipEl.querySelector('[data-slip-clear]').addEventListener('click', function () { items = []; save(); render(); });
  slipEl.querySelector('[data-slip-share]').addEventListener('click', function () {
    var text = 'My Lusitano list:\n' + items.map(function (x) { return '• ' + x.name + ' (' + x.fmt.toLowerCase() + ')'; }).join('\n');
    if (navigator.share) {
      navigator.share({ title: 'My Lusitano list', text: text }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () { say('List copied. Paste it into a text or note.'); }, function () { say('Could not copy. Take a screenshot instead.'); });
    } else { say('Take a screenshot of this slip to keep it.'); }
  });

  load(); render(); setMin(small());
})();

/* ---------- motion: shelf settle, mist puff, sign glint ---------- */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var doc = document.documentElement;

  /* mist puff in the scent's own colour, released when a label is picked */
  window.lusitanoPuff = function (label) {
    if (reduce.matches || !label.animate) return;
    var r = label.getBoundingClientRect();
    var cs = getComputedStyle(label);
    var color = (cs.getPropertyValue('--band') || '#d9ad55').trim();
    var sparkle = !!label.querySelector('.diamond-dust');
    label.classList.remove('rock'); void label.offsetWidth; label.classList.add('rock');
    var n = sparkle ? 30 : 24;
    for (var i = 0; i < n; i++) {
      var el = document.createElement('span');
      var x = r.left + r.width * (0.18 + Math.random() * 0.64);
      var y = r.top + r.height * (0.25 + Math.random() * 0.3);
      var dx = (Math.random() - 0.5) * r.width * 0.9;
      var dy = -(110 + Math.random() * 190);
      var dur = 1200 + Math.random() * 900;
      var frames, opts = { duration: dur, easing: 'cubic-bezier(.23,1,.32,1)', delay: Math.random() * 120 };
      if (sparkle && i % 2) {
        el.className = 'mist-spark';
        frames = [
          { transform: 'translate(' + x + 'px,' + y + 'px) scale(.4)', opacity: 0 },
          { transform: 'translate(' + (x + dx * 0.5) + 'px,' + (y + dy * 0.5) + 'px) scale(1.2)', opacity: 1, offset: 0.35 },
          { transform: 'translate(' + (x + dx) + 'px,' + (y + dy) + 'px) scale(.3)', opacity: 0 }
        ];
      } else {
        var size = 60 + Math.random() * 90;
        el.className = 'mist-puff';
        el.style.width = el.style.height = size + 'px';
        el.style.background = 'radial-gradient(circle, ' + color + ' 0%, transparent 68%)';
        frames = [
          { transform: 'translate(' + (x - size / 2) + 'px,' + (y - size / 2) + 'px) scale(.45)', opacity: 0 },
          { transform: 'translate(' + (x - size / 2 + dx * 0.4) + 'px,' + (y - size / 2 + dy * 0.4) + 'px) scale(1.05)', opacity: 0.9, offset: 0.28 },
          { transform: 'translate(' + (x - size / 2 + dx) + 'px,' + (y - size / 2 + dy) + 'px) scale(1.8)', opacity: 0 }
        ];
      }
      document.body.appendChild(el);
      el.animate(frames, opts).onfinish = (function (node) { return function () { node.remove(); }; })(el);
    }
  };

  /* labels settle onto the shelf as each row comes into view */
  var lists = document.querySelectorAll('.labels');
  if (lists.length && 'IntersectionObserver' in window && !reduce.matches) {
    doc.classList.add('motion');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('set');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.2 });
    var stagger = function (list) {
      var items = list.querySelectorAll('li');
      var cols = getComputedStyle(list).gridTemplateColumns.split(' ').length || 1;
      items.forEach(function (li, i) { li.style.setProperty('--d', (i % cols) * 70 + 'ms'); io.observe(li); });
    };
    lists.forEach(stagger);
    /* a newly opened tab settles in too */
    document.querySelectorAll('[role="tab"]').forEach(function (t) {
      t.addEventListener('click', function () {
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel && panel.classList.contains('labels')) {
          panel.querySelectorAll('li').forEach(function (li) { li.classList.remove('set'); });
          requestAnimationFrame(function () { stagger(panel); });
        }
      });
    });
  }

  /* the gilded sign catches a band of light: once after the gilding, then with scroll */
  var grad = document.getElementById('glint');
  var sign = document.querySelector('.window');
  if (grad && sign && !reduce.matches) {
    var FROM = -700, TO = 1100;
    var set = function (x) { grad.setAttribute('gradientTransform', 'translate(' + x.toFixed(1) + ' 0)'); };
    var start = performance.now() + 900, intro = true;
    var introStep = function (now) {
      var p = Math.min(1, Math.max(0, (now - start) / 1500));
      var e = 1 - Math.pow(1 - p, 3);
      set(FROM + (TO - FROM) * e);
      if (p < 1) requestAnimationFrame(introStep); else intro = false;
    };
    requestAnimationFrame(introStep);
    var visible = true, ticking = false;
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(sign);
    window.addEventListener('scroll', function () {
      if (intro || !visible || ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var h = sign.offsetHeight || 1;
        var p = Math.min(1, Math.max(0, window.scrollY / (h * 0.75)));
        set(FROM + (TO - FROM) * p);
      });
    }, { passive: true });
  }
})();

/* ---------- wholesale form ---------- */
(function () {
  'use strict';
  var form = document.getElementById('wsForm');
  if (!form) return;
  var docs = document.getElementById('docs');
  var files = document.getElementById('dzFiles');
  var note = form.querySelector('.form-note');
  var noteDefault = note ? note.textContent : '';
  var MAX_TOTAL = 10 * 1024 * 1024; // FormSubmit free limit: 10MB total
  var DEFAULT_FILES = files ? files.textContent : '';
  function mb(n) { return (n / 1048576).toFixed(1) + ' MB'; }
  if (docs) {
    docs.addEventListener('change', function () {
      var list = Array.prototype.slice.call(docs.files);
      var total = list.reduce(function (s, f) { return s + f.size; }, 0);
      files.textContent = list.length ? list.map(function (f) { return f.name; }).join(', ') + ' (' + mb(total) + ')' : DEFAULT_FILES;
      if (note) { note.classList.toggle('bad', total > MAX_TOTAL); note.textContent = total > MAX_TOTAL ? 'Those files add up to ' + mb(total) + '. Keep the total under 10 MB, or leave them off and we will ask for them by email.' : noteDefault; }
    });
  }
  form.addEventListener('submit', function (e) {
    if (docs && docs.files.length) {
      var total = 0;
      for (var i = 0; i < docs.files.length; i++) total += docs.files[i].size;
      if (total > MAX_TOTAL) {
        e.preventDefault();
        if (note) { note.classList.add('bad'); note.textContent = 'Those files add up to ' + mb(total) + '. Keep the total under 10 MB, or leave them off and we will ask for them by email.'; }
        docs.focus();
        return;
      }
    }
    var btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    /* submits natively; FormSubmit redirects to the thank-you page */
  });
  /* re-enable if the visitor comes back with the browser's back button */
  window.addEventListener('pageshow', function () {
    var btn = form.querySelector('button[type=submit]');
    if (btn) { btn.disabled = false; btn.textContent = 'Send application'; }
  });
})();
