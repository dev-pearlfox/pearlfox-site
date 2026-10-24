/* Learn4U - one course: modules with Mark complete, progress, certificate, Remove. (The mail buttons are links on the page bar: see mail-link.js.) */
(function () {
  var L = window.L4U, esc = L.esc, D = L.D;
  L.shell('');
  var main = document.getElementById('view'), id = L.urlParam('id'), c = L.course(id);   // #view sits inside #main (the shell adds the phone strip to #main)
  var TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
  var KIND = { Video: 'Video', Reading: 'Reading', Quiz: 'Quiz', Workshop: 'Workshop' };

  if (!c) {
    document.title = 'Course not found - Learn4U';
    main.innerHTML = '<div class="empty"><strong>Course not found</strong>This course number does not exist. <a href="catalog.html">Browse the catalog</a>.</div>';
    return;
  }
  document.title = c.title + ' - Learn4U';
  function entry() { return L.entries().filter(function (e) { return e.item.id === id; })[0] || null; }

  // The details card: status, type, due and so on, then the buttons that depend on the state.
  function details(e) {
    var rows;
    if (e && e.status !== 'Cancelled') {
      rows = [['Status', L.statusBadge(e.status)], ['Type', L.typeBadge(e.item)], ['Due', L.dueBadge(e)], ['Assigned by', esc(e.item.by)], ['Assigned', esc(L.fmtDate(e.item.assignedAt))]];
    } else rows = [['Status', e ? L.statusBadge('Cancelled') : '<span class="tag tag-opt">Not in my learning</span>']];
    rows.push(['Duration', esc(L.fmtMinutes(L.courseMinutes(c)))], ['Modules', String(c.modules.length)], ['Level', esc(c.level)], ['Owner', esc(c.owner)], ['Valid for', c.validMonths + ' months']);
    var html = '<section class="panel"><div class="panel-head"><h2>Details</h2></div><div class="panel-body">';
    if (e && e.status !== 'Cancelled') html += '<div style="margin-bottom:16px">' + L.bar(e.pct, 'Progress') + '<div class="hint" style="margin-top:6px">' + e.pct + '% complete</div></div>';
    html += '<dl class="kv">' + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl><div class="sidebtns">';
    if (!e || e.status === 'Cancelled') html += '<button type="button" class="btn-primary btn-block" id="addBtn">Add to my learning</button>';
    if (e && e.status === 'Completed') html += '<button type="button" class="btn-primary btn-block" id="certBtn">View certificate</button>';
    if (e && e.status !== 'Cancelled' && e.status !== 'Completed') html += e.item.mandatory ? '<p class="hint">Mandatory trainings cannot be removed.</p>' : '<button type="button" class="btn-danger btn-block" id="removeBtn">Remove from my learning</button>';
    return html + '</div></div></section>';
  }

  // "Up next": the first module not done yet, with one big button. Shown only while the course is open.
  function upNext(e, done) {
    if (!e || e.status === 'Cancelled' || e.status === 'Completed') return '';
    var m = c.modules.filter(function (x) { return done.indexOf(x.id) === -1; })[0];
    if (!m) return '';
    return '<div class="upnext"><span class="kicker">' + (done.length ? 'Up next' : 'Start with') + '</span><h3>' + esc(m.title) + '</h3><p>' + esc(KIND[m.kind] || m.kind) + ' &middot; ' + m.min + ' min</p>' +
      '<button type="button" class="btn-white" data-next="' + esc(m.id) + '">Mark complete</button></div>';
  }

  function draw() {
    var e = entry(), live = e && e.status !== 'Cancelled', done = live ? e.item.done : [];
    main.innerHTML = '<div class="crumbs"><a href="catalog.html">Catalog</a> / ' + esc(c.category) + '</div>' +
      '<div class="chead ' + L.coverClass(c) + '"><span class="wm">' + L.coverIcon(c, 300) + '</span><span class="kicker">' + esc(c.category) + '</span><h1>' + esc(c.title) + '</h1><p class="lead">' + esc(c.summary) + '</p>' +
      '<div class="chips"><span>' + esc(c.level) + '</span><span>' + esc(L.fmtMinutes(L.courseMinutes(c))) + '</span><span>' + esc(L.plural(c.modules.length, 'module', 'modules')) + '</span></div></div>' +
      '<div class="player"><div class="side-col">' +
      '<section class="panel"><div class="panel-head"><h2>Modules</h2><span class="hint">' + done.length + ' of ' + c.modules.length + ' done</span></div><ol class="modules">' +
      c.modules.map(function (m, i) {
        var d = done.indexOf(m.id) !== -1;
        return '<li class="' + (d ? 'done' : '') + '"><button type="button" class="tick" data-m="' + esc(m.id) + '"' + (live ? '' : ' disabled') + ' aria-pressed="' + d + '" aria-label="' + (d ? 'Mark not complete: ' : 'Mark complete: ') + esc(m.title) + '">' + TICK + '</button>' +
          '<span class="mt">' + (i + 1) + '. ' + esc(m.title) + '</span><span class="mk">' + esc(KIND[m.kind] || m.kind) + ' &middot; ' + m.min + ' min</span></li>';
      }).join('') + '</ol>' + (live ? '' : '<p class="hint" style="padding:0 26px 18px">Add this course to your learning to track your progress.</p>') + '</section>' +
      '<section class="panel"><div class="panel-head"><h2>What you will learn</h2></div><div class="panel-body"><ul class="outcomes">' + c.outcomes.map(function (o) { return '<li>' + TICK + '<span>' + esc(o) + '</span></li>'; }).join('') + '</ul></div></section>' +
      '</div><aside class="side-col" aria-label="Course details">' + upNext(e, done) + details(e) + '</aside></div>';
    wire(e);
  }

  function wire(e) {
    var on = function (idv, fn) { var n = document.getElementById(idv); if (n) n.addEventListener('click', fn); };
    on('addBtn', function () { L.enrol(id, { mandatory: false }); L.toast('Added to your learning'); draw(); });
    on('removeBtn', function () { if (L.withdraw(id)) { L.toast('Removed from your learning'); draw(); } });
    on('certBtn', openCert);
    function toggle(mid, focusNext) {
      var before = entry().status;
      L.toggleModule(id, mid); draw();
      var again = (focusNext && main.querySelector('[data-next]')) || main.querySelector('[data-m="' + mid + '"]'); if (again) again.focus();
      if (before !== 'Completed' && entry().status === 'Completed') { L.toast('Course completed. Your certificate is ready.'); }
    }
    Array.prototype.forEach.call(main.querySelectorAll('[data-m]'), function (b) { b.addEventListener('click', function () { toggle(b.getAttribute('data-m'), false); }); });
    Array.prototype.forEach.call(main.querySelectorAll('[data-next]'), function (b) { b.addEventListener('click', function () { toggle(b.getAttribute('data-next'), true); }); });
  }

  // ---- certificate ----
  var overlay = document.getElementById('certOverlay'), opener = null;
  function openCert() {
    var e = entry(); if (!e || e.status !== 'Completed') return;
    document.getElementById('certPrint').innerHTML = '<div class="certificate"><div class="org">Learn4U by PearlFox</div><h3>Certificate of completion</h3><p>This certifies that</p>' +
      '<div class="who">' + esc(D.me.name) + '</div><p>has successfully completed</p><div class="course-name">' + esc(c.title) + '</div>' +
      '<p class="fine">' + esc(L.fmtMinutes(L.courseMinutes(c))) + ' of learning &middot; Completed ' + esc(L.fmtDate(e.item.completedAt)) + ' &middot; Certificate ' + esc(L.certNumber(e.item)) + '</p>' +
      '<p class="fine">Sample certificate for the PearlFox Learn4U preview.</p></div>';
    opener = document.activeElement; overlay.hidden = false; document.getElementById('certClose').focus();
  }
  function closeCert() { overlay.hidden = true; if (opener && opener.focus) opener.focus(); }
  ['certClose', 'certDone'].forEach(function (i) { document.getElementById(i).addEventListener('click', closeCert); });
  document.getElementById('certPrintBtn').addEventListener('click', function () { window.print(); });
  overlay.addEventListener('mousedown', function (ev) { if (ev.target === overlay) closeCert(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !overlay.hidden) closeCert(); });

  draw();
})();
