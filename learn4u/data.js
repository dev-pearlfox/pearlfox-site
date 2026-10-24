/* PearlFox Learn4U - SAMPLE DATA ONLY.
   Every course, person and date below is made up. Dates are relative to "today", so the Overdue and Due soon cards
   always show something. Nothing here is sent anywhere; progress is kept only in this browser (see common.js). */
(function () {
  var DAY = 864e5;
  var today = new Date(); today.setHours(0, 0, 0, 0); today = today.getTime();

  var ME = { name: 'Nandha Kumar', first: 'Nandha', title: 'Senior Engineer', dept: 'Payments Platform' };
  var CATEGORIES = ['Compliance & Ethics', 'Information Security', 'Data & Privacy', 'Health & Safety', 'Technology', 'Leadership & Skills'];
  var LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

  // kind: Video, Reading, Quiz or Workshop. min = minutes.
  function m(title, kind, min) { return { title: title, kind: kind, min: min }; }
  function course(num, title, category, level, owner, summary, outcomes, modules, extra) {
    var id = 'TRN' + num;
    return {
      id: id, title: title, category: category, level: level, owner: owner, summary: summary, outcomes: outcomes,
      modules: modules.map(function (x, i) { return { id: id + '-M' + (i + 1), title: x.title, kind: x.kind, min: x.min }; }),
      validMonths: (extra && extra.valid) || 12, popular: !!(extra && extra.popular)
    };
  }

  var COURSES = [
    course('4500101', 'Cybersecurity Awareness', 'Information Security', 'Beginner', 'Information Security Office',
      'Spot phishing, protect your accounts and handle company devices safely. Required every year for all employees.',
      ['Recognise phishing and social-engineering attempts', 'Create strong passwords and use multi-factor sign-in', 'Report a suspected security incident quickly'],
      [m('Why security is everyone\'s job', 'Video', 8), m('Phishing and social engineering', 'Video', 14), m('Passwords and multi-factor sign-in', 'Reading', 10), m('Safe use of laptops and phones', 'Reading', 9), m('Knowledge check', 'Quiz', 10)], { popular: true }),
    course('4500102', 'Data Privacy & GDPR', 'Data & Privacy', 'Beginner', 'Data Protection Office',
      'What personal data is, when you may use it and what to do when something goes wrong.',
      ['Tell personal data from other data', 'Apply the basic principles of GDPR in daily work', 'Know how to report a data breach within 72 hours'],
      [m('What counts as personal data', 'Video', 10), m('The seven GDPR principles', 'Reading', 15), m('Rights of the people whose data you hold', 'Reading', 12), m('Reporting a data breach', 'Video', 9), m('Knowledge check', 'Quiz', 10)], { popular: true }),
    course('4500103', 'Workplace Safety Essentials', 'Health & Safety', 'Beginner', 'Facilities and Safety',
      'Keep yourself and your colleagues safe in the office, in the lab and when working from home.',
      ['Spot common hazards and report them', 'Set up a safe workstation', 'Know your site\'s first-aid and assembly points'],
      [m('Hazards at work', 'Video', 9), m('Safe workstation and posture', 'Reading', 8), m('Working safely from home', 'Reading', 8), m('Knowledge check', 'Quiz', 8)]),
    course('4500104', 'Code of Conduct & Business Ethics', 'Compliance & Ethics', 'Beginner', 'Compliance Office',
      'How we expect everyone to act, and where to go when something does not feel right.',
      ['Apply the Code of Conduct to everyday decisions', 'Handle gifts, conflicts of interest and speaking up', 'Use the confidential ethics line'],
      [m('Our values and the Code', 'Video', 11), m('Conflicts of interest and gifts', 'Reading', 12), m('Speaking up without fear', 'Video', 8), m('Case studies', 'Workshop', 20), m('Knowledge check', 'Quiz', 10)], { popular: true }),
    course('4500105', 'Anti-Bribery and Corruption', 'Compliance & Ethics', 'Intermediate', 'Compliance Office',
      'Recognise bribery in its many forms and know what is allowed when dealing with partners and officials.',
      ['Recognise bribes, facilitation payments and kickbacks', 'Handle hospitality and third-party risk correctly', 'Escalate a doubtful request'],
      [m('What counts as a bribe', 'Video', 12), m('Gifts and hospitality rules', 'Reading', 10), m('Working with third parties', 'Reading', 12), m('Knowledge check', 'Quiz', 10)]),
    course('4500106', 'Handling Confidential Information', 'Data & Privacy', 'Beginner', 'Information Security Office',
      'Classify, share and store company information the right way.',
      ['Use the four information classes', 'Share files safely inside and outside the company', 'Clear your desk and screen'],
      [m('The four information classes', 'Reading', 9), m('Sharing files safely', 'Video', 10), m('Clean desk and clear screen', 'Reading', 6)]),
    course('4500107', 'Secure Coding Fundamentals', 'Technology', 'Intermediate', 'Engineering Academy',
      'The ten mistakes behind most vulnerabilities, and how to avoid them in code review and in daily work.',
      ['Prevent injection and broken access control', 'Handle secrets and dependencies safely', 'Review code with security in mind'],
      [m('Injection and input handling', 'Video', 18), m('Authentication and sessions', 'Video', 16), m('Secrets and dependencies', 'Reading', 14), m('Secure code review', 'Workshop', 30), m('Knowledge check', 'Quiz', 12)]),
    course('4500108', 'Cloud Basics for Engineers', 'Technology', 'Beginner', 'Engineering Academy',
      'Compute, storage, networking and cost: the essentials every engineer needs before touching the cloud.',
      ['Explain the main cloud service types', 'Read a simple architecture diagram', 'Keep cloud costs under control'],
      [m('Cloud service types', 'Video', 15), m('Networking in the cloud', 'Video', 14), m('Storage and databases', 'Reading', 12), m('Cost awareness', 'Reading', 10)], { valid: 24 }),
    course('4500109', 'Incident Response Essentials', 'Information Security', 'Intermediate', 'Information Security Office',
      'What to do in the first hour of a security or service incident.',
      ['Follow the incident response steps', 'Communicate clearly under pressure', 'Write a useful post-incident review'],
      [m('The incident life cycle', 'Video', 13), m('Roles and communication', 'Reading', 10), m('Table-top exercise', 'Workshop', 30), m('Writing the review', 'Reading', 8)]),
    course('4500110', 'Effective Communication at Work', 'Leadership & Skills', 'Beginner', 'People Development',
      'Clear writing, short meetings and listening well, for teams that work across time zones.',
      ['Write mails people act on', 'Run a meeting with a clear outcome', 'Listen and ask better questions'],
      [m('Writing clearly', 'Video', 12), m('Better meetings', 'Video', 10), m('Listening and questions', 'Reading', 9), m('Practice exercise', 'Workshop', 20)], { valid: 36 }),
    course('4500111', 'Giving and Receiving Feedback', 'Leadership & Skills', 'Intermediate', 'People Development',
      'Make feedback specific, kind and useful, in both directions.',
      ['Use a simple structure for feedback', 'Receive feedback without defending', 'Hold a short feedback talk'],
      [m('A simple structure', 'Video', 10), m('Receiving feedback', 'Reading', 8), m('Role-play', 'Workshop', 25)], { valid: 36 }),
    course('4500112', 'Time Management and Focus', 'Leadership & Skills', 'Beginner', 'People Development',
      'Plan your week, protect deep-work time and say no without friction.',
      ['Plan the week around priorities', 'Protect focus time', 'Handle interruptions'],
      [m('Planning your week', 'Video', 9), m('Deep work and distractions', 'Reading', 8), m('Saying no', 'Video', 7)], { valid: 36 }),
    course('4500113', 'Inclusive Workplace', 'Compliance & Ethics', 'Beginner', 'Human Resources',
      'Everyday habits that make teams fair, respectful and welcoming.',
      ['Spot unconscious bias', 'Use inclusive language', 'Act when you see exclusion'],
      [m('Understanding bias', 'Video', 11), m('Inclusive language', 'Reading', 8), m('What to do when you see it', 'Video', 9), m('Knowledge check', 'Quiz', 8)]),
    course('4500114', 'Fire Safety and Emergency Evacuation', 'Health & Safety', 'Beginner', 'Facilities and Safety',
      'What to do when the alarm sounds, and how to help others get out safely.',
      ['Know the evacuation routes and assembly points', 'Use a fire extinguisher correctly', 'Help colleagues who need assistance'],
      [m('Alarms and routes', 'Video', 7), m('Using an extinguisher', 'Video', 8), m('Helping others', 'Reading', 5)]),
    course('4500115', 'Introduction to Generative AI at Work', 'Technology', 'Beginner', 'Engineering Academy',
      'What generative AI tools can and cannot do, and what company data must never be pasted into them.',
      ['Explain how generative AI works in plain words', 'Choose good uses and avoid risky ones', 'Protect company and personal data'],
      [m('How generative AI works', 'Video', 14), m('Good and risky uses', 'Reading', 10), m('Protecting data', 'Video', 9), m('Knowledge check', 'Quiz', 8)], { popular: true }),
    course('4500116', 'Anti-Money Laundering Basics', 'Compliance & Ethics', 'Intermediate', 'Compliance Office',
      'How money laundering works in payments, the warning signs to watch for and how to raise a suspicious activity report.',
      ['Explain the three stages of money laundering', 'Recognise red flags in customer and transaction behaviour', 'Raise a suspicious activity report without tipping anyone off'],
      [m('How money gets laundered', 'Video', 13), m('Red flags in payments', 'Reading', 12), m('Know your customer checks', 'Reading', 10), m('Raising a suspicious activity report', 'Video', 9), m('Case studies', 'Workshop', 20), m('Knowledge check', 'Quiz', 10)], { valid: 12 }),
    course('4500117', 'Managing Stress and Wellbeing', 'Health & Safety', 'Beginner', 'Human Resources',
      'Notice the early signs of stress in yourself and your team, build small daily habits and know where to find support.',
      ['Recognise early signs of stress and burnout', 'Build simple routines for sleep, breaks and movement', 'Find confidential support when you need it'],
      [m('Understanding stress', 'Video', 9), m('Small habits that help', 'Reading', 8), m('Supporting a colleague', 'Video', 8), m('Where to get help', 'Reading', 5)], { valid: 24 }),
    course('4500118', 'Open Source and Software Supply Chain Risk', 'Technology', 'Advanced', 'Engineering Academy',
      'Choose, review and track third-party code: licences, vulnerable dependencies and what a software bill of materials is for.',
      ['Check an open-source licence before you use a library', 'Find and fix vulnerable dependencies', 'Read and keep a software bill of materials'],
      [m('Open-source licences in practice', 'Video', 16), m('Vulnerable dependencies', 'Video', 15), m('Software bill of materials', 'Reading', 12), m('Pinning, signing and updating', 'Reading', 14), m('Audit a sample project', 'Workshop', 35), m('Knowledge check', 'Quiz', 12)])
  ];

  // The learner's starting list. due = days from today (negative = already late). done = modules finished so far.
  // completed = days ago the course was finished. by = who assigned it.
  var START = [
    { id: 'TRN4500101', mandatory: true,  assigned: 40,  due: -3,  done: 2, by: 'Learning & Development' },
    { id: 'TRN4500102', mandatory: true,  assigned: 12,  due: 4,   done: 0, by: 'Learning & Development' },
    { id: 'TRN4500103', mandatory: true,  assigned: 5,   due: 21,  done: 0, by: 'Learning & Development' },
    { id: 'TRN4500105', mandatory: true,  assigned: 20,  due: 45,  done: 1, by: 'Compliance Office' },
    { id: 'TRN4500110', mandatory: false, assigned: 9,   due: 60,  done: 0, by: 'Nandha Kumar' },
    { id: 'TRN4500116', mandatory: true,  assigned: 8,   due: 14,  done: 0, by: 'Compliance Office' },
    { id: 'TRN4500117', mandatory: false, assigned: 3,   due: 90,  done: 1, by: 'Human Resources' },
    { id: 'TRN4500118', mandatory: false, assigned: 10,  due: 6,   done: 2, by: 'Engineering Academy' },
    { id: 'TRN4500104', mandatory: true,  assigned: 95,  due: -30, done: 5, completed: 40,  by: 'Learning & Development' },
    { id: 'TRN4500107', mandatory: false, assigned: 140, due: -60, done: 5, completed: 90,  by: 'Nandha Kumar' },
    { id: 'TRN4500114', mandatory: true,  assigned: 230, due: -170, done: 3, completed: 200, by: 'Facilities and Safety' }
  ];

  window.L4U_DATA = { today: today, day: DAY, me: ME, categories: CATEGORIES, levels: LEVELS, courses: COURSES, start: START };
})();
