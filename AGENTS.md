# Smart Menu — Agent Instructions

## What This Project Is

A SaaS restaurant menu platform for Tanzanian restaurants. QR code → web menu → AR food viewer. Built with Next.js, MongoDB, Prisma, NextAuth, model-viewer.

## How to Work on This Project

1. **Read the spec first** — every feature has a spec in `codev/specs/`. Never implement without reading it.
2. **Check the plan** — `codev/plans/` has implementation phases. Follow the phase order.
3. **Use SPIR** — Specify → Plan → Implement → Review. If a spec doesn't exist, ask the human to write one before coding.
4. **Write tests** — every feature needs at least basic tests.
5. **Update reviews** — after completing a phase, note lessons in `codev/reviews/`.

## Stack

Next.js 14 · Tailwind · HeroUI · MongoDB · Prisma · NextAuth · model-viewer · Azampay · Vercel

## Constraints

- Currency: TZS only
- Mobile-first (Android low-end)
- No app download required for AR (WebXR via browser)
- Multi-tenant (multiple restaurants, one deployment)

## Current Active Spec

`codev/specs/0001-project-setup.md`

## Key Locations

- **Specs**: `codev/specs/` - Feature specifications (WHAT to build)
- **Plans**: `codev/plans/` - Implementation plans (HOW to build)
- **Reviews**: `codev/reviews/` - Reviews and lessons learned
- **Protocols**: `codev/protocols/` - Development protocols

## Quick Start

1. For new features, start with the Specification phase
2. Create exactly THREE documents per feature: spec, plan, and review
3. Follow the protocol phases as defined in the protocol files
4. Use multi-agent consultation when specified

## File Naming Convention

Use sequential numbering with descriptive names:
- Specification: `codev/specs/1-feature-name.md`
- Plan: `codev/plans/1-feature-name.md`
- Review: `codev/reviews/1-feature-name.md`

## Git Workflow

**NEVER use `git add -A` or `git add .`** - Always add files explicitly.

Commit messages format:
```
[Spec 1] Description of change
[Spec 1][Phase: implement] feat: Add feature
```

## CLI Commands

Codev provides three CLI tools:

- **codev**: Project management (init, adopt, update, doctor)
- **af**: Agent Farm orchestration (start, spawn, status, cleanup)
- **consult**: AI consultation for reviews (general, protocol, stats)

For complete reference, see `codev/resources/commands/`:
- `codev/resources/commands/overview.md` - Quick start
- `codev/resources/commands/codev.md` - Project commands
- `codev/resources/commands/agent-farm.md` - Agent Farm commands
- `codev/resources/commands/consult.md` - Consultation commands

## Configuration

Agent Farm is configured via `af-config.json` at the project root. Created during `codev init` or `codev adopt`. Override via CLI flags: `--architect-cmd`, `--builder-cmd`, `--shell-cmd`.

```json
{
  "shell": {
    "architect": "claude",
    "builder": "claude",
    "shell": "bash"
  }
}
```

## For More Info

Read the full protocol documentation in `codev/protocols/`.
