/* PearlFox Service Desk - helpers shared by the landing page and the ticket page.
   Pure functions on the sample data: no network, no storage. */
(function () {
  var DAY = 864e5;
  var FLOW = ['New', 'Assigned', 'In progress', 'On hold', 'Resolved', 'Closed']; // Cancelled sits outside the flow
  var FINISHED = ['Resolved', 'Closed', 'Cancelled'];
  var D = window.SD_DATA;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  function fmtDate(ms) { return new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  function fmtTime(ms) { return new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  function fmtDateTime(ms) { return fmtDate(ms) + ', ' + fmtTime(ms); }

  function fmtDuration(ms) {
    var m = Math.max(0, Math.round(ms / 60000));
    if (m < 1) return 'under a minute';
    var d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mi = m % 60;
    if (d) return h ? d + 'd ' + h + 'h' : d + 'd';
    if (h) return mi ? h + 'h ' + mi + 'm' : h + 'h';
    return mi + 'm';
  }
  function fmtAgo(ms) { return fmtDuration(D.now - ms) + ' ago'; }

  function priorityRank(p) { return Number(String(p).charAt(0)) || 9; }
  function priorityLabel(p) { return String(p).replace(/^\d\s*-\s*/, ''); }
  function priorityClass(p) { return 'pr-' + priorityRank(p); }

  // The newest status event decides the current status. Events are stored oldest first by hours-ago.
  function ordered(inc) { return inc.events.slice().sort(function (a, b) { return b.h - a.h; }); }
  function eventTime(ev) { return D.now - ev.h * 36e5; }

  // [{ status, from, at, by, note, spentMs }] oldest first. spentMs = time until the next change (or until now).
  function statusHistory(inc) {
    var rows = [], prev = null;
    ordered(inc).forEach(function (ev) {
      if (ev.kind !== 'status') return;
      rows.push({ status: ev.to, from: prev, at: eventTime(ev), by: ev.by, note: ev.note, spentMs: 0 });
      prev = ev.to;
    });
    rows.forEach(function (r, i) { r.spentMs = (i + 1 < rows.length ? rows[i + 1].at : D.now) - r.at; });
    return rows;
  }
  function currentStatus(inc) { var h = statusHistory(inc); return h.length ? h[h.length - 1].status : 'New'; }
  function comments(inc) {
    return ordered(inc).filter(function (e) { return e.kind === 'comment'; })
      .map(function (e) { return { by: e.by, text: e.text, at: eventTime(e) }; });
  }

  function isFinished(status) { return FINISHED.indexOf(status) !== -1; }
  function statusClass(s) { return 'st-' + slug(s); }

  // 'done' (finished), 'overdue', 'soon' (today up to 7 days away), 'ok'.
  function dueState(inc) {
    if (isFinished(currentStatus(inc))) return 'done';
    var days = Math.round((inc.endDate - D.today) / DAY);
    if (days < 0) return 'overdue';
    return days <= 7 ? 'soon' : 'ok';
  }
  function dueText(inc) {
    var days = Math.round((inc.endDate - D.today) / DAY);
    if (isFinished(currentStatus(inc))) return 'Finished';
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    if (days > 1) return 'Due in ' + days + ' days';
    return Math.abs(days) + (days === -1 ? ' day' : ' days') + ' overdue';
  }

  function findIncident(id) {
    var hit = D.incidents.filter(function (i) { return i.id === id; });
    return hit.length ? hit[0] : null;
  }

  function greeting() {
    var h = new Date().getHours();
    return (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening') + ', ' + D.me.first;
  }

  // ---- Incidents made with the "New incident" button. Kept in this browser only (localStorage), in absolute
  // times; turned into the same shape as the sample incidents ("hours ago") when the page loads.
  var STORE_KEY = 'pf-service-desk-created';
  var MAX_CREATED = 100;
  function isNum(x) { return typeof x === 'number' && isFinite(x); }
  function isText(x) { return typeof x === 'string' && x.length > 0 && x.length < 2000; }
  function validStored(s) {
    return !!s && /^INC\d{1,12}$/.test(s.id) && isText(s.short) && /^[1-5] - /.test(String(s.priority)) &&
      isText(s.assignedTo) && isNum(s.openedAt) && isNum(s.endDate) && Array.isArray(s.events) && s.events.length > 0 &&
      s.events.every(function (e) { return e && isNum(e.at) && (e.kind === 'status' || e.kind === 'comment') && isText(e.by); });
  }
  function readStored() {
    try {
      var list = JSON.parse(window.localStorage.getItem(STORE_KEY) || '[]');
      return Array.isArray(list) ? list.filter(validStored) : [];
    } catch (e) { return []; }
  }
  function writeStored(list) {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
  }
  function toModel(s) {
    var m = {};
    Object.keys(s).forEach(function (k) { m[k] = s[k]; });
    m.events = s.events.map(toEvent);
    return m;
  }
  function toEvent(e) { return { h: (D.now - e.at) / 36e5, kind: e.kind, to: e.to, by: e.by, note: e.note || '', text: e.text }; }
  readStored().forEach(function (s) { if (!findIncident(s.id)) D.incidents.push(toModel(s)); });

  // ---- Changes made on the ticket page: a new status, a new assignee, a comment. Kept in this browser only, per
  // incident number, and applied on load to sample and created incidents alike. Validated on read.
  var CHANGES_KEY = 'pf-service-desk-changes';
  var MAX_CHANGED = 200, MAX_EVENTS = 200, MAX_NOTE = 500, MAX_COMMENT = 1000;
  var STATUSES = FLOW.concat(['Cancelled']);
  var MIN_YEAR = 2020, MAX_YEAR = 2099;          // an end date outside these years is almost certainly a typing slip
  function inRange(ms) { var y = new Date(ms).getFullYear(); return isNum(ms) && y >= MIN_YEAR && y <= MAX_YEAR; }
  // yyyy-mm-dd (what a date box gives) <-> local midnight in ms. Only a real calendar date is accepted (no 30 February).
  function toDateInput(ms) { var d = new Date(ms); return d.getFullYear() + '-' + (d.getMonth() < 9 ? '0' : '') + (d.getMonth() + 1) + '-' + (d.getDate() < 10 ? '0' : '') + d.getDate(); }
  function fromDateInput(text) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text || ''));
    if (!m) return null;
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return null;
    return inRange(d.getTime()) ? d.getTime() : null;
  }
  function validEvent(e) {
    if (!e || !isNum(e.at) || !isText(e.by)) return false;
    if (e.kind === 'status') return STATUSES.indexOf(e.to) !== -1 && (e.note == null || (typeof e.note === 'string' && e.note.length <= MAX_NOTE));
    return e.kind === 'comment' && isText(e.text);
  }
  function readChanges() {
    var out = {};
    try {
      var all = JSON.parse(window.localStorage.getItem(CHANGES_KEY) || '{}');
      if (!all || typeof all !== 'object' || Array.isArray(all)) return out;
      Object.keys(all).forEach(function (id) {
        var c = all[id];
        if (!/^INC\d{1,12}$/.test(id) || !c || typeof c !== 'object' || !Array.isArray(c.events)) return;
        out[id] = {
          assignedTo: D.assignees.indexOf(c.assignedTo) !== -1 ? c.assignedTo : null,
          priority: D.priorities.indexOf(c.priority) !== -1 ? c.priority : null,
          endDate: inRange(c.endDate) ? c.endDate : null,
          events: c.events.filter(validEvent).slice(-MAX_EVENTS)
        };
      });
    } catch (e) { /* damaged data is ignored */ }
    return out;
  }
  function writeChanges(all) {
    var ids = Object.keys(all);
    ids.slice(0, Math.max(0, ids.length - MAX_CHANGED)).forEach(function (id) { delete all[id]; });   // oldest go first
    try { window.localStorage.setItem(CHANGES_KEY, JSON.stringify(all)); return true; } catch (e) { return false; }
  }
  (function applyChanges() {
    var all = readChanges();
    Object.keys(all).forEach(function (id) {
      var inc = findIncident(id);
      if (!inc) return;
      if (all[id].assignedTo) inc.assignedTo = all[id].assignedTo;
      if (all[id].priority) inc.priority = all[id].priority;
      if (all[id].endDate) inc.endDate = all[id].endDate;
      all[id].events.forEach(function (e) { inc.events.push(toEvent(e)); });
    });
  })();

  // Applies one change to the live incident and stores it. change = { assignedTo, priority, endDate, event }.
  function record(inc, change) {
    var all = readChanges(), mine = all[inc.id] || { assignedTo: null, priority: null, endDate: null, events: [] };
    if (change.assignedTo) { mine.assignedTo = change.assignedTo; inc.assignedTo = change.assignedTo; }
    if (change.priority) { mine.priority = change.priority; inc.priority = change.priority; }
    if (change.endDate) { mine.endDate = change.endDate; inc.endDate = change.endDate; }
    if (change.event) { mine.events.push(change.event); inc.events.push(toEvent(change.event)); }
    delete all[inc.id]; all[inc.id] = mine;         // moved to the end: the newest are kept when trimming
    return { ok: true, persisted: writeChanges(all) };
  }
  function fail(message) { return { ok: false, error: message }; }
  function clean(text) { return String(text == null ? '' : text).replace(/\s+/g, ' ').trim(); }

  function changeStatus(inc, to, by, note) {
    if (STATUSES.indexOf(to) === -1) return fail('Choose a status from the list.');
    if (to === currentStatus(inc)) return fail('The incident is already ' + to + '.');
    var n = clean(note);
    if (n.length > MAX_NOTE) return fail('The note is too long (' + MAX_NOTE + ' characters at most).');
    return record(inc, { event: { at: Date.now(), kind: 'status', to: to, by: by, note: n } });
  }
  function reassign(inc, name, by) {
    if (D.assignees.indexOf(name) === -1) return fail('Choose a person from the list.');
    if (name === inc.assignedTo) return fail('The incident is already assigned to ' + name + '.');
    return record(inc, { assignedTo: name, event: { at: Date.now(), kind: 'comment', by: 'Service Desk', text: 'Reassigned from ' + inc.assignedTo + ' to ' + name + ' by ' + by + '.' } });
  }
  function changePriority(inc, to, by) {
    if (D.priorities.indexOf(to) === -1) return fail('Choose a priority from the list.');
    if (to === inc.priority) return fail('The priority is already ' + to + '.');
    return record(inc, { priority: to, event: { at: Date.now(), kind: 'comment', by: 'Service Desk', text: 'Priority changed from ' + inc.priority + ' to ' + to + ' by ' + by + '.' } });
  }
  function changeEndDate(inc, text, by) {
    var ms = fromDateInput(text);
    if (ms === null) return fail('Choose a real date between ' + MIN_YEAR + ' and ' + MAX_YEAR + '.');
    if (ms === inc.endDate) return fail('The end date is already ' + fmtDate(ms) + '.');
    return record(inc, { endDate: ms, event: { at: Date.now(), kind: 'comment', by: 'Service Desk', text: 'End date changed from ' + fmtDate(inc.endDate) + ' to ' + fmtDate(ms) + ' by ' + by + '.' } });
  }
  function addComment(inc, text, by) {
    var t = clean(text);
    if (!t) return fail('Write a comment first.');
    if (t.length > MAX_COMMENT) return fail('The comment is too long (' + MAX_COMMENT + ' characters at most).');
    return record(inc, { event: { at: Date.now(), kind: 'comment', by: by, text: t } });
  }

  // Adds one incident (stored shape). Returns { incident, persisted }: persisted is false when the browser refuses to store it.
  function addCreated(stored) {
    var list = readStored(); list.push(stored);
    var persisted = writeStored(list.slice(-MAX_CREATED));
    var model = toModel(stored);
    D.incidents.push(model);
    return { incident: model, persisted: persisted };
  }
  function isMine(inc) { return inc.assignedTo === D.me.name; }

  // Top bar and footer, written once and placed by each page into #topbar and #sitefoot.
  function initials(name) { return String(name).split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase(); }
  function renderChrome() {
    var top = document.getElementById('topbar'), foot = document.getElementById('sitefoot');
    if (top) {
      top.className = 'topbar';
      top.innerHTML = '<div class="wrap">' +
        '<a class="brand" href="index.html"><img src="../apple-touch-icon.png" alt="" width="32" height="32">' +
        '<span><span class="pearl">Pearl</span><span class="fox">Fox</span></span><span class="desk">Service Desk</span></a>' +
        '<nav aria-label="Main"><a class="on" href="index.html">My incidents</a></nav><span class="spacer"></span>' +
        '<div class="user"><div class="who"><b>' + esc(D.me.name) + '</b><span>' + esc(D.me.group) + '</span></div>' +
        '<div class="avatar" aria-hidden="true">' + esc(initials(D.me.name)) + '</div></div></div>';
    }
    if (foot) {
      foot.className = 'foot';
      foot.innerHTML = '<div class="wrap"><span>PearlFox Service Desk. Preview with sample data. Changes stay in this browser; nothing is sent.</span>' +
        '<span><a href="../index.html">pearlfox.io</a></span></div>';
    }
  }

  window.SD = {
    FLOW: FLOW, esc: esc, slug: slug, fmtDate: fmtDate, fmtTime: fmtTime, fmtDateTime: fmtDateTime,
    fmtDuration: fmtDuration, fmtAgo: fmtAgo, priorityRank: priorityRank, priorityLabel: priorityLabel,
    priorityClass: priorityClass, statusHistory: statusHistory, currentStatus: currentStatus, comments: comments,
    isFinished: isFinished, statusClass: statusClass, dueState: dueState, dueText: dueText,
    findIncident: findIncident, addCreated: addCreated, STATUSES: STATUSES, changeStatus: changeStatus, reassign: reassign, changePriority: changePriority, changeEndDate: changeEndDate, toDateInput: toDateInput, addComment: addComment, isMine: isMine, greeting: greeting, renderChrome: renderChrome, data: D
  };
})();
