/* Learn4U - Home page. */
(function () {
  var L = window.L4U, D = L.D, esc = L.esc;
  L.shell('index.html');

  var hour = new Date().getHours();
  document.getElementById('greeting').textContent = (hour < 12 ? 'Good morning, ' : hour < 18 ? 'Good afternoon, ' : 'Good evening, ') + D.me.first;
  var t = L.totals();
  document.getElementById('subline').textContent = t.overdue ? 'You have ' + L.plural(t.overdue, 'training', 'trainings') + ' overdue. Let us clear that first.'
    : t.soon ? L.plural(t.soon, 'training is', 'trainings are') + ' due this week.' : t.todo ? 'You are on track. ' + L.plural(t.todo, 'training', 'trainings') + ' to go.' : 'You are all caught up. Nice work.';

  function card(cls, n, label, href) { return '<a class="stat ' + cls + '" href="' + href + '" style="text-decoration:none;color:inherit"><div class="n">' + n + '</div><div class="l">' + label + '</div></a>'; }
  document.getElementById('cards').innerHTML =
    card('s-todo', t.todo, 'To do', 'learning.html?tab=open') + card('s-soon', t.soon, 'Due this week', 'learning.html?tab=soon') +
    card('s-overdue', t.overdue, 'Overdue', 'learning.html?tab=overdue') + card('s-done', t.completedYear, 'Completed this year', 'transcript.html');

  var list = L.active().sort(L.byUrgency), open = list.filter(function (e) { return e.due !== 'done'; });

  // Continue learning: the course that is in progress and closest to its due date; otherwise the first open one.
  var inProg = open.filter(function (e) { return e.status === 'In progress'; })[0] || open[0];
  var box = document.getElementById('continueBox');
  if (inProg) {
    var c = inProg.course, nextM = c.modules.filter(function (m) { return inProg.item.done.indexOf(m.id) === -1; })[0];
    box.innerHTML = '<div class="panel-body continue"><div><div class="kicker">' + (inProg.status === 'In progress' ? 'Continue learning' : 'Start learning') + '</div><h3>' + esc(c.title) + '</h3>' +
      '<div class="meta">' + L.statusBadge(inProg.status) + L.typeBadge(inProg.item) + L.dueBadge(inProg) + '<span>' + esc(L.fmtMinutes(L.courseMinutes(c))) + '</span></div>' +
      '<div style="margin-top:12px;max-width:420px">' + L.bar(inProg.pct, 'Progress in ' + c.title) + '<div class="hint" style="margin-top:4px">' + inProg.pct + '% complete' + (nextM ? '. Next: ' + esc(nextM.title) : '') + '</div></div></div>' +
      '<a class="btn-primary" href="course.html?id=' + esc(c.id) + '">' + (inProg.status === 'In progress' ? 'Resume' : 'Start') + '</a></div>';
  } else {
    box.innerHTML = '<div class="empty"><strong>Nothing to continue</strong>Pick something new from the <a href="catalog.html">course catalog</a>.</div>';
  }

  var att = open.slice(0, 5);
  document.getElementById('attention').innerHTML = att.length ? att.map(function (e) {
    return '<li><div class="t"><a href="course.html?id=' + esc(e.course.id) + '">' + esc(e.course.title) + '</a><span>' + esc(e.course.category) + ' &middot; ' + (e.item.mandatory ? 'Mandatory' : 'Optional') + '</span></div>' + L.dueBadge(e) + '</li>';
  }).join('') : '<li><div class="empty" style="width:100%"><strong>You are all clear</strong>No open trainings right now.</div></li>';

  document.getElementById('goal').innerHTML =
    '<div><div class="big">' + t.mandatoryDone + '<span> of ' + t.mandatoryAll + ' mandatory done</span></div></div>' +
    L.bar(t.mandatoryAll ? Math.round(100 * t.mandatoryDone / t.mandatoryAll) : 0, 'Mandatory trainings completed') +
    '<div class="hint">' + t.completedYear + ' completed this year, ' + esc(L.fmtMinutes(t.minutesYear)) + ' of learning.</div><a class="btn-secondary btn-sm" href="transcript.html" style="justify-self:start">View transcript</a>';

  var mine = {}; L.entries().forEach(function (e) { if (e.status !== 'Cancelled') mine[e.item.id] = 1; });
  var recs = D.courses.filter(function (c) { return !mine[c.id]; }).sort(function (a, b) { return (b.popular ? 1 : 0) - (a.popular ? 1 : 0); }).slice(0, 4);
  document.getElementById('recs').innerHTML = recs.length ? recs.map(function (c) {
    return '<li><div class="t"><a href="course.html?id=' + esc(c.id) + '">' + esc(c.title) + '</a><span>' + esc(c.category) + ' &middot; ' + esc(L.fmtMinutes(L.courseMinutes(c))) + '</span></div><a class="btn-ghost btn-sm" href="course.html?id=' + esc(c.id) + '">View</a></li>';
  }).join('') : '<li><div class="empty" style="width:100%">You have taken every course in the catalog.</div></li>';
})();
