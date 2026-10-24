/* PearlFox Timesheet - turns one week into a mail you can paste: a subject line plus a body.
   THIS IS THE CONTRACT with the Eagle View app's Time Sheet row. The app only looks at two things:
     the sender address, and the START of the subject (the "Subject" box in Eagle View > Settings > Time Sheet).
   So every subject starts with the word "Timesheet":
     "Timesheet: Week 43 (19.10.2026 - 25.10.2026) - reminder, due today"
   The body is for people: HTML with INLINE styles and plain tables only (mail programs ignore classes and modern CSS),
   plus a plain-text twin with the same lines. Pure: no page, no clipboard (see clipboard.js and mail.js). */
(function () {
  var INK = '#0F172A', FAINT = '#556274', LINE = '#E2E8F0', BAR = '#1E1B4B', ACC = '#4F46E5', TINT = '#EEF2FF';
  var FONT = "font-family:'Segoe UI',Arial,Helvetica,sans-serif;";
  var PUBLIC_BASE = 'https://pearlfox.io/timesheet/index.html?week=';   // where the page lives once published
  var KINDS = ['reminder', 'overdue', 'submitted', 'approved', 'rejected'];
  var KIND_NAMES = { reminder: 'Reminder to submit', overdue: 'Overdue reminder', submitted: 'Submitted (confirmation)', approved: 'Approved', rejected: 'Returned for changes' };
  var HEADLINES = {
    reminder: 'Your timesheet is due soon', overdue: 'Your timesheet is overdue', submitted: 'Your timesheet was handed in',
    approved: 'Your timesheet was approved', rejected: 'Your timesheet was returned'
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plural(n) { return n + (n === 1 ? ' day' : ' days'); }

  // The link in the mail must be https. A page opened from a local address cannot be reached from outside,
  // so the address it will have once published is used instead.
  function weekUrl(weekKey, pageUrl) {
    try { var u = new URL(String(pageUrl || '')); if (u.protocol === 'https:') { u.search = '?week=' + encodeURIComponent(weekKey); u.hash = ''; u.pathname = u.pathname.replace(/[^/]*$/, 'index.html'); return u.href; } } catch (e) { /* fall through */ }
    return PUBLIC_BASE + encodeURIComponent(weekKey);
  }
  function tail(kind, v) {
    if (kind === 'reminder') return v.days === 0 ? 'reminder, due today' : 'reminder, due in ' + plural(v.days);
    if (kind === 'overdue') return 'overdue by ' + plural(-v.days);
    return { submitted: 'submitted for approval', approved: 'approved', rejected: 'returned, please correct' }[kind];
  }
  // The lines the mail shows, in order: [label, value].
  function lines(kind, v) {
    var out = [['Employee', v.name], ['Employee ID', v.id], ['Week', 'Week ' + v.week], ['Period', v.period], ['Status', v.status],
      ['Hours logged', v.hours + ' of ' + v.target + ' expected'], ['Due date', v.dueDate]];
    if (kind === 'rejected' && v.comment) out.push(['Manager comment', v.comment]);
    return out;
  }
  function intro(kind, v) {
    return { reminder: 'Please hand in your timesheet for week ' + v.week + ' by ' + v.dueDate + '.',
      overdue: 'Your timesheet for week ' + v.week + ' was due on ' + v.dueDate + ' and has not been handed in.',
      submitted: 'We received your timesheet for week ' + v.week + '. ' + v.manager + ' will look at it next.',
      approved: v.manager + ' approved your timesheet for week ' + v.week + '. Nothing more to do.',
      rejected: v.manager + ' returned your timesheet for week ' + v.week + '. Please correct it and submit it again.' }[kind];
  }

  function build(view) {
    var kind = KINDS.indexOf(view.kind) < 0 ? 'reminder' : view.kind;
    var v = view, rows = lines(kind, v), url = v.url;
    var subject = 'Timesheet: Week ' + v.week + ' (' + v.period + ') - ' + tail(kind, v);
    var cells = rows.map(function (r) {
      return '<tr><td style="' + FONT + 'padding:7px 14px 7px 0;color:' + FAINT + ';font-size:13px;white-space:nowrap;vertical-align:top;border-bottom:1px solid ' + LINE + ';"><b>' + esc(r[0]) + ':</b></td>' +
        '<td style="' + FONT + 'padding:7px 0;color:' + INK + ';font-size:14px;border-bottom:1px solid ' + LINE + ';">' + esc(r[1]) + '</td></tr>';
    }).join('');
    var html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;border:1px solid ' + LINE + ';border-radius:10px;border-collapse:separate;">' +
      '<tr><td style="background:' + BAR + ';padding:16px 20px;border-radius:10px 10px 0 0;' + FONT + 'color:#FFFFFF;font-size:16px;"><b>Timesheet</b> <span style="color:#C7D2FE;font-size:12px;">by PearlFox</span></td></tr>' +
      '<tr><td style="padding:20px;">' +
      '<div style="' + FONT + 'font-size:18px;color:' + INK + ';margin:0 0 6px;"><b>' + esc(HEADLINES[kind]) + '</b></div>' +
      '<div style="' + FONT + 'font-size:14px;color:' + INK + ';margin:0 0 14px;line-height:1.5;">' + esc(intro(kind, v)) + '</div>' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">' + cells +
      '<tr><td style="' + FONT + 'padding:7px 14px 7px 0;color:' + FAINT + ';font-size:13px;white-space:nowrap;"><b>Timesheet link:</b></td><td style="' + FONT + 'padding:7px 0;font-size:14px;"><a href="' + esc(url) + '" style="color:' + ACC + ';">Week ' + esc(v.week) + '</a></td></tr></table>' +
      '<div style="margin-top:18px;"><a href="' + esc(url) + '" style="' + FONT + 'display:inline-block;background:' + ACC + ';color:#FFFFFF;text-decoration:none;font-size:14px;padding:10px 18px;border-radius:8px;"><b>Open timesheet</b></a></div>' +
      '</td></tr>' +
      '<tr><td style="' + FONT + 'background:' + TINT + ';padding:10px 20px;color:' + FAINT + ';font-size:12px;border-radius:0 0 10px 10px;">Sent by Timesheet. A preview with sample data only.</td></tr></table>';
    var text = HEADLINES[kind] + '\n' + intro(kind, v) + '\n\n' + rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n') + '\nTimesheet link: ' + url + '\n';
    return { subject: subject, html: html, text: text };
  }

  window.TS_MAIL = { build: build, weekUrl: weekUrl, KINDS: KINDS, KIND_NAMES: KIND_NAMES };
})();
