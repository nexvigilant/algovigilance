/**
 * Hidden Job Market Navigator Data
 *
 * Framework: Network Mapping, Visibility Building, Relationship Development
 * Source: Connected Board Advisor Academy - Module 5 (Getting A Role)
 *
 * Key principles:
 * - "Most advisory roles are never posted publicly"
 * - "Build relationships before you need them"
 * - "Create value before asking for opportunities"
 * - "Be visible in the right places"
 */

export interface StrategyPrompt {
  id: string;
  question: string;
  placeholder: string;
  helpText: string;
  actionItems: string[];
  pvContext?: string;
}

export interface NavigatorSection {
  id: 'network-mapping' | 'visibility' | 'relationships' | 'action-plan';
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  prompts: StrategyPrompt[];
  keyInsights: string[];
}

export const NAVIGATOR_SECTIONS: NavigatorSection[] = [
  {
    id: 'network-mapping',
    title: 'Network Mapping',
    subtitle: 'Who Do You Know?',
    description: 'The hidden job market operates through relationships. Before you can access it, you need to understand your existing network and identify strategic gaps. Most opportunities come from 2nd and 3rd degree connections.',
    icon: 'Network',
    color: 'cyan',
    prompts: [
      {
        id: 'inner-circle',
        question: 'Who is in your inner circle of professional contacts?',
        placeholder: 'List 5-10 people who know your work well and would advocate for you...',
        helpText: 'These are people who have seen your work firsthand and would recommend you without hesitation.',
        actionItems: [
          'Reach out to reconnect if you haven\'t spoken recently',
          'Update them on your career goals',
          'Ask what opportunities they\'re seeing in the market'
        ],
        pvContext: 'In PV, this often includes former managers, colleagues from inspections, co-authors on safety publications, or people you\'ve collaborated with on signal investigations.'
      },
      {
        id: 'industry-connectors',
        question: 'Who are the connectors in your industry network?',
        placeholder: 'Identify people who seem to know everyone and frequently make introductions...',
        helpText: 'Connectors are people who bridge different networks and naturally introduce people to each other.',
        actionItems: [
          'Identify 3-5 connectors in PV/drug safety',
          'Find ways to provide value to them first',
          'Stay visible to them through regular touchpoints'
        ],
        pvContext: 'PV connectors often include conference organizers, professional association leaders, recruiters who specialize in drug safety, and consultants who work across multiple companies.'
      },
      {
        id: 'target-companies',
        question: 'Which companies or organizations are you targeting?',
        placeholder: 'List specific companies where you\'d like to work or advise...',
        helpText: 'Being specific helps you focus your networking efforts and identify relevant connections.',
        actionItems: [
          'Research who you know at each target company',
          'Identify 2nd degree connections through LinkedIn',
          'Look for company leaders who speak at conferences you attend'
        ],
        pvContext: 'Consider the company lifecycle: startups need building expertise, mid-size companies need scaling expertise, large pharma needs efficiency and innovation expertise.'
      },
      {
        id: 'network-gaps',
        question: 'What are the gaps in your current network?',
        placeholder: 'Identify categories of people or organizations missing from your network...',
        helpText: 'Strategic network building means intentionally filling gaps, not just accumulating contacts.',
        actionItems: [
          'Identify 2-3 critical gaps to address this quarter',
          'Plan specific activities to build those connections',
          'Set networking goals (e.g., 2 new strategic contacts per month)'
        ],
        pvContext: 'Common PV network gaps: health authority contacts, biotech founders, VC life sciences investors, CMOs at emerging companies, PV technology vendors.'
      }
    ],
    keyInsights: [
      'Quality over quantity: 50 strong relationships beat 500 LinkedIn connections',
      'Most opportunities come from weak ties (acquaintances) not strong ties (close friends)',
      '2nd degree connections are often the gateway to hidden opportunities',
      'Your network is an asset that requires maintenance and investment'
    ]
  },
  {
    id: 'visibility',
    title: 'Visibility Building',
    subtitle: 'Being Known in the Right Places',
    description: 'You can\'t access the hidden job market if decision-makers don\'t know you exist. Visibility is about being known for something specific in the places where opportunities originate.',
    icon: 'Eye',
    color: 'purple',
    prompts: [
      {
        id: 'expertise-positioning',
        question: 'What do you want to be known for?',
        placeholder: 'Define your specific expertise positioning (not generic "pharmacovigilance")...',
        helpText: 'The more specific, the more memorable. "PV expert" is forgettable. "The person who built 3 biotech PV functions from scratch" is memorable.',
        actionItems: [
          'Craft a specific positioning statement',
          'Identify 2-3 topics where you can claim expertise',
          'Create content or speak on these specific topics'
        ],
        pvContext: 'Strong PV positioning examples: "Signal detection methodology innovator", "Biotech PV function builder", "FDA inspection preparation specialist", "Oncology safety expert".'
      },
      {
        id: 'content-strategy',
        question: 'How are you creating and sharing professional content?',
        placeholder: 'Describe your current content activities (articles, posts, presentations)...',
        helpText: 'Content creates passive visibility. People discover you through your ideas, not just your job title.',
        actionItems: [
          'Commit to a sustainable content cadence',
          'Share insights from your work (appropriately)',
          'Comment thoughtfully on others\' content',
          'Repurpose content across platforms'
        ],
        pvContext: 'PV content opportunities: case study analyses, regulatory update interpretations, signal detection methodology discussions, career advice, lessons from inspections (appropriately anonymized).'
      },
      {
        id: 'speaking-opportunities',
        question: 'Where are you speaking or presenting?',
        placeholder: 'List conferences, webinars, company presentations, or other speaking venues...',
        helpText: 'Speaking positions you as an expert and creates concentrated visibility with relevant audiences.',
        actionItems: [
          'Apply to speak at industry conferences',
          'Offer to present at professional association meetings',
          'Create webinars or workshops on your expertise areas',
          'Accept internal speaking opportunities that build visibility'
        ],
        pvContext: 'Key PV speaking venues: DIA, ISOP, ICPE, regulatory agency workshops, company PV days, vendor user conferences, professional association chapter meetings.'
      },
      {
        id: 'association-involvement',
        question: 'How are you involved in professional associations?',
        placeholder: 'Describe your participation in industry groups, committees, or associations...',
        helpText: 'Association involvement creates repeated touchpoints with the same people, building deeper relationships.',
        actionItems: [
          'Join relevant committees or working groups',
          'Volunteer for visible roles (not just membership)',
          'Attend events consistently (familiarity builds trust)',
          'Contribute to association publications or initiatives'
        ],
        pvContext: 'PV associations: DIA, ISOP, ISPE, RAPS, local PV networking groups, therapeutic area societies (oncology, cardiology, etc.), alumni associations from former employers.'
      }
    ],
    keyInsights: [
      'Visibility compounds over time—start now, even if imperfect',
      'Being known for something specific is better than being known for everything',
      'Consistent presence beats sporadic intensity',
      'The goal is to be top-of-mind when opportunities arise'
    ]
  },
  {
    id: 'relationships',
    title: 'Relationship Development',
    subtitle: 'From Contact to Advocate',
    description: 'A contact is someone who knows your name. An advocate is someone who actively recommends you. The hidden job market opens when you have advocates in the right places.',
    icon: 'HeartHandshake',
    color: 'gold',
    prompts: [
      {
        id: 'value-creation',
        question: 'How are you creating value for your network before asking for anything?',
        placeholder: 'Describe how you help others in your network (introductions, advice, resources)...',
        helpText: 'The best networkers give more than they take. Create value first, opportunities follow.',
        actionItems: [
          'Make introductions when you see potential synergies',
          'Share relevant articles or opportunities with your network',
          'Offer your expertise when you can help',
          'Celebrate others\' successes publicly'
        ],
        pvContext: 'PV value creation: share regulatory updates, introduce candidates to recruiters, offer to review documents, share lessons learned, connect people with complementary expertise.'
      },
      {
        id: 'relationship-maintenance',
        question: 'How do you maintain relationships over time?',
        placeholder: 'Describe your system for staying in touch with key contacts...',
        helpText: 'Relationships decay without maintenance. The best time to nurture a relationship is when you don\'t need anything.',
        actionItems: [
          'Create a system to track key relationships',
          'Schedule regular touchpoints (quarterly for important contacts)',
          'Use life events as natural touchpoints (new job, promotion, publication)',
          'Remember personal details and follow up on them'
        ],
        pvContext: 'PV relationship triggers: FDA approval announcements, inspection news, career moves on LinkedIn, conference presentations, publication of papers, regulatory guideline releases.'
      },
      {
        id: 'advocate-development',
        question: 'Who would actively recommend you for an opportunity today?',
        placeholder: 'List people who would proactively suggest you when they hear of relevant opportunities...',
        helpText: 'Advocates don\'t just respond to references—they actively think of you when opportunities arise.',
        actionItems: [
          'Identify your current advocates',
          'Determine who could become an advocate with more investment',
          'Keep advocates updated on your goals and achievements',
          'Thank advocates when they help (even if it doesn\'t work out)'
        ],
        pvContext: 'PV advocates often emerge from: successful project collaborations, inspection preparations you led, people you\'ve mentored, hiring managers from past roles, conference co-presenters.'
      },
      {
        id: 'strategic-asks',
        question: 'How do you make strategic asks of your network?',
        placeholder: 'Describe how you approach asking for help, introductions, or opportunities...',
        helpText: 'Good asks are specific, easy to fulfill, and consider what\'s in it for the other person.',
        actionItems: [
          'Make asks specific and actionable',
          'Explain why you\'re asking this person specifically',
          'Make it easy to say yes (provide context, materials, talking points)',
          'Follow up and close the loop on every ask'
        ],
        pvContext: 'Effective PV asks: "Could you introduce me to the CMO at [Company]? I noticed they just raised Series B and will need to build PV capabilities." Not: "Let me know if you hear of any opportunities."'
      }
    ],
    keyInsights: [
      'Give before you ask—create value first',
      'The ask should be specific and easy to fulfill',
      'Keep advocates informed so they can advocate effectively',
      'Relationship building is a long game, not a transaction'
    ]
  }
];

