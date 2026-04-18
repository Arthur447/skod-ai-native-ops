// src/drush-client.ts
//
// Thin wrapper around `ddev drush <command> [--options]`.
//
// This client assumes the Drupal side exposes the actual business logic as
// custom drush commands (see ../drupal-integration/commu_mcp_consultations/).
// The TypeScript side is now a pure adapter: it spawns, collects stdout,
// parses JSON. No Drupal knowledge leaks into this layer.
//
// SECURITY — Principle of Least Privilege:
//   1. `spawn('ddev', [...args])` uses an args ARRAY. No shell interpolation,
//      no injection possible regardless of what the caller passes.
//   2. The caller declares the command name as a string constant (our own
//      code, never user input). User input flows in as typed --options.
//   3. All MCP tools route through a handful of READ-ONLY drush commands.
//      The security boundary is enforced at the drush-commands level, not
//      here — if a drush command is safe, calling it with any valid options
//      is safe.

import { spawn } from "node:child_process";

const DRUSH_TIMEOUT_MS = 15_000;

export interface DrushOptions {
  /** CLI options like { state: 'processing', limit: 10 } → --state=processing --limit=10 */
  readonly [key: string]: string | number | boolean | null | undefined;
}

/**
 * Execute a drush command and return its stdout (trimmed).
 *
 * @param command  Drush command name — must be a hardcoded string in our code.
 * @param options  CLI options; undefined/null values are skipped.
 * @param cwd      Working directory; defaults to SKOD_ROOT env or process.cwd().
 */
export async function drushCommand(
  command: string,
  options: DrushOptions = {},
  cwd: string = process.env.SKOD_ROOT ?? process.cwd(),
): Promise<string> {
  const args: string[] = ["drush", "--quiet", command];
  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === null || value === "") continue;
    args.push(`--${key}=${String(value)}`);
  }

  return new Promise((resolve, reject) => {
    const child = spawn("ddev", args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`drush ${command} timed out after ${DRUSH_TIMEOUT_MS}ms`));
    }, DRUSH_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to spawn ddev drush: ${err.message}`));
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(
          new Error(
            `drush ${command} exited with code ${code}: ${stderr.trim() || "(no stderr)"}`,
          ),
        );
        return;
      }
      resolve(stdout.trim());
    });
  });
}

/**
 * Convenience: run a drush command that emits JSON on stdout and parse it.
 */
export async function drushCommandJson<T = unknown>(
  command: string,
  options: DrushOptions = {},
): Promise<T> {
  const stdout = await drushCommand(command, options);
  try {
    return JSON.parse(stdout) as T;
  } catch {
    throw new Error(
      `drush ${command} returned non-JSON output (first 200 chars): ${stdout.slice(0, 200)}`,
    );
  }
}
