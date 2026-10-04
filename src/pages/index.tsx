import { Link } from 'react-router-dom'
import { ArrowRight, Check, Github, Globe2, Radar, Sparkles } from 'lucide-react'
import { Seo } from '../components/Seo'
import { seo } from '../seo'

export default function Landing() {
  return (
    <>
      <Seo {...seo} path="/" />
      <div data-testid="static-landing" className="min-h-screen overflow-hidden bg-background text-foreground">
        <header className="mx-auto flex h-20 max-w-[1480px] items-center justify-between px-5 lg:px-10">
          <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-accent"><Radar className="h-5 w-5" /></div><span className="font-display text-xl font-semibold tracking-[-.03em]">LaunchLens</span></div>
          <Link to="/home" className="group inline-flex items-center gap-2 rounded-full border border-border bg-white/60 px-4 py-2 text-sm font-medium hover:border-ring">Open workspace <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></Link>
        </header>

        <main>
          <section className="mx-auto grid max-w-[1480px] gap-10 px-5 pb-20 pt-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,.85fr)] lg:px-10 lg:pb-28 lg:pt-24">
            <div>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-white/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.17em]"><Sparkles className="h-3.5 w-3.5" /> Developer adoption intelligence</div>
              <h1 className="font-display max-w-5xl text-6xl font-semibold leading-[.92] tracking-[-.065em] sm:text-7xl lg:text-[94px]">Find the gap between <span className="relative inline-block"><span className="relative z-10">built</span><span className="absolute inset-x-0 bottom-2 h-4 -rotate-1 bg-accent lg:bottom-3 lg:h-5" /></span> and adopted.</h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground">LaunchLens reads a public repository and its product experience, then turns the evidence into a scored adoption audit, prioritized fixes, and sharper launch copy.</p>
              <div className="mt-9 flex flex-wrap gap-3"><Link to="/home" className="group inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90">Explore the live audit <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></Link><a href="#how" className="inline-flex h-12 items-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-white/50">See the pipeline</a></div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Check className="h-3.5 w-3.5" /> Evidence, not generic advice</span><span className="flex items-center gap-2"><Check className="h-3.5 w-3.5" /> Durable background analysis</span><span className="flex items-center gap-2"><Check className="h-3.5 w-3.5" /> No auto-posting</span></div>
            </div>

            <div className="relative flex items-center justify-center lg:justify-end">
              <div className="absolute inset-8 rounded-full bg-accent opacity-55 blur-3xl" />
              <div className="relative w-full max-w-[540px] rotate-[1.5deg] rounded-3xl border border-border bg-card p-5 shadow-2xl">
                <div className="mb-5 flex items-center justify-between border-b border-border pb-4"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">Sample audit</div><div className="mt-1 font-display text-2xl font-semibold">ThreadHunt</div></div><div className="grid h-16 w-16 place-items-center rounded-full bg-accent font-display text-2xl font-semibold">78</div></div>
                <div className="space-y-4">{([['Positioning', 84], ['Time to value', 72], ['Trust', 88], ['Documentation', 82], ['Distribution', 63]] as const).map(([label, score]) => <div key={label}><div className="mb-1.5 flex justify-between text-xs"><span>{label}</span><span className="font-mono font-semibold">{score}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-primary/8"><div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} /></div></div>)}</div>
                <div className="mt-6 rounded-2xl bg-primary p-4 text-white"><div className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-accent">Top recommendation</div><p className="font-display text-lg leading-snug">Show the “found → scored → drafted” outcome before explaining the machinery.</p></div>
              </div>
            </div>
          </section>

          <section id="how" className="border-y border-border bg-primary text-white">
            <div className="mx-auto max-w-[1480px] px-5 py-16 lg:px-10 lg:py-20">
              <div className="mb-10 max-w-2xl"><div className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-accent">One focused pipeline</div><h2 className="font-display text-4xl font-semibold tracking-[-.045em] lg:text-5xl">Three integrations. One decision-ready brief.</h2></div>
              <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
                <PipelineCard icon={<Github />} number="01" title="Repository signals" body="GitHub metadata and README evidence establish what the product actually ships and how it explains itself." />
                <PipelineCard icon={<Globe2 />} number="02" title="Product experience" body="Firecrawl extracts the public landing or docs surface as a prospective developer encounters it." />
                <PipelineCard icon={<Sparkles />} number="03" title="Structured judgment" body="OpenAI produces a strict, evidence-grounded report while DeepSpace streams durable job progress live." />
              </div>
            </div>
          </section>

          <section className="mx-auto flex max-w-[1480px] flex-col items-start justify-between gap-7 px-5 py-16 lg:flex-row lg:items-end lg:px-10 lg:py-24"><div><div className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">The boundary is the product</div><h2 className="font-display max-w-3xl text-4xl font-semibold leading-tight tracking-[-.045em] lg:text-6xl">It recommends. Your team decides.</h2></div><Link to="/home" className="group inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold ring-1 ring-border">Open the sample report <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></Link></section>
        </main>

        <footer className="border-t border-border"><div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-5 py-7 text-xs text-muted-foreground lg:px-10"><span>LaunchLens — built on DeepSpace</span><span>Evidence in. Judgment out.</span></div></footer>
      </div>
    </>
  )
}

function PipelineCard({ icon, number, title, body }: { icon: React.ReactNode; number: string; title: string; body: string }) {
  return <article className="bg-primary p-6 lg:p-8"><div className="mb-12 flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-full bg-white/7 text-accent [&_svg]:h-5 [&_svg]:w-5">{icon}</div><span className="font-mono text-xs text-white/30">{number}</span></div><h3 className="font-display text-2xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-white/55">{body}</p></article>
}