export interface OpportunitySource {
  id: string;
  name: string;
  description: string;
  accessStrategy: string;
  pvRelevance: string;
}

export const OPPORTUNITY_SOURCES: OpportunitySource[] = [
  {
    id: 'executive-recruiters',
    name: 'Executive Recruiters',
    description: 'Retained search firms that fill senior PV/safety roles',
    accessStrategy: 'Build relationships before you need them. Update them on your career, send candidates their way.',
    pvRelevance: 'Key firms: Russell Reynolds, Spencer Stuart (pharma practice), specialized life sciences recruiters'
  },
  {
    id: 'vc-pe-networks',
    name: 'VC/PE Networks',
    description: 'Venture capital and private equity firms that invest in life sciences',
    accessStrategy: 'Offer expertise on due diligence, regulatory risk, safety strategy for portfolio companies.',
    pvRelevance: 'Portfolio companies often need PV expertise for first-in-human trials, NDA submissions, post-acquisition integration'
  },
  {
    id: 'board-networks',
    name: 'Board Networks',
    description: 'People who serve on multiple boards and see opportunities across companies',
    accessStrategy: 'Build relationships with board members through industry involvement, referrals from shared connections.',
    pvRelevance: 'Board members often know of CMO/QPPV needs before roles are posted, especially at emerging biotechs'
  },
  {
    id: 'conference-networks',
    name: 'Conference Networks',
    description: 'Relationships built through industry conference participation',
    accessStrategy: 'Speak at conferences, participate in working groups, attend consistently to build familiarity.',
    pvRelevance: 'DIA, ISOP, and ICPE are where PV leaders connect and opportunities are discussed informally'
  },
  {
    id: 'alumni-networks',
    name: 'Alumni Networks',
    description: 'Former colleagues who have moved to new organizations',
    accessStrategy: 'Maintain relationships with former colleagues, especially those who move to leadership roles.',
    pvRelevance: 'PV is a small world—people you worked with often rise to hiring positions at new companies'
  },
  {
    id: 'association-leadership',
    name: 'Association Leadership',
    description: 'Leaders of professional associations who have broad visibility',
    accessStrategy: 'Take leadership roles in associations, volunteer for visible committees and initiatives.',
    pvRelevance: 'Association leaders often field informal inquiries about potential candidates for senior roles'
  }
];

