# LaunchLens

LaunchLens is an evidence-backed developer adoption audit. Give it a public
GitHub repository and a product or documentation URL; it returns a scored
diagnostic, observed friction, prioritized fixes, and copy-ready positioning.

The public sample is available without an account. Live audit generation is
restricted to the app owner because it spends developer-funded integration
credits.

## Why this scope

Developer products often have strong implementation and weak explanation. A
generic AI critique is easy to produce and hard to trust, so LaunchLens grounds
every report in two real surfaces: what the repository says and what a new
visitor sees. It stops at recommendation—the product never edits a repository
or publishes marketing copy.

## DeepSpace primitives

- **GitHub integration** — repository metadata and README evidence.
- **Firecrawl integration** — rendered product/docs content.
- **OpenAI integration** — a strict structured adoption report.
- **JobRoom** — durable background processing with live progress, retry, and
  cancellation.
- **RecordRoom** — authenticated report history and decision state that syncs
  in real time.
- **PresenceRoom** — live reviewer count in the audit workspace.
- **DeepSpace Auth/RBAC** — public sample, private records, and an admin-only
  paid-job boundary.

## Important product path

1. Open the public sample and inspect the complete report format.
2. Sign in as the app owner.
3. Submit a GitHub repository URL, product/docs URL, audience, and goal.
4. Watch GitHub → website extraction → analysis progress stream live.
5. Save the completed report and mark it reviewing, approved, or parked.

## Local development

```bash
npm install
npx deepspace auth login
npx deepspace dev start
```

Quality checks:

```bash
npm run type-check
npm run lint
npm run build
npm run test:unit
```

Deploy:

```bash
npx deepspace deploy
```

## Main tradeoff

LaunchLens analyzes one repository and one public product surface. It does not
crawl an entire docs site, compare competitors, auto-open issues, or publish
copy. Those features increase cost and permissions while weakening the focused
evaluation path. The next useful extension would be team comments on individual
recommendations, followed by a bounded multi-page docs audit.

## AI-agent contribution

I used a coding agent to accelerate DeepSpace documentation research, project scaffolding, implementation, and initial testing. I directed the product scope, selected the final workflow, and approved the owner-only boundary that protects integration credits. I completed account authentication, reviewed the deployed application, tested the public reviewer experience, ran a real GitHub–Firecrawl–OpenAI audit through the owner account, and checked the generated findings against the repository and product website.
