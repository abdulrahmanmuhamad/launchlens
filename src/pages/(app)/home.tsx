import { useMemo, useState } from 'react'
import {
  useAuthProfileReady,
  useJobs,
  useMutations,
  usePresenceRoom,
  useQuery,
  type JobView,
} from 'deepspace'
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  CircleDot,
  Clipboard,
  ExternalLink,
  Github,
  Globe2,
  History,
  LoaderCircle,
  LockKeyhole,
  Radar,
  RefreshCw,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { Button, Input, Label, Textarea, useToast } from '@/components/ui'
import { SCOPE_ID } from '../../constants'
import {
  DEMO_AUDIT,
  type AuditInput,
  type AuditResult,
  type SavedAudit,
} from '../../lib/audit-types'

const INITIAL_INPUT: AuditInput = {
  repoUrl: 'https://github.com/deepdotspace/threadhunt',
  siteUrl: 'https://threadhunt.app.space',
  audience: 'Developer advocates and technical founders growing an open-source product',
  goal: 'adoption',
}

export default function HomePage() {
  const { isSignedIn, user } = useAuthProfileReady({ requireUser: true })

  if (!isSignedIn || !user) {
    return (
      <div className="min-h-full bg-background text-foreground">
        <div className="mx-auto max-w-[1480px] px-5 py-8 lg:px-10">
          <div className="mb-8 flex items-center justify-between border-b border-border pb-5">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.18em]">
                <CircleDot className="h-3 w-3 fill-foreground text-accent" /> Public sample
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-[-0.04em]">A real audit, before sign-in.</h1>
            </div>
            <div className="hidden max-w-md text-right text-sm text-muted-foreground md:block">
              Sign in from the top-right to run an owner-funded audit and save reports in your live workspace.
            </div>
          </div>
          <AuditReport report={DEMO_AUDIT} demo />
        </div>
      </div>
    )
  }

  return <AuditWorkspace isAdmin={user.role === 'admin'} />
}

