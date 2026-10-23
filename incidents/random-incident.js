/* PearlFox Service Desk - makes one random, believable incident for the "New incident" form.
   Pure: no page, no storage. Sample data only (every name and system is made up).
   make() returns the STORED shape: absolute times in milliseconds, not "hours ago". */
(function () {
  var TEMPLATES = [
    { short: 'Checkout page times out for mobile users', cat: 'Failure', sub: 'Software', ci: 'Web Checkout - PROD', desc: 'Customers on mobile see a timeout at the last checkout step. Desktop users are not affected. Support has received several complaints since this morning.' },
    { short: 'Nightly sales report did not arrive', cat: 'Failure', sub: 'Reporting', ci: 'Sales Reports - PROD', desc: 'The nightly sales report was not delivered to the regional managers. The job shows as finished but no file was produced.' },
    { short: 'VPN disconnects every few minutes', cat: 'Network', sub: 'VPN', ci: 'VPN Gateway - EU', desc: 'Several users lose the VPN connection about every ten minutes and have to sign in again. It started after the last firmware update.' },
    { short: 'New joiner cannot access the shared drive', cat: 'Request', sub: 'Access', ci: 'File Services', desc: 'A new team member has no access to the team shared drive. Their manager approved the request last week.' },
    { short: 'Email alerts are delayed by 20 minutes', cat: 'Failure', sub: 'Email', ci: 'Mail Gateway - PROD', desc: 'System alert emails arrive about twenty minutes late, so the on-call team reacts too slowly. The queue looks normal.' },
    { short: 'Database backup failed with a disk space error', cat: 'Failure', sub: 'Backup', ci: 'Orders Database - PROD', desc: 'Last night\'s full backup stopped with a disk space error. The previous backup is two days old.' },
    { short: 'Customer portal login shows a blank page', cat: 'Failure', sub: 'Software', ci: 'Customer Portal - PROD', desc: 'After entering the password, some users see a blank page. A refresh sometimes helps. Only one browser version seems affected.' },
    { short: 'Printer on floor 3 prints blank pages', cat: 'Failure', sub: 'Hardware', ci: 'Printer F3-02', desc: 'The shared printer on the third floor prints blank pages for every job. The toner level shows full.' },
    { short: 'Certificate for the staging site expires soon', cat: 'Request', sub: 'Security', ci: 'Staging Gateway', desc: 'The certificate for the staging site expires in a few days. Please renew it before the next test cycle.' },
    { short: 'Search in the order screen is very slow', cat: 'Improvement', sub: 'Performance', ci: 'Order Portal - PROD', desc: 'Searching for an order takes about six seconds on large accounts. Users have started to work around it with exports.' },
    { short: 'Duplicate invoices after a payment retry', cat: 'Failure', sub: 'Billing', ci: 'Billing Engine - PROD', desc: 'Some orders created two invoices after a payment retry. Finance asks for the duplicates to be voided.' },
    { short: 'API returns error 503 during peak hours', cat: 'Failure', sub: 'Software', ci: 'Public API - PROD', desc: 'Between ten and eleven every morning the public API answers with error 503 for a few minutes. Partners have noticed.' }
  ];
  var REQUESTERS = ['Daniel Okafor', 'Mei Tanaka', 'Lucas Ferreira', 'Tom Becker', 'Sara Haddad', 'Anika Rao'];
  var GROUPS = ['Payments Platform L3', 'Network Operations L2', 'Finance Systems L2', 'Messaging L2', 'Identity and Access L2', 'Data Governance L2'];
  var PRIORITIES = window.SD_DATA.priorities;     // incidents-data.js must be loaded first
  var END_DAYS_MIN = -2, END_DAYS_MAX = 21;     // from two days late to three weeks ahead

  function pick(list, rng) { return list[Math.min(list.length - 1, Math.floor(rng() * list.length))]; }
  function between(min, max, rng) { return min + Math.min(max - min, Math.floor(rng() * (max - min + 1))); }

  // INC64 plus five digits, never one that is already used.
  function newNumber(existing, rng) {
    var taken = {};
    existing.forEach(function (id) { taken[id] = true; });
    var n = between(10000, 99999, rng);
    for (var i = 0; i < 100000; i++) {
      var id = 'INC64' + (10000 + ((n - 10000 + i) % 90000));
      if (!taken[id]) return id;
    }
    throw new Error('No free incident number');
  }

  /**
   * opts: { assignee, existingIds, now (ms), rng (0 up to but not including 1) }
   * -> { id, short, priority, category, subcategory, ci, group, assignedTo, openedBy, caseRef,
   *      description, openedAt, endDate, events: [{ at, kind: 'status', to, by, note }] }
   */
  function make(opts) {
    var rng = opts.rng || Math.random, now = opts.now || Date.now();
    var t = pick(TEMPLATES, rng);
    var openedBy = pick(REQUESTERS, rng), group = pick(GROUPS, rng);
    var end = new Date(now); end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + between(END_DAYS_MIN, END_DAYS_MAX, rng));
    var id = newNumber(opts.existingIds || [], rng);
    return {
      id: id, short: t.short, priority: pick(PRIORITIES, rng), category: t.cat, subcategory: t.sub, ci: t.ci,
      group: group, assignedTo: opts.assignee, openedBy: openedBy, caseRef: id, description: t.desc,
      openedAt: now, endDate: end.getTime(),
      events: [
        { at: now - 60000, kind: 'status', to: 'New', by: openedBy, note: 'Incident opened.' },
        { at: now, kind: 'status', to: 'Assigned', by: 'Service Desk', note: 'Assigned to ' + group + '.' }
      ]
    };
  }

  window.SD_RANDOM = { make: make, TEMPLATES: TEMPLATES, REQUESTERS: REQUESTERS, GROUPS: GROUPS, PRIORITIES: PRIORITIES };
})();
