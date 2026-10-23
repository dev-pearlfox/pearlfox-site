/* Learn4U - Transcript: a wall of certificates for the completed courses, with hours and the certificate number. */
(function () {
  var L = window.L4U, esc = L.esc;
  L.shell('transcript.html');
  var done = L.entries().filter(function (e) { return e.status === 'Completed'; }).sort(function (a, b) { return (b.item.completedAt || 0) - (a.item.completedAt || 0); });
  var minutes = done.reduce(function (t, e) { return t + L.courseMinutes(e.course); }, 0), t = L.totals();
  function stat(n, label) { return '<div class="ys"><b>' + n + '</b><span>' + label + '</span></div>'; }
  document.getElementById('cards').innerHTML = stat(done.length, 'courses completed') + stat(esc(L.fmtMinutes(minutes)), 'total learning time') + stat(t.mandatoryDone + ' / ' + t.mandatoryAll, 'mandatory completed');
  document.getElementById('none').hidden = done.length > 0;
  document.getElementById('rows').innerHTML = done.map(function (e) {
    var c = e.course;
    return '<article class="cert" data-id="' + esc(c.id) + '"><span class="seal">' + L.icon('transcript', 30) + '</span><span class="kicker">Certificate of completion</span>' +
      '<h3><a href="course.html?id=' + esc(c.id) + '" style="color:inherit;text-decoration:none">' + esc(c.title) + '</a></h3>' +
      '<span class="num">' + esc(L.certNumber(e.item)) + '</span>' +
      '<span class="meta">Completed ' + esc(L.fmtDate(e.item.completedAt)) + ' &middot; ' + esc(L.fmtMinutes(L.courseMinutes(c))) + '</span>' + L.typeBadge(e.item) +
      '<a class="btn-secondary btn-sm" href="course.html?id=' + esc(c.id) + '">View course</a></article>';
  }).join('');
})();
