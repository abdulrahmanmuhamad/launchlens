import { apiWorkerFetch } from 'deepspace/worker'
import type { Job, JobContext } from 'deepspace/worker'
import type { Env } from '../worker'
import type { AuditInput, AuditResult } from './lib/audit-types'

type GitHubRepo = Record<string, unknown>
type GitHubReadme = Record<string, unknown>
type FirecrawlResult = { data?: { markdown?: string; metadata?: Record<string, unknown> } }
type OpenAIResult = { choices?: Array<{ message?: { content?: string } }> }

export async function runJob(job: Job, ctx: JobContext, env: Env): Promise<unknown> {
  if (job.type !== 'adoption-audit') throw new Error(`Unknown job type: ${job.type}`)
  return runAdoptionAudit(job.payload as AuditInput, ctx, env)
}

async function runAdoptionAudit(input: AuditInput, ctx: JobContext, env: Env): Promise<AuditResult> {
  const validated = validateInput(input)
  const { owner, repo } = parseGitHubUrl(validated.repoUrl)

  ctx.progress(0.06, 'Reading repository signals')
  const [repoMeta, readme] = await Promise.all([
    callIntegration<GitHubRepo>(env, 'github/get-repository', { owner, repo }, ctx.signal),
    callIntegration<GitHubReadme>(env, 'github/get-repository-readme', { owner, repo }, ctx.signal),
  ])

  ctx.progress(0.34, 'Inspecting the product experience')
  const page = await callIntegration<FirecrawlResult>(env, 'firecrawl/scrape', {
    url: validated.siteUrl,
    formats: ['markdown'],
    onlyMainContent: true,
    timeout: 30_000,
  }, ctx.signal)

  const readmeText = decodeReadme(readme).slice(0, 14_000)
  const pageText = (page?.data?.markdown ?? '').slice(0, 14_000)
  if (!readmeText && !pageText) {
    throw new Error('The repository and website returned no readable product content.')
  }

  ctx.progress(0.62, 'Judging the adoption path')
  const completion = await callIntegration<OpenAIResult>(env, 'openai/chat-completion', {
    model: 'gpt-5.4-mini',
    max_tokens: 3600,
    temperature: 0.25,
    messages: [
      {
        role: 'system',
        content: 'You are a rigorous developer-product adoption reviewer. Use only supplied evidence, separate observation from recommendation, and return strict JSON with no markdown fences.',
      },
      { role: 'user', content: buildPrompt(validated, repoMeta, readmeText, pageText) },
    ],
  }, ctx.signal)

  ctx.progress(0.9, 'Structuring the launch brief')
  const raw = completion.choices?.[0]?.message?.content ?? ''
  const result = normalizeResult(parseJson(raw), validated, repoMeta)
  ctx.progress(1, 'Audit ready')
  return result
}

function validateInput(input: AuditInput): AuditInput {
  const repoUrl = parseUrl(input.repoUrl, 'GitHub repository URL')
  const siteUrl = parseUrl(input.siteUrl, 'Product or documentation URL')
  if (repoUrl.hostname !== 'github.com') throw new Error('Repository must be a public github.com URL.')
  const audience = input.audience?.trim().slice(0, 180)
  if (!audience) throw new Error('Describe the primary audience.')
  if (!['activation', 'launch', 'adoption'].includes(input.goal)) throw new Error('Choose a valid audit goal.')
  return { repoUrl: repoUrl.toString(), siteUrl: siteUrl.toString(), audience, goal: input.goal }
}

function parseUrl(value: string, label: string): URL {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
    return url
  } catch {
    throw new Error(`${label} must be a complete http(s) URL.`)
  }
}

export function parseGitHubUrl(value: string): { owner: string; repo: string } {
  const url = parseUrl(value, 'GitHub repository URL')
  const [owner, rawRepo] = url.pathname.split('/').filter(Boolean)
  const repo = rawRepo?.replace(/\.git$/, '')
  if (!owner || !repo) throw new Error('Use a repository URL like https://github.com/owner/repo.')
  return { owner, repo }
}

function decodeReadme(readme: GitHubReadme): string {
  const direct = readme.markdown ?? readme.text ?? readme.decoded_content
  if (typeof direct === 'string') return direct
  if (typeof readme.content !== 'string') return ''
  try {
    return atob(readme.content.replace(/\s/g, ''))
  } catch {
    return readme.content
  }
}

function buildPrompt(input: AuditInput, repoMeta: GitHubRepo, readme: string, page: string): string {
  return `Audit this developer product for ${input.goal}. The primary audience is: ${input.audience}.

Repository metadata:
${JSON.stringify(repoMeta).slice(0, 8_000)}

README:
${readme || '[not available]'}

Website or documentation:
${page || '[not available]'}

Return exactly one JSON object with this shape:
{
  "project": {"name":"string","description":"string","primaryLanguage":"string","stars":0,"forks":0,"openIssues":0,"license":"string","lastUpdated":"YYYY-MM-DD"},
  "overallScore": 0,
  "oneLiner": "one sharp sentence",
  "executiveSummary": "2-3 evidence-grounded sentences",
  "scores": [
    {"key":"positioning","label":"Positioning","score":0,"verdict":"short evidence-based verdict"},
    {"key":"onboarding","label":"Time to value","score":0,"verdict":"short evidence-based verdict"},
    {"key":"trust","label":"Trust","score":0,"verdict":"short evidence-based verdict"},
    {"key":"docs","label":"Documentation","score":0,"verdict":"short evidence-based verdict"},
    {"key":"distribution","label":"Distribution","score":0,"verdict":"short evidence-based verdict"}
  ],
  "proofPoints": ["three concrete facts"],
  "friction": [{"title":"string","evidence":"specific observed evidence","fix":"specific change","impact":"High|Medium|Low","effort":"Quick|Moderate|Large"}],
  "quickWins": [{"title":"string","why":"string","how":"specific implementation","impact":"High|Medium|Low"}],
  "launchCopy": {"headline":"string","subhead":"string","socialPost":"under 300 characters"}
}

Rules: scores are integers 0-100; include exactly five score rows in the given order, 3-5 friction items, 3-5 quick wins, and three proof points. Do not claim metrics not present in the evidence. Recommendations may be opinionated, but evidence must be traceable to the supplied material.`
}

