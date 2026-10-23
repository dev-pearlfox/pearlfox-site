/* PearlFox Learn4U - the rules (pure functions), the browser-only state, and the page shell (top bar, footer, toast).
   The rules work on plain objects so they can be tested without a browser; only the bottom half touches the page. */
(function () {
  var D = window.L4U_DATA;
  var DAY = D.day, KEY = 'l4u-state-v1', SOON_DAYS = 7;
  var STORE = (function () { try { return window.localStorage; } catch (e) { return null; } })();

  // ---------- small helpers ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function fmtDate(ms) { return new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  function fmtDay(ms) { return new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); }
  function midnight(ms) { var d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function fmtMinutes(min) { var h = Math.floor(min / 60), m = min % 60; return h ? (m ? h + 'h ' + m + 'm' : h + 'h') : m + ' min'; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  // ---------- courses ----------
  function course(id) { for (var i = 0; i < D.courses.length; i++) if (D.courses[i].id === id) return D.courses[i]; return null; }
  function courseMinutes(c) { return c.modules.reduce(function (t, x) { return t + x.min; }, 0); }

  // ---------- the learner's items (one per course they took part in) ----------
  function startState() {
    var items = {};
    D.start.forEach(function (s) {
      var c = course(s.id);
      items[s.id] = {
        id: s.id, mandatory: !!s.mandatory, by: s.by, assignedAt: D.today - s.assigned * DAY, due: D.today + s.due * DAY,
        done: c.modules.slice(0, s.done).map(function (x) { return x.id; }),
        completedAt: s.completed != null ? D.today - s.completed * DAY : null, cancelledAt: null
      };
    });
    return { v: 1, items: items };
  }
  var state = null;
  function load() {
    if (state) return state;
    try { var raw = STORE && STORE.getItem(KEY); if (raw) { var s = JSON.parse(raw); if (s && s.v === 1 && s.items) { state = s; return state; } } } catch (e) { /* use the sample */ }
    state = startState(); return state;
  }
  function save() { try { if (STORE) STORE.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode: keep going in memory */ } }
  function reset() { state = startState(); save(); return state; }

  // 'Cancelled' | 'Completed' | 'In progress' | 'Assigned'
  function status(item, c) {
    if (item.cancelledAt) return 'Cancelled';
    if (item.completedAt || (c.modules.length && item.done.length >= c.modules.length)) return 'Completed';
    return item.done.length ? 'In progress' : 'Assigned';
  }
  function percent(item, c) { return c.modules.length ? Math.round(100 * Math.min(item.done.length, c.modules.length) / c.modules.length) : 0; }
  function isOpen(item, c) { var s = status(item, c); return s === 'Assigned' || s === 'In progress'; }
  function daysUntil(due, now) { return Math.round((midnight(due) - midnight(now == null ? Date.now() : now)) / DAY); }
  // 'done' (finished or cancelled), 'overdue', 'soon' (today up to 7 days away), 'ok'.
  function dueState(item, c, now) {
    if (!isOpen(item, c)) return 'done';
    var n = daysUntil(item.due, now);
    return n < 0 ? 'overdue' : n <= SOON_DAYS ? 'soon' : 'ok';
  }
  function dueText(item, c, now) {
    var s = status(item, c);
    if (s === 'Completed') return 'Completed ' + fmtDate(item.completedAt || item.due);
    if (s === 'Cancelled') return 'Removed ' + fmtDate(item.cancelledAt);
    var n = daysUntil(item.due, now);
    if (n < 0) return plural(-n, 'day', 'days') + ' overdue';
    if (n === 0) return 'Due today';
    if (n === 1) return 'Due tomorrow';
    return n <= 30 ? 'Due in ' + n + ' days' : 'Due ' + fmtDate(item.due);
  }

  // [{ item, course, status, pct, due }] for every item that exists.
  function entries(now) {
    var st = load(), out = [];
    Object.keys(st.items).forEach(function (id) {
      var item = st.items[id], c = course(id); if (!c) return;
      out.push({ item: item, course: c, status: status(item, c), pct: percent(item, c), due: dueState(item, c, now) });
    });
    return out;
  }
  function active(now) { return entries(now).filter(function (e) { return e.status !== 'Cancelled'; }); }
  var DUE_ORDER = { overdue: 0, soon: 1, ok: 2, done: 3 };
  // Open work first: overdue, then soon, then the rest, each by due date. Finished work last, newest first.
  function byUrgency(a, b) {
    if (DUE_ORDER[a.due] !== DUE_ORDER[b.due]) return DUE_ORDER[a.due] - DUE_ORDER[b.due];
    if (a.due === 'done') return (b.item.completedAt || 0) - (a.item.completedAt || 0);
    return a.item.due - b.item.due;
  }
  function totals(now) {
    var list = active(now), year = new Date(now == null ? Date.now() : now).getFullYear(), t = { todo: 0, soon: 0, overdue: 0, completedYear: 0, minutesYear: 0, mandatoryDone: 0, mandatoryAll: 0 };
    list.forEach(function (e) {
      if (e.status === 'Assigned' || e.status === 'In progress') t.todo++;
      if (e.due === 'soon') t.soon++;
      if (e.due === 'overdue') t.overdue++;
      if (e.status === 'Completed' && new Date(e.item.completedAt).getFullYear() === year) { t.completedYear++; t.minutesYear += courseMinutes(e.course); }
      if (e.item.mandatory) { t.mandatoryAll++; if (e.status === 'Completed') t.mandatoryDone++; }
    });
    return t;
  }

  // ---------- changes ----------
  function toggleModule(id, moduleId, now) {
    var st = load(), item = st.items[id], c = course(id);
    if (!item || !c || item.cancelledAt) return null;
    var at = item.done.indexOf(moduleId);
    if (at === -1) { if (!c.modules.some(function (x) { return x.id === moduleId; })) return null; item.done.push(moduleId); } else item.done.splice(at, 1);
    item.done = c.modules.map(function (x) { return x.id; }).filter(function (m) { return item.done.indexOf(m) !== -1; });   // keep course order
    if (item.done.length >= c.modules.length) { if (!item.completedAt) item.completedAt = now == null ? Date.now() : now; } else item.completedAt = null;
    save(); return item;
  }
  // Add a course to the learner's list (or bring a removed one back). A course already open or finished is left alone.
  function enrol(id, opt, now) {
    var st = load(), c = course(id); if (!c) return null;
    var old = st.items[id];
    if (old && !old.cancelledAt) return null;
    opt = opt || {};
    var t = now == null ? Date.now() : now;
    var item = { id: id, mandatory: !!opt.mandatory, by: opt.by || D.me.name, assignedAt: t, due: midnight(opt.due != null ? opt.due : t + 30 * DAY), done: [], completedAt: null, cancelledAt: null };
    st.items[id] = item; save(); return item;
  }
  function withdraw(id, now) {
    var st = load(), item = st.items[id]; if (!item || item.mandatory || item.cancelledAt) return false;
    var c = course(id); if (status(item, c) === 'Completed') return false;
    item.cancelledAt = now == null ? Date.now() : now; save(); return true;
  }
  function certNumber(item) { return 'CRT-' + String(item.id).replace(/\D/g, '').slice(-6) + '-' + new Date(item.completedAt || Date.now()).getFullYear(); }

  // ---------- page pieces ----------
  var LOGO = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true"><defs>' +
    '<linearGradient id="lg-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC878"/><stop offset=".45" stop-color="#E87722"/><stop offset="1" stop-color="#7A3200"/></linearGradient>' +
    '<linearGradient id="lg-4u" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4DD4C8"/><stop offset="1" stop-color="#006B61"/></linearGradient></defs>' +
    '<rect x="1" y="1" width="22" height="22" rx="5" fill="url(#lg-bg)"/>' +
    '<text x="10" y="18" text-anchor="middle" font-size="18" font-weight="900" fill="#fff" font-family="Segoe UI,Arial,sans-serif">L</text>' +
    '<text x="16" y="14" text-anchor="middle" font-size="8.5" font-weight="800" fill="url(#lg-4u)" stroke="#000" stroke-width=".5" paint-order="stroke fill" font-family="Segoe UI,Arial,sans-serif">4U</text></svg>';
  // ---------- icons, cover art and the progress ring (pure strings, no images to load) ----------
  var ICONS = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/>',
    learning: '<path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2z"/><path d="M12 6v14"/>',
    catalog: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    transcript: '<circle cx="12" cy="9" r="5"/><path d="m8.5 13.5-1.5 7 5-3 5 3-1.5-7"/>',
    'compliance-ethics': '<path d="M12 3v18M6 21h12M5 7h14"/><path d="M5 7 2 14a3 3 0 0 0 6 0L5 7zM19 7l-3 7a3 3 0 0 0 6 0l-3-7z"/>',
    'information-security': '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="m9 12 2 2 4-4"/>',
    'data-privacy': '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    'health-safety': '<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/>',
    technology: '<path d="m9 8-4 4 4 4M15 8l4 4-4 4M13 6l-2 12"/>',
    'leadership-skills': '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3z"/>'
  };
  function icon(name, size) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 20) + '" height="' + (size || 20) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }
  // The colour family and symbol of a course come from its category (class cv-<category>).
  function coverClass(c) { return 'cv-' + slug(c.category); }
  function coverIcon(c, size) { return icon(slug(c.category), size); }
  function ring(pct, size, label) {
    var r = 26, C = 2 * Math.PI * r, off = (C * (1 - Math.max(0, Math.min(100, pct)) / 100)).toFixed(1);
    return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 64 64" role="img" aria-label="' + esc(label || 'Progress') + ': ' + pct + '%">' +
      '<circle class="ring-bg" cx="32" cy="32" r="' + r + '"/><circle class="ring-fg" cx="32" cy="32" r="' + r + '" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off + '" transform="rotate(-90 32 32)"/>' +
      '<text class="ring-t" x="32" y="37" text-anchor="middle">' + pct + '%</text></svg>';
  }

  // The logo is on the page twice on a phone (side bar + top strip). Each copy needs its own gradient names: a gradient inside a hidden
  // element cannot be used by the visible copy, which then paints nothing.
  var logoCount = 0;
  function logo() { var n = ++logoCount; return n === 1 ? LOGO : LOGO.replace(/lg-bg/g, 'lg-bg-' + n).replace(/lg-4u/g, 'lg-4u-' + n); }

  var NAV = [['index.html', 'Home', 'home'], ['learning.html', 'My learning', 'learning'], ['catalog.html', 'Catalog', 'catalog'], ['transcript.html', 'Transcript', 'transcript']];

  function initials(name) { return String(name).split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase(); }

  // The left side bar (a bottom tab bar on a phone), the phone's top strip, and the footer note.
  function shell(activePage) {
    var side = document.getElementById('topbar'), foot = document.getElementById('sitefoot'), main = document.querySelector('.main');
    if (side) {
      side.className = 'side';
      side.innerHTML = '<a class="brand" href="index.html" aria-label="Learn4U home">' + logo() + '<span><strong>Learn4U</strong><small>by PearlFox</small></span></a>' +
        '<nav class="nav" aria-label="Main">' + NAV.map(function (n) { return '<a href="' + n[0] + '"' + (n[0] === activePage ? ' class="on" aria-current="page"' : '') + '>' + icon(n[2], 22) + '<span>' + n[1] + '</span></a>'; }).join('') + '</nav>' +
        '<div class="usermenu"><button type="button" class="user" id="userBtn" aria-haspopup="true" aria-expanded="false"><span class="avatar" aria-hidden="true">' + esc(initials(D.me.name)) + '</span>' +
        '<span class="who"><strong>' + esc(D.me.name) + '</strong><small>' + esc(D.me.title) + '</small></span></button>' +
        '<div class="menu" id="userMenu" hidden><div class="menu-who"><strong>' + esc(D.me.name) + '</strong><span>' + esc(D.me.title) + ', ' + esc(D.me.dept) + '</span></div>' +
        '<button type="button" id="resetBtn">Reset sample data</button></div></div>';
      var btn = document.getElementById('userBtn'), menu = document.getElementById('userMenu');
      btn.addEventListener('click', function (e) { e.stopPropagation(); var open = menu.hidden; menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); });
      document.addEventListener('click', function () { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
      document.getElementById('resetBtn').addEventListener('click', function () { reset(); window.location.reload(); });
    }
    if (main) {
      var strip = document.createElement('div');
      strip.className = 'mtop';
      strip.innerHTML = '<a class="brand" href="index.html" aria-label="Learn4U home">' + logo() + '<span><strong>Learn4U</strong><small>by PearlFox</small></span></a>';
      main.insertBefore(strip, main.firstChild);
    }
    if (foot) {
      foot.className = 'sitefoot';
      foot.innerHTML = '<span>Learn4U by PearlFox. A preview with <strong>sample data only</strong>: every course and person is made up, and progress stays in this browser.</span><a href="../incidents/index.html">PearlFox Service Desk</a>';
    }
  }

  var toastTimer;
  function toast(message) {
    var n = document.getElementById('toast');
    if (!n) { n = document.createElement('div'); n.id = 'toast'; n.className = 'toast'; n.setAttribute('role', 'status'); n.setAttribute('aria-live', 'polite'); document.body.appendChild(n); }
    n.textContent = message; n.classList.add('show'); clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { n.classList.remove('show'); }, 3200);
  }
  function bar(pct, label) { return '<div class="bar-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="' + esc(label || 'Progress') + '"><div class="bar-fill" style="width:' + pct + '%"></div></div>'; }
  function statusBadge(s) { return '<span class="badge st-' + slug(s) + '">' + esc(s) + '</span>'; }
  function dueBadge(e) { return '<span class="due due-' + e.due + '">' + esc(dueText(e.item, e.course)) + '</span>'; }
  function typeBadge(item) { return '<span class="tag ' + (item.mandatory ? 'tag-must' : 'tag-opt') + '">' + (item.mandatory ? 'Mandatory' : 'Optional') + '</span>'; }
  function urlParam(name) { try { return new URLSearchParams(window.location.search).get(name); } catch (e) { return null; } }

  window.L4U = {
    SOON_DAYS: SOON_DAYS, D: D, esc: esc, slug: slug, fmtDate: fmtDate, fmtDay: fmtDay, midnight: midnight, fmtMinutes: fmtMinutes, plural: plural,
    course: course, courseMinutes: courseMinutes, load: load, save: save, reset: reset, startState: startState,
    status: status, percent: percent, isOpen: isOpen, daysUntil: daysUntil, dueState: dueState, dueText: dueText,
    entries: entries, active: active, byUrgency: byUrgency, totals: totals, toggleModule: toggleModule, enrol: enrol, withdraw: withdraw, certNumber: certNumber,
    icon: icon, coverClass: coverClass, coverIcon: coverIcon, ring: ring, shell: shell, toast: toast, bar: bar, statusBadge: statusBadge, dueBadge: dueBadge, typeBadge: typeBadge, urlParam: urlParam, initials: initials
  };
})();
