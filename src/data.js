const base='https://github.com/aliibakhtiyar/';
export const github='https://github.com/aliibakhtiyar';
export const linkedin='https://in.linkedin.com/in/ali-bakhtiyar-b224b229a';

const unisphere={
  id:'student-project-main',
  name:'UniSphere',
  category:'Full stack',
  screenshot:true,
  liveUrl:'https://student-project-main-1.onrender.com/dashboard',
  url:base+'student-project-main',
  tagline:'Learn. Compete. Collaborate. Grow.',
  description:'A student platform for academic planning, coding practice, campus collaboration and career development.',
  stack:['React','Node.js','MongoDB','Tailwind CSS','Socket.IO'],
  featuresTitle:'Complete features',
  features:[
    'Student Dashboard – Personalized dashboard and activity tracking.',
    'Hackathons & Events – Discover, register for and participate in competitions.',
    'GitHub Integration – Track repositories and coding contributions.',
    'LinkedIn Integration – Connect professional profiles.',
    'LeetCode Integration – Track coding progress and problem-solving stats.',
    'Skill Statistics – Analyze skills, performance and growth.',
    'Global Leaderboard – Student rankings, XP and achievements.',
    'PvP Battle Arena – Real-time one-on-one coding and quiz battles.',
    'Study Rooms – Collaborative group study and discussions.',
    'AI Resume Builder – Generate ATS-friendly resumes.',
    'AI Career Assistant – Career guidance and personalized recommendations.',
    'AI Quiz & Challenges – AI-generated quizzes and skill-based challenges.',
    'AI Skill Analysis – Identify strengths and weaknesses.',
    'AI Team Builder – Find teammates based on skills.',
    'Student Community – Connect, communicate and collaborate.',
    'Jobs & Internships – Discover career opportunities.',
    'Project Showcase – Showcase projects and achievements.',
    'Google Classroom Integration – Academic updates and assignments.',
    'Mentor Connect – Connect with mentors and experienced developers.',
    'Notifications System – Real-time alerts for events, battles and opportunities.'
  ]
};

const liveSites=[
  {
    id:'taskassist',
    name:'TaskAssist',
    liveUrl:'https://taskassist.netlify.app/',
    description:'A personal productivity dashboard for organizing tasks and tracking study progress.',
    features:['Study streaks, goals and progress charts','Calendar, notes and revision tracker','Local autosave']
  },
  {
    id:'first-coffee',
    name:'1st Coffee',
    liveUrl:'https://firstcoffeeee.netlify.app/',
    description:'A website for a specialty coffee shop in Vasant Vihar, New Delhi.',
    features:['Coffee and seasonal drink menu','Online ordering and visit information']
  },
  {
    id:'eden-cafe',
    name:'The Eden Cafe Rooftop',
    liveUrl:'https://thee1.netlify.app/',
    description:'A rooftop café website for visitors in Jamia Nagar, New Delhi.',
    features:['Menu and gallery','Table reservations and home delivery links']
  },
  {
    id:'beyond-the-code',
    name:'Beyond the Code',
    liveUrl:'https://roadmapmern.netlify.app/',
    description:'A 60-day learning roadmap covering MERN fundamentals, generative AI projects and production engineering.',
    features:['Guided 60-day learning path','Web development and generative AI projects','Security, performance and reliability topics']
  }
].map(project=>({...project,category:'Live sites',screenshot:true}));

const repositories=[
  {
    name:'Thruft Clothing',
    repo:'thruftclothing',
    category:'Frontend',
    screenshot:true,
    liveUrl:'https://aliibakhtiyar.github.io/thruftclothing/',
    description:'A fashion landing page centered on upcycling clothes and fabrics.',
    features:['Editorial typography and fashion imagery','Pricing and sustainability sections','Trial and video calls to action']
  },
  {
    name:'Jayzhushi Portfolio Study',
    repo:'Jayzhushiwebclone',
    category:'Frontend',
    screenshot:true,
    liveUrl:'https://aliibakhtiyar.github.io/Jayzhushiwebclone/',
    description:'A frontend recreation of Jayzhushi’s design portfolio for UI practice.',
    features:['Typography-led homepage','Project gallery and About navigation','Theme and sound controls in the header']
  },
 {name:'MediCall AI',repo:'medicall-ai',category:'AI',number:'01',theme:'medical',symbol:'✳',description:'A conversational AI application for doctor and appointment queries, with a React client, Express server and voice conversation mode.',stack:['React','Tailwind CSS','Express','MongoDB','Vapi','Groq'],features:['React client and Node.js API','Doctor and appointment chat interface','Live voice conversation and transcription flow','Patient token and authentication logic'],source:'README, client/server package manifests and client App.jsx'},
 {name:'Laundry Order Management',repo:'Laundry-Order',category:'Full stack',number:'04',theme:'laundry',symbol:'▤',description:'A full-stack dry-cleaning order management system with status tracking and a business dashboard.',stack:['React','Tailwind CSS','Express','MongoDB'],features:['Garment order creation and billing','Search and status filters','Revenue dashboard and order editing'],source:'Repository README'},
 {name:'Al-Zaika',repo:'al-zaika',category:'Frontend',screenshot:true,number:'06',theme:'food',symbol:'◒',description:'A restaurant-themed web front end with a restaurant search interface and food-tracking navigation.',stack:['HTML','CSS','JavaScript'],features:['Static web application','Restaurant search interface','Food-tracking navigation in the page markup'],source:'Repository root directory'},
 {name:'BOOKHUB',repo:'BOOKHUB',category:'Full stack',number:'07',theme:'book',symbol:'▱',description:'A project organized into frontend and backend folders, with a React frontend and form/API integration dependencies.',stack:['React','Tailwind CSS','Axios','React Hook Form'],features:['Separate frontend and backend','React frontend','Form and HTTP client dependencies'],source:'Repository root and frontend package manifest'},
  {
    name:'Zomato Insta',
    repo:'Zomato-insta',
    category:'Archive',
    tagline:'Reel-based food ordering UI',
    description:'A food-ordering UI concept that lets diners discover dishes through short restaurant videos and add the dish they’re watching to a cart.',
    featuresTitle:'Ordering flow',
    features:['Vertical food reels for browsing dishes','Dish details and pricing alongside the reel','Add-to-cart action for the dish in view']
  }
].map(project=>({...project,id:project.repo.toLowerCase(),url:base+project.repo}));

export const projects=[unisphere,...liveSites,...repositories];
export const skills=[['HTML','Frontend','Semantic page structure'],['CSS','Frontend','Responsive styling and layouts'],['JavaScript','Frontend','Interactive web applications'],['React','Frontend','Component-based UI'],['Tailwind CSS','Frontend','Utility-first styling'],['GSAP','Creative','Timeline-based web animation'],['Node.js','Backend','JavaScript server runtime'],['Express','Backend','REST API development'],['MongoDB','Backend','Document database'],['C++','Programming','Programming and problem solving'],['Python','Programming','Scripting and AI applications'],['Git','Tools','Version control'],['GitHub','Tools','Repository collaboration'],['Next.js','Learning','Currently exploring routing and rendering in Next.js']];
