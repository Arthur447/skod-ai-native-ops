# skod-consultations MCP server

A read-only MCP server that exposes Skod's consultation data (bounded
context: `commu_consultation_order` + `commu_marktplace` for domain
resolution) to LLM-driven IDEs — primarily **Claude Code** during local
development.

## Why this exists

When you code a feature that touches consultations, you normally need to
run a handful of `ddev drush` commands to inspect current state: how many
consultations are in `processing`, which domain is active, what's the
distribution by type. Each context switch is a small tax.

This MCP server lets Claude Code query that state directly, inline with
your coding session, without leaving the conversation.

## Scope

**Read-only. Strictly.** No tool in this server mutates anything:

- No `drush config:set`
- No `entity:save`
- No SQL write of any kind

Design choice: if we ever add a mutation, it goes through a **different**
transport (HTTP + auth), with **Human-in-the-Loop** validation and an
**audit trail** — not by extending this server.

## Tools exposed

| Tool | Purpose |
|------|---------|
| `list_consultations` | List consultations, filter by state, limit 1–50 |
| `get_consultation_stats` | Aggregated counts by state and bundle type |
| `get_domain_info` | Metadata about a Skod domain |

Full input schemas live in `src/tools/*.ts` (Zod).

## Architecture

This package ships two cooperating pieces:

- **TypeScript MCP server** (`src/`) — thin adapter that spawns drush and parses JSON.
- **Drupal companion module** (`drupal-integration/commu_mcp_consultations/`) — holds the business logic as custom drush commands owned by the bounded context.

The TS side has zero Drupal knowledge. All entity queries, field access and serialization live in the PHP module. This keeps ownership clean (tech lead of `commu_consultation_order` owns the PHP, the MCP team owns the TS) and makes each side testable in isolation.

See `NOTES.md` → *Refactor #1* at the repo root for the story of why this split exists.

## Install & build

### 1. Enable the Drupal companion module in Skod

```bash
ddev drush pm:install commu_mcp_consultations
```

The module lives at `drupal-integration/commu_mcp_consultations/` in this folder. Either symlink it into `web/modules/custom/` or add it as a Composer path repository — whichever fits the Skod install workflow.

Verify the commands are registered:

```bash
ddev drush list --filter=commu-mcp
```

You should see `commu-mcp:consultations:list`, `commu-mcp:consultations:stats`, `commu-mcp:domain:info`.

### 2. Build the TypeScript MCP server

```bash
cd rnd/ai-native-tooling/mcp-servers/skod-consultations
npm install
npm run build
```

The compiled binary is `dist/index.js`.

## Wire into Claude Code

Add to your Claude Code MCP settings (typically
`~/.config/claude-code/mcp.json` or equivalent — check the Claude Code
docs for the current location):

```json
{
  "mcpServers": {
    "skod-consultations": {
      "command": "node",
      "args": [
        "/home/arthur/projets/d8/rnd/ai-native-tooling/mcp-servers/skod-consultations/dist/index.js"
      ],
      "env": {
        "SKOD_ROOT": "/home/arthur/projets/d8"
      }
    }
  }
}
```

Restart Claude Code. You should see the 3 tools listed under the MCP
section.

## Requirements

- Node.js ≥ 20
- DDEV running (`ddev start` in the Skod project)
- Drush available via `ddev drush`

## Manual smoke test

Bypass the MCP protocol and test a tool directly:

```bash
SKOD_ROOT=/home/arthur/projets/d8 node --input-type=module -e "
import('./dist/tools/list-consultations.js').then(async m => {
  const result = await m.listConsultations({ state: 'any', limit: 3 });
  console.log(JSON.stringify(result, null, 2));
});
"
```

## Security notes — Principle of Least Privilege

1. `ddev drush` is spawned with an **args array**, never a shell string → no
   shell-metacharacter injection possible regardless of input.
2. The drush commands invoked are a **short, hardcoded allowlist** in
   `src/drush-client.ts` callers. User input becomes `--option=value` args,
   typed and validated upstream.
3. The companion Drupal module only exposes **read-only** commands. No
   mutation path exists through this MCP.
4. All Zod schemas use strict types (`enum`, `int`, `min/max`, `regex`) and
   `.parse()` throws on unexpected input before any drush call.
5. No network listening, no credentials in code, no `.env` files read.
6. Scope boundary = **two bounded contexts only** (consultations + domain).
   Adding a third requires a review and ideally a new MCP server.
