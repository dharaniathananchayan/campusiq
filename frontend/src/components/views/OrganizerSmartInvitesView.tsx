import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Search,
  Filter,
  Send,
  CheckCircle2,
  ChevronDown,
  Mail,
  Bell,
  Smartphone,
  Download,
  ArrowLeft,
  Users,
  TrendingUp,
  Sliders,
  CheckSquare,
  Square,
  Tag,
  ExternalLink,
  RefreshCw,
  Edit3,
  Bot,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { INITIAL_ORGANIZER_EVENTS, OrganizerEventItem } from './OrganizerMyEventsView';

export interface RecommendedStudent {
  id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  avatarInitials: string;
  matchScore: number;
  matchReason: string;
  keySkills: string[];
  status: 'recommended' | 'invited' | 'accepted' | 'declined';
  invitedAt?: string;
  channel?: 'email' | 'in_app' | 'all';
}

// Event-specific tailored recommended students database
const EVENT_SMART_INVITES_DATA: Record<string, {
  targetAudienceKicker: string;
  matchRationaleSummary: string;
  defaultInviteSubject: string;
  defaultInviteMessage: string;
  students: RecommendedStudent[];
}> = {
  // 1. HackNight: Build & Ship in 12 Hours
  'ev-live-1': {
    targetAudienceKicker: 'Hardware hackers, rapid full-stack sprinters & open-source builders',
    matchRationaleSummary: 'Cross-matched against GitHub commit velocity, robotics lab attendance, and collegiate hackathon project history.',
    defaultInviteSubject: 'Special Invitation: Fast-Track spot reserved for HackNight (Lab 104)',
    defaultInviteMessage: "Hey {student_name}, your recent build streak and hardware prototyping caught our attention. We're reserving an exclusive sponsor-mentored desk for you at HackNight: Build & Ship.",
    students: [
      {
        id: 'hn-stu-1',
        name: 'Priya Sharma',
        email: 'priya.sharma@university.edu',
        department: 'Electrical Engineering',
        year: 'Year 3',
        avatarInitials: 'PS',
        matchScore: 98,
        matchReason: 'RoboWars champion; saved 3 campus hardware lab sessions; built autonomous rover in ROS & OpenCV.',
        keySkills: ['ROS', 'Python', 'IoT', 'Hardware Kits', 'C++'],
        status: 'recommended',
      },
      {
        id: 'hn-stu-2',
        name: 'Dev Kothari',
        email: 'dev.k@university.edu',
        department: 'Computer Science',
        year: 'Year 2',
        avatarInitials: 'DK',
        matchScore: 96,
        matchReason: '14-day GitHub commit streak; waitlisted for HackNight last term; won Freshers CodeSprint 2025.',
        keySkills: ['Next.js', 'Go', 'FastAPI', 'Docker', 'WebSockets'],
        status: 'recommended',
      },
      {
        id: 'hn-stu-3',
        name: 'Kavya Iyer',
        email: 'kavya.iyer@university.edu',
        department: 'Data Science & AI',
        year: 'Year 3',
        avatarInitials: 'KI',
        matchScore: 93,
        matchReason: 'High-velocity backend developer; deployed collegiate server cluster; top scorer in Distributed Systems.',
        keySkills: ['PostgreSQL', 'Redis', 'Python', 'AWS Cloud', 'FastAPI'],
        status: 'recommended',
      },
      {
        id: 'hn-stu-4',
        name: 'Aditya Verma',
        email: 'aditya.v@university.edu',
        department: 'Computer Science',
        year: 'Year 1',
        avatarInitials: 'AV',
        matchScore: 90,
        matchReason: 'Top 5 in Fresher CodeWars; passionate full-stack prototyper with 3 completed shipping projects.',
        keySkills: ['TypeScript', 'React', 'Tailwind', 'Node.js', 'GraphQL'],
        status: 'recommended',
      },
      {
        id: 'hn-stu-5',
        name: 'Sameer Joshi',
        email: 'sameer.j@university.edu',
        department: 'Electronics & Comm',
        year: 'Year 4',
        avatarInitials: 'SJ',
        matchScore: 88,
        matchReason: 'Lead maker at Campus FabLab; expert with ESP32 sensor arrays, 3D printing, and rapid embedded prototyping.',
        keySkills: ['Embedded C', 'PCB Design', 'ESP32', 'MQTT', 'Firmware'],
        status: 'recommended',
      },
      {
        id: 'hn-stu-6',
        name: 'Nina Chen',
        email: 'nina.c@university.edu',
        department: 'Design & Computing',
        year: 'Year 2',
        avatarInitials: 'NC',
        matchScore: 85,
        matchReason: 'Designed UI/UX for 4 previous hackathon demo teams; fastest wireframer in collegiate design guild.',
        keySkills: ['Figma', 'UI/UX', 'Tailwind CSS', 'Pitch Decks', 'Vite'],
        status: 'recommended',
      },
    ],
  },

  // 2. University AI Symposium: Frontiers in Generative Architecture
  'ev-live-2': {
    targetAudienceKicker: 'Foundation model researchers, PyTorch practitioners & AI safety scholars',
    matchRationaleSummary: 'Targeted students with advanced machine learning coursework, AI reading group attendance, and graduate paper publications.',
    defaultInviteSubject: 'Invitation to AI Symposium: Frontiers in Generative Architecture',
    defaultInviteMessage: 'Hello {student_name}, as a researcher in machine learning and data science, we would love to have your perspectives in the audience for the Keynote and Panel discussions.',
    students: [
      {
        id: 'ai-stu-1',
        name: 'Rhea Sengupta',
        email: 'rhea.s@university.edu',
        department: 'Data Science & AI',
        year: 'Year 4',
        avatarInitials: 'RS',
        matchScore: 99,
        matchReason: 'Co-authored NeurIPS student workshop paper on transformer weight quantization; active ML researcher.',
        keySkills: ['PyTorch', 'Transformers', 'CUDA', 'Diffusion Models', 'Math'],
        status: 'recommended',
      },
      {
        id: 'ai-stu-2',
        name: 'Tanmay Bansal',
        email: 'tanmay.b@university.edu',
        department: 'Computer Science',
        year: 'Year 3',
        avatarInitials: 'TB',
        matchScore: 96,
        matchReason: 'Built automated campus teaching assistant with LangGraph and RAG; core contributor to agentic open-source tools.',
        keySkills: ['LangChain', 'RAG', 'Vector Embeddings', 'Python', 'Llama-3'],
        status: 'recommended',
      },
      {
        id: 'ai-stu-3',
        name: 'Meera Sundaram',
        email: 'meera.s@university.edu',
        department: 'Mathematics & Computing',
        year: 'Year 2',
        avatarInitials: 'MS',
        matchScore: 94,
        matchReason: 'Top percentile in Linear Algebra & Probability; active speaker in weekly deep learning reading circle.',
        keySkills: ['Statistical Learning', 'JAX', 'PyTorch', 'Optimization'],
        status: 'recommended',
      },
      {
        id: 'ai-stu-4',
        name: 'Arnav Kapoor',
        email: 'arnav.k@university.edu',
        department: 'Computer Science',
        year: 'Year 4',
        avatarInitials: 'AK',
        matchScore: 91,
        matchReason: 'Computer Vision researcher at Robotics Lab; trained vision-language models for spatial reasoning.',
        keySkills: ['Computer Vision', 'PyTorch', 'Multimodal AI', 'ONNX'],
        status: 'recommended',
      },
      {
        id: 'ai-stu-5',
        name: 'Ishita Ray',
        email: 'ishita.r@university.edu',
        department: 'Cognitive Science & AI',
        year: 'Year 3',
        avatarInitials: 'IR',
        matchScore: 88,
        matchReason: 'President of Responsible AI initiative; conducted evaluation on alignment and hallucination mitigation.',
        keySkills: ['AI Ethics', 'NLP Evaluation', 'RLHF', 'Explainability'],
        status: 'recommended',
      },
      {
        id: 'ai-stu-6',
        name: 'Siddharth Rao',
        email: 'siddharth.r@university.edu',
        department: 'Electrical Engineering',
        year: 'Year 3',
        avatarInitials: 'SR',
        matchScore: 86,
        matchReason: 'Focuses on edge tensor accelerators; prototyped FPGA inference engine for quantised LLMs.',
        keySkills: ['Hardware Accelerators', 'Verilog', 'C++', 'Model Quantization'],
        status: 'recommended',
      },
    ],
  },

  // 3. Venture Sprint: Campus Startup Pitch & Investor Showcase
  'ev-live-3': {
    targetAudienceKicker: 'Student founders, E-Cell leads, product strategists & venture fellows',
    matchRationaleSummary: 'Scored by entrepreneurship club involvement, pre-incubator applications, pitch competition wins, and business case records.',
    defaultInviteSubject: 'Exclusive Founder Pass: Pitch & Connect at Venture Sprint 2026',
    defaultInviteMessage: 'Hi {student_name}, with your active venture initiatives and leadership track record, we want to invite you to connect directly with visiting alumni angels and partners.',
    students: [
      {
        id: 'vs-stu-1',
        name: 'Kabir Singhania',
        email: 'kabir.s@university.edu',
        department: 'Management & CS',
        year: 'Year 3',
        avatarInitials: 'KS',
        matchScore: 98,
        matchReason: 'E-Cell President; bootstrapping micro-SaaS with $1.2k MRR; finalist at National Collegiate E-Summit.',
        keySkills: ['Product Strategy', 'Venture Pitching', 'B2B Sales', 'Financial Modeling'],
        status: 'recommended',
      },
      {
        id: 'vs-stu-2',
        name: 'Aanya Patel',
        email: 'aanya.p@university.edu',
        department: 'Economics & Finance',
        year: 'Year 2',
        avatarInitials: 'AP',
        matchScore: 95,
        matchReason: 'Won Inter-Collegiate Case Study 2025; student venture analyst lead at Campus Angel Syndicate.',
        keySkills: ['Valuation', 'Pitch Decks', 'Fintech', 'Market Analysis'],
        status: 'recommended',
      },
      {
        id: 'vs-stu-3',
        name: 'Rohan Chawla',
        email: 'rohan.c@university.edu',
        department: 'Design & Product',
        year: 'Year 4',
        avatarInitials: 'RC',
        matchScore: 92,
        matchReason: 'Led UX & onboarding for 3 student startups; completed Y Combinator Startup School curriculum.',
        keySkills: ['Product Management', 'Growth Hacking', 'UI/UX', 'Figma'],
        status: 'recommended',
      },
      {
        id: 'vs-stu-4',
        name: 'Sanya Khurana',
        email: 'sanya.k@university.edu',
        department: 'Biotech & Business',
        year: 'Year 3',
        avatarInitials: 'SK',
        matchScore: 89,
        matchReason: 'Pre-seed university grant winner for low-cost portable diagnostics device; seeking co-founders and capital.',
        keySkills: ['HealthTech', 'Grant Applications', 'IP Strategy', 'Pitching'],
        status: 'recommended',
      },
      {
        id: 'vs-stu-5',
        name: 'Nikhil Malhotra',
        email: 'nikhil.m@university.edu',
        department: 'Computer Science',
        year: 'Year 3',
        avatarInitials: 'NM',
        matchScore: 87,
        matchReason: 'Developer tooling builder; looking for a business/GTM co-founder for a local code intelligence tool.',
        keySkills: ['DevTools', 'SaaS Architecture', 'Product-Led Growth'],
        status: 'recommended',
      },
      {
        id: 'vs-stu-6',
        name: "Natasha D'Souza",
        email: 'natasha.d@university.edu',
        department: 'Media & Communications',
        year: 'Year 2',
        avatarInitials: 'ND',
        matchScore: 84,
        matchReason: 'Campus PR lead; managed viral product launch campaigns for university creators and club merchandise.',
        keySkills: ['Go-To-Market', 'Branding', 'Community Building', 'Social PR'],
        status: 'recommended',
      },
    ],
  },

  // 4. HackCampus 2026: 36-Hour National Collegiate Hackathon
  'ev-live-4': {
    targetAudienceKicker: 'Cross-functional sprint captains, competitive coders & grand prize winners',
    matchRationaleSummary: 'Filtered across national hackathon podium finishes, collaborative GitHub repos, and high-intensity sprint endurance.',
    defaultInviteSubject: 'VIP Spot: HackCampus 2026 (36-Hour National Hackathon)',
    defaultInviteMessage: 'Hey {student_name}, with $25k in prizes and top hardware sponsor labs, we are offering you an automatic priority badge for HackCampus 2026.',
    students: [
      {
        id: 'hc-stu-1',
        name: 'Zara Merchant',
        email: 'zara.m@university.edu',
        department: 'Computer Science & Design',
        year: 'Year 3',
        avatarInitials: 'ZM',
        matchScore: 99,
        matchReason: '3x National Hackathon Podium winner; Figma & React frontend wizard with over $10k in prize awards.',
        keySkills: ['React', 'Figma', 'UI/UX', 'Pitch Demos', 'Tailwind'],
        status: 'recommended',
      },
      {
        id: 'hc-stu-2',
        name: 'Farhan Akhtar',
        email: 'farhan.a@university.edu',
        department: 'Information Science',
        year: 'Year 2',
        avatarInitials: 'FA',
        matchScore: 96,
        matchReason: 'Built high-throughput real-time game server handling 5k concurrent WebSockets; master of backend APIs.',
        keySkills: ['Go', 'WebSockets', 'Redis', 'Docker', 'Distributed Systems'],
        status: 'recommended',
      },
      {
        id: 'hc-stu-3',
        name: 'Ritika Das',
        email: 'ritika.d@university.edu',
        department: 'Robotics & Mechanical',
        year: 'Year 4',
        avatarInitials: 'RD',
        matchScore: 93,
        matchReason: 'Hardware sprint team lead; fabricated autonomous sorting bin in under 24 hours at Smart Tech 2025.',
        keySkills: ['SolidWorks', 'Arduino', 'Sensors', 'Rapid 3D Print', 'Actuators'],
        status: 'recommended',
      },
      {
        id: 'hc-stu-4',
        name: 'Harsh Vardhan',
        email: 'harsh.v@university.edu',
        department: 'Computer Science',
        year: 'Year 1',
        avatarInitials: 'HV',
        matchScore: 90,
        matchReason: 'Codeforces Candidate Master; rapid algorithmic problem solver capable of integrating complex APIs in hours.',
        keySkills: ['Algorithms', 'C++', 'Python', 'Fast Prototyping', 'REST APIs'],
        status: 'recommended',
      },
      {
        id: 'hc-stu-5',
        name: 'Anika Bose',
        email: 'anika.b@university.edu',
        department: 'Electronics & IoT',
        year: 'Year 3',
        avatarInitials: 'AB',
        matchScore: 88,
        matchReason: 'Constructed hostel air quality sensor mesh with MQTT and dashboard telemetry; keen hardware hacker.',
        keySkills: ['ESP32', 'LoRaWAN', 'MQTT', 'Telemetry', 'C++'],
        status: 'recommended',
      },
      {
        id: 'hc-stu-6',
        name: 'Tushar Sen',
        email: 'tushar.s@university.edu',
        department: 'Data Science',
        year: 'Year 3',
        avatarInitials: 'TS',
        matchScore: 85,
        matchReason: 'Kaggle Notebooks Expert; experienced at building predictive models and interactive Streamlit demos on the fly.',
        keySkills: ['Python', 'Streamlit', 'Scikit-Learn', 'FastAPI', 'Pandas'],
        status: 'recommended',
      },
    ],
  },

  // 5. Zero to Hacker: CTF Weekend Lab & Security Workshop
  'ev-draft-1': {
    targetAudienceKicker: 'Ethical hackers, Linux enthusiasts, reverse engineers & infosec learners',
    matchRationaleSummary: 'Evaluated against campus cybersecurity guild participation, Linux lab certifications, and CTF scoreboard points.',
    defaultInviteSubject: 'Invitation to CTF Weekend: Zero to Hacker Hands-on Lab',
    defaultInviteMessage: 'Hi {student_name}, we are hosting a hands-on security workshop with live jeopardy-style reverse engineering. We want you on the flag leaderboard!',
    students: [
      {
        id: 'ctf-stu-1',
        name: 'Devin Cole',
        email: 'devin.c@university.edu',
        department: 'Cybersecurity & CS',
        year: 'Year 2',
        avatarInitials: 'DC',
        matchScore: 99,
        matchReason: 'Top 50 collegiate student on HackTheBox; completed 42 machine root flags; lead in campus Infosec Guild.',
        keySkills: ['Linux PrivEsc', 'Binary Exploitation', 'Ghidra', 'Forensics', 'Bash'],
        status: 'recommended',
      },
      {
        id: 'ctf-stu-2',
        name: 'Pooja Hegde',
        email: 'pooja.h@university.edu',
        department: 'Computer Science',
        year: 'Year 3',
        avatarInitials: 'PH',
        matchScore: 96,
        matchReason: 'Discovered security vulnerability in student portal; proficient in x86 disassembly and web exploit chains.',
        keySkills: ['Reverse Engineering', 'Burp Suite', 'Web Security', 'Assembly'],
        status: 'recommended',
      },
      {
        id: 'ctf-stu-3',
        name: 'Amanullah Syed',
        email: 'aman.s@university.edu',
        department: 'Networking & Systems',
        year: 'Year 2',
        avatarInitials: 'AS',
        matchScore: 93,
        matchReason: 'Won campus internal networking capture-the-flag; deeply skilled with packet analyzers and network defense.',
        keySkills: ['Wireshark', 'Network Penetration', 'Linux Kernel', 'Nmap'],
        status: 'recommended',
      },
      {
        id: 'ctf-stu-4',
        name: 'Shreya Bhatnagar',
        email: 'shreya.b@university.edu',
        department: 'Information Technology',
        year: 'Year 1',
        avatarInitials: 'SB',
        matchScore: 91,
        matchReason: 'Enthusiastic beginner who completed cryptography fundamentals seminar; looking to join competitive CTF team.',
        keySkills: ['Cryptography', 'Python', 'Web Exploits', 'Linux Basics'],
        status: 'recommended',
      },
      {
        id: 'ctf-stu-5',
        name: 'Kartik Pillai',
        email: 'kartik.p@university.edu',
        department: 'Computer Science',
        year: 'Year 3',
        avatarInitials: 'KP',
        matchScore: 88,
        matchReason: 'Web penetration testing specialist; solved 60+ challenges on TryHackMe with high accuracy.',
        keySkills: ['OWASP Top 10', 'SQLi', 'Auth Bypass', 'JWT Security'],
        status: 'recommended',
      },
      {
        id: 'ctf-stu-6',
        name: 'Manav Dave',
        email: 'manav.d@university.edu',
        department: 'Electronics & Comm',
        year: 'Year 4',
        avatarInitials: 'MD',
        matchScore: 85,
        matchReason: 'Hardware security enthusiast; experienced in UART and JTAG firmware extraction on IoT microcontrollers.',
        keySkills: ['Hardware Security', 'JTAG', 'Firmware Extraction', 'Logic Analyzers'],
        status: 'recommended',
      },
    ],
  },
};

