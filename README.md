# Gabbs Product Factory

A personal AI-native product factory for building SaaS, media, education products and automation systems with Claude Code, Codex and multi-agent workflows.

## Vision

Gabbs Product Factory is the operating base for building digital products with AI agents.

The goal is not just to build one website. The goal is to create a reusable factory for shipping:

- SaaS products
- media platforms
- education products
- paid communities
- AI automation systems
- client projects
- experimental apps

## Current Product Direction

The first product direction is a media and education platform around AI, Web3, automation and digital product building.

The core business flow is:

1. User discovers public content.
2. User creates an account.
3. User buys access through Stripe Checkout.
4. Stripe webhook confirms the payment.
5. The app unlocks private content, products or community access.

## Tech Stack

- Next.js
- TypeScript
- Supabase
- Supabase Edge Functions
- Stripe
- GitHub
- WSL / Ubuntu
- tmux
- OpenSessions
- Claude Code
- OpenAI Codex
- Git worktrees

## Multi-Agent Workflow

The project is operated with separate agent worktrees:

- `lead` — planning and orchestration
- `frontend` — UI and product experience
- `backend` — auth, APIs, payments and Edge Functions
- `database` — schema, migrations and data validation

Human approval is required before implementation, commit, merge and push.

## Repository Status

This repository is currently the foundation for Gabbs Product Factory.

Completed foundation work includes:

- project cleanup
- GitHub setup
- multi-agent workspace
- OAuth callback and provider sync
- payments schema correction
- Stripe Checkout Edge Function
- Stripe webhook reconciliation fixes
- local playbook and operating workflow

## Operating Principle

Small tasks. Clear plans. Human approval. Isolated commits. Build before push.

