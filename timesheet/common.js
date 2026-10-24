/* PearlFox Timesheet - the rules (pure functions), the browser-only state, and the page shell (top bar, footer, toast).
   The rules work on plain objects so they can be tested without a browser; only the bottom half touches the page. */
(function () {
  var D = window.TS_DATA, KEY = 'ts-state-v1', DAY = 86400000;
  var STORE = (function () { try { return window.localStorage; } catch (e) { return null; } })();
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var STATUSES = ['Draft', 'Submitted', 'Approved', 'Rejected'];

  // ---------- small helpers ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function midnight(ms) { var d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function addDays(ms, n) { var d = new Date(ms); d.setDate(d.getDate() + n); return d.getTime(); }
  function fmtDay(ms) { return new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); }
  function fmtDate(ms) { return new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  function dotDate(ms) { var d = new Date(ms); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); }   // dd.mm.yyyy, like the other PearlFox mails
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  // ---------- weeks (Monday to Sunday) ----------
  function mondayOf(ms) { var d = new Date(midnight(ms)); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); }
  function weekKey(ms) { var d = new Date(mondayOf(ms)); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function keyToMs(key) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || '')); return m ? mondayOf(new Date(+m[1], +m[2] - 1, +m[3]).getTime()) : null; }
  // ISO week number: the week that holds the year's first Thursday is week 1.
  function weekNumber(mondayMs) {
    var thu = addDays(mondayMs, 3), year = new Date(thu).getFullYear();
    var week1 = mondayOf(new Date(year, 0, 4).getTime());
    return Math.round((mondayMs - week1) / (7 * DAY)) + 1;
  }
  function weekRange(mondayMs) { return fmtDay(mondayMs) + ' - ' + fmtDate(addDays(mondayMs, 6)); }

  // ---------- hours ----------
  // What a person typed in an hours box: "7,5" and "7.5" both mean 7.5; blank or nonsense means 0; limited to 0-24 and to quarter hours.
  function clampHours(v) {
    var n = parseFloat(String(v == null ? '' : v).replace(',', '.'));
    if (!isFinite(n) || n < 0) return 0;
    return Math.round(Math.min(n, 24) * 4) / 4;
  }
  function fmtH(n) { return String(Math.round(n * 100) / 100); }
  function expected(i) { return i < 5 ? D.target : 0; }
  function weekTarget() { return D.target * 5; }
  function rowTotal(row) { return row.h.reduce(function (t, x) { return t + x; }, 0); }
  function dayTotal(sheet, i) { return sheet.rows.reduce(function (t, r) { return t + r.h[i]; }, 0); }
  function sheetTotal(sheet) { return sheet.rows.reduce(function (t, r) { return t + rowTotal(r); }, 0); }
  function project(code) { for (var i = 0; i < D.projects.length; i++) if (D.projects[i].code === code) return D.projects[i]; return null; }
  function byProject(sheet) {
    var sums = {}, out = [];
    sheet.rows.forEach(function (r) { sums[r.code] = (sums[r.code] || 0) + rowTotal(r); });
    Object.keys(sums).forEach(function (c) { if (sums[c] > 0) out.push({ code: c, name: (project(c) || { name: c }).name, hours: sums[c] }); });
    return out.sort(function (a, b) { return b.hours - a.hours; });
  }

  // ---------- one week's sheet: status flow ----------
  // Draft -> Submitted -> Approved | Rejected;  Submitted -> Draft (recall);  Rejected is editable and can be submitted again.
  function newSheet() { return { rows: [], status: 'Draft', note: '', submittedOn: null, decidedOn: null, comment: '' }; }
  function canEdit(sheet) { return sheet.status === 'Draft' || sheet.status === 'Rejected'; }
  function addRow(sheet, code, task) {
    if (!canEdit(sheet) || !project(code)) return false;
    if (sheet.rows.some(function (r) { return r.code === code && r.task === task; })) return false;
    sheet.rows.push({ code: code, task: task, h: [0, 0, 0, 0, 0, 0, 0] });
    return true;
  }
  function removeRow(sheet, index) { if (!canEdit(sheet) || !sheet.rows[index]) return false; sheet.rows.splice(index, 1); return true; }
  function setHours(sheet, r, d, value) { if (!canEdit(sheet) || !sheet.rows[r] || d < 0 || d > 6) return false; sheet.rows[r].h[d] = clampHours(value); return true; }
  // Copy last week: the same rows with empty hours (never the hours themselves).
  function copyRows(sheet, from) {
    if (!canEdit(sheet) || !from) return 0;
    var added = 0;
    from.rows.forEach(function (r) { if (addRow(sheet, r.code, r.task)) added++; });
    return added;
  }
  function submit(sheet, now) {
    if (!canEdit(sheet)) return { ok: false, reason: 'locked' };
    if (sheetTotal(sheet) <= 0) return { ok: false, reason: 'empty' };
    sheet.status = 'Submitted'; sheet.submittedOn = now; sheet.decidedOn = null; sheet.comment = '';
    return { ok: true };
  }
  function recall(sheet) { if (sheet.status !== 'Submitted') return false; sheet.status = 'Draft'; sheet.submittedOn = null; return true; }
  // There is no real manager here: the demo buttons play the manager's answer.
  function decide(sheet, approve, comment, now) {
    if (sheet.status !== 'Submitted') return false;
    sheet.status = approve ? 'Approved' : 'Rejected'; sheet.decidedOn = now; sheet.comment = approve ? '' : String(comment || '').trim();
    return true;
  }

  // ---------- when it is due ----------
  // 'done' once submitted or approved; otherwise by the days to the week's due day (its Friday): late (past), today, soon (1-2 days), ok.
  function dueMs(mondayMs) { return addDays(mondayMs, D.dueDay); }
  function daysToDue(mondayMs, now) { return Math.round((dueMs(mondayMs) - midnight(now)) / DAY); }
  function dueInfo(sheet, mondayMs, now) {
    var days = daysToDue(mondayMs, now);
    if (sheet.status === 'Submitted' || sheet.status === 'Approved') return { state: 'done', days: days };
    return { state: days < 0 ? 'late' : days === 0 ? 'today' : days <= 2 ? 'soon' : 'ok', days: days };
  }
  function dueText(info) {
    if (info.state === 'done') return 'Handed in';
    if (info.state === 'late') return plural(-info.days, 'day', 'days') + ' late';
    if (info.state === 'today') return 'Due today';
    return 'Due in ' + plural(info.days, 'day', 'days');
  }

  // ---------- the sample data (relative to today, so it always looks current) ----------
  var PATTERN = [   // one normal working week = 40 hours
    ['PRJ-2041', 'Development', [5, 4, 5, 4, 5]], ['PRJ-1187', 'Analysis', [2, 2, 1.5, 2, 1.5]],
    ['INT-0001', 'Team meetings', [1, 1, 1.5, 1, 1.5]], ['PRJ-2041', 'Code review', [0, 1, 0, 1, 0]]
  ];
  function sampleSheet(opts) {
    var s = newSheet();
    PATTERN.forEach(function (p) { var h = [0, 0, 0, 0, 0, 0, 0]; for (var i = 0; i < 5; i++) h[i] = p[2][i]; s.rows.push({ code: p[0], task: p[1], h: h }); });
    if (opts.leaveDay != null || opts.holiday != null) {
      var day = opts.leaveDay != null ? opts.leaveDay : opts.holiday;
      s.rows.forEach(function (r) { r.h[day] = 0; });
      var l = [0, 0, 0, 0, 0, 0, 0]; l[day] = 8;
      s.rows.push({ code: 'ABS-0001', task: opts.leaveDay != null ? 'Annual leave' : 'Public holiday', h: l });
    }
    if (opts.fromDay != null) s.rows.forEach(function (r) { for (var i = opts.fromDay; i < 7; i++) r.h[i] = 0; });   // the days that have not happened yet stay empty
    return s;
  }
  function seed(now) {
    var cur = mondayOf(now), weeks = {}, todayIdx = Math.round((midnight(now) - cur) / DAY);
    weeks[weekKey(cur)] = sampleSheet({ fromDay: todayIdx });
    for (var w = 1; w <= 11; w++) {
      var mon = addDays(cur, -7 * w), s = sampleSheet({ leaveDay: w === 2 ? 2 : null, holiday: w === 5 ? 0 : null });
      var friday = addDays(mon, 4) + 17 * 3600000;
      if (w === 1) { s.status = 'Submitted'; s.submittedOn = friday; }
      else if (w === 3) {
        s.status = 'Rejected'; s.submittedOn = friday; s.decidedOn = addDays(mon, 7) + 10 * 3600000;
        s.comment = 'PRJ-2041 shows all the time as Development. Please split the testing hours into Testing and submit again.';
      } else { s.status = 'Approved'; s.submittedOn = friday; s.decidedOn = addDays(mon, 7) + 10 * 3600000; }
      weeks[weekKey(mon)] = s;
    }
    return { v: 1, weeks: weeks };
  }

  // ---------- state (this browser only) ----------
  var state = null;
  function valid(s) { return s && s.v === 1 && s.weeks && typeof s.weeks === 'object'; }
  function load() {
    if (state) return state;
    try { var raw = STORE && STORE.getItem(KEY); if (raw) { var s = JSON.parse(raw); if (valid(s)) { state = s; return state; } } } catch (e) { /* use the sample */ }
    state = seed(Date.now()); save();
    return state;
  }
  function save() { try { if (STORE) STORE.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode: it still works until the page closes */ } }
  function reset() { state = seed(Date.now()); save(); }
  // A week nobody has touched is an empty draft; it only gets stored once something is entered.
  function sheetFor(mondayMs) { var k = weekKey(mondayMs), st = load(); return st.weeks[k] || (st.weeks[k] = newSheet()); }
  function allWeeks() {
    var st = load();
    return Object.keys(st.weeks).sort().reverse().map(function (k) { return { key: k, mon: keyToMs(k), sheet: st.weeks[k] }; });
  }

  // ---------- page shell ----------
  var logoCount = 0;
  function logo() {   // a fresh gradient id per copy: two copies sharing one id leave one of them blank on some phones
    var id = 'tsg' + (++logoCount);
    return '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#818CF8"/><stop offset="1" stop-color="#4F46E5"/></linearGradient></defs>' +
      '<rect width="32" height="32" rx="8" fill="url(#' + id + ')"/><circle cx="16" cy="16" r="8.2" fill="none" stroke="#fff" stroke-width="2"/><path d="M16 11v5.4l3.6 2.1" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  var TOAST_TIMER = null;
  function toast(msg) {
    var t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.className = 'toast show';
    clearTimeout(TOAST_TIMER); TOAST_TIMER = setTimeout(function () { t.className = 'toast'; }, 2600);
  }
  function shell(page) {
    var bar = document.getElementById('topbar'), foot = document.getElementById('sitefoot');
    if (bar) {
      var tabs = [['week', 'index.html', 'My timesheet'], ['history', 'history.html', 'History'], ['mail', 'mail.html', 'Reminder mails']];
      bar.className = 'bar';
      bar.innerHTML = '<div class="bar-in"><a class="brand" href="index.html">' + logo() + '<span class="brand-t"><b>Timesheet</b><small>by PearlFox</small></span></a>' +
        '<nav class="tabs" aria-label="Sections">' + tabs.map(function (t) { return '<a href="' + t[1] + '"' + (t[0] === page ? ' class="on" aria-current="page"' : '') + '>' + t[2] + '</a>'; }).join('') + '</nav>' +
        '<div class="who"><span class="avatar" aria-hidden="true">' + esc(D.user.initials) + '</span><span class="who-t"><b>' + esc(D.user.name) + '</b><small>ID ' + esc(D.user.id) + ' &middot; ' + esc(D.user.title) + '</small></span></div></div>';
    }
    if (foot) {
      foot.className = 'sitefoot';
      foot.innerHTML = '<span>Timesheet by PearlFox. A preview with <strong>sample data only</strong>: every project and person is made up, and the hours stay in this browser.</span>' +
        '<span class="foot-r"><button type="button" id="resetBtn">Reset sample data</button><a href="../learn4u/index.html">PearlFox Learn4U</a></span>';
      var rb = document.getElementById('resetBtn');
      if (rb) rb.addEventListener('click', function () { reset(); toast('Sample data restored'); setTimeout(function () { location.href = 'index.html'; }, 500); });
    }
    if (!document.getElementById('toast')) { var t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
  }

  window.TS = {
    D: D, DAY: DAY, DAYS: DAYS, STATUSES: STATUSES, esc: esc, pad: pad, midnight: midnight, addDays: addDays, fmtDay: fmtDay, fmtDate: fmtDate, dotDate: dotDate, plural: plural,
    mondayOf: mondayOf, weekKey: weekKey, keyToMs: keyToMs, weekNumber: weekNumber, weekRange: weekRange,
    clampHours: clampHours, fmtH: fmtH, expected: expected, weekTarget: weekTarget, rowTotal: rowTotal, dayTotal: dayTotal, sheetTotal: sheetTotal, project: project, byProject: byProject,
    newSheet: newSheet, canEdit: canEdit, addRow: addRow, removeRow: removeRow, setHours: setHours, copyRows: copyRows, submit: submit, recall: recall, decide: decide,
    dueMs: dueMs, daysToDue: daysToDue, dueInfo: dueInfo, dueText: dueText, seed: seed,
    load: load, save: save, reset: reset, sheetFor: sheetFor, allWeeks: allWeeks, shell: shell, toast: toast, logo: logo
  };
})();