// Fallback procedural generator for custom / other events
const getFallbackSmartInvites = (event: OrganizerEventItem) => {
  const isDesign = event.category.toLowerCase().includes('art') || event.title.toLowerCase().includes('design');
  const isBiz = event.category.toLowerCase().includes('business') || event.category.toLowerCase().includes('leader');
  
  if (isDesign) {
    return {
      targetAudienceKicker: 'UI/UX designers, creative technologists & human-centered design thinkers',
      matchRationaleSummary: `Matched across design portfolio submissions, Figma community usage, and interaction coursework for ${event.title}.`,
      defaultInviteSubject: `Exclusive Invitation: ${event.title}`,
      defaultInviteMessage: `Hi {student_name}, we loved your design and creative prototyping work. Join us at ${event.title} to share your creativity!`,
      students: [
        { id: `gen-d-1`, name: 'Ananya Menon', email: 'ananya.m@university.edu', department: 'Design', year: 'Year 3', avatarInitials: 'AM', matchScore: 98, matchReason: 'Created campus design system; Figma community advocate with 1.2k downloads.', keySkills: ['Design Systems', 'Figma', 'User Research', 'Typography'], status: 'recommended' as const },
        { id: `gen-d-2`, name: 'Leo Garcia', email: 'leo.g@university.edu', department: 'HCI & Media', year: 'Year 2', avatarInitials: 'LG', matchScore: 95, matchReason: 'Prototyped accessible mobile library app; skilled in motion design & Framer.', keySkills: ['Framer', 'Micro-interactions', 'Accessibility', 'Mobile UX'], status: 'recommended' as const },
        { id: `gen-d-3`, name: 'Tara Mukherjee', email: 'tara.m@university.edu', department: 'Visual Arts', year: 'Year 4', avatarInitials: 'TM', matchScore: 91, matchReason: '3D interactive artist using Three.js and Blender for virtual museum showcase.', keySkills: ['Three.js', 'Blender', 'Creative Coding', 'Spatial Design'], status: 'recommended' as const },
        { id: `gen-d-4`, name: 'Kunal Sen', email: 'kunal.s@university.edu', department: 'Computer Science', year: 'Year 2', avatarInitials: 'KS', matchScore: 88, matchReason: 'Frontend engineer with acute aesthetic eye; contributed to university web portal revamp.', keySkills: ['CSS Animations', 'Tailwind', 'Svelte', 'Design Engineering'], status: 'recommended' as const },
      ],
    };
  }

  if (isBiz) {
    return {
      targetAudienceKicker: 'Strategy consultants, case competition champions & collegiate leaders',
      matchRationaleSummary: `Cross-referenced with economics clubs, case study tournament rankings, and corporate networking records for ${event.title}.`,
      defaultInviteSubject: `Leadership Invitation: ${event.title}`,
      defaultInviteMessage: `Hi {student_name}, your analytical case work and collegiate initiative make you an ideal participant for ${event.title}.`,
      students: [
        { id: `gen-b-1`, name: 'Arjun Singhal', email: 'arjun.s@university.edu', department: 'Economics', year: 'Year 3', avatarInitials: 'AS', matchScore: 97, matchReason: 'President of Finance & Consulting Club; won Inter-University Case Trophy 2025.', keySkills: ['Case Competitions', 'Corporate Strategy', 'Financial Modeling'], status: 'recommended' as const },
        { id: `gen-b-2`, name: 'Bhavna Roy', email: 'bhavna.r@university.edu', department: 'Management Studies', year: 'Year 2', avatarInitials: 'BR', matchScore: 94, matchReason: 'Managed corporate sponsorships for national cultural fest; exceptional negotiation skills.', keySkills: ['Partnerships', 'Public Speaking', 'Event Operations'], status: 'recommended' as const },
        { id: `gen-b-3`, name: 'Vikram Seth', email: 'vikram.s@university.edu', department: 'Commerce & Law', year: 'Year 4', avatarInitials: 'VS', matchScore: 90, matchReason: 'Published paper on fintech regulatory compliance; leading collegiate moot court team.', keySkills: ['Fintech Law', 'Market Research', 'Compliance', 'Negotiation'], status: 'recommended' as const },
      ],
    };
  }

  // Default Tech / Engineering fallback
  return {
    targetAudienceKicker: 'Top-ranking technical problem solvers and active laboratory participants',
    matchRationaleSummary: `Tailored according to semester programming projects, campus club memberships, and workshop attendance for ${event.title}.`,
    defaultInviteSubject: `Priority Invitation: Spot saved for ${event.title}`,
    defaultInviteMessage: `Hi {student_name}, based on your strong performance in campus technology initiatives, you have been selected for priority access to ${event.title}.`,
    students: [
      { id: `gen-t-1`, name: 'Aditya Sen', email: 'aditya.s@university.edu', department: 'Computer Science', year: 'Year 3', avatarInitials: 'AS', matchScore: 95, matchReason: `Demonstrated high aptitude in practical labs; active in campus peer coding mentoring.`, keySkills: ['Python', 'System Design', 'Git', 'Databases'], status: 'recommended' as const },
      { id: `gen-t-2`, name: 'Ritu Varma', email: 'ritu.v@university.edu', department: 'Information Science', year: 'Year 2', avatarInitials: 'RV', matchScore: 92, matchReason: `Ranked in top 10% in departmental algorithmic benchmarks; attended recent workshops.`, keySkills: ['Data Structures', 'Java', 'Web Development'], status: 'recommended' as const },
      { id: `gen-t-3`, name: 'Chirag Nair', email: 'chirag.n@university.edu', department: 'Electronics', year: 'Year 3', avatarInitials: 'CN', matchScore: 89, matchReason: `Experienced in microcontrollers and sensor integration; eager hands-on learner.`, keySkills: ['Arduino', 'C', 'Circuit Simulation'], status: 'recommended' as const },
    ],
  };
};

