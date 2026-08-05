# well-known-showcase — agent instructions

`CLAUDE.md` is the canonical operator manual; this file is the short version for tools that look for
`AGENTS.md`.

## Hard rules

- **Every endpoint is honest.** Three labels only: `live` (spec-accurate for real), `demo`
  (format-valid, illustrative values, labelled in-band), `reference` (documented, not served). Never
  present a demo as a working service. Where an endpoint needs real infrastructure (CA, mail server,
  Lightning node, homeserver), the response must say so.
- **Never fabricate identity.** No fake accounts, keys, identities or services implied. The one
  generated Ed25519 keypair exists solely to demonstrate real cryptographic formats (JWKS, did:web,
  signed did-configuration); it has no other meaning.
- **Correct content types always.** `application/json`, `application/tracking-status+json`,
  `application/linkset+json; profile="..."`, `application/dns-message`, `text/turtle`,
  `application/xrd+xml` — a format demo with the wrong media type is a broken demo.
- **Ground every spec page in the actual standard.** RFC numbers, section links and registrar status
  come from the IANA registry / the spec itself, not from memory. `lib/iana.ts` records the registry
  fetch date (2026-08-05); refresh it when the registry changes.
- **Deep-dive pages must explain the threat**, not just the format: what breaks without the
  well-known URI, and how the mechanism fixes it.
- **Run `deno task gate` before committing** (fmt + lint + check + test). Extend
  `tests/server_test.ts` whenever you add an endpoint: status, content type, and the honesty
  invariant (e.g. LNURL callback must error honestly, unknown accounts 404).
- **Public writing** — follow the anti-slop rules: concrete counts, routes, standards and
  mechanisms; no inflated significance, no marketing fog.
- Use one writer per worktree; push to `main` only via gate-clean commits.

## Adding a spec

1. Add the deep-dive entry to `lib/registry.ts` (slug, uri, standard + URL, category, summary, what,
   threat, how, demoKind, notes).
2. If it gets a live endpoint, add the handler to `lib/endpoints.ts` and register it in `ENDPOINTS`;
   add a smoke test.
3. If it's IANA-registered, add the row to `lib/iana.ts` (with `deepDive` slug).
4. `deno task gate`, commit, push — the GitHub-integration deploy picks it up.

## Deploy

Production deploys happen on pushes to `main` via Deno's native GitHub integration (attached by Paul
2026-08-05). The earlier Actions pipeline is disabled (`.github/workflows/deploy.yml.disabled`) so
two deploy mechanisms don't shadow each other (last deploy wins). If the integration is ever
detached, re-enable the workflow — it runs the `deno deploy` CLI with the `DENO_DEPLOY_TOKEN` repo
secret (org `paulkinlan-ea`, app `well-known-showcase`). Never `deno deploy` CLI against production
from here (bootstrap deploys are one-off; CI owns the app).
