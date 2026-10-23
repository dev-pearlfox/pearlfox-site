/* PearlFox Service Desk - turns one incident into a mail you can paste: a subject line plus a body.
   The body is HTML with INLINE styles and plain tables only (mail programs ignore classes and modern CSS),
   and a plain-text twin for editors that only take text. Pure: no page, no clipboard (see ticket.js).
   Layout (same fields as the real service-desk mail the Eagle View app reads): labels with values in the next cell,
   the ticket number as a link, and Status and End Date on the right. */
(function () {
  var ORANGE = '#fc8215', DARK = '#1a1310', CREAM = '#fbf6ef', INK = '#1f2933', FAINT = '#7b8794', LINE = '#e1e5ea';
  var FONT = "font-family:'Segoe UI',Arial,Helvetica,sans-serif;";
  var PUBLIC_BASE = 'https://pearlfox.io/incidents/ticket.html?id=';   // where the page will live once published

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  // The mail carries the end date as day.month.year, the format the Eagle View app reads.
  function endDateText(ms) { var d = new Date(ms); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); }
  function stamp(ms) { var d = new Date(ms); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  // The link in the mail must be https (the app drops anything else). A page opened from a local address is not
  // reachable from outside anyway, so the address it will have once published is used instead.
  function ticketUrl(id, pageUrl) {
    try {
      var u = new URL(String(pageUrl || ''));
      if (u.protocol === 'https:') { u.search = '?id=' + encodeURIComponent(id); u.hash = ''; return u.href; }
    } catch (e) { /* fall through */ }
    return PUBLIC_BASE + encodeURIComponent(id);
  }

  // What the mail says is new: the newest comment or status change.
  function latestUpdate(inc, history, comments) {
    var lastStatus = history.length ? history[history.length - 1] : null;
    var lastComment = comments.length ? comments[0] : null;      // comments are newest first
    if (lastComment && (!lastStatus || lastComment.at >= lastStatus.at)) return { by: lastComment.by, at: lastComment.at, text: lastComment.text, kind: 'comment' };
    if (lastStatus) return { by: lastStatus.by, at: lastStatus.at, text: lastStatus.note || ('Status changed to ' + lastStatus.status + '.'), kind: 'status' };
    return null;
  }

  /**
   * view: { inc, status, history, comments, url }  (history oldest first, comments newest first)
   * -> { subject, html, text }
   */
  function build(view) {
    var inc = view.inc, status = view.status;
    var assigned = inc.assignedTo + ' (' + inc.group + ')';
    var link = ticketUrl(inc.id, view.url);
    var update = latestUpdate(inc, view.history, view.comments);
    var priority = inc.priority;
    var end = endDateText(inc.endDate);
    var subject = 'Incident: ' + inc.id + ' - ' + inc.short;

    var label = 'padding:4px 12px 4px 0;' + FONT + 'font-size:13px;font-weight:bold;color:' + INK + ';white-space:nowrap;vertical-align:top;';
    var value = 'padding:4px 0;' + FONT + 'font-size:13px;color:' + INK + ';vertical-align:top;';
    function row(name, val) { return '<tr><td style="' + label + '"><b>' + esc(name) + ':</b></td><td style="' + value + '">' + val + '</td></tr>'; }
    function rowPair(a, av, b, bv) {
      return '<tr><td style="' + label + '"><b>' + esc(a) + ':</b></td><td style="' + value + '">' + esc(av) + '</td>' +
        '<td style="' + label + 'padding-left:16px;"><b>' + esc(b) + ':</b></td><td style="' + value + '">' + esc(bv) + '</td></tr>';
    }
    function side(name, val) { return '<p style="margin:0 0 6px 0;' + FONT + 'font-size:13px;color:' + INK + ';"><b>' + esc(name) + ':</b> ' + val + '</p>'; }

    var html =
      '<div style="' + FONT + 'color:' + INK + ';">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;max-width:760px;">' +
        // Dark text on a light band: still readable when a mail program drops the background colour.
        '<tr><td bgcolor="' + CREAM + '" style="background-color:' + CREAM + ';border-bottom:3px solid ' + ORANGE + ';padding:14px 18px;' + FONT + 'font-size:18px;font-weight:bold;color:' + DARK + ';">' +
          '<span style="color:' + DARK + ';">Pearl</span><span style="color:#d95f00;">Fox</span> <span style="font-weight:normal;color:#52606d;">Service Desk</span></td></tr>' +
      '</table>' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;max-width:760px;margin-top:14px;"><tr>' +
        '<td valign="top" width="62%" style="padding-right:24px;">' +
          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">' +
            row('Assigned to', esc(assigned)) + row('Assignment group', esc(inc.group)) + row('Priority', esc(priority)) +
            rowPair('Category', inc.category, 'Subcategory', inc.subcategory) +
            row('Sub Configuration item', esc(inc.ci)) + row('Case reference', esc(inc.caseRef)) +
          '</table></td>' +
        '<td valign="top" style="border-left:1px solid ' + LINE + ';padding-left:18px;">' +
          side('Ticket Number', '<a href="' + esc(link) + '" style="color:#2563eb;">' + esc(inc.id) + '</a>') +
          side('Opened By', esc(inc.openedBy)) + side('Status', esc(status)) + side('End Date', esc(end)) +
        '</td></tr></table>' +
      '<p style="margin:16px 0 4px 0;' + FONT + 'font-size:13px;font-weight:bold;color:' + INK + ';">Short description</p>' +
      '<p style="margin:0 0 12px 0;' + FONT + 'font-size:13px;color:' + INK + ';">' + esc(inc.short) + '</p>' +
      '<p style="margin:0 0 4px 0;' + FONT + 'font-size:13px;font-weight:bold;color:' + INK + ';">Description</p>' +
      '<p style="margin:0 0 12px 0;' + FONT + 'font-size:13px;color:' + INK + ';">' + esc(inc.description) + '</p>' +
      (update ? '<p style="margin:0 0 4px 0;' + FONT + 'font-size:13px;font-weight:bold;color:' + INK + ';">Latest update</p>' +
        '<p style="margin:0 0 12px 0;' + FONT + 'font-size:13px;color:' + INK + ';border-left:3px solid ' + ORANGE + ';padding-left:10px;">' +
        esc(update.text) + '<br><span style="color:' + FAINT + ';font-size:12px;">' + esc(update.by) + ', ' + esc(stamp(update.at)) + '</span></p>' : '') +
      '<p style="margin:16px 0 0 0;' + FONT + 'font-size:11px;color:' + FAINT + ';">Preview mail from PearlFox Service Desk with sample data.</p>' +
      '</div>';

    var lines = [
      'Assigned to: ' + assigned, 'Assignment group: ' + inc.group, 'Priority: ' + priority,
      'Category: ' + inc.category + ' Subcategory: ' + inc.subcategory, 'Sub Configuration item: ' + inc.ci, 'Case reference: ' + inc.caseRef,
      '', 'Ticket Number: ' + inc.id + ' (' + link + ')', 'Opened By: ' + inc.openedBy, 'Status: ' + status, 'End Date: ' + end,
      '', 'Short description', inc.short, '', 'Description', inc.description
    ];
    if (update) lines.push('', 'Latest update', update.text, update.by + ', ' + stamp(update.at));
    return { subject: subject, html: html, text: lines.join('\n') };
  }

  window.SD_MAIL = { build: build, ticketUrl: ticketUrl, endDateText: endDateText };
})();