export const OrganizerSmartInvitesView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Read incoming event ID or default to HackNight
  const incomingEventId = (location.state as any)?.selectedEventId;
  const [selectedEventId, setSelectedEventId] = useState<string>(
    incomingEventId && INITIAL_ORGANIZER_EVENTS.some((e) => e.id === incomingEventId)
      ? incomingEventId
      : INITIAL_ORGANIZER_EVENTS[0]?.id || 'ev-live-1'
  );

  // Search input for event selector
  const [eventSearchQuery, setEventSearchQuery] = useState('');

  // Filtering events for selector
  const availableEvents = useMemo(() => {
    if (!eventSearchQuery.trim()) return INITIAL_ORGANIZER_EVENTS;
    const q = eventSearchQuery.toLowerCase();
    return INITIAL_ORGANIZER_EVENTS.filter(
      (ev) =>
        ev.title.toLowerCase().includes(q) ||
        ev.category.toLowerCase().includes(q) ||
        ev.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [eventSearchQuery]);

  // Selected Event Object
  const selectedEvent = useMemo(() => {
    return (
      INITIAL_ORGANIZER_EVENTS.find((e) => e.id === selectedEventId) ||
      INITIAL_ORGANIZER_EVENTS[0]
    );
  }, [selectedEventId]);

  // Dynamic campaign data tailored for the selected event
  const campaignData = useMemo(() => {
    if (EVENT_SMART_INVITES_DATA[selectedEvent.id]) {
      return EVENT_SMART_INVITES_DATA[selectedEvent.id];
    }
    return getFallbackSmartInvites(selectedEvent);
  }, [selectedEvent]);

  // Local state of students to manage invite dispatches
  const [studentsList, setStudentsList] = useState<RecommendedStudent[]>(campaignData.students);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [minScoreFilter, setMinScoreFilter] = useState(0);

  // Invite Template Customization
  const [inviteSubject, setInviteSubject] = useState(campaignData.defaultInviteSubject);
  const [inviteMessage, setInviteMessage] = useState(campaignData.defaultInviteMessage);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelInApp, setChannelInApp] = useState(true);
  const [channelSMS, setChannelSMS] = useState(false);

  // Sync state whenever selected event changes
  React.useEffect(() => {
    const freshData = EVENT_SMART_INVITES_DATA[selectedEvent.id] || getFallbackSmartInvites(selectedEvent);
    setStudentsList(freshData.students);
    setSelectedStudentIds([]);
    setInviteSubject(freshData.defaultInviteSubject);
    setInviteMessage(freshData.defaultInviteMessage);
  }, [selectedEvent.id]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return studentsList.filter((s) => {
      if (deptFilter !== 'all' && !s.department.toLowerCase().includes(deptFilter.toLowerCase())) {
        return false;
      }
      if (s.matchScore < minScoreFilter) return false;
      if (searchStudentQuery.trim()) {
        const q = searchStudentQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesDept = s.department.toLowerCase().includes(q);
        const matchesSkills = s.keySkills.some((sk) => sk.toLowerCase().includes(q));
        const matchesReason = s.matchReason.toLowerCase().includes(q);
        if (!matchesName && !matchesDept && !matchesSkills && !matchesReason) return false;
      }
      return true;
    });
  }, [studentsList, deptFilter, minScoreFilter, searchStudentQuery]);

  // Multi-select toggle
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Dispatch single invite
  const handleDispatchSingle = (student: RecommendedStudent) => {
    setStudentsList((prev) =>
      prev.map((s) =>
        s.id === student.id
          ? {
              ...s,
              status: 'invited',
              invitedAt: 'Just now',
              channel: channelEmail && channelInApp ? 'all' : channelEmail ? 'email' : 'in_app',
            }
          : s
      )
    );
    toast.success(`Dispatched personalized Smart Invite to ${student.name} via ${channelEmail ? 'Email' : ''}${channelEmail && channelInApp ? ' & ' : ''}${channelInApp ? 'In-App Alert' : ''}!`);
  };

  // Dispatch selected batch
  const handleDispatchSelected = () => {
    if (selectedStudentIds.length === 0) {
      toast('Please select at least one student to invite.', { icon: 'ℹ️' });
      return;
    }
    const count = selectedStudentIds.length;
    setStudentsList((prev) =>
      prev.map((s) =>
        selectedStudentIds.includes(s.id)
          ? {
              ...s,
              status: 'invited',
              invitedAt: 'Just now',
              channel: 'all',
            }
          : s
      )
    );
    toast.success(`Successfully dispatched ${count} personalized AI Smart Invites!`);
    setSelectedStudentIds([]);
  };

  // 1-Click Dispatch to all recommended
  const handleDispatchAllTop = () => {
    const uninvitedCount = studentsList.filter((s) => s.status === 'recommended').length;
    if (uninvitedCount === 0) {
      toast('All recommended candidates have already been invited!', { icon: '✨' });
      return;
    }
    setStudentsList((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'invited',
        invitedAt: 'Just now',
        channel: 'all',
      }))
    );
    toast.success(`⚡ 1-Click Smart Campaign launched! Dispatched invites to all ${uninvitedCount} AI-matched candidates.`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvContent =
      `data:text/csv;charset=utf-8,Smart Invites Candidate Roster\n` +
      `Event Title,"${selectedEvent.title}"\n` +
      `Category,"${selectedEvent.category}"\n` +
      `Total Recommended,${studentsList.length}\n\n` +
      `Name,Email,Department,Year,MatchScore,MatchReason,Status\n` +
      studentsList
        .map(
          (s) =>
            `"${s.name}","${s.email}","${s.department}","${s.year}",${s.matchScore}%,"${s.matchReason.replace(/"/g, '""')}","${s.status}"`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedEvent.id}_smart_invites.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported Smart Invites candidate roster (CSV)');
  };

  const invitesSentCount = studentsList.filter((s) => s.status === 'invited').length;
  const avgMatchScore = Math.round(
    studentsList.reduce((acc, curr) => acc + curr.matchScore, 0) / (studentsList.length || 1)
  );

  return (
    <div className="space-y-6 text-left w-full font-sans max-w-7xl mx-auto">
      {/* 1. Header with Back Button and Quick Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#e3dfd3]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate('/organizer/dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e65c36] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Overall Overview</span>
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => navigate('/organizer/events')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <span>My Events</span>
            </button>
            <span className="text-slate-300">·</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#113326] text-[#d8fa57] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#d8fa57]" />
              SMART INVITES MODULE
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11241c] tracking-tight">
            AI Smart Invites & Candidate Matchmaker
          </h1>
          <p className="text-xs sm:text-sm text-[#526359] max-w-3xl">
            Semantic vector matching across 4,200 campus student profiles. Every event dynamically derives a unique candidate roster matched specifically to its prerequisites and themes.
          </p>
        </div>

        {/* Action Controls Right */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => navigate(`/organizer/analytics`, { state: { selectedEventId: selectedEvent.id } })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#fbf9f3] text-[#19231e] border border-[#d8d3c5] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span>View Event Analytics</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#113326] hover:bg-[#1a4433] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#d8fa57]" />
            <span>Export Roster CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Event Selector: Type Bar & Dropdown */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#dedbd4] shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Label */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Filter className="w-4 h-4 text-[#e65c36]" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Event to Target:
            </span>
          </div>

          {/* Type Bar (Event Search Input) */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={eventSearchQuery}
              onChange={(e) => {
                const query = e.target.value;
                setEventSearchQuery(query);
                if (query.trim()) {
                  const q = query.toLowerCase();
                  const matched = INITIAL_ORGANIZER_EVENTS.find(
                    (ev) =>
                      ev.title.toLowerCase().includes(q) ||
                      ev.category.toLowerCase().includes(q) ||
                      ev.tags.some((t) => t.toLowerCase().includes(q))
                  );
                  if (matched) {
                    setSelectedEventId(matched.id);
                  }
                }
              }}
              placeholder="Type to search event title, topic or category..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#f7f5ed] border border-[#d8d3c5] rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#113326]/30 transition-all"
            />
          </div>

          {/* Dropdown of Events */}
          <div className="relative w-full sm:w-80 md:w-96 shrink-0">
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                const ev = INITIAL_ORGANIZER_EVENTS.find((x) => x.id === e.target.value);
                if (ev) {
                  toast(`Loaded distinct student recommendations for "${ev.title}"`);
                }
              }}
              className="appearance-none w-full px-3.5 py-2.5 bg-[#f7f5ed] border border-[#d8d3c5] rounded-xl text-xs font-bold text-slate-900 pr-9 focus:outline-none focus:ring-2 focus:ring-[#113326]/30 cursor-pointer shadow-xs truncate"
            >
              {availableEvents.length > 0 ? (
                availableEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.status.toUpperCase()})
                  </option>
                ))
              ) : (
                INITIAL_ORGANIZER_EVENTS.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.status.toUpperCase()})
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 3. Selected Event Context Banner */}
      <div className="bg-gradient-to-br from-[#113326] to-[#184634] text-white rounded-2xl p-5 sm:p-6 border border-[#23533e] shadow-md space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#d8fa57] text-[#113326] uppercase tracking-wider">
                {selectedEvent.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#26533f] text-[#a6c1b3] uppercase tracking-wider">
                ● {selectedEvent.status.toUpperCase()}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1b4433] text-[#c4ded0]">
                Llama-3.1-70b · pgvector embeddings (cosine &gt; 0.82)
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {selectedEvent.title}
            </h2>
            <p className="text-xs text-[#a6c1b3] flex items-center gap-1.5">
              <span>🎯 Target Persona:</span>
              <strong className="text-[#d8fa57] font-semibold">{campaignData.targetAudienceKicker}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDispatchAllTop}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#e65c36] hover:bg-[#d8522d] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>1-Click Dispatch to Top Matches</span>
            </button>
          </div>
        </div>

        <div className="p-3 bg-[#163e2e] rounded-xl border border-[#26533f] text-xs text-[#c4ded0] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#d8fa57] shrink-0" />
            <span>{campaignData.matchRationaleSummary}</span>
          </div>
          <button
            onClick={() => setShowTemplateEditor(!showTemplateEditor)}
            className="text-[#d8fa57] hover:underline font-bold text-xs shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{showTemplateEditor ? 'Close Template' : 'Customize Message'}</span>
          </button>
        </div>

        {/* Expandable Template Customizer */}
        {showTemplateEditor && (
          <div className="p-4 bg-[#0d271d] rounded-xl border border-[#2e624c] space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#d8fa57] uppercase tracking-wider">
                Personalized Invite Template Editor
              </span>
              <div className="flex items-center gap-3 text-xs text-[#c4ded0]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelEmail}
                    onChange={(e) => setChannelEmail(e.target.checked)}
                    className="accent-[#d8fa57]"
                  />
                  <span>Email</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelInApp}
                    onChange={(e) => setChannelInApp(e.target.checked)}
                    className="accent-[#d8fa57]"
                  />
                  <span>In-App Alert</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelSMS}
                    onChange={(e) => setChannelSMS(e.target.checked)}
                    className="accent-[#d8fa57]"
                  />
                  <span>SMS</span>
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#8fa99c] font-bold uppercase">Subject Line</label>
              <input
                type="text"
                value={inviteSubject}
                onChange={(e) => setInviteSubject(e.target.value)}
                className="w-full px-3 py-2 bg-[#163e2e] border border-[#2e624c] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d8fa57]/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#8fa99c] font-bold uppercase">
                Message Body (Supports dynamic tags: {'{student_name}'}, {'{event_title}'})
              </label>
              <textarea
                rows={2}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="w-full px-3 py-2 bg-[#163e2e] border border-[#2e624c] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d8fa57]/40"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. KPI Performance Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-[#dedbd4] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Distinct Matches</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#11241c] font-mono">{studentsList.length}</div>
          <p className="text-[11px] text-slate-500">Filtered for this specific session</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#dedbd4] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Avg Match Fit</span>
            <Sparkles className="w-4 h-4 text-[#d8fa57] bg-[#113326] p-0.5 rounded" />
          </div>
          <div className="text-2xl font-extrabold text-[#11241c] font-mono">{avgMatchScore}%</div>
          <p className="text-[11px] text-emerald-700 font-semibold">High semantic alignment</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#dedbd4] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Invites Dispatched</span>
            <Send className="w-4 h-4 text-[#e65c36]" />
          </div>
          <div className="text-2xl font-extrabold text-[#11241c] font-mono">
            {invitesSentCount} <span className="text-xs text-slate-400 font-normal">/ {studentsList.length}</span>
          </div>
          <p className="text-[11px] text-slate-500">Via multi-channel alerts</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#dedbd4] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Projected Accept</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#11241c] font-mono">72.4%</div>
          <p className="text-[11px] text-slate-500">Based on past AI targeting</p>
        </div>
      </div>

      {/* 5. Filter & Batch Action Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#dedbd4] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Select all toggle */}
          <button
            onClick={handleToggleSelectAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#f7f5ed] hover:bg-[#ede9dc] border border-[#d8d3c5] rounded-lg cursor-pointer text-[#11241c]"
          >
            {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-[#113326]" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0
                ? 'Deselect All'
                : `Select All (${filteredStudents.length})`}
            </span>
          </button>

          {/* Department Filter Pills */}
          <div className="flex items-center gap-1 text-xs">
            {['all', 'Computer Science', 'Data Science', 'Electrical', 'Design', 'Management'].map((dept) => (
              <button
                key={dept}
                onClick={() => setDeptFilter(dept)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  deptFilter === dept
                    ? 'bg-[#113326] text-white font-bold'
                    : 'bg-[#f7f5ed] text-slate-600 hover:bg-[#eae6d8]'
                }`}
              >
                {dept === 'all' ? 'All Depts' : dept}
              </button>
            ))}
          </div>
        </div>

        {/* Right side: Search student & batch dispatch button */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchStudentQuery}
              onChange={(e) => setSearchStudentQuery(e.target.value)}
              placeholder="Search student or skill..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#f7f5ed] border border-[#d8d3c5] rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#113326]/30"
            />
          </div>

          <button
            onClick={handleDispatchSelected}
            disabled={selectedStudentIds.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#e65c36] hover:bg-[#d8522d] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send to Selected ({selectedStudentIds.length})</span>
          </button>
        </div>
      </div>

      {/* 6. Recommended Students Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
          <span>RECOMMENDED CANDIDATE PROFILES FOR THIS EVENT</span>
          <span>Showing {filteredStudents.length} candidates</span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#dedbd4] space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-800 text-sm">No matching student candidates found</p>
            <p className="text-xs text-slate-500">Try loosening your department filter or search keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredStudents.map((student) => {
              const isSelected = selectedStudentIds.includes(student.id);
              const isInvited = student.status === 'invited';

              return (
                <div
                  key={student.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    isInvited
                      ? 'bg-[#f4f9f5] border-emerald-300'
                      : isSelected
                      ? 'bg-amber-50/50 border-[#113326] shadow-sm'
                      : 'bg-white border-[#dedbd4] hover:border-slate-400 shadow-xs'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Checkbox, Name, Score Badge */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleStudent(student.id)}
                          className="mt-0.5 cursor-pointer text-slate-600 hover:text-slate-900"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#113326]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        <div className="w-9 h-9 rounded-full bg-[#113326] text-[#d8fa57] font-bold text-xs flex items-center justify-center shrink-0 border border-[#23533e]">
                          {student.avatarInitials}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-[#11241c] leading-tight truncate">
                            {student.name}
                          </h4>
                          <span className="text-[11px] text-[#526359] block truncate">
                            {student.department} · {student.year}
                          </span>
                        </div>
                      </div>

                      {/* Match Score Badge */}
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#113326] text-[#d8fa57] font-mono shrink-0 shadow-2xs">
                        {student.matchScore}% Match
                      </span>
                    </div>

                    {/* AI Match Reason */}
                    <div className="p-2.5 bg-[#fbf9f4] rounded-lg border border-[#eeebe2] text-xs text-[#2a3831] leading-relaxed">
                      <strong className="text-[#113326] font-semibold">Why AI Matched: </strong>
                      <span>{student.matchReason}</span>
                    </div>

                    {/* Skills Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {student.keySkills.map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f0ede4] text-[#425247]"
                        >
                          #{sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#f0ede4] text-xs">
                    <div>
                      {isInvited ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Invite Dispatched (Email + In-App)</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">
                          {student.email}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDispatchSingle(student)}
                      disabled={isInvited}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        isInvited
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                          : 'bg-[#113326] hover:bg-[#1a4433] text-white shadow-2xs'
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      <span>{isInvited ? 'Re-send' : 'Send Invite'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
