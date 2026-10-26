/* Lusitano: menu, the shelf switch, the counter slip with its scent mist, and the wholesale form. Every block checks its elements exist. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- menu (small screens) ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var links = document.getElementById('site-nav');
  function setMenu(open, focusBack) {
    links.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) { var a = links.querySelector('a'); if (a) a.focus(); }
    else if (focusBack) menuBtn.focus();
  }
  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true', false); });
    links.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { if (links.classList.contains('is-open')) setMenu(false, false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && links.classList.contains('is-open')) setMenu(false, true); });
    window.matchMedia('(min-width: 60.0625rem)').addEventListener('change', function (m) { if (m.matches) setMenu(false, false); });
  }

  /* ---------- the shelf switch: without script both lists show ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.seg [role="tab"]'));
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t, false); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      selectTab(tabs[(i + d + tabs.length) % tabs.length], true);
    });
  });
  if (tabs.length) selectTab(tabs[0], false);

  /* ---------- the scent mist: one puff in the scent's colour, on a pick ---------- */
  function puff(row) {
    if (reduce.matches || !row || !row.animate) return;
    var r = row.getBoundingClientRect();
    var color = getComputedStyle(row).getPropertyValue('--scent').trim() || getComputedStyle(doc).getPropertyValue('--color-accent').trim();
    for (var i = 0; i < 18; i++) {
      var el = document.createElement('span');
      var size = 50 + Math.random() * 80;
      var x = r.left + r.width * (0.1 + Math.random() * 0.6) - size / 2;
      var y = r.top + r.height * 0.5 - size / 2;
      var dx = (Math.random() - 0.5) * r.width * 0.5;
      var dy = -(60 + Math.random() * 160);
      el.className = 'mist';
      el.style.width = el.style.height = size + 'px';
      el.style.background = 'radial-gradient(circle, ' + color + ' 0%, transparent 68%)';
      document.body.appendChild(el);
      el.animate([
        { transform: 'translate(' + x + 'px,' + y + 'px) scale(.4)', opacity: 0 },
        { transform: 'translate(' + (x + dx * 0.4) + 'px,' + (y + dy * 0.4) + 'px) scale(1)', opacity: 0.85, offset: 0.25 },
        { transform: 'translate(' + (x + dx) + 'px,' + (y + dy) + 'px) scale(1.7)', opacity: 0 }
      ], { duration: 1100 + Math.random() * 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', delay: Math.random() * 100 })
        .onfinish = (function (n) { return function () { n.remove(); }; })(el);
    }
  }

  /* ---------- the counter slip ---------- */
  var slip = document.querySelector('[data-slip]');
  if (!slip) return;
  var KEY = 'lusitano-slip';
  var list = slip.querySelector('[data-slip-list]');
  var summary = slip.querySelector('[data-slip-summary]');
  var status = slip.querySelector('.slip__status');
  var toggle = slip.querySelector('.slip__toggle');
  var picks = Array.prototype.slice.call(document.querySelectorAll('.pick[data-scent]'));
  var items = [];

  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); items = Array.isArray(v) ? v.filter(function (x) { return x && x.name && x.fmt; }) : []; }
    catch (e) { items = []; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* private mode: the slip lives in memory */ } }
  function key(x) { return x.name + '|' + x.fmt; }
  function has(x) { return items.some(function (y) { return key(y) === key(x); }); }
  function count(n) { return n + (n === 1 ? ' scent' : ' scents'); }
  function say(msg) { status.textContent = msg; clearTimeout(say.t); say.t = setTimeout(function () { status.textContent = ''; }, 2600); }
  function small() { return window.matchMedia('(max-width: 40rem)').matches; }
  function setMin(min) {
    slip.classList.toggle('is-min', min);
    toggle.setAttribute('aria-expanded', String(!min));
    toggle.setAttribute('aria-label', min ? 'Open the slip' : 'Fold the slip');
  }

  function render() {
    var n = items.length;
    slip.hidden = n === 0;
    doc.classList.toggle('has-slip', n > 0);
    document.querySelectorAll('[data-slip-count]').forEach(function (el) { el.textContent = n; });
    summary.textContent = count(n);
    list.innerHTML = '';
    items.forEach(function (x) {
      var li = document.createElement('li');
      var t = document.createElement('div');
      var b = document.createElement('b'); b.textContent = x.name;
      var s = document.createElement('small'); s.textContent = x.fmt;
      t.appendChild(b); t.appendChild(s);
      var rm = document.createElement('button');
      rm.type = 'button';
      rm.setAttribute('aria-label', 'Remove ' + x.name + ', ' + x.fmt.toLowerCase());
      rm.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
      rm.addEventListener('click', function () { remove(x); });
      li.appendChild(t); li.appendChild(rm);
      list.appendChild(li);
    });
    picks.forEach(function (p) {
      var on = has({ name: p.dataset.scent, fmt: p.dataset.fmt });
      p.setAttribute('aria-pressed', String(on));
      var row = p.closest('.row'); if (row) row.classList.toggle('is-on', on);
    });
  }
  function remove(x) { items = items.filter(function (y) { return key(y) !== key(x); }); save(); render(); say(x.name + ' taken off the slip'); }

  picks.forEach(function (p) {
    p.addEventListener('click', function () {
      var x = { name: p.dataset.scent, fmt: p.dataset.fmt };
      if (has(x)) { remove(x); return; }
      items.push(x); save(); render(); setMin(small());
      say(x.name + ' is on your slip');
      puff(p.closest('.row'));
    });
  });
  toggle.addEventListener('click', function () { setMin(!slip.classList.contains('is-min')); });
  document.querySelectorAll('[data-open-slip]').forEach(function (b) {
    b.addEventListener('click', function () { setMin(false); toggle.focus(); });
  });
  slip.querySelector('[data-slip-clear]').addEventListener('click', function () { items = []; save(); render(); });
  slip.querySelector('[data-slip-share]').addEventListener('click', function () {
    var text = 'My Lusitano list:\n' + items.map(function (x) { return x.name + ' (' + x.fmt.toLowerCase() + ')'; }).join('\n');
    if (navigator.share) navigator.share({ title: 'My Lusitano list', text: text }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { say('Copied. Paste it into a text or a note.'); }, function () { say('That did not copy. Take a screenshot of the slip instead.'); });
    else say('Take a screenshot of the slip to keep it.');
  });

  load(); render(); setMin(small());
})();

