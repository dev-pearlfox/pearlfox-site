/* Learn4U - My learning: list with tabs, search, Copy mail and the Assign training test tool. */
(function () {
  var L = window.L4U, esc = L.esc, DAY = L.D.day;
  L.shell('learning.html');

  var TABS = [['all', 'All'], ['open', 'To do'], ['soon', 'Due soon'], ['overdue', 'Overdue'], ['mandatory', 'Mandatory'], ['done', 'Completed']];   // same tabs and rules as before
  var FILTERS = {
    all: function (e) { return e.status !== 'Cancelled'; },
    open: function (e) { return e.due !== 'done'; },
    soon: function (e) { return e.due === 'soon'; },
    overdue: function (e) { return e.due === 'overdue'; },
    mandatory: function (e) { return e.item.mandatory && e.status !== 'Cancelled'; },
    done: function (e) { return e.status === 'Completed'; }
  };
  var tab = FILTERS[L.urlParam('tab')] ? L.urlParam('tab') : 'all', query = '';

  function matches(e) { var q = query.trim().toLowerCase(); return !q || (e.course.title + ' ' + e.course.category + ' ' + e.course.id).toLowerCase().indexOf(q) !== -1; }
  function drawTabs() {
    var all = L.entries();
    document.getElementById('tabs').innerHTML = TABS.map(function (t) {
      var n = all.filter(FILTERS[t[0]]).length;
      return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (t[0] === tab) + '">' + t[1] + '<span class="count">' + n + '</span></button>';
    }).join('');
  }
  function draw() {
    drawTabs();
    var list = L.entries().filter(FILTERS[tab]).filter(matches).sort(L.byUrgency);
    document.getElementById('rows').innerHTML = list.map(function (e) {
      var c = e.course, open = e.status !== 'Completed' && e.status !== 'Cancelled';
      return '<li class="lcard" data-id="' + esc(c.id) + '"><div>' + L.ring(e.pct, 64, 'Progress in ' + c.title) + '</div>' +
        '<div><h3><a href="course.html?id=' + esc(c.id) + '">' + esc(c.title) + '</a></h3><div class="lc-sub"><span>' + esc(c.id) + '</span><span>&middot;</span><span>' + esc(c.category) + '</span>' + L.typeBadge(e.item) + L.statusBadge(e.status) + '</div></div>' +
        '<div class="lc-right">' + L.dueBadge(e) + '<div class="lc-actions"><button type="button" class="btn-ghost btn-sm" data-copy="' + esc(c.id) + '" title="Copy this training as a mail">Copy mail</button> ' +
        '<a class="' + (open ? 'btn-primary' : 'btn-secondary') + ' btn-sm" href="course.html?id=' + esc(c.id) + '">' + (open ? (e.status === 'In progress' ? 'Resume' : 'Start') : 'View') + '</a></div></div></li>';
    }).join('');
    var none = document.getElementById('none');
    none.hidden = list.length > 0;
    document.getElementById('noneText').textContent = query.trim() ? ' No training matches "' + query.trim() + '".' : tab === 'overdue' || tab === 'soon' ? ' Nothing is ' + (tab === 'overdue' ? 'overdue' : 'due soon') + '. Well done.' : ' Nothing in this list yet.';
  }

  document.getElementById('tabs').addEventListener('click', function (ev) { var b = ev.target.closest('[data-tab]'); if (b) { tab = b.getAttribute('data-tab'); draw(); } });
  document.getElementById('q').addEventListener('input', function (ev) { query = ev.target.value; draw(); });
  document.getElementById('rows').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-copy]'); if (!b) return;
    var entry = L.entries().filter(function (e) { return e.course.id === b.getAttribute('data-copy'); })[0];
    window.L4U_MAIL.copyFor(entry, 'mail').then(function (r) { L.toast(r.ok ? 'Mail copied. Paste it into a new mail. Subject: ' + r.subject : 'The browser blocked copying. Allow clipboard access for this page.'); });
  });

  // ---- Assign training (test tool) ----
  var overlay = document.getElementById('assignOverlay'), sel = document.getElementById('aCourse'), due = document.getElementById('aDue'), note = document.getElementById('aNote'), opener = null;
  function iso(ms) { var d = new Date(ms); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function fromIso(s) { var p = String(s).split('-'); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]).getTime() : NaN; }
  function takenIds() { var m = {}; L.entries().forEach(function (e) { if (e.status !== 'Cancelled') m[e.item.id] = 1; }); return m; }
  function fillCourses() {
    var taken = takenIds(), free = L.D.courses.filter(function (c) { return !taken[c.id]; });
    sel.innerHTML = free.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.title) + '</option>'; }).join('');
    note.textContent = free.length ? '' : 'You already have every course. Remove an optional one or use Reset sample data.';
    return free;
  }
  function openDialog() { fillCourses(); due.value = iso(Date.now() + 30 * DAY); opener = document.activeElement; overlay.hidden = false; sel.focus(); }
  function closeDialog() { overlay.hidden = true; if (opener && opener.focus) opener.focus(); }
  document.getElementById('assignBtn').addEventListener('click', openDialog);
  document.getElementById('assignClose').addEventListener('click', closeDialog);
  document.getElementById('aCancel').addEventListener('click', closeDialog);
  overlay.addEventListener('mousedown', function (ev) { if (ev.target === overlay) closeDialog(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !overlay.hidden) closeDialog(); });
  document.getElementById('aRandom').addEventListener('click', function () {
    var free = fillCourses(); if (!free.length) return;
    sel.value = free[Math.floor(Math.random() * free.length)].id;
    document.getElementById('aType').value = Math.random() < 0.6 ? 'mandatory' : 'optional';
    due.value = iso(Date.now() + (Math.floor(Math.random() * 60) - 10) * DAY);    // from 10 days late to 50 days ahead
  });
  document.getElementById('assignForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var ms = fromIso(due.value);
    if (!sel.value) { note.textContent = 'There is no course left to assign.'; return; }
    if (isNaN(ms)) { note.textContent = 'Choose a due date.'; return; }
    var item = L.enrol(sel.value, { mandatory: document.getElementById('aType').value === 'mandatory', due: ms, by: 'Learning & Development' });
    closeDialog();
    if (item) { L.toast('Assigned: ' + L.course(item.id).title + '. Use Copy mail to try the mail.'); draw(); }
  });

  draw();
})();
