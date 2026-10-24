/* PearlFox Timesheet - the history page: every week at a glance, with a filter by status. A row opens that week. */
(function () {
  var T = window.TS, esc = T.esc, main = document.getElementById('main');
  T.shell('history');
  var filter = 'All';

  // Weeks worth listing: ones with hours or a decision, plus the current week. (Empty drafts of weeks nobody touched are noise.)
  function weeks() {
    var cur = T.mondayOf(Date.now());
    return T.allWeeks().filter(function (w) { return w.mon <= cur && (T.sheetTotal(w.sheet) > 0 || w.sheet.status !== 'Draft' || w.mon === cur); });
  }
  function tiles(list) {
    var now = new Date(), month = list.filter(function (w) { var d = new Date(w.mon); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    var hours = month.reduce(function (t, w) { return t + T.sheetTotal(w.sheet); }, 0);
    var count = function (st) { return list.filter(function (w) { return w.sheet.status === st; }).length; };
    // Needs attention: returned by the manager, or still a draft after its due day. Each week counts once.
    var attention = list.filter(function (w) { return w.sheet.status === 'Rejected' || (w.sheet.status === 'Draft' && T.dueInfo(w.sheet, w.mon, Date.now()).state === 'late'); }).length;
    var t = function (big, label) { return '<div class="card tile"><div class="big">' + big + '</div><div class="muted">' + label + '</div></div>'; };
    return '<div class="tiles">' + t(T.fmtH(hours) + ' <small>h</small>', 'Logged this month') + t(count('Approved'), 'Approved weeks') + t(count('Submitted'), 'Waiting for approval') + t(attention, 'Need your attention') + '</div>';
  }
  function row(w) {
    var due = T.dueInfo(w.sheet, w.mon, Date.now()), total = T.sheetTotal(w.sheet);
    var cm = w.sheet.status === 'Rejected' && w.sheet.comment ? esc(w.sheet.comment) : (due.state === 'late' && w.sheet.status === 'Draft' ? esc(T.dueText(due)) : '');
    return '<tr data-week="' + w.key + '" tabindex="0"><td><b>Week ' + T.weekNumber(w.mon) + '</b></td><td class="hide-s">' + esc(T.weekRange(w.mon)) + '</td><td class="num">' + T.fmtH(total) + ' / ' + T.fmtH(T.weekTarget()) + '</td>' +
      '<td><span class="pill ' + w.sheet.status + '">' + w.sheet.status + '</span></td><td class="hide-s">' + (w.sheet.submittedOn ? T.fmtDate(w.sheet.submittedOn) : '-') + '</td><td class="cm hide-s">' + cm + '</td></tr>';
  }
  function render() {
    var all = weeks(), shown = all.filter(function (w) { return filter === 'All' || w.sheet.status === filter; });
    var counts = { All: all.length }; T.STATUSES.forEach(function (s) { counts[s] = all.filter(function (w) { return w.sheet.status === s; }).length; });
    main.innerHTML = '<h1>History</h1><div class="muted">Every week you have worked on. Open a week to see its hours.</div>' + tiles(all) +
      '<div class="filters" role="group" aria-label="Filter by status">' + ['All'].concat(T.STATUSES).map(function (s) { return '<button type="button" data-f="' + s + '" class="' + (s === filter ? 'on' : '') + '" aria-pressed="' + (s === filter) + '">' + s + ' (' + counts[s] + ')</button>'; }).join('') + '</div>' +
      '<div class="card" style="overflow:auto"><table class="hist"><thead><tr><th>Week</th><th class="hide-s">Period</th><th>Hours</th><th>Status</th><th class="hide-s">Handed in</th><th class="hide-s">Comment</th></tr></thead><tbody>' +
      (shown.length ? shown.map(row).join('') : '<tr><td colspan="6" class="empty">No weeks with this status.</td></tr>') + '</tbody></table></div>';
  }
  main.addEventListener('click', function (e) {
    var f = e.target.closest && e.target.closest('[data-f]'); if (f) { filter = f.getAttribute('data-f'); render(); return; }
    var r = e.target.closest && e.target.closest('tr[data-week]'); if (r) location.href = 'index.html?week=' + r.getAttribute('data-week');
  });
  main.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.getAttribute && e.target.getAttribute('data-week')) location.href = 'index.html?week=' + e.target.getAttribute('data-week'); });
  render();
})();