function parseJson(raw: string): Record<string, unknown> {
  let text = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) text = text.slice(start, end + 1)
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new Error('The analysis completed, but its structured report was invalid. Retry the audit.')
  }
}

function normalizeResult(raw: Record<string, unknown>, input: AuditInput, meta: GitHubRepo): AuditResult {
  const project = asObject(raw.project)
  const scores = Array.isArray(raw.scores) ? raw.scores.map(asObject) : []
  const friction = Array.isArray(raw.friction) ? raw.friction.map(asObject) : []
  const quickWins = Array.isArray(raw.quickWins) ? raw.quickWins.map(asObject) : []
  const launchCopy = asObject(raw.launchCopy)
  if (scores.length !== 5 || friction.length < 2 || quickWins.length < 2) {
    throw new Error('The analysis did not return a complete adoption report. Retry the audit.')
  }

  const scoreNumber = (value: unknown, fallback = 0) =>
    Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Math.round(Number(value)))) : fallback
  const countNumber = (value: unknown, fallback = 0) =>
    Number.isFinite(Number(value)) ? Math.max(0, Math.round(Number(value))) : fallback
  const text = (value: unknown, fallback = '') => typeof value === 'string' ? value.trim() : fallback
  const repoName = parseGitHubUrl(input.repoUrl).repo

  return {
    project: {
      name: text(project.name, text(meta.name, repoName)),
      repoUrl: input.repoUrl,
      siteUrl: input.siteUrl,
      description: text(project.description, text(meta.description, 'Developer product')),
      primaryLanguage: text(project.primaryLanguage, text(meta.language, 'Not specified')),
      stars: countNumber(project.stars, Number(meta.stargazers_count ?? 0)),
      forks: countNumber(project.forks, Number(meta.forks_count ?? 0)),
      openIssues: countNumber(project.openIssues, Number(meta.open_issues_count ?? 0)),
      license: text(project.license, text(asObject(meta.license).spdx_id, 'Not specified')),
      lastUpdated: text(project.lastUpdated, text(meta.updated_at).slice(0, 10)),
    },
    overallScore: scoreNumber(raw.overallScore),
    oneLiner: text(raw.oneLiner),
    executiveSummary: text(raw.executiveSummary),
    scores: scores.slice(0, 5).map((score, index) => {
      const keys = ['positioning', 'onboarding', 'trust', 'docs', 'distribution'] as const
      const labels = ['Positioning', 'Time to value', 'Trust', 'Documentation', 'Distribution']
      return { key: keys[index], label: labels[index], score: scoreNumber(score.score), verdict: text(score.verdict) }
    }),
    proofPoints: asStringArray(raw.proofPoints).slice(0, 4),
    friction: friction.slice(0, 5).map((item) => ({
      title: text(item.title), evidence: text(item.evidence), fix: text(item.fix),
      impact: asEnum(item.impact, ['High', 'Medium', 'Low'], 'Medium'),
      effort: asEnum(item.effort, ['Quick', 'Moderate', 'Large'], 'Moderate'),
    })),
    quickWins: quickWins.slice(0, 5).map((item) => ({
      title: text(item.title), why: text(item.why), how: text(item.how),
      impact: asEnum(item.impact, ['High', 'Medium', 'Low'], 'Medium'),
    })),
    launchCopy: {
      headline: text(launchCopy.headline),
      subhead: text(launchCopy.subhead),
      socialPost: text(launchCopy.socialPost).slice(0, 500),
    },
    sources: [
      { label: 'GitHub repository', url: input.repoUrl },
      { label: 'Product experience', url: input.siteUrl },
    ],
    generatedAt: new Date().toISOString(),
  }
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []
}

function asEnum<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? value as T : fallback
}

function isTransient(message: string): boolean {
  return /overload|temporar|timeout|rate.?limit|429|500|502|503|504|529|gateway/i.test(message)
}

async function callIntegration<T>(env: Env, endpoint: string, body: unknown, signal: AbortSignal): Promise<T> {
  let lastError = `${endpoint} failed`
  for (let attempt = 1; attempt <= 2; attempt++) {
    if (signal.aborted) throw new Error('Audit canceled.')
    try {
      const res = await apiWorkerFetch(env, `/api/integrations/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.APP_OWNER_JWT}` },
        body: JSON.stringify(body),
        signal,
      })
      const payload = await res.json() as { success?: boolean; data?: T; error?: string }
      if (payload.success) return payload.data as T
      lastError = payload.error ?? lastError
      if (!isTransient(lastError) || attempt === 2) throw new Error(lastError)
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
      if (!isTransient(lastError) || attempt === 2) throw new Error(lastError)
    }
    await new Promise((resolve) => setTimeout(resolve, 900 * attempt))
  }
  throw new Error(lastError)
}
