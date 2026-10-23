/* Learn4U - Transcript: completed courses, hours, certificate number, link to the certificate. */
(function () {
  var L = window.L4U, esc = L.esc;
  L.shell('transcript.html');
  var done = L.entries().filter(function (e) { return e.status === 'Completed'; }).sort(function (a, b) { return (b.item.completedAt || 0) - (a.item.completedAt || 0); });
  var minutes = done.reduce(function (t, e) { return t + L.courseMinutes(e.course); }, 0), t = L.totals();
  function card(cls, n, l) { return '<div class="stat ' + cls + '"><div class="n">' + n + '</div><div class="l">' + l + '</div></div>'; }
  document.getElementById('cards').innerHTML = card('s-done', done.length, 'Courses completed') + card('s-todo', esc(L.fmtMinutes(minutes)), 'Total learning time') + card('s-done', t.mandatoryDone + ' of ' + t.mandatoryAll, 'Mandatory completed');
  document.getElementById('none').hidden = done.length > 0;
  document.getElementById('rows').innerHTML = done.map(function (e) {
    return '<tr><td class="name"><a href="course.html?id=' + esc(e.course.id) + '">' + esc(e.course.title) + '</a><div class="sub">' + esc(e.course.id) + ' &middot; ' + esc(e.course.category) + ' ' + L.typeBadge(e.item) + '</div></td>' +
      '<td>' + esc(L.fmtDate(e.item.completedAt)) + '</td><td>' + esc(L.fmtMinutes(L.courseMinutes(e.course))) + '</td><td>' + esc(L.certNumber(e.item)) + '</td>' +
      '<td class="go"><a class="btn-secondary btn-sm" href="course.html?id=' + esc(e.course.id) + '">View</a></td></tr>';
  }).join('');
})();
