/**
 * Facts the legal pages (src/app/pages/Legal.tsx) depend on. Fill these in
 * before launch; until `contactEmail` is set the pages point to the Help page.
 * Bump `version` (and `effective`) whenever the wording changes: it is saved
 * with each new account as the terms version they accepted.
 */
export const LEGAL = {
  /** Who runs EditMe. Not registered yet (Nov 2026): replace with the company name once it is, e.g. "EditMe Ltd". */
  operator: 'EditMe',
  /** Registered address, shown in the Terms and Privacy Policy once set. */
  address: '',
  /** One address for support, legal notices, privacy requests and copyright complaints. */
  contactEmail: 'moseschore9@gmail.com',
  /** Law that governs the Terms. */
  governingLaw: 'Kenya',
  /** Data protection regulator people can complain to. */
  regulator: 'the Office of the Data Protection Commissioner (Kenya)',
  effective: '18 November 2026',
  version: '2026-11-18',
  minimumAge: 18,
} as const;
