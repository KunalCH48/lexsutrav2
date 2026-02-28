/**
 * logError — centralised server-side error logger.
 *
 * Writes to the `error_logs` Supabase table via the service-role client
 * (bypasses RLS). Also logs to console so errors appear in Vercel logs.
 *
 * Safe to call from:
 *  - Next.js server actions ("use server")
 *  - API route handlers (app/api/*)
 *  - Server components (sparingly)
 *
 * Never throws — if the DB write itself fails, it falls back to console only.
 */

import { createSupabaseAdminClient } from "./supabase-server";

export type ErrorSeverity = "error" | "warning" | "info";

export interface LogErrorParams {
  /** The raw error — Error instance, Supabase error, or any unknown throw */
  error: unknown;

  /** File or route where this happened, e.g. "admin/demo-requests/[id]/actions" */
  source: string;

  /** Specific function or operation, e.g. "createClientAccount" */
  action: string;

  /** auth.users.id of the user who triggered the action, if known */
  userId?: string | null;

  /** companies.id of the affected company, if known */
  companyId?: string | null;

  /** Extra context to help debug — e.g. { demoId, email, diagnosticId } */
  metadata?: Record<string, unknown>;

  severity?: ErrorSeverity;
}

export async function logError({
  error,
  source,
  action,
  userId      = null,
  companyId   = null,
  metadata    = {},
  severity    = "error",
}: LogErrorParams): Promise<void> {
  const message    = error instanceof Error ? error.message : String(error);
  const stackTrace = error instanceof Error ? (error.stack ?? null) : null;

  // Always log to console — shows in Vercel Functions logs
  const prefix = `[${severity.toUpperCase()}] ${source} › ${action}`;
  if (severity === "error") console.error(prefix, message);
  else if (severity === "warning") console.warn(prefix, message);
  else console.info(prefix, message);

  // Write to DB — fail silently so errors never crash the caller
  try {
    const adminClient = createSupabaseAdminClient();
    await adminClient.from("error_logs").insert({
      actor_id:      userId,
      company_id:    companyId,
      severity,
      source,
      action,
      error_message: message,
      stack_trace:   stackTrace,
      metadata,
    });
  } catch (logErr) {
    // If the DB write fails, log that too but never throw
    console.error("[logError] Failed to write to error_logs table:", logErr);
  }
}

/** Convenience wrapper — logs at 'warning' level */
export async function logWarning(params: Omit<LogErrorParams, "severity">) {
  return logError({ ...params, severity: "warning" });
}

/** Convenience wrapper — logs at 'info' level */
export async function logInfo(params: Omit<LogErrorParams, "severity">) {
  return logError({ ...params, severity: "info" });
}