function AuditWorkspace({ isAdmin }: { isAdmin: boolean }) {
  const [input, setInput] = useState(INITIAL_INPUT)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { success, error } = useToast()
  const { jobs, enqueue, cancel, retry, connected } = useJobs<AuditInput, AuditResult>(SCOPE_ID)
  const { peers, connected: presenceConnected } = usePresenceRoom(`${SCOPE_ID}:audit-room`)
  const { records: saved, status: savedStatus } = useQuery<SavedAudit>('audits', {
    orderBy: 'createdAt',
    orderDir: 'desc',
    limit: 20,
  })
  const mutations = useMutations<SavedAudit>('audits')

  const activeJob = jobs.find((job) => job.id === activeJobId)
  const selectedSaved = saved.find((row) => row.recordId === selectedSavedId)
  const liveResult = activeJob?.status === 'succeeded' ? activeJob.result : undefined
  const report = selectedSaved?.data.result ?? liveResult ?? saved[0]?.data.result ?? DEMO_AUDIT
  const isRunning = activeJob?.status === 'queued' || activeJob?.status === 'running'
  const alreadySaved = activeJobId ? saved.some((row) => row.data.jobId === activeJobId) : false

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!isAdmin) {
      error('Owner-only action', 'Live audits spend the app owner’s integration credits. The sample remains fully explorable.')
      return
    }
    try {
      const jobId = await enqueue('adoption-audit', input, { maxAttempts: 2 })
      setActiveJobId(jobId)
      setSelectedSavedId(null)
      success('Audit started', 'GitHub, Firecrawl and OpenAI are working in the background.')
    } catch (cause) {
      error('Could not start audit', cause instanceof Error ? cause.message : String(cause))
    }
  }

  async function saveActive() {
    if (!activeJobId || !liveResult || !mutations.ready || alreadySaved) return
    setSaving(true)
    try {
      const id = await mutations.createConfirmed({
        title: liveResult.project.name,
        repoUrl: liveResult.project.repoUrl,
        siteUrl: liveResult.project.siteUrl,
        jobId: activeJobId,
        result: liveResult,
        decision: 'reviewing',
      })
      setSelectedSavedId(id)
      success('Saved to workspace', 'The report is now backed by live DeepSpace records.')
    } catch (cause) {
      error('Could not save report', cause instanceof Error ? cause.message : String(cause))
    } finally {
      setSaving(false)
    }
  }

  async function setDecision(value: SavedAudit['decision']) {
    if (!selectedSaved || !mutations.ready) return
    try {
      await mutations.putConfirmed(selectedSaved.recordId, { decision: value })
      success('Decision synced', `This report is now marked ${value}.`)
    } catch (cause) {
      error('Could not update decision', cause instanceof Error ? cause.message : String(cause))
    }
  }

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto grid max-w-[1600px] gap-0 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-primary text-white lg:min-h-[calc(100vh-3rem)] lg:border-b-0 lg:border-r">
          <div className="sticky top-0 p-5 lg:p-7">
            <div className="mb-7 flex items-center justify-between text-xs text-white/55">
              <span className="inline-flex items-center gap-2"><Radar className="h-4 w-4 text-accent" /> Audit console</span>
              <span className="inline-flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${connected ? 'bg-accent' : 'bg-warning'}`} />
                {connected ? 'Live' : 'Connecting'}
              </span>
            </div>

            <form className="space-y-5" onSubmit={submit}>
              <div>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] text-white/50">
                  <Github className="h-3.5 w-3.5" /> Repository
                </div>
                <Label htmlFor="repo" className="sr-only">GitHub repository</Label>
                <Input id="repo" value={input.repoUrl} onChange={(e) => setInput({ ...input, repoUrl: e.target.value })} className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-accent" placeholder="https://github.com/owner/repo" required />
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] text-white/50">
                  <Globe2 className="h-3.5 w-3.5" /> Product surface
                </div>
                <Label htmlFor="site" className="sr-only">Product or docs URL</Label>
                <Input id="site" value={input.siteUrl} onChange={(e) => setInput({ ...input, siteUrl: e.target.value })} className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-accent" placeholder="https://your-product.com" required />
              </div>
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[.16em] text-white/50">Primary audience</div>
                <Label htmlFor="audience" className="sr-only">Primary audience</Label>
                <Textarea id="audience" value={input.audience} onChange={(e) => setInput({ ...input, audience: e.target.value })} className="min-h-24 border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-accent" maxLength={180} required />
              </div>
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[.16em] text-white/50">Optimize for</div>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/5 p-1">
                  {(['adoption', 'activation', 'launch'] as const).map((goal) => (
                    <button key={goal} type="button" onClick={() => setInput({ ...input, goal })} className={`rounded-lg px-2 py-2 text-xs capitalize transition ${input.goal === goal ? 'bg-accent font-semibold text-foreground' : 'text-white/55 hover:text-white'}`}>
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={!connected || isRunning} className="h-12 w-full bg-accent text-foreground hover:bg-accent/90">
                {isRunning ? <><LoaderCircle className="animate-spin" /> Running audit</> : <><Sparkles /> Run evidence audit</>}
              </Button>
              {!isAdmin && (
                <p className="flex gap-2 text-xs leading-5 text-white/45"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Live generation is owner-only because it uses developer-billed integrations.</p>
              )}
            </form>

            {activeJob && (
              <JobStatus job={activeJob} onCancel={() => cancel(activeJob.id)} onRetry={() => retry(activeJob.id)} />
            )}

            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-white/50"><History className="h-3.5 w-3.5" /> Saved audits</h2>
                <span className="text-[11px] text-white/35">{saved.length}</span>
              </div>
              <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
                {savedStatus === 'loading' && <p className="py-3 text-xs text-white/35">Loading workspace…</p>}
                {saved.map((row) => (
                  <button key={row.recordId} onClick={() => setSelectedSavedId(row.recordId)} className={`w-full rounded-lg px-3 py-2.5 text-left transition ${selectedSavedId === row.recordId ? 'bg-white/12' : 'hover:bg-white/7'}`}>
                    <div className="truncate text-sm font-medium text-white/90">{row.data.title}</div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-white/35">
                      <span>{new Date(row.createdAt).toLocaleDateString()}</span>
                      <span className="capitalize">{row.data.decision}</span>
                    </div>
                  </button>
                ))}
                {savedStatus === 'ready' && saved.length === 0 && <p className="py-3 text-xs leading-5 text-white/35">Complete an audit, then save it here for a persistent history.</p>}
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-5 py-7 lg:px-10 lg:py-9">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Evidence-backed adoption brief</div>
              <h1 className="font-display text-3xl font-semibold tracking-[-.04em]">{report.project.name}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-1 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> {presenceConnected ? `${peers.length + 1} live` : 'Offline'}
              </div>
              {liveResult && !alreadySaved && (
                <Button variant="outline" onClick={saveActive} loading={saving} disabled={!mutations.ready}><CheckCircle2 /> Save report</Button>
              )}
              {selectedSaved && (
                <div className="flex rounded-lg border border-border bg-white/50 p-1">
                  {(['reviewing', 'approved', 'parked'] as const).map((value) => (
                    <button key={value} onClick={() => setDecision(value)} className={`rounded-md px-2.5 py-1.5 text-xs capitalize ${selectedSaved.data.decision === value ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>{value}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <AuditReport report={report} demo={!liveResult && !selectedSaved && saved.length === 0} />
        </main>
      </div>
    </div>
  )
}

function JobStatus({ job, onCancel, onRetry }: { job: JobView<AuditInput, AuditResult>; onCancel: () => void; onRetry: () => void }) {
  const progress = Math.round((job.progress ?? 0) * 100)
  return (
    <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="font-medium text-white/85">{job.progressMessage ?? job.status}</span>
        <span className="font-mono text-white/40">{job.status === 'succeeded' ? '100%' : `${progress}%`}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${job.status === 'succeeded' ? 100 : progress}%` }} /></div>
      {job.status === 'running' && <button onClick={onCancel} className="mt-3 flex items-center gap-1 text-xs text-white/40 hover:text-white"><X className="h-3 w-3" /> Cancel</button>}
      {job.status === 'failed' && <div className="mt-3"><p className="text-xs leading-5 text-destructive">{job.error}</p><button onClick={onRetry} className="mt-2 flex items-center gap-1 text-xs text-white/70 hover:text-white"><RefreshCw className="h-3 w-3" /> Retry</button></div>}
    </div>
  )
}

function AuditReport({ report, demo = false }: { report: AuditResult; demo?: boolean }) {
  const [copied, setCopied] = useState<string | null>(null)
  const meta = useMemo(() => [
    `${report.project.primaryLanguage}`,
    `${report.project.stars.toLocaleString()} stars`,
    report.project.license,
    report.project.lastUpdated ? `Updated ${report.project.lastUpdated}` : '',
  ].filter(Boolean), [report])

  async function copy(key: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(key)
    window.setTimeout(() => setCopied(null), 1400)
  }

  return (
    <div className="space-y-8">
      {demo && (
        <div className="flex items-start gap-3 rounded-xl border border-accent bg-accent/25 px-4 py-3 text-sm text-foreground">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <p><strong>Guided sample.</strong> This report shows the complete output contract. Sign in as the app owner to generate a fresh report through the real pipeline.</p>
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="rounded-2xl border border-border bg-card p-6 lg:p-8">
          <div className="mb-6 flex flex-wrap gap-2">{meta.map((item) => <span key={item} className="rounded-full border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground">{item}</span>)}</div>
          <p className="font-display max-w-4xl text-3xl font-semibold leading-[1.08] tracking-[-.04em] lg:text-[42px]">“{report.oneLiner}”</p>
          <p className="mt-6 max-w-3xl text-[15px] leading-7 text-muted-foreground">{report.executiveSummary}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            {report.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">{source.label}<ExternalLink className="h-3.5 w-3.5" /></a>)}
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-2xl bg-accent p-6 text-foreground">
          <div className="text-[11px] font-bold uppercase tracking-[.16em]">Adoption readiness</div>
          <div className="my-8 flex items-center justify-center">
            <div className="grid h-44 w-44 place-items-center rounded-full bg-primary" style={{ background: `conic-gradient(var(--color-primary) ${report.overallScore * 3.6}deg, var(--color-muted) 0)` }}>
              <div className="grid h-[138px] w-[138px] place-items-center rounded-full bg-accent text-center"><div><div className="font-display text-5xl font-semibold tracking-[-.06em]">{report.overallScore}</div><div className="text-[10px] font-semibold uppercase tracking-[.16em]">out of 100</div></div></div>
            </div>
          </div>
          <p className="text-sm leading-6">Score reflects positioning, first-run value, trust, documentation, and distribution—not product quality alone.</p>
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Diagnostic" title="Where adoption leaks" subtitle="Five dimensions, one evidence trail." />
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {report.scores.map((score, index) => (
            <div key={score.key} className={`grid gap-4 p-5 md:grid-cols-[190px_1fr_56px] md:items-center ${index ? 'border-t border-border' : ''}`}>
              <div className="font-medium">{score.label}</div>
              <div><div className="mb-2 h-1.5 overflow-hidden rounded-full bg-primary/8"><div className="h-full rounded-full bg-primary" style={{ width: `${score.score}%` }} /></div><p className="text-sm text-muted-foreground">{score.verdict}</p></div>
              <div className="font-mono text-lg font-semibold">{score.score}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Observed friction" title="Fix the blockers" subtitle="Evidence first, then the smallest useful change." />
          <div className="space-y-3">
            {report.friction.map((item, index) => (
              <article key={`${item.title}-${index}`} className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-start justify-between gap-3"><h3 className="font-display text-xl font-semibold tracking-[-.02em]">{item.title}</h3><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${item.impact === 'High' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>{item.impact} impact</span></div>
                <p className="text-sm leading-6 text-muted-foreground"><span className="font-semibold text-foreground">Evidence:</span> {item.evidence}</p>
                <div className="mt-4 border-l-2 border-accent pl-4 text-sm leading-6"><span className="font-semibold">Change:</span> {item.fix}</div>
                <div className="mt-4 text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">{item.effort} effort</div>
              </article>
            ))}
          </div>
        </div>
        <div>
          <SectionHeading eyebrow="Prioritized plan" title="Quick wins" subtitle="Small moves with a visible adoption payoff." />
          <div className="space-y-3">
            {report.quickWins.map((item, index) => (
              <article key={`${item.title}-${index}`} className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-ring">
                <div className="mb-3 flex gap-4"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent font-mono text-xs font-bold">0{index + 1}</div><div><h3 className="font-display text-xl font-semibold tracking-[-.02em]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.why}</p></div></div>
                <div className="ml-12 rounded-xl bg-muted px-4 py-3 text-sm leading-6"><span className="font-semibold">How:</span> {item.how}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Copy lab" title="A sharper launch story" subtitle="Generated from the same evidence, ready to edit—not auto-published." />
        <div className="grid gap-4 lg:grid-cols-2">
          <CopyCard label="Homepage hero" value={`${report.launchCopy.headline}\n\n${report.launchCopy.subhead}`} onCopy={() => copy('hero', `${report.launchCopy.headline}\n\n${report.launchCopy.subhead}`)} copied={copied === 'hero'} large />
          <CopyCard label="Launch post" value={report.launchCopy.socialPost} onCopy={() => copy('post', report.launchCopy.socialPost)} copied={copied === 'post'} />
        </div>
      </section>

      <section className="rounded-2xl bg-primary p-6 text-white lg:p-8">
        <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] text-white/45"><CheckCircle2 className="h-4 w-4 text-accent" /> Evidence retained</div>
        <div className="grid gap-4 md:grid-cols-3">{report.proofPoints.map((point) => <div key={point} className="flex gap-3 text-sm leading-6 text-white/75"><Check className="mt-1 h-4 w-4 shrink-0 text-accent" />{point}</div>)}</div>
      </section>
    </div>
  )
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div className="mb-4"><div className="mb-1 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</div><div className="flex flex-wrap items-end justify-between gap-2"><h2 className="font-display text-2xl font-semibold tracking-[-.03em]">{title}</h2><p className="text-sm text-muted-foreground">{subtitle}</p></div></div>
}

function CopyCard({ label, value, onCopy, copied, large = false }: { label: string; value: string; onCopy: () => void; copied: boolean; large?: boolean }) {
  return <div className={`flex flex-col rounded-2xl border border-border bg-card p-5 ${large ? 'lg:row-span-1' : ''}`}><div className="mb-5 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">{label}</span><button onClick={onCopy} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">{copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}{copied ? 'Copied' : 'Copy'}</button></div><p className={`${large ? 'font-display text-2xl font-semibold leading-tight tracking-[-.03em]' : 'text-base leading-7'} whitespace-pre-line`}>{value}</p></div>
}
