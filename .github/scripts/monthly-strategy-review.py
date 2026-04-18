#!/usr/bin/env python3
"""Draft a monthly strategy-review Markdown document for Skod.

Behavior
--------
- Reads docs/META-PLAN.md, docs/STRATEGY.md, docs/VISION.md and the
  last 30 days of commits on the current branch.
- If ANTHROPIC_API_KEY is set in the environment, calls the Claude
  API to produce a data-grounded draft review.
- Otherwise, falls back to a static checklist template so the
  workflow still produces a useful monthly reminder.
- Prints the Markdown draft to stdout. The calling workflow
  captures the output and opens a GitHub Issue with it.

Usage
-----
    python .github/scripts/monthly-strategy-review.py > draft.md
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path


ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
REPO_ROOT = Path(__file__).resolve().parents[2]


def read_doc(relative_path: str) -> str:
    path = REPO_ROOT / relative_path
    if not path.exists():
        return f"(missing on this branch: {relative_path})"
    return path.read_text(encoding="utf-8")


def recent_commits(days: int = 30) -> str:
    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    result = subprocess.run(
        [
            "git",
            "log",
            f"--since={since}",
            "--pretty=format:%h %ad %s",
            "--date=short",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    output = result.stdout.strip()
    return output if output else "(no commits in the last 30 days)"


def fallback_template(month: str, commits: str) -> str:
    return f"""# Monthly strategy review — {month}

> No `ANTHROPIC_API_KEY` configured. Set it as a repository secret to get
> an AI-drafted review from next month. This is the static checklist
> fallback.

## Review checklist

- [ ] Re-read `docs/META-PLAN.md` and flip any ❌ / 🟡 / ✅ that changed
- [ ] Re-read `docs/STRATEGY.md` — does it still reflect reality?
- [ ] Re-read `docs/VISION.md` — any drift to flag?
- [ ] Check `docs/ROADMAP-ai-native-organization.md` for priorities that
      became obsolete or need re-ordering
- [ ] Did any strategic trigger fire this month (CDI offer, fund
      outreach, PMF signal, alarm signal)?
- [ ] R3 visibility — has the 3-month mark been reached?
      If yes and the public repo is objectively solid, publish
      externally regardless of the "not legitimate yet" feeling.
- [ ] Append a new entry to the META-PLAN session log summarizing
      this month

## Commits on this repo in the last 30 days

```
{commits}
```

---

Fill this issue, then commit the META-PLAN update and close the issue.
"""


def build_claude_prompt(
    meta_plan: str, strategy: str, vision: str, commits: str, month: str
) -> str:
    return f"""You are drafting the monthly strategy review for Skod, a
solo-founder micro-SaaS operated as a 360° AI-native organization
demonstration. The review will be opened as a GitHub Issue on the
public operating-model repository.

Your output must be a single Markdown document, ready to paste as
the Issue body. It must:

1. Start with a level-1 heading `# Monthly strategy review — {month}`.
2. Have three sections:
   - `## What happened this month` — 3 to 6 bullet points grounded
     in the commits below (quote SHAs or subjects); no fluff.
   - `## Cascade status check` — for each of the 7 levels in the
     META-PLAN, give a one-line verdict: unchanged / flipped
     (❌→🟡→✅) / needs review. Flag any trace-up inconsistency
     (e.g. a roadmap priority that does not trace up to a strategy
     element).
   - `## Proposed updates` — concrete checklist items to apply this
     month. Each item must reference a file path.
3. End with `## Triggers watched` — a three-column table (Trigger,
   Status, Action-if-fired) covering: CDI top poste, seed fund
   outreach, R3 visibility 3-month mark, alarm signal (interview
   challenge on AI-native positioning).
4. Be direct and factual — no marketing fluff, no over-optimism, no
   fake enthusiasm. A seasoned CTO should read it in 3 minutes and
   know exactly what state the strategy is in.

Here is the current state of the documents and the commit log.

=== docs/META-PLAN.md ===
{meta_plan}

=== docs/STRATEGY.md ===
{strategy}

=== docs/VISION.md ===
{vision}

=== Commits on this repo in the last 30 days ===
{commits}

Now write the Markdown document for the Issue body. Output only the
Markdown, nothing else (no surrounding prose, no code fences around
the whole output).
"""


def call_claude(prompt: str, api_key: str) -> str:
    payload = json.dumps(
        {
            "model": ANTHROPIC_MODEL,
            "max_tokens": 3000,
            "messages": [{"role": "user", "content": prompt}],
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        ANTHROPIC_API_URL,
        data=payload,
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="replace")
        print(f"Claude API HTTP {exc.code}: {err_body}", file=sys.stderr)
        raise
    except urllib.error.URLError as exc:
        print(f"Claude API URL error: {exc.reason}", file=sys.stderr)
        raise

    content = body.get("content", [])
    if not content or not isinstance(content, list):
        raise RuntimeError("Claude response has no content blocks")
    return content[0].get("text", "").strip()


def main() -> int:
    month = datetime.now(timezone.utc).strftime("%B %Y")
    commits = recent_commits(30)
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()

    if not api_key:
        print(fallback_template(month, commits))
        return 0

    meta_plan = read_doc("docs/META-PLAN.md")
    strategy = read_doc("docs/STRATEGY.md")
    vision = read_doc("docs/VISION.md")
    prompt = build_claude_prompt(meta_plan, strategy, vision, commits, month)

    try:
        draft = call_claude(prompt, api_key)
    except Exception as exc:  # noqa: BLE001
        print(f"Claude call failed ({exc}); falling back to template.", file=sys.stderr)
        print(fallback_template(month, commits))
        return 0

    print(draft)
    return 0


if __name__ == "__main__":
    sys.exit(main())
