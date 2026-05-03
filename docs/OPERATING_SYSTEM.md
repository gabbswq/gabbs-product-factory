# Operating System

Gabbs Product Factory is operated as a personal AI product factory.

## Main paths

Main project:
~/ai-projects/gabbs-product-factory

Agent worktrees:
~/ai-projects/worktrees/gabbs-product-factory/frontend
~/ai-projects/worktrees/gabbs-product-factory/backend
~/ai-projects/worktrees/gabbs-product-factory/database

## Agents

- lead: planning and orchestration
- frontend: UI and user experience
- backend: APIs, auth, payments and Edge Functions
- database: schema, migrations, RLS and SQL validation

## Enter agents

tmux attach -t lead
tmux attach -t frontend
tmux attach -t backend
tmux attach -t database

If already attached:
tmux attach -d -t backend

## Leave safely

Press Ctrl+b, then d.

Do not use Ctrl+C to copy text. Ctrl+C may interrupt the agent.

## Capture long output

agent-copy backend
agent-copy lead
agent-copy frontend
agent-copy database

## Daily startup

cd ~/ai-projects/gabbs-product-factory
git status
git log --oneline --decorate --max-count=10
git worktree list
tmux ls

## Standard workflow

1. Ask the agent for a plan.
2. Review the plan.
3. Approve a small implementation.
4. Validate with commands.
5. Commit in the agent branch.
6. Merge into main.
7. Run build when needed.
8. Push to GitHub.

## Safety rules

- Plan before implementation.
- One task per commit.
- Keep work isolated in the correct worktree.
- Do not edit .env through agents.
- Do not commit secrets.
- Do not make the repository public before a security scan.
