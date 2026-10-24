/* PearlFox Learn4U - the "New" and "Completed" mail buttons on a course page.
   Each click builds the mail the Eagle View app reads (mail-copy.js) for THIS course and opens the visitor's mail app with the
   subject and body filled in. "To" is left empty on purpose. Nothing is saved.
   Each button is a real link whose href already holds the full mailto address (set when the page loads), exactly like the Peakon
   page: the browser does the opening, no script navigation, so the subject and body always reach the mail app.
   A mailto link carries plain text, so the plain-text twin of the mail is used. */
(function () {
  var L = window.L4U, M = window.L4U_MAIL;
  var bar = document.querySelector('.mailbar[data-course-page]');
  if (!L || !M || !bar) return;
  var course = L.course(L.urlParam('id'));
  if (!course) { bar.hidden = true; return; }                      // "Course not found": nothing to mail

  function mailtoUrl(mail) {
    return 'mailto:?subject=' + encodeURIComponent(mail.subject) + '&body=' + encodeURIComponent(mail.text.replace(/\n/g, '\r\n'));
  }

  function viewFor(status, now) {
    var due = L.midnight(now + 30 * L.D.day), done = status === 'Completed';
    return {
      id: course.id, title: course.title, category: course.category, duration: L.fmtMinutes(L.courseMinutes(course)), type: 'Mandatory',
      status: status, dueMs: due, dueState: 'ok', days: L.daysUntil(due, now), pct: done ? 100 : 0,
      doneModules: done ? course.modules.length : 0, totalModules: course.modules.length,
      nextModule: done ? '' : course.modules[0].title, learner: L.D.me.name, first: L.D.me.first,
      url: window.location.href, completedMs: done ? now : null
    };
  }

  function wire(buttonId, status) {
    document.getElementById(buttonId).href = mailtoUrl(M.build(viewFor(status, Date.now())));
  }
  wire('mailNew', 'Assigned');
  wire('mailDone', 'Completed');
}());
