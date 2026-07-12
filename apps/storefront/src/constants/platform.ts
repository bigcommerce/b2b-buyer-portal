/**
 * Channel platforms referenced in buyer portal logic.
 *
 * - `BIGCOMMERCE` — Stencil storefront (native BC)
 * - `CATALYST` — BC headless (Catalyst)
 * - `CUSTOM` — default for other headless integrations (Next, Gatsby, etc.)
 */
export const PLATFORM = {
  BIGCOMMERCE: 'bigcommerce',
  CATALYST: 'catalyst',
  CUSTOM: 'custom',
} as const;
