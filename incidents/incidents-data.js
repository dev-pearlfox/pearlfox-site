/* PearlFox Service Desk - SAMPLE DATA ONLY.
   Every person, system and ticket below is made up. Dates are relative to "today", so the
   Overdue / Due this week cards always show something. Nothing here is saved or sent anywhere. */
(function () {
  var HOUR = 36e5, DAY = 864e5;
  var now = Date.now();
  var today = new Date(); today.setHours(0, 0, 0, 0); today = today.getTime();

  var ME = { name: 'Nandha Kumar', first: 'Nandha', group: 'Payments Platform L3' };
  // The "Assigned to" dropdown of the New incident form: the main user first, then three made-up people.
  var ASSIGNEES = [ME.name, 'Rahul Verma', 'Elena Petrova', 'James Carter'];
  // The five priorities, most urgent first. Used by the random maker and by "Change priority".
  var PRIORITIES = ['1 - Critical', '2 - High', '3 - Moderate', '4 - Low', '5 - Planning'];

  // h = hours before now. A status event moves the ticket to `to`; the "from" is worked out in order.
  function st(h, to, by, note) { return { h: h, kind: 'status', to: to, by: by, note: note || '' }; }
  function cm(h, by, text) { return { h: h, kind: 'comment', by: by, text: text }; }

  // opened = days before today, end = days from today (negative = already late).
  function inc(num, short, o) {
    return {
      id: num, short: short, priority: o.p, category: o.cat, subcategory: o.sub, ci: o.ci,
      group: o.group || ME.group, assignedTo: ME.name, openedBy: o.by, caseRef: num,
      description: o.desc, openedAt: now - o.openedH * HOUR, endDate: today + o.end * DAY,
      events: o.ev
    };
  }

  var list = [
    inc('INC6410021', 'Card payments failing with error 5021 at checkout', {
      p: '1 - Critical', cat: 'Failure', sub: 'Software', ci: 'Payments API - PROD', by: 'Daniel Okafor', openedH: 30, end: 1,
      desc: 'Customers see "Payment could not be completed" for roughly one in three card payments since the evening release. Logs show error 5021 from the card gateway adapter. Revenue impact is ongoing.',
      ev: [st(30, 'New', 'Daniel Okafor', 'Incident opened from the monitoring alert.'), st(29, 'Assigned', 'Service Desk', 'Assigned to Payments Platform L3.'),
        st(27, 'In progress', 'Nandha Kumar', 'Investigating the gateway adapter release.'),
        cm(22, 'Nandha Kumar', 'Rolled back the adapter to the previous build on one node. Failure rate on that node dropped to near zero.'),
        cm(6, 'Daniel Okafor', 'Support confirms fewer complaints on the rolled-back node. Please roll back the remaining nodes.')]
    }),
    inc('INC6410388', 'Refund batch job stuck in Pending since midnight', {
      p: '2 - High', cat: 'Failure', sub: 'Batch', ci: 'Refund Scheduler - PROD', by: 'Mei Tanaka', openedH: 52, end: 2,
      desc: 'The nightly refund batch shows Pending and has not processed any records. About 420 refunds are waiting. Finance needs them out before month end.',
      ev: [st(52, 'New', 'Mei Tanaka'), st(51, 'Assigned', 'Service Desk', 'Assigned to Payments Platform L3.'), st(48, 'In progress', 'Nandha Kumar'),
        cm(40, 'Nandha Kumar', 'A lock on the refunds table was never released after the last deployment. Clearing it in the maintenance window.'),
        st(30, 'On hold', 'Nandha Kumar', 'Waiting for the maintenance window tonight.')]
    }),
    inc('INC6409565', 'Quote calculation returns error code 299', {
      p: '4 - Low', cat: 'Failure', sub: 'Software', ci: 'CRM Portal - PROD', by: 'Lucas Ferreira', openedH: 120, end: 31, group: 'CRM Support L3',
      desc: 'Sales users see error code 299 when recalculating a quote that has more than 40 line items. Smaller quotes work. A workaround is to split the quote.',
      ev: [st(120, 'New', 'Lucas Ferreira'), st(118, 'Assigned', 'Service Desk', 'Assigned to CRM Support L3.'), st(96, 'In progress', 'Nandha Kumar'),
        cm(70, 'Nandha Kumar', 'Reproduced with a 45 line quote. The pricing service times out on large quotes.'),
        cm(20, 'Lucas Ferreira', 'Sales can live with the workaround for now, so low priority is fine.')]
    }),
    inc('INC6410702', 'VPN drops every 15 minutes for the Berlin office', {
      p: '3 - Moderate', cat: 'Network', sub: 'VPN', ci: 'VPN Gateway - EU', by: 'Tom Becker', openedH: 26, end: 4, group: 'Network Operations L2',
      desc: 'About twenty users in the Berlin office lose the VPN connection every 15 minutes and have to reconnect. It started after the firmware update on Monday.',
      ev: [st(26, 'New', 'Tom Becker'), st(25, 'Assigned', 'Service Desk', 'Assigned to Network Operations L2.'), st(9, 'In progress', 'Nandha Kumar', 'Picked up from the queue.')]
    }),
    inc('INC6408877', 'Month-end report exports an empty file', {
      p: '3 - Moderate', cat: 'Failure', sub: 'Reporting', ci: 'Finance Reports - PROD', by: 'Sara Haddad', openedH: 170, end: -2, group: 'Finance Systems L2',
      desc: 'The month-end ledger report downloads as an empty spreadsheet for the Dubai entity. Other entities are fine.',
      ev: [st(170, 'New', 'Sara Haddad'), st(168, 'Assigned', 'Service Desk'), st(150, 'In progress', 'Nandha Kumar'),
        cm(100, 'Nandha Kumar', 'The Dubai entity has a new cost centre code that the report query filters out. Fix prepared and in review.'),
        st(60, 'On hold', 'Nandha Kumar', 'Waiting for the change approval board.')]
    }),
    inc('INC6410144', 'Customer export includes deleted accounts', {
      p: '2 - High', cat: 'Data', sub: 'Privacy', ci: 'Customer Data Store - PROD', by: 'Anika Rao', openedH: 14, end: 0, group: 'Data Governance L2',
      desc: 'The weekly marketing export contains accounts that were deleted under a privacy request. This must be corrected before the export is used again.',
      ev: [st(14, 'New', 'Anika Rao'), st(13, 'Assigned', 'Service Desk', 'Assigned to Data Governance L2.'), st(11, 'In progress', 'Nandha Kumar'),
        cm(3, 'Nandha Kumar', 'Export is paused. Checking how many deleted records were included.')]
    }),
    inc('INC6411290', 'Staging environment certificate expires in 5 days', {
      p: '4 - Low', cat: 'Request', sub: 'Security', ci: 'Staging Gateway', by: 'Daniel Okafor', openedH: 8, end: 5, group: 'Identity and Access L2',
      desc: 'The staging gateway certificate expires soon. Please renew it before the next test cycle.',
      ev: [st(8, 'New', 'Daniel Okafor'), st(7, 'Assigned', 'Service Desk', 'Assigned to Identity and Access L2.')]
    }),
    inc('INC6410955', 'Support inbox rules not routing partner mails', {
      p: '3 - Moderate', cat: 'Failure', sub: 'Email', ci: 'Mail Gateway - PROD', by: 'Mei Tanaka', openedH: 40, end: 6, group: 'Messaging L2',
      desc: 'Mails from partner domains land in the general inbox instead of the partner queue. The routing rule seems to ignore subdomains.',
      ev: [st(40, 'New', 'Mei Tanaka'), st(38, 'Assigned', 'Service Desk'), st(20, 'In progress', 'Nandha Kumar'),
        cm(12, 'Nandha Kumar', 'Rule uses an exact domain match. Updating it to include subdomains and testing on a copy.')]
    }),
    inc('INC6411502', 'Slow search results in the order screen', {
      p: '5 - Planning', cat: 'Improvement', sub: 'Performance', ci: 'Order Portal - PROD', by: 'Lucas Ferreira', openedH: 200, end: 45,
      desc: 'Order search takes about six seconds on large accounts. Planned for the next performance sprint.',
      ev: [st(200, 'New', 'Lucas Ferreira'), st(196, 'Assigned', 'Service Desk'), st(190, 'In progress', 'Nandha Kumar', 'Scoped for the performance sprint.')]
    }),
    inc('INC6407760', 'Login page shows a blank screen on Safari', {
      p: '2 - High', cat: 'Failure', sub: 'Software', ci: 'Customer Portal - PROD', by: 'Tom Becker', openedH: 260, end: -10,
      desc: 'Safari users on macOS see a blank page after entering their password. Chrome and Edge are fine.',
      ev: [st(260, 'New', 'Tom Becker'), st(258, 'Assigned', 'Service Desk'), st(250, 'In progress', 'Nandha Kumar'),
        cm(200, 'Nandha Kumar', 'A script used an unsupported date format. Fix released in the evening deployment.'),
        st(190, 'Resolved', 'Nandha Kumar', 'Fix verified on Safari 17 and 18.'), cm(170, 'Tom Becker', 'Confirmed working for the affected users.'),
        st(120, 'Closed', 'Tom Becker', 'Closed after the confirmation period.')]
    }),
    inc('INC6407012', 'Password reset emails arrive after 30 minutes', {
      p: '3 - Moderate', cat: 'Failure', sub: 'Email', ci: 'Mail Gateway - PROD', by: 'Sara Haddad', openedH: 330, end: -14, group: 'Messaging L2',
      desc: 'Users report that password reset emails take up to half an hour to arrive.',
      ev: [st(330, 'New', 'Sara Haddad'), st(328, 'Assigned', 'Service Desk'), st(300, 'In progress', 'Nandha Kumar'),
        cm(260, 'Nandha Kumar', 'The outbound queue was throttled for the transactional sender. Limit raised.'),
        st(240, 'Resolved', 'Nandha Kumar', 'Delivery time is back under 10 seconds.')]
    }),
    inc('INC6406390', 'Duplicate invoices created for one order', {
      p: '2 - High', cat: 'Failure', sub: 'Billing', ci: 'Billing Engine - PROD', by: 'Anika Rao', openedH: 400, end: -20,
      desc: 'Some orders produced two invoices after a retry. Finance asked for the duplicates to be voided.',
      ev: [st(400, 'New', 'Anika Rao'), st(398, 'Assigned', 'Service Desk'), st(380, 'In progress', 'Nandha Kumar'),
        st(350, 'Resolved', 'Nandha Kumar', 'Retry now checks for an existing invoice. Duplicates voided.'), st(300, 'Closed', 'Anika Rao')]
    }),
    inc('INC6409020', 'Request for a new test tenant', {
      p: '5 - Planning', cat: 'Request', sub: 'Access', ci: 'Test Tenants', by: 'Daniel Okafor', openedH: 180, end: -3, group: 'Identity and Access L2',
      desc: 'A new test tenant was requested for the partner onboarding project. The project was later postponed.',
      ev: [st(180, 'New', 'Daniel Okafor'), st(176, 'Assigned', 'Service Desk'),
        st(150, 'Cancelled', 'Daniel Okafor', 'Project postponed. No tenant is needed.')]
    })
  ];

  window.SD_DATA = { me: ME, assignees: ASSIGNEES, priorities: PRIORITIES, now: now, today: today, incidents: list };
})();
