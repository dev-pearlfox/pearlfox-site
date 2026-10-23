/* Learn4U - Catalog: search, category chips, level and sort. */
(function () {
  var L = window.L4U, D = L.D, esc = L.esc;
  L.shell('catalog.html');
  var q = document.getElementById('q'), lvl = document.getElementById('lvl'), sort = document.getElementById('sort'), cat = 'All';
  q.value = L.urlParam('q') || '';
  lvl.innerHTML = ['All levels'].concat(D.levels).map(function (l, i) { return '<option value="' + (i ? esc(l) : '') + '">' + esc(l) + '</option>'; }).join('');

  function chips() {
    document.getElementById('cats').innerHTML = ['All'].concat(D.categories).map(function (c) { return '<button type="button" class="chip" data-cat="' + esc(c) + '" aria-pressed="' + (c === cat) + '">' + esc(c) + '</button>'; }).join('');
  }
  function mineMap() { var m = {}; L.entries().forEach(function (e) { m[e.item.id] = e; }); return m; }
  function draw() {
    var text = q.value.trim().toLowerCase(), mine = mineMap();
    var list = D.courses.filter(function (c) {
      if (cat !== 'All' && c.category !== cat) return false;
      if (lvl.value && c.level !== lvl.value) return false;
      return !text || (c.title + ' ' + c.summary + ' ' + c.category + ' ' + c.owner).toLowerCase().indexOf(text) !== -1;
    });
    var by = { az: function (a, b) { return a.title.localeCompare(b.title); }, short: function (a, b) { return L.courseMinutes(a) - L.courseMinutes(b); },
      pop: function (a, b) { return (b.popular ? 1 : 0) - (a.popular ? 1 : 0) || a.title.localeCompare(b.title); } };
    list.sort(by[sort.value]);
    document.getElementById('count').textContent = L.plural(list.length, 'course', 'courses');
    document.getElementById('none').hidden = list.length > 0;
    document.getElementById('grid').innerHTML = list.map(function (c) {
      var e = mine[c.id], on = e && e.status !== 'Cancelled';
      var action = on ? L.statusBadge(e.status) : '<button type="button" class="btn-secondary btn-sm" data-add="' + esc(c.id) + '">Add to my learning</button>';
      return '<article class="cc"><div class="cc-cover ' + L.coverClass(c) + '"><span class="cat">' + esc(c.category) + '</span><span class="wm">' + L.coverIcon(c, 150) + '</span></div>' +
        '<div class="cc-body"><h3><a href="course.html?id=' + esc(c.id) + '">' + esc(c.title) + '</a></h3><p>' + esc(c.summary) + '</p>' +
        '<div class="facts"><span>' + esc(L.fmtMinutes(L.courseMinutes(c))) + '</span><span>' + esc(L.plural(c.modules.length, 'module', 'modules')) + '</span><span>' + esc(c.level) + '</span></div></div>' +
        '<div class="cc-foot">' + action + '<a class="btn-ghost btn-sm" href="course.html?id=' + esc(c.id) + '">Details</a></div></article>';
    }).join('');
    chips();
  }
  document.getElementById('cats').addEventListener('click', function (ev) { var b = ev.target.closest('[data-cat]'); if (b) { cat = b.getAttribute('data-cat'); draw(); } });
  document.getElementById('grid').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-add]'); if (!b) return;
    var item = L.enrol(b.getAttribute('data-add'), { mandatory: false });
    if (item) L.toast('Added to your learning: ' + L.course(item.id).title); draw();
  });
  [q, lvl, sort].forEach(function (n) { n.addEventListener('input', draw); });
  draw();
})();
