/* PearlFox Service Desk - ticket page: header, progress bar, full status history, comments, details.
   Opened with ticket.html?id=INC... Sample data only. */
(function () {
  var S = window.SD, esc = S.esc;
  S.renderChrome();
  var main = document.getElementById('main');

  var id = new URLSearchParams(window.location.search).get('id') || '';
  var inc = S.findIncident(id);

  if (!inc) {
    document.title = 'Incident not found - PearlFox Service Desk';
    main.innerHTML = '<div class="notfound"><h1>Incident not found</h1><p class="muted">There is no incident ' +
      (id ? '"' + esc(id) + '"' : 'with that number') + ' assigned to you.</p><p><a href="index.html">Back to my incidents</a></p></div>';
    return;
  }

  // Recomputed on every render: a status change, reassignment or comment redraws the whole page.
  var history, current, due;
  document.title = inc.id + ' - PearlFox Service Desk';

  function initials(name) { return String(name).split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase(); }

  // Progress bar. Steps reached are "done", the current one is highlighted, steps never visited are dashed.
  // A cancelled ticket shows the steps it reached and ends in a red Cancelled step.
  function stepper() {
    var visited = {};
    history.forEach(function (h) { visited[h.status] = h; });
    var steps = S.FLOW.slice();
    if (current === 'Cancelled') steps = S.FLOW.filter(function (s) { return visited[s]; }).concat(['Cancelled']);
    var curIdx = steps.indexOf(current);
    return '<ol class="stepper" aria-label="Progress">' + steps.map(function (s, i) {
      var cls = s === 'Cancelled' ? 'cancelled' : i < curIdx ? 'done' : i === curIdx ? 'current' : '';
      // Before the current step: reached = done, never reached (for example On hold) = dashed.
      if (i < curIdx && !visited[s]) cls = 'skipped';
      var when = visited[s] ? '<small>' + S.fmtDate(visited[s].at) + '</small>' : '<small>&nbsp;</small>';
      return '<li class="' + cls + '"' + (i === curIdx ? ' aria-current="step"' : '') + '>' + esc(s) + when + '</li>';
    }).join('') + '</ol>';
  }

  function historyTable() {
    var rows = history.slice().reverse().map(function (h, i) {
      var isNow = i === 0;
      return '<tr' + (isNow ? ' class="now"' : '') + '>' +
        '<td><span class="chip ' + S.statusClass(h.status) + '">' + esc(h.status) + '</span>' +
        (h.from ? '<span class="note">from ' + esc(h.from) + '</span>' : '<span class="note">Incident opened</span>') + '</td>' +
        '<td>' + S.fmtDateTime(h.at) + '</td>' +
        '<td>' + esc(h.by) + (h.note ? '<span class="note">' + esc(h.note) + '</span>' : '') + '</td>' +
        // A finished status is where the ticket stopped: counting the time since then up to today would mislead.
        '<td>' + (isNow && S.isFinished(h.status) ? '<span class="muted">Final status</span>' : S.fmtDuration(h.spentMs) + (isNow ? '<span class="note">so far</span>' : '')) + '</td></tr>';
    }).join('');
    return '<div class="history-scroll"><table class="history"><thead><tr><th scope="col">Status</th><th scope="col">Changed</th>' +
      '<th scope="col">By</th><th scope="col">Time in status</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function commentForm() {
    return '<form class="update-form comment-form" id="commentForm" novalidate>' +
      '<label class="field-label" for="commentText">Add a comment</label>' +
      '<textarea id="commentText" rows="3" maxlength="1000" placeholder="Write a comment"></textarea>' +
      '<div class="form-row"><button type="submit" class="btn">Add comment</button><span class="form-note" id="commentNote" role="status" aria-live="polite"></span></div></form>';
  }

  function statusForm() {
    var others = S.STATUSES.filter(function (s) { return s !== current; });
    var people = S.data.assignees.filter(function (n) { return n !== inc.assignedTo; });
    var levels = S.data.priorities.filter(function (p) { return p !== inc.priority; });
    return '<form class="update-form" id="statusForm" novalidate>' +
        '<label class="field-label" for="statusSelect">Change status</label>' +
        '<select id="statusSelect"><option value="">Choose a status</option>' + others.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '</select>' +
        '<label class="field-label" for="statusNote">Note (optional)</label>' +
        '<input id="statusNote" type="text" maxlength="500" placeholder="Why is it changing?">' +
        '<div class="form-row"><button type="submit" class="btn-primary">Update status</button><span class="form-note" id="statusFormNote" role="status" aria-live="polite"></span></div></form>' +
      '<form class="update-form" id="priorityForm" novalidate>' +
        '<label class="field-label" for="prioritySelect">Change priority</label>' +
        '<select id="prioritySelect"><option value="">Choose a priority</option>' + levels.map(function (p) { return '<option>' + esc(p) + '</option>'; }).join('') + '</select>' +
        '<div class="form-row"><button type="submit" class="btn">Change priority</button><span class="form-note" id="priorityNote" role="status" aria-live="polite"></span></div></form>' +
      '<form class="update-form" id="endDateForm" novalidate>' +
        '<label class="field-label" for="endDateInput">Change end date</label>' +
        '<input id="endDateInput" type="date" min="2020-01-01" max="2099-12-31" value="' + esc(S.toDateInput(inc.endDate)) + '">' +
        '<div class="form-row"><button type="submit" class="btn">Change end date</button><span class="form-note" id="endDateNote" role="status" aria-live="polite"></span></div></form>' +
      '<form class="update-form" id="assignForm" novalidate>' +
        '<label class="field-label" for="assignSelect">Reassign to</label>' +
        '<select id="assignSelect"><option value="">Choose a person</option>' + people.map(function (n) { return '<option>' + esc(n) + '</option>'; }).join('') + '</select>' +
        '<div class="form-row"><button type="submit" class="btn">Reassign</button><span class="form-note" id="assignNote" role="status" aria-live="polite"></span></div></form>';
  }

  function commentList() {
    var list = S.comments(inc).reverse();
    if (!list.length) return '<div class="body muted">No comments yet.</div>';
    return list.map(function (c) {
      return '<div class="comment"><div class="avatar" aria-hidden="true">' + esc(initials(c.by)) + '</div><div>' +
        '<span class="who">' + esc(c.by) + '</span><span class="when">' + S.fmtDateTime(c.at) + '</span><p>' + esc(c.text) + '</p></div></div>';
    }).join('');
  }

  function detail(label, value) { return '<div><dt>' + label + '</dt><dd>' + value + '</dd></div>'; }

  // ---- Copy as mail. The mail is built by mail-copy.js; this part only talks to the clipboard.
  var ENVELOPE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>';
  function legacyCopy(node) {
    // Older route: put the content on the page (off screen, not display:none, which cannot be selected), select it, copy.
    document.body.appendChild(node);
    var range = document.createRange(); range.selectNodeContents(node);
    var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    var done = false; try { done = document.execCommand('copy'); } catch (e) { done = false; }
    sel.removeAllRanges(); document.body.removeChild(node);
    return done;
  }
  function offscreen(tag) { var n = document.createElement(tag); n.setAttribute('aria-hidden', 'true'); n.style.cssText = 'position:fixed;left:-9999px;top:0;'; return n; }
  // Resolves true or false. Rich (html plus text) when the browser allows it, otherwise the older route.
  function copyRich(html, text) {
    var viaOldRoute = function () { var n = offscreen('div'); n.innerHTML = html; return legacyCopy(n); };
    if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
      var item = new window.ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) });
      return navigator.clipboard.write([item]).then(function () { return true; }, function () { return viaOldRoute(); });
    }
    return Promise.resolve(viaOldRoute());
  }
  function copyPlain(text) {
    var viaOldRoute = function () { var n = offscreen('textarea'); n.value = text; document.body.appendChild(n); n.select(); var d = false; try { d = document.execCommand('copy'); } catch (e) { d = false; } document.body.removeChild(n); return d; };
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return viaOldRoute(); });
    return Promise.resolve(viaOldRoute());
  }
  function mailView() {
    return { inc: inc, status: S.currentStatus(inc), history: S.statusHistory(inc), comments: S.comments(inc).reverse(), url: window.location.href };
  }
  var noteTimer;
  function say(button, label, message) {
    var note = document.getElementById('copyNote'), text = button.querySelector('.lbl');
    if (note) note.textContent = message;
    if (text) { var old = text.getAttribute('data-label'); text.textContent = label; clearTimeout(noteTimer); noteTimer = setTimeout(function () { text.textContent = old; if (note) note.textContent = ''; }, 3500); }
  }
  function wireMailButtons() {
    // A real link whose href already holds the whole mail (like the Peakon page), refilled on every redraw so it follows the status.
    document.getElementById('mailOpen').href = window.SD_MAIL.mailtoUrl(window.SD_MAIL.build(mailView()));
    var mailBtn = document.getElementById('copyMail'), subjectBtn = document.getElementById('copySubject');
    mailBtn.addEventListener('click', function () {
      var mail = window.SD_MAIL.build(mailView());           // built first, inside the click, so the browser allows the copy
      copyRich(mail.html, mail.text).then(function (done) {
        say(mailBtn, done ? 'Copied' : 'Not copied', done ? 'Copied. Paste it into a new mail. Use Copy subject for the subject line.' : 'The browser blocked copying. Allow clipboard access for this page and try again.');
      });
    });
    subjectBtn.addEventListener('click', function () {
      var mail = window.SD_MAIL.build(mailView());
      copyPlain(mail.subject).then(function (done) {
        say(subjectBtn, done ? 'Copied' : 'Not copied', done ? 'Subject copied: ' + mail.subject : 'The browser blocked copying. Allow clipboard access for this page and try again.');
      });
    });
  }

  function render(flash) {
    history = S.statusHistory(inc); current = S.currentStatus(inc); due = S.dueState(inc);
    var scroll = window.scrollY;
    main.innerHTML =
      '<div class="crumbs"><a href="index.html">My incidents</a> / ' + esc(inc.id) + '</div>' +
      '<div class="ticket-head"><div class="head-row"><div><div class="id">' + esc(inc.id) + '</div><h1>' + esc(inc.short) + '</h1></div>' +
      '<div class="mail-actions"><button type="button" class="btn-primary" id="copyMail" title="Copy this incident as a mail, then paste it into a new mail">' + ENVELOPE +
      '<span class="lbl" data-label="Copy as mail">Copy as mail</span></button>' +
      '<button type="button" class="btn" id="copySubject" title="Copy the subject line"><span class="lbl" data-label="Copy subject">Copy subject</span></button>' +
      '<a class="btn" id="mailOpen" href="mailto:" title="Open a new mail with this incident, subject and body filled in">' + ENVELOPE + '<span>New mail</span></a>' +
      '<span class="copy-note" id="copyNote" role="status" aria-live="polite"></span></div></div>' +
      '<div class="chips"><span class="chip ' + S.priorityClass(inc.priority) + '">' + esc(inc.priority) + '</span>' +
      '<span class="chip ' + S.statusClass(current) + '">' + esc(current) + '</span>' +
      '<span class="muted">Opened ' + S.fmtDateTime(inc.openedAt) + ' by ' + esc(inc.openedBy) + '</span></div></div>' +
      '<div class="layout"><div class="stack">' +
        '<section class="panel" aria-label="Progress">' + stepper() + '</section>' +
        '<section class="panel"><h2>Description</h2><div class="body"><p class="desc">' + esc(inc.description) + '</p></div></section>' +
        '<section class="panel"><h2>Status history</h2>' + historyTable() + '</section>' +
        '<section class="panel"><h2>Comments (' + S.comments(inc).length + ')</h2>' + commentForm() + commentList() + '</section>' +
      '</div><aside class="stack">' +
        '<section class="panel"><h2>Update incident</h2><div class="body update">' + statusForm() + '</div></section>' +
        '<section class="panel"><h2>End date</h2><div class="due-box ' + due + '"><b>' + S.fmtDate(inc.endDate) + '</b><div class="muted">' + esc(S.dueText(inc)) + '</div></div></section>' +
        '<section class="panel"><h2>Details</h2><dl class="details">' +
          detail('Assigned to', esc(inc.assignedTo)) + detail('Assignment group', esc(inc.group)) + detail('Opened by', esc(inc.openedBy)) +
          detail('Priority', esc(inc.priority)) + detail('Status', esc(current)) + detail('Category', esc(inc.category)) +
          detail('Subcategory', esc(inc.subcategory)) + detail('Configuration item', esc(inc.ci)) + detail('Case reference', esc(inc.caseRef)) +
        '</dl></section>' +
      '</aside></div>';
    wireMailButtons();
    wireUpdateForms();
    if (flash) { window.scrollTo(0, scroll); showFlash(flash); }       // a redraw after a change keeps your place
  }

  // ---- Status, reassign and comment. The rules live in common.js; this part reads the form and redraws.
  function showFlash(flash) {
    var note = document.getElementById(flash.target);
    if (note) { note.textContent = flash.text; note.className = 'form-note ' + (flash.ok ? 'ok' : 'bad'); }
    var field = document.getElementById(flash.focus);
    if (field) field.focus();
  }
  function submit(formId, run, target, focus) {
    document.getElementById(formId).addEventListener('submit', function (e) {
      e.preventDefault();
      var result = run();
      if (!result.ok) { showFlash({ target: target, text: result.error, ok: false, focus: focus }); return; }
      var suffix = result.persisted ? '' : ' This browser would not keep it, so it is gone on reload.';
      render({ target: target, text: result.text + suffix, ok: result.persisted, focus: focus });
    });
  }
  function wireUpdateForms() {
    var me = S.data.me.name;
    submit('statusForm', function () {
      var to = document.getElementById('statusSelect').value, r = S.changeStatus(inc, to, me, document.getElementById('statusNote').value);
      if (r.ok) r.text = 'Status changed to ' + to + '.';
      return r;
    }, 'statusFormNote', 'statusSelect');
    submit('priorityForm', function () {
      var to = document.getElementById('prioritySelect').value, r = S.changePriority(inc, to, me);
      if (r.ok) r.text = 'Priority changed to ' + to + '.';
      return r;
    }, 'priorityNote', 'prioritySelect');
    submit('endDateForm', function () {
      var r = S.changeEndDate(inc, document.getElementById('endDateInput').value, me);
      if (r.ok) r.text = 'End date changed to ' + S.fmtDate(inc.endDate) + '.';
      return r;
    }, 'endDateNote', 'endDateInput');
    submit('assignForm', function () {
      var to = document.getElementById('assignSelect').value, r = S.reassign(inc, to, me);
      if (r.ok) r.text = 'Reassigned to ' + to + '.';
      return r;
    }, 'assignNote', 'assignSelect');
    submit('commentForm', function () {
      var r = S.addComment(inc, document.getElementById('commentText').value, me);
      if (r.ok) r.text = 'Comment added.';
      return r;
    }, 'commentNote', 'commentText');
  }

  render();
})();
