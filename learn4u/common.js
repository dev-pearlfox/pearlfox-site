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
  var NAV = [['index.html', 'Home'], ['learning.html', 'My learning'], ['catalog.html', 'Catalog'], ['transcript.html', 'Transcript']];

  function initials(name) { return String(name).split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase(); }

  function shell(activePage) {
    var top = document.getElementById('topbar'), foot = document.getElementById('sitefoot');
    if (top) {
      top.className = 'topbar';
      top.innerHTML = '<div class="wrap bar"><a class="brand" href="index.html" aria-label="Learn4U home">' + LOGO + '<span class="brand-name">Learn4U</span><span class="brand-sub">by PearlFox</span></a>' +
        '<nav class="nav" aria-label="Main">' + NAV.map(function (n) { return '<a href="' + n[0] + '"' + (n[0] === activePage ? ' class="on" aria-current="page"' : '') + '>' + n[1] + '</a>'; }).join('') + '</nav>' +
        '<div class="usermenu"><button type="button" class="user" id="userBtn" aria-haspopup="true" aria-expanded="false"><span class="avatar" aria-hidden="true">' + esc(initials(D.me.name)) + '</span><span class="uname">' + esc(D.me.name) + '</span></button>' +
        '<div class="menu" id="userMenu" hidden><div class="menu-who"><strong>' + esc(D.me.name) + '</strong><span>' + esc(D.me.title) + ', ' + esc(D.me.dept) + '</span></div>' +
        '<button type="button" id="resetBtn">Reset sample data</button></div></div></div>';
      var btn = document.getElementById('userBtn'), menu = document.getElementById('userMenu');
      btn.addEventListener('click', function (e) { e.stopPropagation(); var open = menu.hidden; menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); });
      document.addEventListener('click', function () { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
      document.getElementById('resetBtn').addEventListener('click', function () { reset(); window.location.reload(); });
    }
    if (foot) {
      foot.className = 'sitefoot';
      foot.innerHTML = '<div class="wrap"><span>Learn4U by PearlFox. A preview with <strong>sample data only</strong>: every course and person is made up, and progress stays in this browser.</span><span><a href="../incidents/index.html">PearlFox Service Desk</a></span></div>';
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
    shell: shell, toast: toast, bar: bar, statusBadge: statusBadge, dueBadge: dueBadge, typeBadge: typeBadge, urlParam: urlParam, initials: initials
  };
})();
