/**
 * Unified server action response type.
 *
 * Superset of the former ActionResult (community actions) and
 * ServerActionResponse (form utilities). Both names are re-exported
 * from their original locations for backward compatibility.
 */
export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  /** Field-level validation errors (form actions) */
  errors?: Record<string, string>;
  /** Error classification code (e.g., UNAUTHORIZED, RATE_LIMITED) */
  code?: string;
  /** Whether the action was rate-limited */
  rateLimited?: boolean;
}
