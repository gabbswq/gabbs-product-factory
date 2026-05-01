#!/usr/bin/env python3
"""
Claude API cached diff reviewer.

Uso:
  ANTHROPIC_API_KEY=... python scripts/claude-review-diff.py

Exemplos:
  python scripts/claude-review-diff.py --staged
  python scripts/claude-review-diff.py --last-commit
  python scripts/claude-review-diff.py --task "Revisar BE-01 OAuth callback"

Nunca coloque API key neste arquivo.
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import pathlib
import subprocess
import sys

try:
    import anthropic
except ImportError:
    print(
        "Erro: pacote 'anthropic' não instalado.\n"
        "Instale com:\n"
        "  python3 -m pip install --user anthropic\n",
        file=sys.stderr,
    )
    sys.exit(1)


ROOT = pathlib.Path(__file__).resolve().parents[1]
REVIEWS_DIR = ROOT / "docs" / "reviews"

DEFAULT_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-5-20250929")
MAX_CONTEXT_CHARS = int(os.environ.get("CLAUDE_REVIEW_MAX_CONTEXT_CHARS", "120000"))
MAX_DIFF_CHARS = int(os.environ.get("CLAUDE_REVIEW_MAX_DIFF_CHARS", "90000"))

CONTEXT_FILES = [
    "AGENTS.md",
    "CLAUDE.md",
    "TASKS.md",
    "package.json",
    "tsconfig.json",
    "docs/database-migration-validation.md",
    "docs/agent-system/repo-map.md",
    "docs/agent-system/references.md",
    "docs/agent-system/orchestration-plan.md",
    "docs/agent-system/claude-api-cache-plan.md",
]

CONTEXT_GLOBS = [
    "supabase/migrations/*.sql",
]

DENY_PARTS = {
    ".git",
    "node_modules",
    ".next",
    "dist",
    "build",
    ".venv",
    "venv",
}

DENY_FILENAMES = {
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
}


def run(cmd: list[str], check: bool = False) -> str:
    result = subprocess.run(
        cmd,
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )

    if check and result.returncode != 0:
        raise RuntimeError(f"Comando falhou: {' '.join(cmd)}\n{result.stdout}")

    return result.stdout.strip()


def is_safe_path(path: pathlib.Path) -> bool:
    rel = path.relative_to(ROOT)

    if any(part in DENY_PARTS for part in rel.parts):
        return False

    if path.name in DENY_FILENAMES:
        return False

    if path.name.startswith(".env."):
        return False

    return True


def read_text_file(path: pathlib.Path, max_chars: int = 30000) -> str:
    if not path.exists() or not path.is_file():
        return ""

    if not is_safe_path(path):
        return ""

    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except Exception as exc:
        return f"[Erro lendo {path}: {exc}]"

    if len(text) > max_chars:
        return text[:max_chars] + f"\n\n[TRUNCADO em {max_chars} chars]\n"

    return text


def collect_context() -> str:
    chunks: list[str] = []

    for rel in CONTEXT_FILES:
        path = ROOT / rel
        text = read_text_file(path)
        if text:
            chunks.append(f"\n\n===== FILE: {rel} =====\n{text}")

    for pattern in CONTEXT_GLOBS:
        for path in sorted(ROOT.glob(pattern)):
            if not is_safe_path(path):
                continue

            rel = path.relative_to(ROOT)
            text = read_text_file(path, max_chars=20000)
            if text:
                chunks.append(f"\n\n===== FILE: {rel} =====\n{text}")

    context = "".join(chunks).strip()

    if len(context) > MAX_CONTEXT_CHARS:
        context = context[:MAX_CONTEXT_CHARS] + f"\n\n[CONTEXTO TRUNCADO em {MAX_CONTEXT_CHARS} chars]\n"

    return context


def collect_diff(args: argparse.Namespace) -> str:
    if args.last_commit:
        diff = run(["git", "diff", "--no-ext-diff", "HEAD~1..HEAD"])
    elif args.staged:
        diff = run(["git", "diff", "--cached", "--no-ext-diff"])
    else:
        diff = run(["git", "diff", "--no-ext-diff"])

        if not diff.strip():
            diff = run(["git", "diff", "--cached", "--no-ext-diff"])

    if len(diff) > MAX_DIFF_CHARS:
        diff = diff[:MAX_DIFF_CHARS] + f"\n\n[DIFF TRUNCADO em {MAX_DIFF_CHARS} chars]\n"

    return diff


def make_system_prompt(context: str) -> list[dict]:
    text = f"""
