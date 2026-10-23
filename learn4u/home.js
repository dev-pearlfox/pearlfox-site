/* Learn4U - Home page: a hero for what to continue, the mandatory path, what is coming up, ideas, and the year so far. */
(function () {
  var L = window.L4U, D = L.D, esc = L.esc;
  L.shell('index.html');
  var TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';

  var now = new Date(), hour = now.getHours();
  document.getElementById('dateLine').textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  document.getElementById('greeting').textContent = (hour < 12 ? 'Good morning, ' : hour < 18 ? 'Good afternoon, ' : 'Good evening, ') + D.me.first + '.';
  var t = L.totals();
  document.getElementById('subline').textContent = t.overdue ? 'You have ' + L.plural(t.overdue, 'training', 'trainings') + ' overdue. Let us clear that first.'
    : t.soon ? L.plural(t.soon, 'training is', 'trainings are') + ' due this week.' : t.todo ? 'You are on track. ' + L.plural(t.todo, 'training', 'trainings') + ' to go.' : 'You are all caught up. Nice work.';

  var list = L.active().sort(L.byUrgency), open = list.filter(function (e) { return e.due !== 'done'; });

  // The hero: the course in progress that is closest to its due date; otherwise the first open one.
  var lead = open.filter(function (e) { return e.status === 'In progress'; })[0] || open[0];
  var hero = document.getElementById('hero');
  if (lead) {
    var c = lead.course, nextM = c.modules.filter(function (m) { return lead.item.done.indexOf(m.id) === -1; })[0], started = lead.status === 'In progress';
    hero.innerHTML = '<div class="hero ' + L.coverClass(c) + '"><span class="wm">' + L.coverIcon(c, 260) + '</span><div><span class="eyebrow">' + (started ? 'Continue where you left off' : 'Start here') + '</span>' +
      '<h2>' + esc(c.title) + '</h2><p>' + (nextM ? 'Next up: ' + esc(nextM.title) : 'Almost there.') + '</p>' +
      '<div class="chips"><span' + (lead.due === 'overdue' ? ' class="late"' : '') + '>' + esc(L.dueText(lead.item, c)) + '</span><span>' + (lead.item.mandatory ? 'Mandatory' : 'Optional') + '</span><span>' + esc(L.fmtMinutes(L.courseMinutes(c))) + '</span></div>' +
      '<a class="btn-white" href="course.html?id=' + esc(c.id) + '">' + (started ? 'Resume' : 'Start') + '</a></div>' +
      '<div>' + L.ring(lead.pct, 120, 'Progress in ' + c.title) + '</div></div>';
  } else {
    hero.innerHTML = '<div class="empty" style="margin-top:28px"><strong>Nothing to continue</strong>Pick something new from the <a href="catalog.html">course catalog</a>.</div>';
  }

  // The mandatory path: every mandatory training in due order. Done = green tick, late = red, the first open one is "now".
  var must = L.active().filter(function (e) { return e.item.mandatory; }).sort(function (a, b) { return a.item.due - b.item.due; }), nowSet = false;
  document.getElementById('path').innerHTML = must.length ? must.map(function (e, i) {
    var cls = e.status === 'Completed' ? 'done' : e.due === 'overdue' ? 'late' : (!nowSet && (nowSet = true)) ? 'now' : '';
    return '<li class="step ' + cls + '"><span class="node">' + (cls === 'done' ? TICK : e.due === 'overdue' ? '!' : (i + 1)) + '</span><a href="course.html?id=' + esc(e.course.id) + '">' + esc(e.course.title) + '</a><small>' + esc(L.dueText(e.item, e.course)) + '</small></li>';
  }).join('') : '<li class="step"><small>No mandatory trainings.</small></li>';

  // Coming up: the next open trainings after the hero, as cards with a cover.
  var next = open.filter(function (e) { return !lead || e.course.id !== lead.course.id; }).slice(0, 3);
  document.getElementById('due').innerHTML = next.length ? next.map(function (e) {
    var c = e.course;
    return '<article class="tcard"><div class="tc-cover ' + L.coverClass(c) + '">' + L.coverIcon(c, 34) + L.dueBadge(e) + '<span class="wm">' + L.coverIcon(c, 130) + '</span></div><div class="tc-body">' +
      '<span class="hint">' + esc(c.category) + '</span><h3><a href="course.html?id=' + esc(c.id) + '">' + esc(c.title) + '</a></h3>' +
      '<span class="hint">' + (e.item.mandatory ? 'Mandatory' : 'Optional') + ' &middot; ' + esc(L.fmtMinutes(L.courseMinutes(c))) + ' &middot; ' + e.pct + '% done</span>' +
      L.bar(e.pct, 'Progress in ' + c.title) + '<a class="btn-secondary btn-sm" style="justify-self:start;margin-top:6px" href="course.html?id=' + esc(c.id) + '">' + (e.status === 'In progress' ? 'Resume' : 'Start') + '</a></div></article>';
  }).join('') : '<div class="empty" style="grid-column:1/-1"><strong>You are all clear</strong>No other open trainings right now.</div>';

  // Worth exploring: popular courses the learner has not taken.
  var mine = {}; L.entries().forEach(function (e) { if (e.status !== 'Cancelled') mine[e.item.id] = 1; });
  var recs = D.courses.filter(function (c) { return !mine[c.id]; }).sort(function (a, b) { return (b.popular ? 1 : 0) - (a.popular ? 1 : 0); }).slice(0, 4);
  document.getElementById('recs').innerHTML = recs.length ? recs.map(function (c) {
    return '<a class="rec" href="course.html?id=' + esc(c.id) + '"><span class="tile ' + L.coverClass(c) + '">' + L.coverIcon(c, 24) + '</span><span><b>' + esc(c.title) + '</b><small>' + esc(c.category) + ' &middot; ' + esc(L.fmtMinutes(L.courseMinutes(c))) + '</small></span></a>';
  }).join('') : '<div class="empty" style="grid-column:1/-1">You have taken every course in the catalog.</div>';

  document.getElementById('goal').innerHTML =
    '<div class="ys"><b>' + t.mandatoryDone + ' / ' + t.mandatoryAll + '</b><span>mandatory done</span></div>' +
    '<div class="ys"><b>' + t.completedYear + '</b><span>completed this year</span></div>' +
    '<div class="ys"><b>' + esc(L.fmtMinutes(t.minutesYear)) + '</b><span>of learning this year</span></div>' +
    '<a class="btn-secondary" href="transcript.html">View my transcript</a>';
})();
