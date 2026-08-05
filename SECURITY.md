# Security Policy

## Reporting a vulnerability

If you find a security issue in this project (the server, an endpoint, or the
archive content), report it via:

- **GitHub Issues** (preferred): https://github.com/PaulKinlan/well-known-showcase/issues
- **Email**: paul.kinlan@gmail.com

Please do not open a public issue for actively-exploitable vulnerabilities before
coordinating disclosure.

## Scope

This project is a demonstration archive. Live endpoints are either spec-accurate
metadata about this host or clearly-labelled format demos — none of them gate real
security infrastructure (no certificate authority, mail server, Lightning node,
homeserver or Solid pod runs here).

That said, a few things are real and worth protecting:

- The **Ed25519 keypair** generated at boot signs the did-configuration JWT. The
  private key must never leave the process or be logged. Restarting the deploy
  rotates it.
- The **dns-query relay** forwards to Cloudflare's public resolver; treat it as a
  public resolver, not a private one.
- The **oidc-registration** demo accepts registrations but persists nothing and
  issues credentials that work nowhere.

## Response

This is a hobby-scale project; expect best-effort response within a few days.
