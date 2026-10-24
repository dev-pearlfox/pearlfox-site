/* PearlFox Timesheet - the made-up company data (people, projects, tasks). Sample data only: nothing here is real. */
window.TS_DATA = {
  user: { name: 'Nandha Kumar', initials: 'NK', id: '4500102', title: 'Senior Analyst', manager: 'Priya Raman', email: 'nandha.kumar@sample.example.org' },
  target: 8,            // hours expected on each working day (Monday to Friday); weekends expect none
  dueDay: 4,            // a week's timesheet is due on its Friday (0 = Monday)
  projects: [
    { code: 'PRJ-2041', name: 'Customer Portal Revamp', kind: 'project', tasks: ['Development', 'Code review', 'Testing', 'Documentation'] },
    { code: 'PRJ-1187', name: 'Data Migration Wave 2', kind: 'project', tasks: ['Analysis', 'Mapping', 'Validation'] },
    { code: 'PRJ-3310', name: 'Service Desk Automation', kind: 'project', tasks: ['Scripting', 'Support'] },
    { code: 'INT-0001', name: 'Internal', kind: 'internal', tasks: ['Training', 'Team meetings', 'Admin'] },
    { code: 'ABS-0001', name: 'Absence', kind: 'absence', tasks: ['Annual leave', 'Sick leave', 'Public holiday'] }
  ]
};
