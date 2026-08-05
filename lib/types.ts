/**
 * Core data model for the well-known-showcase archive.
 *
 * A "Spec" is a deep-dive entry: full explainer (what / threat / how it works)
 * plus, optionally, a live endpoint handler that this server actually serves
 * under /.well-known/...
 *
 * Every entry carries an honesty label so visitors can tell a real,
 * spec-accurate response from an illustrative demo.
 */

export type Category =
  | "security"
  | "identity"
  | "platform"
  | "email"
  | "privacy"
  | "discovery"
  | "agents"
  | "deprecated"
  | "reference";

export type DemoKind = "live" | "demo" | "reference";

export interface Spec {
  /** URL slug for /specs/<slug> */
  slug: string;
  /** Human-readable name of the spec / URI */
  name: string;
  /** The well-known URI(s) this spec defines, e.g. "/.well-known/security.txt" */
  uri: string | string[];
  /** Short human label for the governing standard, e.g. "RFC 9116" */
  standard: string;
  /** URL of the primary specification document */
  standardUrl: string;
  /** Which tier the URI belongs to */
  registrar: "iana" | "w3c" | "ietf" | "community" | "defacto";
  /** IANA registry status when IANA-registered: permanent | provisional | deprecated | obsoleted */
  ianaStatus?: string;
  /** Category for index grouping */
  category: Category;
  /** One-line description used in indexes and meta tags */
  summary: string;
  /** Longer "what is it" paragraph */
  what: string;
  /** The problem / threat the spec addresses */
  threat: string;
  /** How it works — bullet points */
  how: string[];
  /** Optional "gotchas / honesty" notes shown on the page */
  notes?: string[];
  /** Honesty label: live = real spec-accurate response; demo = format-valid illustrative; reference = not served */
  demoKind: DemoKind;
  /** Label shown for the demo, defaults from demoKind */
  demoLabel?: string;
  /** The request path used by the explainer page's live panel (defaults to uri when string) */
  demoPath?: string;
  /** Extra path/query/body for the demo panel fetch */
  demoFetch?: { method?: string; body?: string; headers?: Record<string, string> };
}

export interface RegistryEntry {
  /** IANA URI suffix, e.g. "security.txt" */
  suffix: string;
  /** Full well-known path */
  uri: string;
  /** Specification reference label */
  standard: string;
  /** Specification URL */
  url: string;
  /** IANA status */
  status: string;
  /** Change controller / organization */
  org: string;
  /** Registration date (YYYY-MM-DD) */
  registered: string;
  /** One-line honest description */
  summary: string;
  /** Optional deep-dive link (slug) */
  deepDive?: string;
}
