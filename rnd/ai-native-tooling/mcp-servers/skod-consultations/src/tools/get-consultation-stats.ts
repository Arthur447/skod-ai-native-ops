// src/tools/get-consultation-stats.ts
//
// MCP tool: get_consultation_stats
//
// Thin adapter — delegates to `commu-mcp:consultations:stats` (Drupal module).

import { z } from "zod";
import { drushCommandJson } from "../drush-client.js";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

export const getConsultationStatsInputSchema = z.object({
  since_days: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .describe(
      "If set, only count consultations created in the last N days " +
        "(1-365). Omit to count all consultations.",
    ),
});

export type GetConsultationStatsInput = z.infer<typeof getConsultationStatsInputSchema>;

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------

export interface ConsultationStats {
  total: number;
  by_state: Record<string, number>;
  by_type: Record<string, number>;
  since_days: number | null;
}

// ---------------------------------------------------------------------------
// Tool handler
// ---------------------------------------------------------------------------

export async function getConsultationStats(
  input: GetConsultationStatsInput,
): Promise<ConsultationStats> {
  return drushCommandJson<ConsultationStats>("commu-mcp:consultations:stats", {
    // Note: the drush option is kebab-case (`--since-days`), we convert here.
    "since-days": input.since_days ?? undefined,
  });
}
