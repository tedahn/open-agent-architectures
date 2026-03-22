<p align="center">
  <strong>Open Agent Architectures</strong>
  <br />
  Community-contributed AI agent architecture documentation
  <br />
  <br />
  <a href="https://tedahn.github.io/open-agent-harness-page/architectures/">Explore</a>
  &nbsp;&middot;&nbsp;
  <a href="#quick-start">Contribute</a>
  &nbsp;&middot;&nbsp;
  <a href="CONTRIBUTING.md">Full Guide</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-CC%20BY%204.0-blue" alt="CC BY 4.0" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome" />
  <img src="https://img.shields.io/badge/contributions-open-orange" alt="Contributions Open" />
</p>

---

## What is this?

A public collection of real-world AI agent architectures, written by the engineers who built them.

Each submission is an MDX article documenting how an agent system works — the problem it solves, the components involved, the decisions made, and the lessons learned. Submissions are published on the [OpenHarness Explore page](https://tedahn.github.io/open-agent-harness-page/architectures/) where anyone can browse, filter, and learn from them.

**This is not a code repository.** It's a knowledge repository. Think of it as a community-written reference library for AI agent system design.

---

## Why contribute?

- **Share what you've learned** so others don't repeat your mistakes
- **Get structured feedback** on your architecture from the community
- **Build your profile** — each submission links to your GitHub
- **Help establish patterns** for a field that's still figuring things out

---

## Quality tiers

Every submission is automatically assigned a quality tier. You don't self-declare — the validation script detects it based on what sections you've written.

Tiers are milestones, not gates. Start wherever you are.

| Tier | Label | What it signals |
|------|-------|-----------------|
| 1 | **Concept** | Enough to understand the idea |
| 2 | **Documented** | Thorough enough to evaluate and learn from |
| 3 | **Field-Tested** | Includes real-world evidence and battle scars |

<details>
<summary><strong>What each tier requires</strong></summary>

### Concept

The minimum bar. Demonstrates a clear idea with enough context to understand the approach.

- Problem statement (50+ words describing the real problem)
- Technology choices with brief rationale
- Architecture overview with at least one diagram or visual

### Documented

A thorough architecture document. Readers can evaluate your approach and learn from your decisions.

Everything in Concept, plus:

- System context — external actors, APIs, users that interact with your system
- Components — major building blocks and responsibilities
- Data flow — how data moves through the system
- Architecture decisions — at least 2 in ADR format (context, decision, alternatives, consequences)
- Trade-offs — what was explicitly sacrificed and why
- At least one quantified metric (latency, throughput, scale, etc.)

### Field-Tested

Battle-tested architecture with production evidence. The most valuable tier for the community.

Everything in Documented, plus:

- Failure modes and resilience — what breaks and how you handle it
- Security model — trust boundaries, auth approach, threat considerations
- Deployment architecture — how it runs in production
- Scale and performance — quantified operational characteristics
- Lessons learned — what worked, what didn't, what you'd change

</details>

---

## Quick start

```bash
# 1. Fork and clone this repo
git clone https://github.com/<your-username>/open-agent-architectures.git
cd open-agent-architectures

# 2. Copy the template
cp templates/architecture-template.mdx architectures/your-architecture-name.mdx

# 3. Write your architecture (edit the file)

# 4. Validate
npm run validate

# 5. Commit with DCO sign-off and open a PR
git add architectures/your-architecture-name.mdx
git commit -s -m "feat: add your-architecture-name"
git push origin main
```

The validation script will tell you your current tier and exactly what to add to level up.

---

## Repository structure

```
open-agent-architectures/
├── architectures/          # Community submissions (MDX files)
│   ├── multi-agent-rag-pipeline.mdx
│   └── tool-scoped-agent-framework.mdx
├── templates/
│   └── architecture-template.mdx   # Start here
├── scripts/
│   └── validate.mjs               # Validation + tier detection
├── CONTRIBUTING.md                 # Full contribution guide
├── LICENSE                         # CC BY 4.0
└── package.json
```

---

## What makes a good submission?

**Be specific, not generic.**

| Instead of | Write |
|------------|-------|
| "a database" | "PostgreSQL 15 on RDS with pgvector for embeddings" |
| "highly scalable" | "handles 10K requests/sec at p99 < 200ms" |
| "we chose microservices" | "we chose microservices because the team was split across 3 time zones and needed independent deploy cycles" |
| "it's secure" | "API gateway validates JWTs; internal services use mTLS; PII is encrypted at rest with AWS KMS" |

**Include what went wrong.** The most valuable part of any architecture document is honesty about trade-offs, failures, and things you'd change. Nobody learns from a press release.

**Show your decisions, not just your choices.** Don't just say what you picked — explain what you rejected and why. Architecture decisions with rationale are the core of a useful submission.

---

## Recommended tags

Use these tags in your frontmatter to help readers find your architecture:

`multi-agent` · `rag` · `tool-use` · `human-in-the-loop` · `workflow` · `safety` · `monitoring` · `evaluation` · `deployment` · `cost-optimization`

Custom tags are welcome if none of these fit.

---

## Validation

The validation script checks your submission and auto-detects your tier:

```bash
npm run validate
```

```
Validating: my-architecture.mdx

✓ Frontmatter: all required fields valid
✓ MDX: parses successfully

Tier Assessment:
  ✓ Concept requirements met
  ✓ Documented requirements met
  ✗ Field-Tested: missing "Security Model"

┌─────────────────────────────────────┐
│  Tier: Documented                   │
│  "Thorough enough to evaluate"      │
└─────────────────────────────────────┘

To reach Field-Tested, add:
  → "Security Model" — Identify trust boundaries and auth approach.
```

**Errors** block your PR. **Suggestions** help you level up but don't block.

---

## License

All submissions are licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

You're free to share and adapt any architecture in this collection, as long as you give appropriate credit.

Contributors must sign off their commits with [DCO](https://developercertificate.org/) (`git commit -s`).

---

<p align="center">
  <sub>Built for the <a href="https://tedahn.github.io/open-agent-harness-page/">OpenHarness</a> community</sub>
</p>
