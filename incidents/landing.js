/* PearlFox Service Desk - landing page: summary cards, "Assigned to me" table, filters, sorting, search.
   Double-click (or Enter) on a row opens the ticket page. Sample data only. */
(function () {
  var S = window.SD, D = S.data, esc = S.esc;
  var state = { scope: 'open', card: '', priority: 'all', status: 'all', query: '', sortKey: 'priority', sortDir: 1, selected: '' };

  var ASSIGNED_COL = { key: 'assigned', label: 'Assigned to' };
  var BASE_COLS = [
    { key: 'id', label: 'Number' }, { key: 'short', label: 'Short description' }, { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' }, { key: 'category', label: 'Category' }, { key: 'end', label: 'End date' }, { key: 'updated', label: 'Updated' }
  ];
  // On the "other people" tab the table also says who each incident is assigned to.
  function cols() { return state.scope === 'others' && !state.card ? [BASE_COLS[0], BASE_COLS[1], ASSIGNED_COL].concat(BASE_COLS.slice(2)) : BASE_COLS; }

  function lastUpdate(inc) {
    var t = inc.openedAt;
    inc.events.forEach(function (e) { var x = D.now - e.h * 36e5; if (x > t) t = x; });
    return t;
  }
  function isOpen(inc) { return !S.isFinished(S.currentStatus(inc)); }
  var mine = S.isMine;
  function daysLeft(inc) { return Math.round((inc.endDate - D.today) / 864e5); }

  var CARDS = [
    { key: 'open', label: 'Open incidents', test: function (i) { return mine(i) && isOpen(i); } },
    { key: 'high', label: 'High priority', test: function (i) { return mine(i) && isOpen(i) && S.priorityRank(i.priority) <= 2; } },
    { key: 'week', label: 'Due this week', test: function (i) { var d = daysLeft(i); return mine(i) && isOpen(i) && d >= 0 && d <= 7; } },
    { key: 'overdue', label: 'Overdue', test: function (i) { return mine(i) && isOpen(i) && daysLeft(i) < 0; } }
  ];

  function sortValue(inc, key) {
    switch (key) {
      case 'id': return inc.id;
      case 'short': return inc.short.toLowerCase();
      case 'priority': return S.priorityRank(inc.priority);
      case 'status': return S.FLOW.concat(['Cancelled']).indexOf(S.currentStatus(inc));
      case 'category': return inc.category.toLowerCase();
      case 'assigned': return inc.assignedTo.toLowerCase();
      case 'end': return inc.endDate;
      default: return lastUpdate(inc);
    }
  }
  // Ties always fall back to the soonest end date, then the number, so the order never jumps around.
  function compare(a, b) {
    var x = sortValue(a, state.sortKey), y = sortValue(b, state.sortKey);
    if (x < y) return -state.sortDir;
    if (x > y) return state.sortDir;
    return (a.endDate - b.endDate) || (a.id < b.id ? -1 : 1);
  }

  // "Assigned to me" = my open ones, "Resolved and closed" = my finished ones, "Others" = anyone else's.
  function inScope(inc, card) {
    if (card) return card.test(inc);
    if (state.scope === 'others') return !mine(inc);
    return mine(inc) && (state.scope === 'open') === isOpen(inc);
  }

  function visible() {
    var q = state.query.trim().toLowerCase();
    var card = CARDS.filter(function (c) { return c.key === state.card; })[0];
    return D.incidents.filter(function (i) {
      var status = S.currentStatus(i);
      if (!inScope(i, card)) return false;
      if (state.priority !== 'all' && S.priorityRank(i.priority) !== Number(state.priority)) return false;
      if (state.status !== 'all' && status !== state.status) return false;
      if (q && (i.id + ' ' + i.short + ' ' + i.ci + ' ' + i.category + ' ' + i.subcategory).toLowerCase().indexOf(q) === -1) return false;
      return true;
    }).sort(compare);
  }

  function renderCards() {
    document.getElementById('cards').innerHTML = CARDS.map(function (c) {
      var n = D.incidents.filter(c.test).length;
      return '<button type="button" class="card-btn' + (state.card === c.key ? ' on' : '') + '" data-card="' + c.key + '" aria-pressed="' + (state.card === c.key) + '">' +
        '<span class="num">' + n + '</span><span class="lbl">' + c.label + '</span></button>';
    }).join('');
  }
  function renderTabs() {
    var own = D.incidents.filter(mine), open = own.filter(isOpen).length;
    var tabs = [['open', 'Assigned to me', open], ['done', 'Resolved and closed', own.length - open],
      ['others', 'Assigned to others', D.incidents.length - own.length]];
    document.getElementById('tabs').innerHTML = tabs.map(function (t) {
      var on = !state.card && state.scope === t[0];
      return '<button type="button" role="tab" class="tab' + (on ? ' on' : '') + '" aria-selected="' + on + '" data-scope="' + t[0] + '">' +
        t[1] + '<span class="count">' + t[2] + '</span></button>';
    }).join('');
  }
  function renderHead() {
    document.getElementById('head').innerHTML = cols().map(function (c) {
      var on = state.sortKey === c.key;
      return '<th scope="col" aria-sort="' + (on ? (state.sortDir === 1 ? 'ascending' : 'descending') : 'none') + '">' +
        '<button type="button" data-sort="' + c.key + '">' + c.label + (on ? ' <span class="arrow">' + (state.sortDir === 1 ? '&#9650;' : '&#9660;') + '</span>' : '') + '</button></th>';
    }).join('');
  }
  function renderOptions() {
    var p = document.getElementById('fPriority'), s = document.getElementById('fStatus');
    p.innerHTML = '<option value="all">All priorities</option>' + [1, 2, 3, 4, 5].map(function (n) {
      var sample = D.incidents.filter(function (i) { return S.priorityRank(i.priority) === n; })[0];
      return '<option value="' + n + '">' + (sample ? esc(sample.priority) : n) + '</option>';
    }).join('');
    s.innerHTML = '<option value="all">All statuses</option>' + S.FLOW.concat(['Cancelled']).map(function (x) {
      return '<option>' + x + '</option>';
    }).join('');
    p.value = state.priority; s.value = state.status;
  }

  function renderRows() {
    var list = visible(), body = document.getElementById('rows');
    if (!list.length) {
      body.innerHTML = '<tr><td colspan="' + cols().length + '"><div class="empty"><b>No incidents match</b>Try a different search or clear the filters.</div></td></tr>';
    } else {
      body.innerHTML = list.map(function (i) {
        var status = S.currentStatus(i), due = S.dueState(i);
        return '<tr tabindex="0" data-id="' + esc(i.id) + '" class="' + (state.selected === i.id ? 'selected' : '') + '" aria-label="' + esc(i.id + ', ' + i.short) + '">' +
          '<td class="num"><a href="ticket.html?id=' + encodeURIComponent(i.id) + '">' + esc(i.id) + '</a></td>' +
          '<td class="short"><span>' + esc(i.short) + '</span><small>' + esc(i.ci) + '</small></td>' +
          (state.scope === 'others' && !state.card ? '<td>' + esc(i.assignedTo) + '</td>' : '') +
          '<td><span class="chip ' + S.priorityClass(i.priority) + '">' + esc(i.priority) + '</span></td>' +
          '<td><span class="chip ' + S.statusClass(status) + '">' + esc(status) + '</span></td>' +
          '<td>' + esc(i.category) + '<small class="muted"> / ' + esc(i.subcategory) + '</small></td>' +
          '<td class="end ' + due + '">' + S.fmtDate(i.endDate) + '<small>' + esc(S.dueText(i)) + '</small></td>' +
          '<td class="muted">' + S.fmtAgo(lastUpdate(i)) + '</td></tr>';
      }).join('');
    }
    var total = D.incidents.filter(state.scope === 'others' && !state.card ? function (i) { return !mine(i); } : mine).length;
    document.getElementById('foot').textContent = 'Showing ' + list.length + ' of ' + total + (total === 1 ? ' incident' : ' incidents') + (state.scope === 'others' && !state.card ? ' assigned to other people' : ' assigned to you');
  }

  function render() { renderCards(); renderTabs(); renderHead(); renderRows(); }

  function openTicket(id) { window.location.href = 'ticket.html?id=' + encodeURIComponent(id); }
  function rowId(el) { var tr = el.closest ? el.closest('tr[data-id]') : null; return tr ? tr.getAttribute('data-id') : ''; }

  function wire() {
    document.getElementById('cards').addEventListener('click', function (e) {
      var b = e.target.closest('[data-card]'); if (!b) return;
      state.card = state.card === b.getAttribute('data-card') ? '' : b.getAttribute('data-card');
      render();
    });
    document.getElementById('tabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-scope]'); if (!b) return;
      state.scope = b.getAttribute('data-scope'); state.card = ''; render();
    });
    document.getElementById('head').addEventListener('click', function (e) {
      var b = e.target.closest('[data-sort]'); if (!b) return;
      var k = b.getAttribute('data-sort');
      state.sortDir = state.sortKey === k ? -state.sortDir : 1; state.sortKey = k; render();
    });
    document.getElementById('fPriority').addEventListener('change', function (e) { state.priority = e.target.value; renderRows(); });
    document.getElementById('fStatus').addEventListener('change', function (e) { state.status = e.target.value; renderRows(); });
    document.getElementById('q').addEventListener('input', function (e) { state.query = e.target.value; renderRows(); });
    document.getElementById('clear').addEventListener('click', function () {
      state.priority = 'all'; state.status = 'all'; state.query = ''; state.card = '';
      document.getElementById('q').value = ''; renderOptions(); render();
    });
    var rows = document.getElementById('rows');
    rows.addEventListener('click', function (e) {
      var id = rowId(e.target); if (!id || e.target.closest('a')) return;
      state.selected = id; renderRows();
    });
    rows.addEventListener('dblclick', function (e) { var id = rowId(e.target); if (id) openTicket(id); });
    rows.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var id = rowId(e.target); if (id) openTicket(id); }
    });
  }

  // A new incident: clear the filters so it cannot be hidden, go to the tab it belongs to, select it and bring it into view.
  function showNew(inc) {
    state.card = ''; state.priority = 'all'; state.status = 'all'; state.query = '';
    document.getElementById('q').value = '';
    state.scope = mine(inc) ? 'open' : 'others';
    state.selected = inc.id;
    renderOptions(); render();
    var row = document.querySelector('#rows tr[data-id="' + inc.id + '"]');
    if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest' });
    refreshSubline();
  }

  function refreshSubline() {
    var open = D.incidents.filter(function (i) { return mine(i) && isOpen(i); }).length;
    document.getElementById('subline').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
      '. You have ' + open + ' open incident' + (open === 1 ? '' : 's') + ' assigned to you.';
  }

  S.renderChrome();
  document.getElementById('greeting').textContent = S.greeting();
  refreshSubline();
  renderOptions();
  wire();
  render();
  window.SD_CREATE.init({ onCreated: showNew });
})();
