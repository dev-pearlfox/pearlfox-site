/* PearlFox Timesheet - the Reminder mails page: pick a week and a kind of mail, see it, copy it.
   The mail is what the Eagle View Time Sheet row reacts to (see mail-copy.js for the contract). */
(function () {
  var T = window.TS, M = window.TS_MAIL, esc = T.esc, main = document.getElementById('main');
  T.shell('mail');
  var weeks = T.allWeeks().filter(function (w) { return w.mon <= T.addDays(T.mondayOf(Date.now()), 7); });
  var selWeek = weeks.length ? weeks.filter(function (w) { return w.mon === T.mondayOf(Date.now()); })[0] || weeks[0] : null;
  var selKind = null;

  // The kind that fits the week as it stands now (what the real system would send).
  function defaultKind(w) {
    var st = w.sheet.status; if (st === 'Submitted') return 'submitted'; if (st === 'Approved') return 'approved'; if (st === 'Rejected') return 'rejected';
    return T.dueInfo(w.sheet, w.mon, Date.now()).state === 'late' ? 'overdue' : 'reminder';
  }
  function viewOf(w, kind) {
    var days = T.daysToDue(w.mon, Date.now()), d = function (ms) { return T.dotDate(ms); };
    return { kind: kind, name: T.D.user.name, id: T.D.user.id, manager: T.D.user.manager, week: T.weekNumber(w.mon), period: d(w.mon) + ' - ' + d(T.addDays(w.mon, 6)),
      status: w.sheet.status, hours: T.fmtH(T.sheetTotal(w.sheet)), target: T.fmtH(T.weekTarget()), dueDate: d(T.dueMs(w.mon)), days: days, comment: w.sheet.comment,
      url: M.weekUrl(w.key, location.href) };
  }
  function render() {
    if (!selWeek) { main.innerHTML = '<h1>Reminder mails</h1><div class="card empty">No weeks yet.</div>'; return; }
    if (!selKind) selKind = defaultKind(selWeek);
    var out = M.build(viewOf(selWeek, selKind));
    main.innerHTML = '<h1>Reminder mails</h1><div class="muted">The mail your company system would send. Copy one, send it to yourself, and the Eagle View Time Sheet row picks it up.</div>' +
      '<div class="mailgrid"><div class="card"><div class="field"><label for="wk">Week</label><select id="wk">' + weeks.map(function (w) {
        return '<option value="' + w.key + '"' + (w === selWeek ? ' selected' : '') + '>Week ' + T.weekNumber(w.mon) + ' - ' + esc(T.fmtDay(w.mon) + ' to ' + T.fmtDay(T.addDays(w.mon, 6))) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="kind">Kind of mail</label><select id="kind">' + M.KINDS.map(function (k) { return '<option value="' + k + '"' + (k === selKind ? ' selected' : '') + '>' + esc(M.KIND_NAMES[k]) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="from">From (set this in Eagle View)</label><input id="from" readonly value="timesheet@sample.example.org"></div>' +
      '<h2>How to test</h2><ol class="steps"><li>In Eagle View open Settings, then Time Sheet. Type the sender address and the subject start (Timesheet).</li><li>Copy the mail here, paste it into a new mail, and send it to yourself from that sender.</li><li>When it arrives, the Time Sheet row lights up.</li></ol></div>' +
      '<div class="card"><h2>Subject</h2><div class="subjectbox" id="subj">' + esc(out.subject) + '</div><div class="row2"><button type="button" class="btn pri" id="copyMail">Copy mail</button><button type="button" class="btn" id="copySubj">Copy subject</button></div>' +
      '<h2>Preview</h2><div class="mailframe">' + out.html + '</div></div></div>';
  }
  main.addEventListener('change', function (e) {
    if (e.target.id === 'wk') { selWeek = weeks.filter(function (w) { return w.key === e.target.value; })[0] || selWeek; selKind = null; render(); }
    else if (e.target.id === 'kind') { selKind = e.target.value; render(); }
  });
  main.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null; if (!b || !selWeek) return;
    var out = M.build(viewOf(selWeek, selKind));
    if (b.id === 'copyMail') window.TS_CLIP.copyRich(out.html, out.text).then(function (ok) { T.toast(ok ? 'Mail copied. Paste it into a new mail, and put the subject in the subject line' : 'Your browser blocked copying. Select the preview and copy it by hand'); });
    else if (b.id === 'copySubj') window.TS_CLIP.copyPlain(out.subject).then(function (ok) { T.toast(ok ? 'Subject copied' : 'Your browser blocked copying'); });
  });
  render();
})();
