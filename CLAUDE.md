# CLAUDE.md — well-known-showcase operator manual

This is a Deno Deploy server that is simultaneously:

1. an **archive** of every known RFC 8615 `/.well-known/` URI, and
2. a **live host** that actually serves most of those endpoints.

## Project shape

| Path                   | Role                                                                                                                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server.ts`            | Entrypoint. Routes `/`, `/specs/*`, `/registry/*`, `/.well-known/*`, supporting resources (`/nodeinfo/2.1`, `/sbom.json`, `/funding.json`, `/demo/*`). Binds `PORT`/`HOST` (defaults 8787 / 0.0.0.0).                                  |
| `lib/registry.ts`      | The 61 deep-dive specs. Each has: slug, uri(s), standard + URL, registrar + IANA status, category, summary, what, threat, how (bullets), notes (honesty), demoKind (`live`/`demo`/`reference`), demoPath/demoFetch for the demo panel. |
| `lib/iana.ts`          | The full IANA Well-Known URIs registry (101 entries, fetched 2026-08-05) + de-facto URIs. One row per suffix: standard, status, controller, date, one-line summary, optional deepDive slug.                                            |
| `lib/endpoints.ts`     | 45 handlers registered in `ENDPOINTS`, keyed by the IANA suffix (longest-match dispatch, so `matrix/client` wins over `matrix`). `serveWellKnown()` dispatches.                                                                        |
| `lib/html.ts`          | Server-rendered HTML. The demo panel on each explainer page **self-fetches the real endpoint** through the real routing layer and pretty-prints it.                                                                                    |
| `lib/keys.ts`          | One Ed25519 keypair at boot; `signJwt()` for the did-configuration JWT.                                                                                                                                                                |
| `public/styles.css`    | Single stylesheet, light + dark, warm off-white + indigo.                                                                                                                                                                              |
| `tests/server_test.ts` | Spawns a real server, asserts statuses, content types, honesty invariants.                                                                                                                                                             |

## The three labels (non-negotiable)

- **live** — spec-accurate for real. Currently: security.txt, jwks.json, did.json,
  did-configuration.json, gpc.json, webfinger, nodeinfo, dnt, tdmrep.json, webauthn, sbom,
  api-catalog, host-meta(+.json), hosting-provider, dns-query (real relay to Cloudflare's public
  resolver).
- **demo** — format-valid, illustrative values, labelled. When the endpoint implies infrastructure
  that doesn't exist, it says so in-band (e.g. LNURL callback →
  `{"status":"ERROR","reason":"no Lightning node attached"}`).
- **reference** — documented only (EST, HOBA, OSLC, openid-federation, uma2-configuration,
  gnap-as-rs, idp-proxy, csvm, void, resourcesync, scitt-keys, open-resource-discovery, webweaver,
  dnt-policy.txt, privacy-sandbox-attestations, related-website-set.json…).

Never add a fourth label. Never move an endpoint from demo to live without real infrastructure
behind it.

## Operational notes

- **Key rotation**: restarting the deploy rotates the keypair; JWKS `kid` is stable
  (`well-known-showcase-demo-1`) but `x` changes. Any consumer verifying the did-configuration JWT
  must re-fetch the JWKS — the JWT is only valid for the key that signed it, which is exactly the
  point of the format.
- **dns-query** relays to `https://cloudflare-dns.com/dns-query`. If upstream changes or the relay
  is abused, gate it behind an allowlist or drop it (it's one handler).
- **Self-fetch in demo panels** hits the real routing layer. On Deno Deploy this is a normal
  same-origin request; keep `cache-control: no-store` on endpoints so panels show fresh data.
- **The IANA registry drifts.** When entries are added/deprecated, update `lib/iana.ts` and
  re-record the fetch date in the file header and in `README.md`.

## Tasks

- `deno task serve` — local dev on 8787
- `deno task test` — e2e smoke tests (spawns a server on 8799)
- `deno task gate` — fmt --check && lint && check && test (run before every commit)

## Deploy

Push-to-`main` deploys via `.github/workflows/deploy.yml`, which runs the `deno deploy` CLI
(`--org=paulkinlan-ea --app=well-known-showcase --prod`) with the `DENO_DEPLOY_TOKEN` repo secret.
The org token has no linked GitHub identity, so the native GitHub integration isn't attached and the
OIDC-only `denoland/deployctl@v1` action can't authenticate; if Paul attaches the repo in the
console, disable the Actions workflow to avoid two deploy mechanisms shadowing each other. Don't mix
ad-hoc `deno deploy` CLI deploys into production from here (CI owns the app).
