/* PearlFox Learn4U - turns one training into a mail you can paste: a subject line plus a body.
   THIS IS THE CONTRACT with the Eagle View app (its Learn4U row reads exactly this mail):
     Subject  "Training: TRN4500102 - Data Privacy & GDPR - reminder, due in 4 days"   (starts "Training: TRN<digits>")
     Body     label cells ending in a colon, the value in the next cell:
              Assigned to / Type / Training Number (a link whose text is the number) / Course / Category / Duration /
              Status (Assigned, In progress, Completed or Cancelled) / Due Date (day.month.year) / Progress.
   The body is HTML with INLINE styles and plain tables only (mail programs ignore classes and modern CSS), plus a
   plain-text twin with the same lines. Pure: no page, no clipboard (see clipboard.js and course.js). */
(function () {
  var BRAND = '#C2410C', ORANGE = '#E8710A', TINT = '#FFF4EA', TEAL = '#0F766E', INK = '#101828', FAINT = '#667085', LINE = '#E4E7EC';
  var FONT = "font-family:'Segoe UI',Arial,Helvetica,sans-serif;";
  var PUBLIC_BASE = 'https://pearlfox.io/learn4u/course.html?id=';   // where the page lives once published

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  // The mail carries the due date as day.month.year, the format the Eagle View app reads.
  function dueDateText(ms) { var d = new Date(ms); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); }
  function plural(n) { return n + (n === 1 ? ' day' : ' days'); }

  // The link in the mail must be https (the app drops anything else). A page opened from a local address is not
  // reachable from outside anyway, so the address it will have once published is used instead.
  function courseUrl(id, pageUrl) {
    try { var u = new URL(String(pageUrl || '')); if (u.protocol === 'https:') { u.search = '?id=' + encodeURIComponent(id); u.hash = ''; return u.href; } } catch (e) { /* fall through */ }
    return PUBLIC_BASE + encodeURIComponent(id);
  }

  // 'removed' | 'completed' | 'overdue' | 'reminder' | 'progress' | 'assigned'
  function kindOf(view) {
    if (view.status === 'Cancelled') return 'removed';
    if (view.status === 'Completed') return 'completed';
    if (view.dueState === 'overdue') return 'overdue';
    if (view.dueState === 'soon') return 'reminder';
    return view.status === 'In progress' ? 'progress' : 'assigned';
  }
  function subjectTail(kind, view) {
    var d = view.days;
    if (kind === 'overdue') return 'overdue by ' + plural(-d);
    if (kind === 'reminder') return d === 0 ? 'reminder, due today' : 'reminder, due in ' + plural(d);
    return { removed: 'removed from your learning', completed: 'completed', progress: 'progress update', assigned: 'new training assigned' }[kind];
  }
  function intro(kind, view) {
    var d = view.days;
    return {
      assigned: 'A new training has been assigned to you. Please complete it by the due date.',
      progress: 'Your progress on this training has been updated.',
      reminder: d === 0 ? 'This training is due today.' : 'This training is due in ' + plural(d) + '. Please complete it in time.',
      overdue: 'This training is ' + plural(-d) + ' overdue. Please complete it as soon as possible.',
      completed: 'Congratulations, you have completed this training. Your certificate is in your transcript.',
      removed: 'This optional training was removed from your learning list. No further action is needed.'
    }[kind];
  }
  function latest(kind, view) {
    var done = view.doneModules, all = view.totalModules;
    if (kind === 'completed') return 'All ' + all + ' modules are complete.';
    if (kind === 'removed') return 'The training was removed at your request.';
    var line = done + ' of ' + all + ' modules completed.';
    return view.nextModule ? line + ' Next: ' + view.nextModule + '.' : line;
  }

  /**
   * view: { id, title, category, minutes, type, status, dueMs, dueState, days, pct, doneModules, totalModules,
   *         nextModule, learner, url, completedMs }
   * -> { subject, html, text, kind }
   */
  function build(view) {
    var kind = kindOf(view), link = courseUrl(view.id, view.url), due = dueDateText(view.dueMs);
    var subject = 'Training: ' + view.id + ' - ' + view.title + ' - ' + subjectTail(kind, view);
    var rows = [
      ['Assigned to', esc(view.learner)],
      ['Type', esc(view.type)],
      ['Training Number', '<a href="' + esc(link) + '" style="color:#2563eb;">' + esc(view.id) + '</a>'],
      ['Course', esc(view.title)],
      ['Category', esc(view.category)],
      ['Duration', esc(view.duration)],
      ['Status', esc(view.status)],
      ['Due Date', esc(due)],
      ['Progress', esc(view.pct + '%')]
    ];
    if (view.completedMs) rows.push(['Completed on', esc(dueDateText(view.completedMs))]);
    var labelCss = 'padding:6px 14px 6px 0;' + FONT + 'font-size:13px;color:' + FAINT + ';white-space:nowrap;vertical-align:top;';
    var valueCss = 'padding:6px 0;' + FONT + 'font-size:13px;color:' + INK + ';vertical-align:top;';
    var table = rows.map(function (r) { return '<tr><td style="' + labelCss + '"><b>' + r[0] + ':</b></td><td style="' + valueCss + '">' + r[1] + '</td></tr>'; }).join('');
    var note = latest(kind, view);
    var html =
      '<div style="' + FONT + 'color:' + INK + ';">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;max-width:640px;">' +
        // Dark text on a light band: still readable when a mail program drops the background colour.
        '<tr><td bgcolor="' + TINT + '" style="background-color:' + TINT + ';border-bottom:3px solid ' + ORANGE + ';padding:14px 18px;' + FONT + 'font-size:18px;font-weight:bold;color:' + INK + ';">' +
          'Learn4U <span style="font-weight:normal;font-size:13px;color:' + FAINT + ';">&nbsp;Training</span></td></tr>' +
        '<tr><td style="padding:16px 18px 6px 18px;' + FONT + 'font-size:14px;color:' + INK + ';">Hello ' + esc(view.first) + ',<br><br>' + esc(intro(kind, view)) + '</td></tr>' +
        '<tr><td style="padding:6px 18px;"><table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">' + table + '</table></td></tr>' +
        '<tr><td style="padding:10px 18px 4px 18px;' + FONT + 'font-size:13px;color:' + INK + ';border-left:3px solid ' + TEAL + ';">' +
          '<b>Latest update</b><br>' + esc(note) + '</td></tr>' +
        '<tr><td style="padding:16px 18px;"><a href="' + esc(link) + '" style="display:inline-block;background-color:' + BRAND + ';color:#ffffff;' + FONT + 'font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:6px;">Open training</a></td></tr>' +
        '<tr><td style="padding:0 18px 12px 18px;' + FONT + 'font-size:11px;color:' + FAINT + ';border-top:1px solid ' + LINE + ';padding-top:10px;">Preview mail from PearlFox Learn4U with sample data.</td></tr>' +
      '</table></div>';
    var lines = ['Hello ' + view.first + ',', '', intro(kind, view), '', 'Assigned to: ' + view.learner, 'Type: ' + view.type,
      'Training Number: ' + view.id + ' (' + link + ')', 'Course: ' + view.title, 'Category: ' + view.category, 'Duration: ' + view.duration,
      'Status: ' + view.status, 'Due Date: ' + due, 'Progress: ' + view.pct + '%'];
    if (view.completedMs) lines.push('Completed on: ' + dueDateText(view.completedMs));
    lines.push('', 'Latest update', note, '', 'Open training: ' + link);
    return { subject: subject, html: html, text: lines.join('\n'), kind: kind };
  }

  // Everything build() needs, from one entry of L4U.entries() (browser pages only; the rules live in common.js).
  function viewOf(entry, pageUrl, now) {
    var L = window.L4U, c = entry.course, item = entry.item;
    var next = c.modules.filter(function (m) { return item.done.indexOf(m.id) === -1; })[0];
    return {
      id: c.id, title: c.title, category: c.category, duration: L.fmtMinutes(L.courseMinutes(c)), type: item.mandatory ? 'Mandatory' : 'Optional',
      status: entry.status, dueMs: item.due, dueState: entry.due, days: L.daysUntil(item.due, now), pct: entry.pct, doneModules: item.done.length,
      totalModules: c.modules.length, nextModule: next ? next.title : '', learner: L.D.me.name, first: L.D.me.first, url: pageUrl,
      completedMs: entry.status === 'Completed' ? item.completedAt : null
    };
  }

  // Copy the mail (or just its subject) for one entry. Resolves { ok, subject }. Browser pages only.
  function copyFor(entry, what) {
    var mail = build(viewOf(entry, window.location.href, Date.now()));
    var done = what === 'subject' ? window.L4U_CLIP.copyPlain(mail.subject) : window.L4U_CLIP.copyRich(mail.html, mail.text);
    return done.then(function (ok) { return { ok: ok, subject: mail.subject }; });
  }

  window.L4U_MAIL = { build: build, viewOf: viewOf, copyFor: copyFor, courseUrl: courseUrl, dueDateText: dueDateText, kindOf: kindOf };
})();