/* ---------- wholesale form ---------- */
(function () {
  'use strict';
  var form = document.getElementById('wsForm');
  if (!form) return;
  var docs = document.getElementById('docs');
  var files = document.getElementById('dzFiles');
  var note = form.querySelector('.form-note');
  var btn = form.querySelector('button[type=submit]');
  var noteDefault = note ? note.textContent : '';
  var filesDefault = files ? files.textContent : '';
  var MAX_TOTAL = 10 * 1024 * 1024; /* FormSubmit free limit: 10 MB in total */
  function mb(n) { return (n / 1048576).toFixed(1) + ' MB'; }
  function total() { var t = 0; if (docs) for (var i = 0; i < docs.files.length; i++) t += docs.files[i].size; return t; }
  function tooBig(t) { return 'Those files come to ' + mb(t) + '. Keep them under 10 MB in total, or leave them off and we will ask for them by email.'; }
  if (docs) {
    docs.addEventListener('change', function () {
      var names = Array.prototype.map.call(docs.files, function (f) { return f.name; });
      var t = total();
      files.textContent = names.length ? names.join(', ') + ' (' + mb(t) + ')' : filesDefault;
      note.classList.toggle('is-bad', t > MAX_TOTAL);
      note.textContent = t > MAX_TOTAL ? tooBig(t) : noteDefault;
    });
  }
  form.addEventListener('submit', function (e) {
    var t = total();
    if (t > MAX_TOTAL) { e.preventDefault(); note.classList.add('is-bad'); note.textContent = tooBig(t); docs.focus(); return; }
    if (!form.checkValidity()) return;
    btn.setAttribute('aria-busy', 'true');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    /* posts natively; FormSubmit redirects to the thank-you page */
  });
  window.addEventListener('pageshow', function () { btn.disabled = false; btn.removeAttribute('aria-busy'); btn.textContent = 'Send application'; });
})();
