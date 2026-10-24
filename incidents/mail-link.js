/* PearlFox Service Desk - the "New" mail button at the top of the page.
   One click makes a random sample incident (the same maker as the "New incident" form), turns it into the mail the Eagle View
   app reads (mail-copy.js) and opens the visitor's mail app with the subject and body filled in. "To" is left empty on purpose.
   Nothing is saved: it only opens a mail. A mailto link carries plain text, so the plain-text twin of the mail is used.
   The button is a real link whose href already holds the full mailto address, exactly like the Peakon page: the browser does the
   opening, no script navigation, so the subject and body always reach the mail app. After a click the link is refilled with a
   new random incident, ready for the next click. */
(function () {
  var btn = document.getElementById('mailNew');
  if (!btn || !window.SD_MAIL || !window.SD_RANDOM || !window.SD_DATA) return;
  var D = window.SD_DATA;

  function refill() {
    var inc = window.SD_RANDOM.make({ assignee: D.me.name, existingIds: D.incidents.map(function (i) { return i.id; }), now: Date.now(), rng: Math.random });
    var opened = inc.events[0];                          // the "New" event: "Incident opened."
    var mail = window.SD_MAIL.build({
      inc: inc, status: 'New', comments: [], url: window.location.href,
      history: [{ status: 'New', at: opened.at, by: opened.by, note: opened.note }]
    });
    btn.href = window.SD_MAIL.mailtoUrl(mail);
  }

  refill();
  btn.addEventListener('click', function () { setTimeout(refill, 500); });   // the browser has taken the old address by then
}());
