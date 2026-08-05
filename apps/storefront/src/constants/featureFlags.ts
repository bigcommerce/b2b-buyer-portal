/**
 * Temporary local flags for behaviour that will eventually move behind a real
 * feature-flag service. Keep this file limited to simple `boolean` toggles.
 *
 * - `SHOW_USER_NAME` — B2B-2219: render the logged-in user's own name on their
 *   quote messages instead of the quote's contact name. Flip to `false` to
 *   revert to the previous behaviour if an issue surfaces.
 */
export const SHOW_USER_NAME = true;
