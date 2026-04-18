// src/tools/list-consultations.ts
//
// MCP tool: list_consultations
//
// Thin adapter — delegates to the custom drush command
// `commu-mcp:consultations:list` provided by the companion Drupal module
// ../../drupal-integration/commu_mcp_consultations/.
//
// The tool file's only concerns are:
//   1. Declare the input schema (what the agent sends us)
//   2. Declare the output shape (what we give back)
//   3. Map input → drush options → parsed JSON
//
// All business logic (entity query, serialization) lives in the Drupal module,
// where it's testable via PHPUnit and owned by the tech lead of the bounded
// context.

import { z } from "zod";
import { drushCommandJson } from "../drush-client.js";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

export const listConsultationsInputSchema = z.object({
  state: z
    .enum(["draft", "configured", "processing", "completed", "canceled", "any"])
    .default("any")
    .describe(
      "Consultation state filter. 'any' returns all states. Matches the " +
        "Consultation entity state machine in commu_consultation_order.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe("Max number of consultations to return (1-50, default 10)."),
});

export type ListConsultationsInput = z.infer<typeof listConsultationsInputSchema>;

// ---------------------------------------------------------------------------
// Output type — mirrors ConsultationMcpCommands::listConsultations() output
// ---------------------------------------------------------------------------

export interface ConsultationSummary {
  id: string;
  type: string;
  state: string;
  created: string; // ISO date
  pro_id: string | null;
  user_id: string | null;
}

// ---------------------------------------------------------------------------
// Tool handler
// ---------------------------------------------------------------------------

export async function listConsultations(
  input: ListConsultationsInput,
): Promise<ConsultationSummary[]> {
  return drushCommandJson<ConsultationSummary[]>("commu-mcp:consultations:list", {
    state: input.state,
    limit: input.limit,
  });
}
