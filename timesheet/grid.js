/* PearlFox Timesheet - the week page: the hours grid, totals, and the submit / recall / approve flow.
   All rules live in common.js (window.TS); this file only draws the page and listens to it. */
(function () {
  var T = window.TS, D = T.D, esc = T.esc, main = document.getElementById('main');
  T.shell('week');

  var wanted = T.keyToMs(new URLSearchParams(location.search).get('week'));
  var mon = wanted || T.mondayOf(Date.now());
  var sheet = T.sheetFor(mon);
  var todayMs = T.midnight(Date.now());
  var AWAY = T.addDays(T.mondayOf(Date.now()), 7 * 8);          // the next 8 weeks can be opened; further ahead makes no sense
  var savedTimer = null;

  function dayMs(i) { return T.addDays(mon, i); }
  function isToday(i) { return dayMs(i) === todayMs; }
  function sameWeek(ms) { return ms === T.mondayOf(Date.now()); }
  function icon(d) { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; }
  function href(ms) { return 'index.html?week=' + T.weekKey(ms); }

  // ---------- what a day total looks like: green on target, amber short (once the day has passed), red over ----------
  function dayClass(i, total) {
    if (i > 4) return '';
    if (total > D.target) return 'over';
    if (total === D.target) return 'ok';
    return total < D.target && dayMs(i) < todayMs && total >= 0 ? 'under' : '';
  }
  function dayCells(tag, fn) { var out = ''; for (var i = 0; i < 7; i++) out += fn(i); return out; }

  // ---------- drawing ----------
  function headHtml() {
    var due = T.dueInfo(sheet, mon, Date.now());
    return '<div class="weekbar"><div class="nav">' +
      '<a class="iconbtn" id="prev" href="' + href(T.addDays(mon, -7)) + '" aria-label="Previous week">' + icon('M15 18l-6-6 6-6') + '</a>' +
      '<a class="iconbtn" id="next" href="' + href(T.addDays(mon, 7)) + '" aria-label="Next week"' + (T.addDays(mon, 7) > AWAY ? ' hidden' : '') + '>' + icon('M9 18l6-6-6-6') + '</a></div>' +
      '<div class="weektitle"><h1>Week ' + T.weekNumber(mon) + '</h1><small>' + esc(T.weekRange(mon)) + '</small></div>' +
      (sameWeek(mon) ? '' : '<a class="btn sm" id="thisweek" href="index.html">This week</a>') +
      '<div class="right"><span class="due ' + due.state + '" id="dueChip">' + esc(T.dueText(due)) + '</span><span class="pill ' + sheet.status + '" id="statusPill">' + sheet.status + '</span><span class="saved" id="saved" aria-live="polite"></span></div></div>';
  }
  function bannerHtml() {
    var lead = { Rejected: 'Returned by ' + esc(D.user.manager) + (sheet.decidedOn ? ' on ' + T.fmtDate(sheet.decidedOn) : '') + '.',
      Submitted: 'Waiting for ' + esc(D.user.manager) + ' to approve' + (sheet.submittedOn ? ' (handed in ' + T.fmtDate(sheet.submittedOn) + ')' : '') + '.',
      Approved: 'Approved by ' + esc(D.user.manager) + (sheet.decidedOn ? ' on ' + T.fmtDate(sheet.decidedOn) : '') + '. This week is closed.' }[sheet.status];
    if (!lead) return '';
    return '<div class="banner ' + sheet.status + '" role="status"><div><b>' + lead + '</b>' + (sheet.status === 'Rejected' && sheet.comment ? '<span>' + esc(sheet.comment) + ' Fix it below and submit again.</span>' : sheet.status === 'Submitted' ? '<span>The sheet is locked. Use Recall if you need to change something.</span>' : '') + '</div></div>';
  }
  function gridHtml() {
    var edit = T.canEdit(sheet);
    var head = '<tr><th class="task" scope="col">Project / task</th>' + dayCells('', function (i) {
      return '<th scope="col" class="' + (isToday(i) ? 'today ' : '') + (i > 4 ? 'wkend' : '') + '">' + T.DAYS[i] + '<small>' + T.fmtDay(dayMs(i)) + '</small></th>';
    }) + '<th scope="col" style="width:72px">Total</th></tr>';
    var body = sheet.rows.map(function (r, ri) {
      var p = T.project(r.code) || { name: r.code };
      return '<tr><th class="task" scope="row"><div class="rowname"><div class="pc"><b>' + esc(r.code) + '<span class="pn"> &middot; ' + esc(p.name) + '</span></b><span class="t">' + esc(r.task) + '</span></div>' +
        (edit ? '<button type="button" class="rm" data-rm="' + ri + '" aria-label="Remove ' + esc(r.code + ' ' + r.task) + '" title="Remove this row">&times;</button>' : '') + '</div></th>' +
        dayCells('', function (i) {
          var v = r.h[i];
          return '<td class="cell ' + (isToday(i) ? 'today ' : '') + (i > 4 ? 'wkend' : '') + '"><input class="hr' + (v ? ' has' : '') + '" inputmode="decimal" autocomplete="off" placeholder="-" data-r="' + ri + '" data-d="' + i + '"' +
            (edit ? '' : ' disabled') + ' value="' + (v ? T.fmtH(v) : '') + '" aria-label="' + esc(r.code + ' ' + r.task + ', ' + T.DAYS[i] + ' ' + T.fmtDay(dayMs(i))) + '"></td>';
        }) + '<td class="rtot" data-rt="' + ri + '">' + T.fmtH(T.rowTotal(r)) + '</td></tr>';
    }).join('');
    if (!sheet.rows.length) body = '<tr><td colspan="9"><div class="empty">No rows yet. Pick a project and task below, or copy last week\'s rows.</div></td></tr>';
    var foot = '<tr><th scope="row">Daily total</th>' + dayCells('', function (i) { return '<td class="dtot" data-dt="' + i + '"></td>'; }) + '<td id="grand"></td></tr>' +
      '<tr><th scope="row">Expected</th>' + dayCells('', function (i) { return '<td>' + (T.expected(i) ? T.fmtH(T.expected(i)) : '-') + '</td>'; }) + '<td>' + T.fmtH(T.weekTarget()) + '</td></tr>';
    return '<div class="scroller"><table class="grid"><thead>' + head + '</thead><tbody>' + body + '</tbody><tfoot>' + foot + '</tfoot></table></div>';
  }
  function addRowHtml() {
    if (!T.canEdit(sheet)) return '';
    var opts = D.projects.map(function (p) {
      return '<optgroup label="' + esc(p.code + ' - ' + p.name) + '">' + p.tasks.map(function (t) { return '<option value="' + esc(p.code + '|' + t) + '">' + esc(t) + '</option>'; }).join('') + '</optgroup>';
    }).join('');
    return '<div class="addrow"><select id="pick" aria-label="Project and task">' + opts + '</select><button type="button" class="btn sm" id="addBtn">Add row</button>' +
      '<button type="button" class="btn sm" id="copyBtn" title="Adds last week\'s rows with empty hours">Copy last week\'s rows</button></div>';
  }
  function sideTopHtml() {
    var total = T.sheetTotal(sheet), target = T.weekTarget(), pct = Math.min(100, Math.round(total / target * 100));
    var cls = total > target ? 'over' : total >= target ? 'full' : '';
    var note = total > target ? T.fmtH(total - target) + ' h over the expected ' + T.fmtH(target) + ' h' : total === target ? 'Target reached' : T.fmtH(target - total) + ' h to go';
    var by = T.byProject(sheet);
    return '<div class="card"><h2>Hours this week</h2><div class="big">' + T.fmtH(total) + ' <small>/ ' + T.fmtH(target) + ' h</small></div>' +
      '<div class="meter ' + cls + '" role="img" aria-label="' + pct + ' percent of the expected hours"><i style="width:' + pct + '%"></i></div><div class="muted">' + note + '</div></div>' +
      '<div class="card"><h2>By project</h2>' + (by.length ? by.map(function (b) {
        return '<div class="proj"><span>' + esc(b.code) + ' <span class="muted">' + esc(b.name) + '</span></span><b>' + T.fmtH(b.hours) + ' h</b><span class="bar2"><i style="width:' + Math.round(b.hours / total * 100) + '%"></i></span></div>';
      }).join('') : '<div class="muted">Nothing logged yet.</div>') + '</div>';
  }
  function actionsHtml() {
    var s = sheet.status, out = '';
    if (s === 'Draft' || s === 'Rejected') out = '<button type="button" class="btn pri" id="submitBtn">' + (s === 'Rejected' ? 'Submit again' : 'Submit for approval') + '</button>';
    else if (s === 'Submitted') out = '<button type="button" class="btn" id="recallBtn">Recall to edit</button>';
    else out = '<div class="muted">Approved sheets cannot be changed.</div>';
    var demo = s === 'Submitted' ? '<div class="card demo"><h2>Test the manager</h2><p>There is no real manager in this preview. These buttons play ' + esc(D.user.manager) + '\'s answer.</p><div class="two"><button type="button" class="btn sm" id="approveBtn">Approve</button><button type="button" class="btn sm bad" id="rejectBtn">Reject</button></div></div>' : '';
    return '<div class="card actions-card"><h2>Hand in</h2><div class="actions">' + out + '</div></div>' + demo;
  }
  function render() {
    main.innerHTML = headHtml() + bannerHtml() + '<div class="layout"><div class="card sheet">' + gridHtml() + addRowHtml() + '</div>' +
      '<aside class="side"><div id="sideTop" style="display:contents">' + sideTopHtml() + '</div><div class="card notes-card"><h2>Note for ' + esc(D.user.manager.split(' ')[0]) + '</h2>' +
      '<textarea class="note" id="note" placeholder="Anything your manager should know"' + (T.canEdit(sheet) ? '' : ' disabled') + '>' + esc(sheet.note) + '</textarea></div>' + actionsHtml() + '</aside></div>';
    paintTotals();
  }

  // ---------- totals update in place, so typing never loses the cursor ----------
  function paintTotals() {
    sheet.rows.forEach(function (r, ri) { var c = main.querySelector('[data-rt="' + ri + '"]'); if (c) c.textContent = T.fmtH(T.rowTotal(r)); });
    for (var i = 0; i < 7; i++) {
      var c = main.querySelector('[data-dt="' + i + '"]'), t = T.dayTotal(sheet, i);
      if (c) { c.textContent = t ? T.fmtH(t) : (i > 4 ? '-' : '0'); c.className = 'dtot ' + dayClass(i, t); }
    }
    var g = document.getElementById('grand'); if (g) g.textContent = T.fmtH(T.sheetTotal(sheet));
    var top = document.getElementById('sideTop'); if (top) top.innerHTML = sideTopHtml();
  }
  function saved(text) {
    T.save(); var s = document.getElementById('saved'); if (!s) return;
    s.textContent = text || 'Saved'; clearTimeout(savedTimer); savedTimer = setTimeout(function () { s.textContent = ''; }, 1800);
  }

  // ---------- a small question box (a real dialog, or the browser's own when dialogs are missing) ----------
  function ask(o) {
    return new Promise(function (resolve) {
      var dlg = document.createElement('dialog');
      if (!dlg.showModal) { resolve({ ok: window.confirm(o.title + '\n' + o.text), note: '' }); return; }
      dlg.innerHTML = '<h3>' + esc(o.title) + '</h3><p>' + esc(o.text) + '</p>' + (o.note ? '<textarea id="dlgNote" placeholder="' + esc(o.note) + '"></textarea>' : '') +
        '<div class="two"><button type="button" class="btn" data-a="no">Cancel</button><button type="button" class="btn ' + (o.bad ? 'bad' : 'pri') + '" data-a="yes">' + esc(o.ok) + '</button></div>';
      document.body.appendChild(dlg);
      var done = function (v) { var n = dlg.querySelector('#dlgNote'); var note = n ? n.value : ''; dlg.close(); dlg.remove(); resolve({ ok: v, note: note }); };
      dlg.addEventListener('click', function (e) { var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (a) done(a === 'yes'); });
      dlg.addEventListener('cancel', function (e) { e.preventDefault(); done(false); });
      dlg.showModal();
    });
  }

  // ---------- events ----------
  main.addEventListener('input', function (e) {
    var el = e.target;
    if (el.classList && el.classList.contains('hr')) {
      if (!T.setHours(sheet, +el.dataset.r, +el.dataset.d, el.value)) return;
      el.classList.toggle('has', sheet.rows[+el.dataset.r].h[+el.dataset.d] > 0);
      paintTotals(); saved();
    } else if (el.id === 'note') { sheet.note = el.value; saved(); }
  });
  main.addEventListener('change', function (e) {      // when the box is left, show the number the way it was understood ("7,3" becomes "7.25")
    var el = e.target; if (!el.classList || !el.classList.contains('hr')) return;
    var v = sheet.rows[+el.dataset.r].h[+el.dataset.d]; el.value = v ? T.fmtH(v) : '';
  });
  main.addEventListener('keydown', function (e) {
    var el = e.target; if (!el.classList || !el.classList.contains('hr')) return;
    var dr = e.key === 'Enter' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!dr) return;
    var next = main.querySelector('.hr[data-r="' + (+el.dataset.r + dr) + '"][data-d="' + el.dataset.d + '"]');
    e.preventDefault(); if (next) { next.focus(); next.select(); }
  });
  main.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
    if (t.hasAttribute('data-rm')) { if (T.removeRow(sheet, +t.getAttribute('data-rm'))) { T.save(); render(); } return; }
    if (t.id === 'addBtn') {
      var parts = document.getElementById('pick').value.split('|');
      if (T.addRow(sheet, parts[0], parts[1])) { T.save(); render(); } else T.toast('That row is already on the sheet');
    } else if (t.id === 'copyBtn') {
      var n = T.copyRows(sheet, T.load().weeks[T.weekKey(T.addDays(mon, -7))]);
      if (n) { T.save(); render(); T.toast(T.plural(n, 'row', 'rows') + ' copied, hours left empty'); } else T.toast('Nothing new to copy from last week');
    } else if (t.id === 'submitBtn') submitFlow();
    else if (t.id === 'recallBtn') { T.recall(sheet); T.save(); render(); T.toast('Recalled. You can edit again'); }
    else if (t.id === 'approveBtn') { T.decide(sheet, true, '', Date.now()); T.save(); render(); T.toast('Approved'); }
    else if (t.id === 'rejectBtn') {
      ask({ title: 'Return this timesheet?', text: 'Write what needs to change. It goes back to ' + D.user.name.split(' ')[0] + '.', note: 'Comment for the employee', ok: 'Return it', bad: true }).then(function (r) {
        if (!r.ok) return; T.decide(sheet, false, r.note || 'Please check the hours and submit again.', Date.now()); T.save(); render(); T.toast('Returned with your comment');
      });
    }
  });
  function submitFlow() {
    var total = T.sheetTotal(sheet), target = T.weekTarget();
    if (total <= 0) { T.toast('Add some hours before you submit'); return; }
    var go = function () { var r = T.submit(sheet, Date.now()); if (r.ok) { T.save(); render(); T.toast('Submitted to ' + D.user.manager); } };
    if (total < target) ask({ title: 'Hand in with fewer hours?', text: 'You logged ' + T.fmtH(total) + ' of the expected ' + T.fmtH(target) + ' hours.', ok: 'Submit anyway' }).then(function (r) { if (r.ok) go(); });
    else go();
  }

  render();
})();