Você é um revisor sênior de código, segurança e arquitetura para um projeto Next.js/Supabase operado por múltiplos agentes.

Você deve revisar mudanças antes de merge.

Prioridades:
1. segurança;
2. vazamento de segredo;
3. auth/session/OAuth;
4. Supabase/RLS/migrations;
5. build/typecheck;
6. escopo da tarefa;
7. risco de conflito entre agentes.

Regras:
- Não sugira reescrever tudo.
- Não invente arquivos que não viu.
- Aponte riscos concretos.
- Diga claramente se está APROVADO, APROVADO COM RESSALVAS ou BLOQUEADO.
- Seja objetivo.
- Responda em português do Brasil.

Contexto fixo do projeto:
{context}
""".strip()

    return [
        {
            "type": "text",
            "text": text,
            "cache_control": {"type": "ephemeral"},
        }
    ]


def make_user_prompt(
    args: argparse.Namespace,
    git_status: str,
    git_branch: str,
    diff_stat: str,
    diff: str,
) -> str:
    task = args.task or "Revisar o diff atual do agente antes de merge."

    return f"""
Tarefa declarada:
{task}

Branch atual:
{git_branch}

Git status:
{git_status}

Diff stat:
{diff_stat}

Diff completo:

{diff}

Faça uma revisão objetiva com este formato:

# Review

## Veredito
APROVADO / APROVADO COM RESSALVAS / BLOQUEADO

## Resumo
- ...

## Riscos encontrados
- ...

## Segurança e segredos
- ...

## Supabase/Auth/RLS/Migrations
- ...

## Build/Testes recomendados
- ...

## Arquivos que merecem atenção
- ...

## Próxima ação recomendada
- ...
""".strip()


def save_review(text: str) -> pathlib.Path:
    REVIEWS_DIR.mkdir(parents=True, exist_ok=True)

    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    branch = run(["git", "branch", "--show-current"]) or "unknown-branch"
    safe_branch = "".join(c if c.isalnum() or c in "-_" else "-" for c in branch)

    path = REVIEWS_DIR / f"{stamp}-{safe_branch}-claude-review.md"
    path.write_text(text, encoding="utf-8")

    return path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--staged", action="store_true", help="Revisar apenas git diff --cached")
    parser.add_argument("--last-commit", action="store_true", help="Revisar HEAD~1..HEAD")
    parser.add_argument("--task", default="", help="Descrição da tarefa/mudança")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Modelo Anthropic")
    parser.add_argument("--max-tokens", type=int, default=1800)

    args = parser.parse_args()

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print(
            "Erro: ANTHROPIC_API_KEY não definida.\n\n"
            "Use assim, sem salvar no código:\n"
            "  export ANTHROPIC_API_KEY='sua-chave-aqui'\n"
            "  python scripts/claude-review-diff.py\n",
            file=sys.stderr,
        )
        return 1

    git_status = run(["git", "status", "--short"])
    git_branch = run(["git", "branch", "--show-current"])

    if args.last_commit:
        diff_stat = run(["git", "diff", "--stat", "HEAD~1..HEAD"])
    elif args.staged:
        diff_stat = run(["git", "diff", "--cached", "--stat"])
    else:
        diff_stat = run(["git", "diff", "--stat"])
        if not diff_stat.strip():
            diff_stat = run(["git", "diff", "--cached", "--stat"])

    diff = collect_diff(args)

    if not diff.strip():
        print("Nada para revisar: git diff vazio.", file=sys.stderr)
        return 1

    context = collect_context()

    print(f"Contexto coletado: {len(context)} chars")
    print(f"Diff coletado: {len(diff)} chars")
    print("Chamando Claude API com prompt caching...")

    client = anthropic.Anthropic()

    response = client.messages.create(
        model=args.model,
        max_tokens=args.max_tokens,
        system=make_system_prompt(context),
        messages=[
            {
                "role": "user",
                "content": make_user_prompt(args, git_status, git_branch, diff_stat, diff),
            }
        ],
    )

    review_parts: list[str] = []

    for block in response.content:
        if getattr(block, "type", None) == "text":
            review_parts.append(block.text)

    review = "\n\n".join(review_parts).strip()

    usage_json = response.usage.model_dump_json(indent=2)

    output = (
        review
        + "\n\n---\n\n"
        + "## Uso da API\n\n"
        + usage_json
        + "\n"
    )

    path = save_review(output)

    print()
    print(output)
    print()
    print(f"Review salvo em: {path.relative_to(ROOT)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
