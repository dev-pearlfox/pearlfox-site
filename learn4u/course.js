/* Learn4U - one course: modules with Mark complete, progress, certificate, Remove, Copy as mail. */
(function () {
  var L = window.L4U, esc = L.esc, D = L.D;
  L.shell('');
  var main = document.getElementById('main'), id = L.urlParam('id'), c = L.course(id);
  var TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
  var KIND = { Video: 'Video', Reading: 'Reading', Quiz: 'Quiz', Workshop: 'Workshop' };

  if (!c) {
    document.title = 'Course not found - Learn4U';
    main.innerHTML = '<div class="panel"><div class="empty"><strong>Course not found</strong>This course number does not exist. <a href="catalog.html">Browse the catalog</a>.</div></div>';
    return;
  }
  document.title = c.title + ' - Learn4U';
  function entry() { return L.entries().filter(function (e) { return e.item.id === id; })[0] || null; }

  function side(e) {
    var rows;
    if (e && e.status !== 'Cancelled') {
      rows = [['Status', L.statusBadge(e.status)], ['Type', L.typeBadge(e.item)], ['Due', L.dueBadge(e)], ['Assigned by', esc(e.item.by)], ['Assigned', esc(L.fmtDate(e.item.assignedAt))]];
    } else rows = [['Status', e ? L.statusBadge('Cancelled') : '<span class="tag tag-opt">Not in my learning</span>']];
    rows.push(['Duration', esc(L.fmtMinutes(L.courseMinutes(c)))], ['Modules', String(c.modules.length)], ['Level', esc(c.level)], ['Owner', esc(c.owner)], ['Valid for', c.validMonths + ' months']);
    var html = '<section class="panel"><div class="panel-head"><h2>Details</h2></div><div class="panel-body">';
    if (e && e.status !== 'Cancelled') html += '<div style="margin-bottom:14px">' + L.bar(e.pct, 'Progress') + '<div class="hint" style="margin-top:4px">' + e.pct + '% complete</div></div>';
    html += '<dl class="kv">' + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl><div class="sidebtns">';
    if (!e || e.status === 'Cancelled') html += '<button type="button" class="btn-primary btn-block" id="addBtn">Add to my learning</button>';
    if (e && e.status === 'Completed') html += '<button type="button" class="btn-primary btn-block" id="certBtn">View certificate</button>';
    if (e && e.status !== 'Cancelled') html += '<button type="button" class="btn-secondary btn-block" id="copyMail" title="Copy this training as a mail, then paste it into a new mail">Copy as mail</button><button type="button" class="btn-ghost btn-block" id="copySubject">Copy subject only</button>';
    if (e && e.status !== 'Cancelled' && e.status !== 'Completed') html += e.item.mandatory ? '<p class="hint">Mandatory trainings cannot be removed.</p>' : '<button type="button" class="btn-danger btn-block" id="removeBtn">Remove from my learning</button>';
    return html + '</div><p class="copynote" id="copyNote" role="status"></p></div></section>';
  }

  function draw() {
    var e = entry(), live = e && e.status !== 'Cancelled', done = live ? e.item.done : [];
    main.innerHTML = '<div><div class="crumbs"><a href="catalog.html">Catalog</a> / ' + esc(c.category) + '</div></div>' +
      '<div class="course"><div style="display:grid;gap:20px;min-width:0">' +
      '<div><span class="kicker">' + esc(c.category) + '</span><h1>' + esc(c.title) + '</h1><p class="lead">' + esc(c.summary) + '</p></div>' +
      '<section class="panel"><div class="panel-head"><h2>What you will learn</h2></div><div class="panel-body"><ul class="outcomes">' + c.outcomes.map(function (o) { return '<li>' + TICK + '<span>' + esc(o) + '</span></li>'; }).join('') + '</ul></div></section>' +
      '<section class="panel"><div class="panel-head"><h2>Modules</h2><span class="hint">' + done.length + ' of ' + c.modules.length + ' done</span></div><ol class="modules">' +
      c.modules.map(function (m, i) {
        var d = done.indexOf(m.id) !== -1;
        return '<li class="' + (d ? 'done' : '') + '"><button type="button" class="tick" data-m="' + esc(m.id) + '"' + (live ? '' : ' disabled') + ' aria-pressed="' + d + '" aria-label="' + (d ? 'Mark not complete: ' : 'Mark complete: ') + esc(m.title) + '">' + TICK + '</button>' +
          '<span class="mt">' + (i + 1) + '. ' + esc(m.title) + '</span><span class="mk">' + esc(KIND[m.kind] || m.kind) + ' &middot; ' + m.min + ' min</span></li>';
      }).join('') + '</ol>' + (live ? '' : '<p class="hint" style="padding:0 18px 14px">Add this course to your learning to track your progress.</p>') + '</section></div>' +
      '<aside class="side" aria-label="Course details">' + side(e) + '</aside></div>';
    wire(e);
  }

  var noteTimer;
  function say(message) { var n = document.getElementById('copyNote'); if (n) { n.textContent = message; clearTimeout(noteTimer); noteTimer = setTimeout(function () { n.textContent = ''; }, 6000); } }
  function wire(e) {
    var on = function (idv, fn) { var n = document.getElementById(idv); if (n) n.addEventListener('click', fn); };
    on('addBtn', function () { L.enrol(id, { mandatory: false }); L.toast('Added to your learning'); draw(); });
    on('removeBtn', function () { if (L.withdraw(id)) { L.toast('Removed from your learning'); draw(); } });
    on('certBtn', openCert);
    on('copyMail', function () { window.L4U_MAIL.copyFor(entry(), 'mail').then(function (r) { say(r.ok ? 'Copied. Paste it into a new mail. Use "Copy subject only" for the subject line.' : 'The browser blocked copying. Allow clipboard access for this page.'); }); });
    on('copySubject', function () { window.L4U_MAIL.copyFor(entry(), 'subject').then(function (r) { say(r.ok ? 'Subject copied: ' + r.subject : 'The browser blocked copying. Allow clipboard access for this page.'); }); });
    Array.prototype.forEach.call(main.querySelectorAll('[data-m]'), function (b) {
      b.addEventListener('click', function () {
        var before = entry().status, mid = b.getAttribute('data-m');
        L.toggleModule(id, mid); draw();
        var again = main.querySelector('[data-m="' + mid + '"]'); if (again) again.focus();
        if (before !== 'Completed' && entry().status === 'Completed') { L.toast('Course completed. Your certificate is ready.'); }
      });
    });
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
