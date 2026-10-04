export interface AuditInput {
  repoUrl: string
  siteUrl: string
  audience: string
  goal: 'activation' | 'launch' | 'adoption'
}

export interface AuditScore {
  key: 'positioning' | 'onboarding' | 'trust' | 'docs' | 'distribution'
  label: string
  score: number
  verdict: string
}

export interface AuditFriction {
  title: string
  evidence: string
  fix: string
  impact: 'High' | 'Medium' | 'Low'
  effort: 'Quick' | 'Moderate' | 'Large'
}

export interface AuditQuickWin {
  title: string
  why: string
  how: string
  impact: 'High' | 'Medium' | 'Low'
}

export interface AuditResult {
  project: {
    name: string
    repoUrl: string
    siteUrl: string
    description: string
    primaryLanguage: string
    stars: number
    forks: number
    openIssues: number
    license: string
    lastUpdated: string
  }
  overallScore: number
  oneLiner: string
  executiveSummary: string
  scores: AuditScore[]
  proofPoints: string[]
  friction: AuditFriction[]
  quickWins: AuditQuickWin[]
  launchCopy: {
    headline: string
    subhead: string
    socialPost: string
  }
  sources: Array<{ label: string; url: string }>
  generatedAt: string
}

export interface SavedAudit {
  title: string
  repoUrl: string
  siteUrl: string
  jobId: string
  result: AuditResult
  decision: 'reviewing' | 'approved' | 'parked'
}

export const DEMO_AUDIT: AuditResult = {
  project: {
    name: 'ThreadHunt',
    repoUrl: 'https://github.com/deepdotspace/threadhunt',
    siteUrl: 'https://threadhunt.app.space',
    description: 'A focused queue for finding and replying to relevant developer conversations.',
    primaryLanguage: 'TypeScript',
    stars: 0,
    forks: 0,
    openIssues: 0,
    license: 'MIT',
    lastUpdated: '2026-10-02',
  },
  overallScore: 78,
  oneLiner: 'Find the conversations your product should join—then reply with context, not spam.',
  executiveSummary:
    'The product has a sharp workflow and an unusually honest manual-posting boundary. Its biggest adoption gap is proof: the homepage explains the mechanism before showing the outcome a developer advocate gets in the first five minutes.',
  scores: [
    { key: 'positioning', label: 'Positioning', score: 84, verdict: 'Clear job, narrow audience.' },
    { key: 'onboarding', label: 'Time to value', score: 72, verdict: 'Setup is easy; payoff arrives late.' },
    { key: 'trust', label: 'Trust', score: 88, verdict: 'Manual posting is a strong boundary.' },
    { key: 'docs', label: 'Documentation', score: 82, verdict: 'Practical and runnable.' },
    { key: 'distribution', label: 'Distribution', score: 63, verdict: 'Few proof assets to share.' },
  ],
  proofPoints: [
    'Five source venues feed one triage queue.',
    'Background scans survive refreshes and stream progress live.',
    'Replies are drafted, never auto-posted.',
  ],
  friction: [
    {
      title: 'The outcome is described, not demonstrated',
      evidence: 'The first screen has no before/after example of a weak thread match becoming a useful reply.',
      fix: 'Place one compact “found → scored → drafted” example immediately below the hero.',
      impact: 'High',
      effort: 'Quick',
    },
    {
      title: 'The ideal user is implicit',
      evidence: 'The copy names topics and venues but not the developer advocate or founder who owns the workflow.',
      fix: 'Name the primary user in the headline and move secondary personas into a later use-cases row.',
      impact: 'Medium',
      effort: 'Quick',
    },
  ],
  quickWins: [
    {
      title: 'Ship a 45-second guided sample',
      why: 'Visitors can experience the scoring logic before connecting anything.',
      how: 'Seed one topic and three labeled results; keep the real triage controls enabled.',
      impact: 'High',
    },
    {
      title: 'Turn the manual-posting limit into a trust badge',
      why: 'The constraint is a differentiator in a category associated with spam.',
      how: 'Repeat “You approve every reply” beside the primary CTA and in the queue.',
      impact: 'High',
    },
  ],
  launchCopy: {
    headline: 'Find the threads worth showing up for.',
    subhead: 'ThreadHunt watches the places your users talk, ranks the best openings, and drafts a reply you stay in control of.',
    socialPost:
      'Most social listening tools find mentions. ThreadHunt finds conversations where your expertise is actually useful—then helps you write the reply. You review and post every word.',
  },
  sources: [
    { label: 'GitHub repository', url: 'https://github.com/deepdotspace/threadhunt' },
    { label: 'Product experience', url: 'https://threadhunt.app.space' },
  ],
  generatedAt: '2026-10-04T20:00:00.000Z',
}