export interface ActionPlanTemplate {
  id: string;
  name: string;
  description: string;
  format: 'plan' | 'tracker' | 'script';
  useCase: string;
}

export const ACTION_PLAN_TEMPLATES: ActionPlanTemplate[] = [
  {
    id: '30-day-plan',
    name: '30-Day Action Plan',
    description: 'Concrete actions to take in the next 30 days',
    format: 'plan',
    useCase: 'Immediate next steps to access the hidden job market'
  },
  {
    id: 'network-tracker',
    name: 'Network Relationship Tracker',
    description: 'Track your key relationships and touchpoints',
    format: 'tracker',
    useCase: 'Ongoing relationship management'
  },
  {
    id: 'outreach-scripts',
    name: 'Outreach Scripts',
    description: 'Templates for reaching out to your network',
    format: 'script',
    useCase: 'Reconnection and ask conversations'
  },
  {
    id: 'visibility-calendar',
    name: 'Visibility Calendar',
    description: 'Plan your content and speaking activities',
    format: 'plan',
    useCase: 'Consistent visibility building'
  }
];

export const HIDDEN_MARKET_PRINCIPLES = {
  mindsetShift: {
    title: 'The Mindset Shift',
    from: 'Job seeker looking for openings',
    to: 'Professional building relationships who happens to be open to opportunities',
    implications: [
      'You\'re always networking, not just when job hunting',
      'You lead with value, not with your resume',
      'You build relationships before you need them',
      'You\'re selective about opportunities, not desperate'
    ]
  },
  timing: {
    title: 'The Timing Principle',
    insight: 'The best time to build relationships is when you don\'t need anything',
    practices: [
      'Network actively when you\'re happily employed',
      'Maintain relationships through career transitions',
      'Reach out when you have something to give, not just when you need something',
      'Stay visible even when you\'re not looking'
    ]
  },
  reciprocity: {
    title: 'The Reciprocity Principle',
    insight: 'Give more than you take, and opportunities will find you',
    practices: [
      'Make introductions generously',
      'Share knowledge and resources freely',
      'Help others succeed without expectation',
      'Create value in every interaction'
    ]
  }
};

