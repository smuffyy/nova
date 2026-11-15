/**
 * Adaptive when-to-retrieve (SeaKR / When to Retrieve).
 * Skip company retrieval for pure personal/scheduling Sidekick turns.
 */

const PERSONAL_ONLY_RE =
  /\b(remind me|my calendar|schedule with me|personal note|don't tell|private to me|just between us)\b/i;
const COMPANY_NEED_RE =
  /\b(policy|invoice|vendor|refund|sop|standard|company|workspace|onboarding|shipping|billing|ledger)\b/i;

export function shouldRetrieveCompany(input: {
  surface: string;
  query: string;
}): boolean {
  if (input.surface !== "sidekick") return true;
  if (PERSONAL_ONLY_RE.test(input.query) && !COMPANY_NEED_RE.test(input.query)) {
    return false;
  }
  return true;
}
