# /.well-known/ Showcase

An archive of **every known RFC 8615 `/.well-known/` URI** — what each one is, the
threat it addresses, how it works — with the twist that **this server actually
serves most of them live**. Point `curl` at any endpoint and you get the real thing.

Live at **https://well-known-showcase.paulkinlan-ea.deno.dev** (Deno Deploy).

## What's here

- **61 deep-dive explainer pages** (`/specs/<slug>`): the famous URIs (security.txt,
  webfinger, openid-configuration, jwks.json, acme-challenge, mta-sts, apple-app-site-association,
  assetlinks.json, gpc.json, change-password…) and the interesting new ones (tdmrep.json,
  agent-card.json, webauthn, oauth-protected-resource, sbom, api-catalog…).
- **All 101 IANA-registered well-known URIs** catalogued (`/registry/<suffix>`), fetched
  from the IANA registry on 2026-08-05 — including the ones the registry already retired
  (related-website-set.json, privacy-sandbox-attestations.json, tpcd).
- **The de-facto URIs IANA misses**: jwks.json, oidc-registration, apple-app-site-association,
  autoconfig/autodiscover, dns-query, openpgpkey, lnurlp, wac, aarc.
- **45 live endpoints** served from this host, each labelled honestly:

| Label | Count | Meaning |
|---|---|---|
| **live** | 15 | Spec-accurate for real: genuine security.txt, genuine signed Ed25519 JWT (did-configuration), real JWK Set, working WebFinger, working NodeInfo, real DoH DNS relay, real GPC/TDMRep/DNT declarations, real SBOM, real Linkset API catalog. |
| **demo** | 30 | Format-valid responses with illustrative values, labelled as demos in-band (e.g. the LNURL callback returns an honest "no Lightning node attached" error). |
| **reference** | 16 | Documented only — serving them would require real infrastructure we don't run (EST, HOBA, OSLC, …). |

**The honesty rule:** nothing is faked as something it isn't. A demo never claims to be a
live service; where an endpoint needs real infrastructure (a CA, a mail server, a Lightning
node, a homeserver, a Solid server) the response says so in-band and the explainer says so
in a "Honesty notes" section.

## The one-key demo

At boot the server generates a single Ed25519 keypair (the private key never leaves the
process). One key, three interoperable formats:

- `/.well-known/jwks.json` — the public JWK (RFC 7517)
- `/.well-known/did.json` — `did:web:<host>` verification method (JSON Web Key 2020)
- `/.well-known/did-configuration.json` — a **real signed JWT** domain-linkage credential
  (DIF Well Known DID Configuration), verifiable against the JWK in the other two files.

## Run it locally

```sh
deno task serve        # http://127.0.0.1:8787
deno task test         # smoke tests: endpoints, content types, honesty invariants
deno task gate         # fmt + lint + check + test
```

Requires Deno 2.x. No third-party runtime dependencies — std and Web Platform APIs only
(the test suite pulls `@std/assert`).

## Deploy

Production deploys via the Deno Deploy GitHub integration on pushes to `main`
(app `well-known-showcase`, org `paulkinlan-ea`). `deno.json` carries the deploy config.

## Architecture

```
server.ts            — routing: /, /specs/*, /registry/*, /.well-known/*, supporting resources
lib/registry.ts      — 61 deep-dive specs (what / threat / how / honesty notes)
lib/iana.ts          — the 101-entry IANA registry + de-facto URIs
lib/endpoints.ts     — 45 live endpoint handlers, each labelled live|demo
lib/html.ts          — server-rendered pages (no client framework)
lib/keys.ts          — boot-time Ed25519 keypair + JWT signing
public/styles.css    — single stylesheet, light + dark
tests/server_test.ts — end-to-end smoke tests against a real server instance
```

The explainer pages render their live-demo panel by **self-fetching the actual endpoint**
through the real routing layer, so what you see in the panel is byte-for-byte what
`curl` gets.

## Why

RFC 8615 turned `/.well-known/` into a tiny but universal convention: "if you need the
world to find something about this origin, put it here." That convention now carries
security reporting, identity discovery, passkey scope, AI-mining policy and agent cards.
This archive is a map of it.

## License

Apache-2.0. © 2026 Paul Kinlan.