export const STEP_INSTRUCTIONS = {
  'network-mapping': {
    title: 'Map Your Current Network',
    instructions: [
      'Start with who you already know—your network is larger than you think',
      'Identify connectors who bridge different networks',
      'Be specific about target companies and roles',
      'Acknowledge gaps honestly—this enables strategic building'
    ]
  },
  visibility: {
    title: 'Build Strategic Visibility',
    instructions: [
      'Define what you want to be known for (be specific)',
      'Create content that demonstrates your expertise',
      'Pursue speaking opportunities that reach your target audience',
      'Engage consistently in professional associations'
    ]
  },
  relationships: {
    title: 'Develop Advocate Relationships',
    instructions: [
      'Create value before asking for anything',
      'Maintain relationships systematically, not just when you need something',
      'Identify and nurture potential advocates',
      'Make strategic, specific asks that are easy to fulfill'
    ]
  },
  'action-plan': {
    title: 'Create Your Action Plan',
    instructions: [
      'Commit to specific actions in the next 30 days',
      'Focus on relationship building, not job applications',
      'Track your networking activities and follow-ups',
      'Review and adjust your strategy monthly'
    ]
  }
};

export const NETWORKING_SCRIPTS = {
  reconnection: {
    title: 'Reconnection Message',
    template: `Hi [Name],

I hope this message finds you well. It's been [time period] since we [last interaction context], and I wanted to reach out to reconnect.

I've been [brief update on what you've been doing] and thought of you when [specific trigger—article, news, mutual connection].

I'd love to catch up and hear what you're working on. Would you have 20 minutes for a call in the next few weeks?

Best,
[Your name]`,
    notes: [
      'Reference specific shared context',
      'Give a reason for reaching out now',
      'Make the ask small and specific',
      'Lead with genuine interest in them'
    ]
  },
  introductionRequest: {
    title: 'Introduction Request',
    template: `Hi [Name],

I hope you're doing well. I'm reaching out because I'm looking to connect with [specific person or type of person] and noticed you're connected to [Name/Company].

I'm specifically interested in [specific reason—their work, company, expertise] because [how it relates to your goals].

Would you be comfortable making an introduction? I'm happy to provide a brief blurb you can forward, or I can reach out directly and mention your name if that's easier.

Thanks for considering this,
[Your name]`,
    notes: [
      'Be specific about who and why',
      'Make it easy to say yes',
      'Offer options for how to facilitate',
      'Acknowledge this is a favor'
    ]
  },
  valueOffer: {
    title: 'Value Offer Message',
    template: `Hi [Name],

I saw your recent [post/article/presentation] about [topic] and wanted to share [relevant resource/insight/introduction] that might be helpful.

[Brief explanation of the value you're offering]

No response needed—just thought this might be useful given what you're working on.

Best,
[Your name]`,
    notes: [
      'Lead with value, not an ask',
      'Be specific about why you thought of them',
      'Make it easy to receive (no obligation)',
      'This builds relationship equity over time'
    ]
  }
};
