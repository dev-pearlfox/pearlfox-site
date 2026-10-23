/* PearlFox Service Desk - the "New incident" form. Everything is made up at random; the only choice is who
   the incident is assigned to. Save stores it (see addCreated in common.js) and tells the page through onCreated.
   Sample data only: nothing is sent anywhere. */
(function () {
  var S = window.SD, D = S.data, esc = S.esc;
  var backdrop, select, saveBtn, preview, current, openBtn, onCreated, toastTimer;

  function field(label, value) { return '<div><dt>' + label + '</dt><dd>' + value + '</dd></div>'; }

  function renderPreview() {
    var c = current;
    preview.innerHTML =
      field('Number', esc(c.id)) + field('Short description', esc(c.short)) +
      field('Priority', '<span class="chip ' + S.priorityClass(c.priority) + '">' + esc(c.priority) + '</span>') +
      field('Category', esc(c.category) + ' / ' + esc(c.subcategory)) + field('Configuration item', esc(c.ci)) +
      field('Opened by', esc(c.openedBy)) + field('Assignment group', esc(c.group)) + field('End date', S.fmtDate(c.endDate)) +
      field('Description', esc(c.description));
  }

  function build() {
    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.hidden = true;
    backdrop.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="newTitle">' +
        '<h2 id="newTitle">New incident</h2>' +
        '<p class="muted">Everything is filled in at random. Only the person it is assigned to is your choice.</p>' +
        '<label class="field-label" for="newAssignee">Assigned to</label>' +
        '<select id="newAssignee">' + D.assignees.map(function (n) { return '<option>' + esc(n) + '</option>'; }).join('') + '</select>' +
        '<dl class="details preview" id="newPreview"></dl>' +
        '<div class="modal-actions"><button type="button" class="btn" id="newCancel">Cancel</button>' +
        '<button type="button" class="btn-primary" id="newSave">Save</button></div>' +
      '</div>';
    document.body.appendChild(backdrop);
    select = backdrop.querySelector('#newAssignee');
    saveBtn = backdrop.querySelector('#newSave');
    preview = backdrop.querySelector('#newPreview');
    backdrop.querySelector('#newCancel').addEventListener('click', close);
    saveBtn.addEventListener('click', save);
    backdrop.addEventListener('mousedown', function (e) { if (e.target === backdrop) close(); });
    backdrop.addEventListener('keydown', onKey);
  }

  function focusables() { return [].slice.call(backdrop.querySelectorAll('select, button')); }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    var f = focusables(), first = f[0], last = f[f.length - 1];     // keep Tab inside the dialog
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function open() {
    if (!backdrop) build();
    current = window.SD_RANDOM.make({
      assignee: D.me.name, existingIds: D.incidents.map(function (i) { return i.id; }), now: Date.now(), rng: Math.random
    });
    select.value = D.me.name;
    renderPreview();
    backdrop.hidden = false;
    select.focus();
  }

  function close() {
    if (!backdrop || backdrop.hidden) return;
    backdrop.hidden = true;
    // Back to the + button itself: Safari does not focus a button when it is clicked, so "the element that had focus" is not reliable.
    if (openBtn) openBtn.focus();
  }

  function toast(text, id) {
    var el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.innerHTML = esc(text) + (id ? ' <a href="ticket.html?id=' + encodeURIComponent(id) + '">Open</a>' : '');
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 7000);
  }

  function save() {
    // Only a name from the list is accepted, whatever the page says.
    current.assignedTo = D.assignees.indexOf(select.value) === -1 ? D.me.name : select.value;
    var result = S.addCreated(current);
    close();
    toast(result.incident.id + ' created and assigned to ' + result.incident.assignedTo +
      (result.persisted ? '.' : '. This browser would not keep it, so it is gone on reload.'), result.incident.id);
    if (onCreated) onCreated(result.incident);
  }

  window.SD_CREATE = {
    init: function (opts) {
      onCreated = opts && opts.onCreated;
      openBtn = document.getElementById('newBtn');
      if (openBtn) openBtn.addEventListener('click', open);
    }
  };
})();
