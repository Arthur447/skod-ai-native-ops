// src/tools/get-domain-info.ts
//
// MCP tool: get_domain_info
//
// Thin adapter — delegates to `commu-mcp:domain:info` (Drupal module).

import { z } from "zod";
import { drushCommandJson } from "../drush-client.js";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

export const getDomainInfoInputSchema = z.object({
  domain_id: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, "domain_id must be lowercase alphanumeric + underscore")
    .optional()
    .describe(
      "Domain machine name (e.g. 'arthur_ddev_site'). Omit to return the " +
        "first registered domain.",
    ),
});

export type GetDomainInfoInput = z.infer<typeof getDomainInfoInputSchema>;

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------

export interface DomainInfo {
  id: string;
  hostname: string;
  name: string;
  is_default: boolean;
  admin_uid: string | null;
}

// ---------------------------------------------------------------------------
// Tool handler
// ---------------------------------------------------------------------------

export async function getDomainInfo(
  input: GetDomainInfoInput,
): Promise<DomainInfo> {
  return drushCommandJson<DomainInfo>("commu-mcp:domain:info", {
    "domain-id": input.domain_id ?? undefined,
  });
}
