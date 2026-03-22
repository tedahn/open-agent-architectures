# Contributing Architecture Articles

We want your architecture. Whether it is a weekend prototype or a battle-tested production system, your experience helps the community learn. This guide explains how to contribute and how to make your submission great.

## What This Project Is

This is a community showcase for AI agent system architectures -- real designs from real builders. Submissions are displayed on the [OpenHarness](https://openharness.dev) site so others can study, compare, and learn from different approaches to building agent systems.

## The Tier System

Every submission is automatically assigned a quality tier based on its content. Tiers are computed by our validation script -- you never self-declare a tier. Think of them as milestones, not gates. Start wherever you are and level up over time.

| Tier | Name | What It Signals | What You Need |
|------|------|----------------|---------------|
| 1 | **Concept** | Enough to understand the idea | Problem statement (50+ words), tech choices listed, license declared, at least 1 diagram or visual |
| 2 | **Documented** | Thorough enough to evaluate and learn from | All of Concept, plus: system context (external actors), 2+ architecture decisions with rationale (ADR format), data flow described, explicit trade-offs, 1+ quantified quality attribute |
| 3 | **Field-Tested** | Includes real-world evidence and battle scars | All of Documented, plus: failure modes and resilience, security model, deployment architecture, lessons learned, production metrics or scale evidence |

Your article starts at the highest tier whose requirements are fully met. The validation script tells you exactly what is missing to reach the next tier.

## Quick Start

1. **Fork** this repository
2. **Copy** the template:
   ```bash
   cp community/templates/architecture-template.mdx community/architectures/your-architecture-name.mdx
   ```
   Choose a descriptive, URL-friendly filename using lowercase and hyphens (e.g., `multi-agent-rag-pipeline.mdx`).
3. **Write** your architecture following the template sections
4. **Validate** your submission:
   ```bash
   cd community && npm run validate
   ```
   Fix any errors before submitting. The script tells you your current tier and what to add for the next one.
5. **Commit** with DCO sign-off:
   ```bash
   git add community/architectures/your-architecture-name.mdx
   git commit -s -m "Add architecture: your-architecture-name"
   ```
6. **Open a pull request** against `main`

## Section-by-Section Guide

### Problem & Context (Tier 1)

Explain the problem your system solves. Be specific about the domain, users, and constraints.

**Good:** "Our e-commerce platform needed to handle 500 customer support conversations simultaneously, with agents that could look up orders, process refunds, and escalate to humans -- all while maintaining a 30-second median response time."

**Weak:** "We built an AI agent system to help customers."

### Technology Choices (Tier 1)

List your stack with brief rationale for each choice. Name specific versions and services.

**Good:**
- **Python 3.12** -- team expertise, LangChain ecosystem compatibility
- **PostgreSQL 15 on RDS** -- ACID guarantees for order data, pgvector for embeddings
- **Redis 7 Cluster** -- sub-ms caching for session state

**Weak:**
- Python
- A database
- Cache layer

### Architecture Overview (Tier 1)

Describe the system shape with at least one diagram. Mermaid code blocks, linked images, or ASCII art all work. The diagram should show major components and how they connect.

### System Context (Tier 2)

Map everything external to your system: users, third-party APIs, upstream services, admin tools. A C4 System Context diagram is ideal but a simple list with descriptions works too.

### Data Flow (Tier 2)

Walk through at least one end-to-end flow. Sequence diagrams help, but a clear written narrative ("The user sends X, which triggers Y, which calls Z...") is also fine.

### Architecture Decisions (Tier 2)

Use ADR (Architecture Decision Record) format for at least two significant decisions. Good subjects include database choice, sync vs async messaging, LLM provider selection, or agent orchestration pattern.

Each ADR should include context (what forces were at play), the decision itself, alternatives you considered and why you rejected them, and consequences (good, bad, and neutral).

### Trade-offs & Constraints (Tier 2)

Every architecture sacrifices something. Name your trade-offs honestly and include at least one quantified quality attribute.

**Good:** "We chose eventual consistency for cross-region replication, accepting a 2-second propagation delay to achieve 99.95% availability. Target: p99 agent response latency under 500ms at 1,000 concurrent users."

**Weak:** "We made the best choices for our use case."

### Failure Modes & Resilience (Tier 3)

Describe what happens when components break. Include detection mechanisms (health checks, circuit breakers) and recovery strategies. Real incident anecdotes are gold.

### Security Model (Tier 3)

Document trust boundaries, authentication approach, and agent-specific security considerations like prompt injection prevention and tool-use guardrails.

### Deployment Architecture (Tier 3)

How does this run in production? Cover infrastructure, CI/CD, and observability. A deployment diagram adds clarity.

### Scale & Performance (Tier 3)

Share real numbers: requests per second, latency percentiles, data volumes, user counts, cost per request. Numbers beat adjectives.

### Lessons Learned (Tier 3)

The most valuable section. What worked, what surprised you, what you would change. Honest reflection helps the community more than polished marketing.

## Quality Signals

What makes an architecture article credible:

- **Specificity over buzzwords** -- "PostgreSQL 15 on RDS with pgvector" not "a database"
- **Quantified claims** -- "10K req/s at p99 < 200ms" not "highly scalable"
- **Trade-off honesty** -- state what was sacrificed and why
- **Decision rationale** -- explain why alternatives were rejected, not just what was picked
- **Production evidence** -- real metrics, incident stories, and operational lessons when available

## What to Avoid

- **Marketing language** -- this is a technical showcase, not a pitch deck
- **Buzzword stacking** -- "AI-powered cloud-native serverless microservices" says nothing
- **Happy-path-only descriptions** -- every system has failure modes; describe yours
- **Copy-pasted READMEs** -- adapt your content to the template structure
- **Unsubstantiated superlatives** -- "best-in-class" and "world-class" need evidence or should be removed

## Recommended Tags

Use tags that help readers find relevant architectures:

| Tag | Use when your architecture involves... |
|-----|---------------------------------------|
| `multi-agent` | Multiple cooperating or competing agents |
| `rag` | Retrieval-augmented generation |
| `tool-use` | Agents calling external tools or APIs |
| `human-in-the-loop` | Human review, approval, or feedback steps |
| `workflow` | Orchestrated multi-step agent workflows |
| `safety` | Guardrails, content filtering, or safety mechanisms |
| `monitoring` | Observability, logging, or agent behavior tracking |
| `evaluation` | Testing, benchmarking, or quality assessment of agents |
| `deployment` | Production deployment patterns and infrastructure |
| `cost-optimization` | Strategies for reducing API costs or compute usage |

You can also add custom tags relevant to your domain or technology stack.

## How Validation Works

Run the validation script to check your submission:

```bash
cd community && npm run validate
```

The script reads your `.mdx` file, checks frontmatter fields, measures section content, and computes your tier. It tells you:

- Your current tier
- Which requirements are met
- Exactly what to add to reach the next tier

You can submit at any tier. Tier 1 (Concept) is a perfectly valid starting point -- you can always update your article later to reach higher tiers.

## DCO Sign-Off

All contributions require a Developer Certificate of Origin sign-off. This certifies that you wrote the content or have the right to submit it. Add the sign-off to every commit:

```bash
git commit -s -m "Add architecture: your-architecture-name"
```

This appends `Signed-off-by: Your Name <your@email.com>` using your Git configuration. If you forget, you can amend:

```bash
git commit --amend -s
```

## License

All submissions are licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)**. By submitting, you agree that your content can be shared and adapted with attribution. See [LICENSE](./LICENSE) for details.

---

Questions? Open an issue or start a discussion. We are here to help you share your architecture with the community.
