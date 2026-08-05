/**
 * The deep-dive archive: every spec gets an explainer page, and most are also
 * served live by this server. Copy is deliberately concrete — each entry states
 * the governing standard, the threat it addresses, and how it actually works.
 */

import type { Spec } from "./types.ts";

const RFC = (num: number) => `https://www.rfc-editor.org/rfc/rfc${num}`;

export const CATEGORIES: Record<string, { label: string; blurb: string }> = {
  security: {
    label: "Security & Trust",
    blurb: "Where domains prove who they are and how to report problems.",
  },
  identity: {
    label: "Identity, Auth & Federation",
    blurb: "How services discover each other's identity and authorization endpoints.",
  },
  platform: {
    label: "Platform Integration",
    blurb: "How native platforms (Apple, Android, browsers) verify web-app associations.",
  },
  email: { label: "Email", blurb: "Mail-sender security and client auto-configuration." },
  privacy: { label: "Privacy", blurb: "User signals about tracking, selling and sharing." },
  discovery: {
    label: "Discovery & Metadata",
    blurb: "Machine-readable metadata about the host itself.",
  },
  agents: {
    label: "AI, Agents & Automation",
    blurb: "Agent cards, llms.txt and policy files — the newest machine-facing URIs.",
  },
  deprecated: {
    label: "Deprecated & Historical",
    blurb: "Even well-known URIs get retired. These tell the platform's history.",
  },
  reference: { label: "Reference", blurb: "Registered but niche — documented, not served." },
};

export const SPECS: Spec[] = [
  // ------------------------------------------------------------------ security
  {
    slug: "security-txt",
    name: "security.txt",
    uri: "/.well-known/security.txt",
    standard: "RFC 9116",
    standardUrl: RFC(9116),
    registrar: "iana",
    ianaStatus: "permanent",
    category: "security",
    summary:
      "A standard place for security researchers to find a site's vulnerability disclosure contact.",
    what:
      "security.txt is a plain-text file that tells security researchers where to report a vulnerability and under what terms. Before RFC 9116, finding a responsible contact meant digging through WHOIS, social media or guessable mailboxes — a real barrier to disclosure.",
    threat:
      "When a researcher finds a bug, they need a safe, canonical place to report it. Without one, reports go to the wrong people, get ignored, or — worse — get exploited. security.txt removes the guesswork, which measurably increases the chance a vulnerability gets disclosed responsibly instead of leaked or sold.",
    how: [
      "A site publishes /.well-known/security.txt (RFC 9116 also allows /security.txt at the origin root as a fallback).",
      "The file uses simple key-value lines: Contact (mandatory), Expires (mandatory), plus optional Canonical, Policy, Preferred-Languages, Encryption, Hiring, and Acknowledgements.",
      "Researchers, scanners and tools fetch it automatically before (or instead of) manual outreach.",
      "This server serves a real security.txt pointing at the project's GitHub issues and security policy.",
    ],
    demoKind: "live",
    demoLabel: "Spec-accurate live response — this file is this site's real security.txt",
  },
  {
    slug: "acme-challenge",
    name: "ACME http-01 challenge",
    uri: "/.well-known/acme-challenge/<token>",
    standard: "RFC 8555 (ACME)",
    standardUrl: RFC(8555),
    registrar: "iana",
    ianaStatus: "permanent",
    category: "security",
    summary:
      "How automated certificate issuance (Let's Encrypt et al.) proves you control a domain over HTTP.",
    what:
      "The ACME protocol automates TLS certificate issuance. In the http-01 challenge, the certificate authority asks you to serve a file at /.well-known/acme-challenge/<token> containing the token plus a thumbprint of your account key. If the CA can fetch it, you control the domain.",
    threat:
      "Before automated challenges, proving domain control meant email loops, DNS edits and human review — slow and fragile. http-01 replaces that with a cryptographic proof served over plain HTTP, so issuers like Let's Encrypt can issue and renew certificates at machine speed.",
    how: [
      "The CA issues a random token and tells you to serve /.well-known/acme-challenge/<token>.",
      "Your HTTP server answers with `<token>.<base64url(sha256(account key JWK))>` — the key authorization.",
      "The CA fetches the URL over HTTP (port 80, not 443 — that's the point: no cert needed yet) and verifies the value.",
      "Because this must work on port 80 for arbitrary tokens, web servers and reverse proxies expose a challenge directory or route it dynamically — exactly what this demo does.",
    ],
    notes: [
      "Demo: a real CA would place a live token here during issuance. This server answers any token with a sample key authorization so the mechanism is visible.",
      "On the deployed host, Deno Deploy's platform firewall returns 403 for /.well-known/acme-challenge/* — the edge blocks CA-validation paths to prevent domain-hijacking attacks. That 403 is itself the real-world behavior; the endpoint works fully on a self-hosted server.",
    ],
    demoKind: "demo",
    demoLabel: "Format demonstration — a real CA places a live token during issuance",
    demoPath: "/.well-known/acme-challenge/demo-token",
  },
  {
    slug: "mta-sts",
    name: "MTA-STS",
    uri: "/.well-known/mta-sts.txt",
    standard: "RFC 8461",
    standardUrl: RFC(8461),
    registrar: "iana",
    ianaStatus: "permanent",
    category: "security",
    summary:
      "SMTP Strict Transport Security — stops downgrade attacks on email-in-transit encryption.",
    what:
      "SMTP has used STARTTLS for decades, but STARTTLS is optional: an attacker on the network can strip it and read mail in plaintext (a classic downgrade attack). MTA-STS lets a mail domain publish a policy that says 'connections to my mail server MUST be encrypted and verified'.",
    threat:
      "Without MTA-STS, a network attacker can silently downgrade email transport to plaintext. With it, receiving mail servers validate the policy over HTTPS, cache it, and refuse unencrypted or mismatched-certificate connections to the MX.",
    how: [
      "The policy lives at /.well-known/mta-sts.txt on the mail domain, published over HTTPS (which is itself authenticated).",
      "A matching TXT record _mta-sts.<domain> advertises its existence so senders know to fetch it.",
      "Policies declare version, mode (enforce / testing / none), the allowed MX hosts, and max_age for caching.",
      "This demo serves a policy in testing mode — the honest setting for a host with no real mail.",
    ],
    notes: [
      "Demo: this host has no MX records, so the policy is illustrative. Real deployments publish on the actual mail domain and keep the MX list accurate — mismatches break mail delivery in enforce mode.",
    ],
    demoKind: "demo",
    demoLabel: "Format-valid demo policy (mode: testing) — this host has no real mail",
  },
  {
    slug: "keybase-txt",
    name: "keybase.txt",
    uri: "/.well-known/keybase.txt",
    standard: "Keybase",
    standardUrl: "https://keybase.io/docs/keybase_well_known",
    registrar: "defacto",
    category: "security",
    summary: "Proof-of-domain-ownership that links a website to a Keybase identity.",
    what:
      "Keybase lets users prove they control a domain by publishing a signed file at /.well-known/keybase.txt. The file is a saltpack-signed message whose payload includes the Keybase username; anyone can verify the signature and the domain in one step.",
    threat:
      "Decentralized identity needs a way to bind real-world domains to cryptographic identities without a central authority. keybase.txt gives a public, verifiable binding — the signature proves who, the HTTPS host proves where.",
    how: [
      "Run `keybase prove domain` — Keybase signs a message containing your username and instructions.",
      "Paste the signed block into /.well-known/keybase.txt on your domain.",
      "Anyone (or the Keybase service) fetches the file, verifies the saltpack signature, and checks the username in the payload matches the claimed identity.",
    ],
    notes: [
      "Demo: no Keybase identity is claimed here. A real file contains a saltpack-signed block, which only the account holder can produce.",
    ],
    demoKind: "demo",
    demoLabel: "Format demonstration — a real file contains a saltpack signature",
  },
  {
    slug: "pki-validation",
    name: "pki-validation (file-based DCV)",
    uri: "/.well-known/pki-validation/<file>",
    standard: "CA/Browser Forum Baseline Requirements",
    standardUrl: "https://cabforum.org/baseline-requirements-documents/",
    registrar: "iana",
    ianaStatus: "permanent",
    category: "security",
    summary:
      "The classic 'put a file on your web server' domain-control check used by certificate authorities.",
    what:
      "Certificate authorities must prove you control a domain before issuing. One method (BR §3.2.2.4.6) is to place a random value in a file under /.well-known/pki-validation/ and let the CA fetch it back over HTTPS.",
    threat:
      "It prevents an attacker from getting a certificate for a domain they don't control. The random value is issued per-request, so an attacker can't pre-place a guessable file.",
    how: [
      "The CA generates a random value and tells you the filename to use (often the value itself, or a random token).",
      "You serve it at /.well-known/pki-validation/<filename> over HTTPS.",
      "The CA fetches the URL and verifies the exact value before issuing.",
    ],
    notes: [
      "Demo: real issuance uses CA-generated random values. This server answers any filename with a sample value so the mechanism is visible.",
      "On the deployed host, Deno Deploy's platform firewall returns 403 for /.well-known/pki-validation/* — same edge block as acme-challenge. See the acme-challenge entry for the same real-world note.",
    ],
    demoKind: "demo",
    demoLabel: "Format demonstration — real issuance uses CA-generated random values",
    demoPath: "/.well-known/pki-validation/demo-validation.txt",
  },
  {
    slug: "openpgpkey",
    name: "OpenPGP Web Key Directory",
    uri: "/.well-known/openpgpkey/",
    standard: "RFC 7929",
    standardUrl: RFC(7929),
    registrar: "defacto",
    category: "security",
    summary:
      "Publish your OpenPGP public key so others can find it by email address — no keyserver needed.",
    what:
      "Web Key Directory (WKD) lets you publish an OpenPGP key at a predictable HTTPS URL so mail clients can fetch the key for an email address automatically. The advanced method uses /.well-known/openpgpkey/<domain>/hu/<hash>.",
    threat:
      "Keyservers have had poisoning and availability problems; users forget to upload keys. WKD ties key discovery to the domain itself — the party you're emailing — over authenticated HTTPS, removing the third-party keyserver from the trust chain.",
    how: [
      "A policy file at /.well-known/openpgpkey/policy lists the key's fingerprint (openpgp4fpr:...).",
      "Keys are stored at /.well-known/openpgpkey/<domain>/hu/<zbase32 hash of the local-part>.",
      "Mail clients (Thunderbird, etc.) query WKD before falling back to keyservers.",
    ],
    notes: [
      "Demo: the policy file is served with a placeholder fingerprint. A real deployment publishes the actual key under /hu/.",
    ],
    demoKind: "demo",
    demoLabel: "Demo policy file — real deployments publish the key under /hu/",
    demoPath: "/.well-known/openpgpkey/policy",
  },
  {
    slug: "posh",
    name: "POSH",
    uri: "/.well-known/posh/<service>.json",
    standard: "RFC 7711",
    standardUrl: RFC(7711),
    registrar: "iana",
    ianaStatus: "permanent",
    category: "security",
    summary:
      "PKIX Over HTTP — publish TLS certificate chains for protocols that can't use DNS SRV well.",
    what:
      "Some protocols (historically XMPP) need to discover the X.509 certificate of a server but lack a good DNS mechanism. POSH publishes the certificate chain at a well-known HTTPS URL, piggybacking on the trust already established by HTTPS.",
    threat:
      "For protocols without standard certificate distribution, clients either skip validation or rely on ad-hoc mechanisms. POSH gives a verifiable chain: HTTPS certifies the file, the file certifies the service.",
    how: [
      "The server publishes /.well-known/posh/<service>.json containing subject, issuer and base64 DER certificates.",
      "A client connects over HTTPS to fetch the file, then uses those certificates to validate the service's TLS.",
      "The service name in the path (e.g. 'spice') is registered per-protocol.",
    ],
    notes: [
      "Demo: illustrative response with an empty certificate list — real deployments publish the actual DER chain.",
    ],
    demoKind: "demo",
    demoLabel: "Format demonstration — real deployments publish the actual DER chain",
    demoPath: "/.well-known/posh/demo.json",
  },
  {
    slug: "est",
    name: "EST",
    uri: "/.well-known/est/",
    standard: "RFC 7030",
    standardUrl: RFC(7030),
    registrar: "iana",
    ianaStatus: "permanent",
    category: "security",
    summary:
      "Enrollment over Secure Transport — automated certificate enrollment for devices without keys.",
    what:
      "EST lets network devices (printers, routers, IoT) automatically enroll for client certificates. The /.well-known/est prefix hosts endpoints for CA discovery (/cacerts), enrollment (/simpleenroll) and re-enrollment (/simplereenroll).",
    threat:
      "Devices that can't do ACME still need certificates for TLS client authentication. EST provides a simple, standardized enrollment path that works over existing HTTPS infrastructure.",
    how: [
      "A device fetches /.well-known/est/cacerts to get the CA certificate chain.",
      "It POSTs a PKCS#10 CSR to /.well-known/est/simpleenroll (optionally authenticated via TLS client certs or a shared secret).",
      "The CA returns a signed certificate; re-enrollment uses /simplereenroll with an existing cert.",
    ],
    demoKind: "reference",
    demoLabel: "Reference only — not served (this host runs no PKI)",
  },
  {
    slug: "hoba",
    name: "HOBA",
    uri: "/.well-known/hoba",
    standard: "RFC 7486",
    standardUrl: RFC(7486),
    registrar: "iana",
    ianaStatus: "permanent",
    category: "security",
    summary: "HTTP Origin-Bound Authentication — passwordless auth via channel-bound public keys.",
    what:
      "HOBA is a signature-based authentication scheme where the client proves possession of a private key bound to the TLS channel. /.well-known/hoba is the well-known location where a server advertises HOBA support.",
    threat:
      "Passwords get phished, leaked and replayed. HOBA binds authentication to the TLS channel and a client-held key, so stolen credentials don't transfer to another channel or device.",
    how: [
      "The server publishes HOBA support and parameters at /.well-known/hoba.",
      "The client sends an HTTP signature computed over the request with a channel-bound key.",
      "The server verifies the signature and the channel binding; no password crosses the wire.",
    ],
    demoKind: "reference",
    demoLabel: "Reference only — not served",
  },
  {
    slug: "ssh-known-hosts",
    name: "ssh-known-hosts",
    uri: "/.well-known/ssh-known-hosts",
    standard: "C2SP well-known-ssh-hosts",
    standardUrl: "https://c2sp.org/well-known-ssh-hosts",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "security",
    summary:
      "Publish your SSH host keys over HTTPS so clients can verify before first connect (TOFU upgrade).",
    what:
      "A service publishes its sshd known_hosts entries at /.well-known/ssh-known-hosts. SSH clients can fetch it over HTTPS to verify a host key before trusting it — turning trust-on-first-use into verified-on-first-use.",
    threat:
      "SSH's default trust-on-first-use (TOFU) is vulnerable to a MITM on the very first connection. Publishing keys over authenticated HTTPS closes that gap for domains whose web TLS is already trusted.",
    how: [
      "The file is a restricted subset of the sshd known_hosts format: plain hostnames (matching the serving domain or subdomains), valid base64 keys.",
      "Clients that support the spec fetch the file, verify the key matches, then connect.",
      "The HTTPS certificate is the trust anchor — same model as SSHFP but without DNS dependency.",
    ],
    notes: ["Demo: format demonstration only — no SSH service runs on this host."],
    demoKind: "demo",
    demoLabel: "Format demonstration — no SSH service runs on this host",
  },
  {
    slug: "tor-relay",
    name: "tor-relay",
    uri: "/.well-known/tor-relay/rsa-fingerprint",
    standard: "Tor proposal 326",
    standardUrl:
      "https://gitlab.torproject.org/tpo/core/torspec/-/blob/main/proposals/326-tor-relay-well-known-uri-rfc8615.md",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "security",
    summary: "Advertise a Tor relay's identity fingerprint over HTTPS for verification.",
    what:
      "A Tor relay operator can publish the relay's RSA identity fingerprint at /.well-known/tor-relay/rsa-fingerprint, letting web-based tools verify relay identity without querying the Tor network.",
    threat:
      "Verifying relay identity traditionally required Tor network lookups or out-of-band checks. This gives a direct, HTTPS-authenticated statement of identity from the relay's own domain.",
    how: [
      "The relay operator serves the raw fingerprint at /.well-known/tor-relay/rsa-fingerprint.",
      "Tooling compares it against the fingerprint in the relay descriptor fetched from the Tor network.",
    ],
    notes: ["Demo: this host runs no Tor relay."],
    demoKind: "demo",
    demoLabel: "Demo — no Tor relay runs on this host",
    demoPath: "/.well-known/tor-relay/rsa-fingerprint",
  },

  // --------------------------------------------------------------- identity
  {
    slug: "webfinger",
    name: "WebFinger",
    uri: "/.well-known/webfinger",
    standard: "RFC 7033",
    standardUrl: RFC(7033),
    registrar: "iana",
    ianaStatus: "permanent",
    category: "identity",
    summary:
      "Discover information about a person or entity from an account identifier (acct:user@domain).",
    what:
      "WebFinger resolves an email-like identifier (acct:alice@example.com) into a JSON Resource Descriptor (JRD) with links: profile pages, avatars, activity inboxes, OAuth issuer hints. It's the discovery backbone of the federated social web (Mastodon, ActivityPub) and many OAuth/OpenID flows.",
    threat:
      "Federated systems need to find the right server, profile and capabilities for a user whose identity spans domains. Without WebFinger, every protocol invents its own lookup; with it, an identifier plus one well-known GET is enough to bootstrap federation.",
    how: [
      "A client sends GET /.well-known/webfinger?resource=acct:user@example.com (with a rel filter optionally).",
      "The server returns a JRD: subject, aliases, and typed links.",
      "For unknown accounts the server returns 404 — deliberately no account enumeration.",
      "This server implements a real WebFinger for the demo account acct:demo@<host> and 404s everything else.",
    ],
    demoKind: "live",
    demoLabel:
      "Spec-accurate live implementation — resolves acct:demo@<host>, 404s unknown accounts",
    demoPath: "/.well-known/webfinger?resource=acct:demo@__HOST__",
  },
  {
    slug: "openid-configuration",
    name: "OpenID Connect Discovery",
    uri: "/.well-known/openid-configuration",
    standard: "OpenID Connect Discovery 1.0",
    standardUrl: "https://openid.net/specs/openid-connect-discovery-1_0.html",
    registrar: "iana",
    ianaStatus: "permanent",
    category: "identity",
    summary:
      "The discovery document every OpenID Provider publishes so clients know its endpoints and capabilities.",
    what:
      "An OpenID Connect issuer publishes its complete configuration — authorization, token and userinfo endpoints, JWKS location, supported scopes, response types, signing algorithms — at /.well-known/openid-configuration. Clients fetch it once and never hardcode an endpoint.",
    threat:
      "Hardcoded endpoints break when providers change infrastructure, and mixing endpoints from different issuers is how confusion attacks happen. Discovery binds every endpoint to a canonical issuer, and clients MUST verify the issuer matches the configuration document's origin.",
    how: [
      "A client derives the URL from the issuer: <issuer>/.well-known/openid-configuration.",
      "The response must include issuer, authorization_endpoint, token_endpoint, jwks_uri (the metadata that defines the well-known discovery contract).",
      "The client uses the returned endpoints and jwks_uri to validate signed tokens.",
      "This demo serves a complete metadata document for a demo issuer on this origin, including its own jwks.json and registration endpoint.",
    ],
    notes: [
      "Demo: the issuer is this showcase host — it advertises demo endpoints, no real accounts or tokens.",
    ],
    demoKind: "demo",
    demoLabel: "Format-valid demo issuer metadata (no real accounts or tokens)",
  },
  {
    slug: "jwks-json",
    name: "JWK Set",
    uri: "/.well-known/jwks.json",
    standard: "RFC 7517",
    standardUrl: RFC(7517),
    registrar: "defacto",
    category: "identity",
    summary: "Where OAuth/OIDC clients fetch the public keys used to verify signed tokens.",
    what:
      "A JWK Set (/.well-known/jwks.json) publishes public keys in JSON Web Key format. OpenID Connect and OAuth authorization servers expose their signing keys here, and clients use them to verify ID tokens, access tokens and request objects.",
    threat:
      "Tokens signed by a server are only trustworthy if clients can independently verify the signature. The jwks_uri gives a standard, cacheable, often-rotated location for the verification keys — without it, clients would have to ship keys out-of-band (which rot poorly) or skip verification (which is fatal).",
    how: [
      "The server generates an Ed25519 keypair at boot (the private key never leaves the process).",
      "/.well-known/jwks.json serves the public JWK with use: sig and a stable kid.",
      "The same key backs this site's did.json verification method and its signed did-configuration JWT — one keypair, three interoperable formats.",
    ],
    demoKind: "live",
    demoLabel: "Real public key — generated at boot, private key never leaves the process",
  },
  {
    slug: "oauth-authorization-server",
    name: "OAuth 2.0 Authorization Server Metadata",
    uri: "/.well-known/oauth-authorization-server",
    standard: "RFC 8414",
    standardUrl: RFC(8414),
    registrar: "iana",
    ianaStatus: "permanent",
    category: "identity",
    summary:
      "OAuth's RFC 8414 metadata document — same idea as OIDC discovery, for plain OAuth 2.0.",
    what:
      "RFC 8414 lets an OAuth authorization server describe itself at /.well-known/oauth-authorization-server: issuer, authorization and token endpoints, JWKS, supported grants, PKCE support. OIDC discovery builds on the same metadata shape.",
    threat:
      "OAuth clients need a reliable way to learn an AS's endpoints and policies, and to detect mixed/confused issuer situations. Structured metadata makes configuration explicit and machine-checkable instead of copied into client code.",
    how: [
      "A client fetches <issuer>/.well-known/oauth-authorization-server.",
      "The document's issuer value must match the origin the client requested — clients MUST reject mismatches (this is the core anti-confusion check).",
      "OIDC discovery (/.well-known/openid-configuration) is a superset of the same document with OIDC-specific fields.",
    ],
    demoKind: "demo",
    demoLabel: "Format-valid demo metadata for a demo issuer",
  },
  {
    slug: "oauth-protected-resource",
    name: "OAuth 2.0 Protected Resource Metadata",
    uri: "/.well-known/oauth-protected-resource",
    standard: "RFC 9728",
    standardUrl: RFC(9728),
    registrar: "iana",
    ianaStatus: "permanent",
    category: "identity",
    summary:
      "The 2024 counterpart to RFC 8414: let a protected resource advertise which authorization servers may issue tokens for it.",
    what:
      "RFC 9728 publishes metadata for the resource side of OAuth: which authorization servers are permitted to issue access tokens for this resource, so resource servers can reject tokens from unknown ASes.",
    threat:
      "Resource servers used to accept tokens from any AS that happened to sign them, or had to hardcode AS lists. Metadata makes the authorized-AS set explicit and discoverable, closing the door on tokens minted by rogue servers.",
    how: [
      "The resource serves /.well-known/oauth-protected-resource with its own URI and the list of authorization_servers it trusts.",
      "Clients and resource servers use it to bind tokens to the right AS (and the right resource indicator).",
      "This demo advertises the demo issuer on this origin.",
    ],
    demoKind: "demo",
    demoLabel:
      "Format-valid demo metadata (RFC 9728 is brand new — this is one of the first public examples)",
  },
  {
    slug: "oidc-registration",
    name: "OIDC Dynamic Client Registration",
    uri: "/.well-known/oidc-registration",
    standard: "OpenID Connect Dynamic Client Registration 1.0",
    standardUrl: "https://openid.net/specs/openid-connect-registration-1_0.html",
    registrar: "defacto",
    category: "identity",
    summary:
      "The POST endpoint where OAuth/OIDC clients register themselves at runtime and get a client_id.",
    what:
      "Dynamic client registration lets an application register itself with an authorization server at runtime: it POSTs its metadata (redirect URIs, grant types) and receives a client_id and secret. The endpoint URL is advertised in the discovery document; /.well-known/oidc-registration is the widely-used conventional path for it.",
    threat:
      "Hardcoding client credentials per deployment is a maintenance and security burden (every environment needs new secrets, and secrets leak into repos). Runtime registration keeps credentials ephemeral and scoped.",
    how: [
      "The client POSTs a JSON metadata object (redirect_uris, token_endpoint_auth_method, ...) to the registration endpoint.",
      "The AS validates it, assigns a client_id (and optionally a secret), and returns the full client registration response.",
      "RFC 8414 metadata advertises the endpoint via registration_endpoint; this demo also serves the conventional /.well-known/oidc-registration path.",
    ],
    notes: [
      "Demo: registrations are accepted and returned but are not persisted, and the issued credentials work nowhere — the token endpoint is itself a demo.",
      "Note: this path is not in the IANA registry; it is the de-facto conventional location, while the standardized mechanism is the registration_endpoint advertised in discovery metadata.",
    ],
    demoKind: "demo",
    demoLabel:
      "Working demo POST endpoint — accepts registrations, issues unusable demo credentials",
    demoFetch: {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        redirect_uris: ["https://client.example.com/callback"],
        token_endpoint_auth_method: "client_secret_basic",
        grant_types: ["authorization_code"],
        client_name: "demo-client",
      }),
    },
  },
  {
    slug: "did-json",
    name: "did.json (did:web)",
    uri: "/.well-known/did.json",
    standard: "did:web method (W3C CCG)",
    standardUrl: "https://w3c-ccg.github.io/did-method-web/",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "identity",
    summary:
      "A decentralized identifier for your domain, resolved straight from its HTTPS endpoint.",
    what:
      "did:web derives a DID from a domain name: did:web:example.com. The DID document is served from the domain itself — at /did.json, or via the /.well-known/did.json fallback this archive uses. No blockchain or registry involved.",
    threat:
      "Traditional identifiers are issued by centralized registries (CAs, DNS registrars, platforms) and don't carry cryptographic capability. did:web gives a domain an addressable, verifiable identifier whose public keys are published by the domain owner and can rotate — useful for verifiable credentials and web trust.",
    how: [
      "The identifier did:web:<host> maps to this origin; the document is served at /.well-known/did.json.",
      "The document lists verification methods (this site's Ed25519 public JWK), authentication and assertion relationships.",
      "Verifiers resolve the DID, fetch the document over HTTPS (TLS is the trust root), and use the listed keys to verify signatures.",
    ],
    demoKind: "live",
    demoLabel:
      "Real document, real key — the same key that signs this site's did-configuration JWT",
  },
  {
    slug: "did-configuration",
    name: "DID Configuration (domain linkage)",
    uri: "/.well-known/did-configuration.json",
    standard: "DIF Well Known DID Configuration",
    standardUrl: "https://identity.foundation/.well-known/resources/did-configuration/",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "identity",
    summary: "A signed credential that cryptographically links a DID to the domain that serves it.",
    what:
      "DID Configuration proves the entity behind a DID also controls the domain: the domain serves a JSON file containing a signed JWT (a DomainLinkageCredential) whose credentialSubject includes the origin. Anyone can verify the JWT signature with the DID's key and check the origin matches the serving host.",
    threat:
      "Nothing stops someone from claiming a DID belongs to example.com. Domain linkage closes the gap: the JWT is signed by the DID's key and served from the domain, so both sides of the binding are independently verifiable — the web of trust version of proving 'this domain and this DID are the same actor'.",
    how: [
      "The server signs a domain-linkage JWT with its Ed25519 key (iss/sub = did:web:<host>, credentialSubject.origin = this origin).",
      "The JWT is wrapped in /.well-known/did-configuration.json under linked_dids.",
      "A verifier fetches the file, resolves the DID, verifies the signature, and checks the origin claim against the serving host.",
    ],
    demoKind: "live",
    demoLabel:
      "Real signed JWT — verifiable with the key published at /.well-known/jwks.json and did.json",
  },
  {
    slug: "aarc",
    name: "AARC",
    uri: "/.well-known/aarc",
    standard: "AARC (GÉANT community guidance)",
    standardUrl: "https://aarc-community.org/",
    registrar: "community",
    category: "identity",
    summary:
      "A well-known URI referenced by the research-federation community (Authentication and Authorisation for Research and Collaboration).",
    what:
      "AARC is the European research community's blueprint for federated authentication and authorization infrastructures (AAIs) — the proxy architecture that lets researchers use their home institution's login across collaborations. The community references /.well-known/aarc in its guidance for services to expose AAI-related metadata.",
    threat:
      "Research collaborations span many institutions with many identity providers. AARC's proxy model centralizes discovery, but services still need a conventional place to advertise which AAI endpoints they use — the problem this well-known URI addresses.",
    how: [
      "A service exposes /.well-known/aarc with metadata about the research AAI it participates in.",
      "This demo returns an illustrative document linking to the community's IdP-hinting spec (AARC-G049) and the service's own discovery endpoints.",
    ],
    notes: [
      "No single public format is standardized for this URI — the response below is illustrative of the metadata a research AAI could expose.",
      "It is referenced in AARC community materials but is not IANA-registered.",
    ],
    demoKind: "demo",
    demoLabel:
      "Illustrative response — the AARC community references this URI without a single published format",
  },
  {
    slug: "wac",
    name: "Web Access Control (Solid)",
    uri: "/.well-known/wac",
    standard: "Solid / Web Access Control",
    standardUrl: "https://solidproject.org/TR/wac",
    registrar: "community",
    category: "identity",
    summary:
      "The Solid protocol's root ACL resource: who can read, write and control an origin's resources.",
    what:
      "The Solid protocol (a standard for personal data pods) serves an ACL at /.well-known/wac that governs the origin root. It's a Turtle file in the WAC vocabulary (acl:Authorization, acl:mode Read/Write/Control) describing agents and their permissions.",
    threat:
      "Personal data stores need fine-grained, machine-readable authorization — who may read which resource — that is itself stored as data. WAC turns access control into linked data you can inspect, share and delegate.",
    how: [
      "The server exposes /.well-known/wac as the ACL governing the origin root.",
      "The file declares authorizations: agents (or groups) granted acl:Read, acl:Write, acl:Control over accessTo/default scopes.",
      "Solid clients and servers evaluate these rules when reading or writing pod resources.",
    ],
    notes: ["Demo: format-valid Turtle ACL; this host runs no Solid server."],
    demoKind: "demo",
    demoLabel: "Format-valid Turtle ACL demo (no Solid server runs here)",
  },
  {
    slug: "nodeinfo",
    name: "NodeInfo",
    uri: "/.well-known/nodeinfo",
    standard: "NodeInfo 2.1",
    standardUrl: "https://nodeinfo.diaspora.software/",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "identity",
    summary:
      "Federated servers describe their software, protocols and usage — the Fediverse's 'about this server' file.",
    what:
      "NodeInfo lets a federated server (Mastodon, PeerTube, diaspora*, ...) describe itself: software name/version, supported protocols, open registration, user counts. /.well-known/nodeinfo returns links to schema versions; the schema URL itself returns the full document.",
    threat:
      "Federating with a server means trusting its software and policies. NodeInfo makes that inspectable at a glance — and lets tools aggregate the health of the fediverse (which servers run what, how many users).",
    how: [
      "GET /.well-known/nodeinfo → a links object pointing at schema URLs (2.0, 2.1).",
      "GET the schema URL → the full NodeInfo document.",
      "This server serves a real NodeInfo 2.1 document with honest metadata (no federation protocols, no open registration).",
    ],
    demoKind: "live",
    demoLabel: "Spec-accurate live NodeInfo 2.1 — honest metadata about this host",
    demoPath: "/.well-known/nodeinfo",
  },
  {
    slug: "matrix",
    name: "Matrix server discovery",
    uri: ["/.well-known/matrix/client", "/.well-known/matrix/server"],
    standard: "Matrix specification",
    standardUrl: "https://spec.matrix.org/latest/client-server-api/#well-known-uri",
    registrar: "iana",
    ianaStatus: "permanent",
    category: "identity",
    summary:
      "Matrix homeserver discovery: clients and servers find the right homeserver for a user@domain.",
    what:
      "In Matrix, a user is user@example.com, but the homeserver may live elsewhere. /.well-known/matrix/client tells clients where the homeserver's client API is; /.well-known/matrix/server does the same for federation.",
    threat:
      "Without discovery, homeserver URLs would have to be hardcoded or guessed, and a malicious party could redirect federation. The well-known files make the mapping explicit and HTTPS-authenticated.",
    how: [
      'Client: GET /.well-known/matrix/client → {"m.homeserver": {"base_url": "https://homeserver.example"}}.',
      'Server: GET /.well-known/matrix/server → {"m.server": "homeserver.example:8448"}.',
      "Delegation lets example.com point at a homeserver hosted anywhere.",
    ],
    notes: ["Demo: points at this origin — no real homeserver runs here."],
    demoKind: "demo",
    demoLabel: "Format-valid demo delegation (no real homeserver)",
  },
  {
    slug: "nostr-json",
    name: "Nostr NIP-05",
    uri: "/.well-known/nostr.json",
    standard: "NIP-05",
    standardUrl: "https://github.com/nostr-protocol/nips/blob/master/05.md",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "identity",
    summary: "Nostr's DNS-based identity: map a name@domain to a nostr public key.",
    what:
      "Nostr is a decentralized social protocol with no central registry of identities. NIP-05 lets a domain publish /.well-known/nostr.json mapping names to hex public keys, giving users a human-readable nostr address (name@domain) that clients verify against the domain.",
    threat:
      "Raw nostr pubkeys are unreadable 64-char hex strings with no human meaning. NIP-05 gives verifiable names: the domain attests the mapping, and clients show a verified badge when the file matches.",
    how: [
      "A user claims name@example.com as their nostr handle.",
      'The domain serves /.well-known/nostr.json: {"names": {"name": "<hex pubkey>"}}.',
      "Clients fetch it, verify the pubkey matches the events they see, and display the handle.",
    ],
    notes: ["Demo: maps 'demo' to a placeholder pubkey — real deployments map actual identities."],
    demoKind: "demo",
    demoLabel: "Format-valid demo mapping (placeholder pubkey)",
  },
  {
    slug: "lnurlp",
    name: "LNURL-pay",
    uri: "/.well-known/lnurlp/<user>",
    standard: "LNURL LUD-06",
    standardUrl: "https://lnurl.dev/luds/06",
    registrar: "community",
    category: "identity",
    summary:
      "Lightning Addresses: turn user@domain into a payable Lightning address via a well-known JSON file.",
    what:
      "A Lightning Address (name@domain) lets anyone pay you over Lightning without pasting an invoice. Wallets resolve /.well-known/lnurlp/<name> to get payRequest JSON: the callback URL, min/max amounts in millisatoshis, and metadata describing the payment.",
    threat:
      "Invoices are one-time, long strings that are awkward to share publicly. LNURL-pay gives a stable address with metadata, so you can put your address on a website and receive payments (with amount choice and comments) from any wallet.",
    how: [
      "A wallet sees name@domain and GETs https://domain/.well-known/lnurlp/name.",
      "The response declares callback, minSendable/maxSendable (msat), and metadata (a JSON string: text/plain description, optional image).",
      "The wallet calls the callback with ?amount=<msat> and receives a real Lightning invoice (or an error).",
      "This demo serves the payRequest document and a callback that honestly reports no Lightning node is attached.",
    ],
    notes: ["Demo: the callback returns an honest error — no Lightning node is attached."],
    demoKind: "demo",
    demoLabel: "Format-valid payRequest + honest demo callback",
    demoPath: "/.well-known/lnurlp/demo",
  },
  {
    slug: "host-meta",
    name: "host-meta",
    uri: ["/.well-known/host-meta", "/.well-known/host-meta.json"],
    standard: "RFC 6415",
    standardUrl: RFC(6415),
    registrar: "iana",
    ianaStatus: "permanent",
    category: "identity",
    summary:
      "The 2011 predecessor of WebFinger: an XRD/JRD document describing the host's services.",
    what:
      "host-meta is a small document every host can serve describing itself, historically in XRD XML (/.well-known/host-meta) or JRD JSON (/.well-known/host-meta.json). Its most important use is the lrdd link with a template that bootstraps WebFinger itself.",
    threat:
      "Before WebFinger was standardized, clients needed a fixed, discoverable document to learn a host's services — host-meta filled that role and remains a fallback for older software.",
    how: [
      "The host serves an XRD or JRD document listing typed links (lrdd templates, OpenID, etc.).",
      "Clients dereference /.well-known/host-meta and follow the lrdd template to resolve account URIs.",
      "This server serves both formats, with host-meta.json pointing its lrdd template at the live WebFinger endpoint.",
    ],
    demoKind: "live",
    demoLabel: "Spec-accurate live response — both XRD and JRD formats",
  },
  {
    slug: "openid-federation",
    name: "OpenID Federation",
    uri: "/.well-known/openid-federation",
    standard: "OpenID Federation 1.0",
    standardUrl: "https://openid.net/specs/openid-federation-1_0.html",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "identity",
    summary:
      "Signed statements that let an ecosystem of issuers trust each other without a central registry.",
    what:
      "OpenID Federation replaces federations of shared metadata with self-issued, signed statements: each entity publishes its own metadata at /.well-known/openid-federation, and trust chains are built by following signatures up to a trust anchor.",
    threat:
      "Traditional federation aggregates metadata centrally, which is a single point of failure and a bottleneck. Federation statements let entities publish once and be discovered/verified by anyone who trusts the same anchor.",
    how: [
      "Each entity serves its federation statement (JWT with iss/sub, metadata, authority_hints) at /.well-known/openid-federation.",
      "Relying parties resolve the trust chain from entity to trust anchor, verifying signatures at each hop.",
    ],
    demoKind: "demo",
    demoLabel: "Demo — entity statement with this host's real demo JWK; nothing federates",
  },
  {
    slug: "uma2-configuration",
    name: "UMA 2.0 configuration",
    uri: "/.well-known/uma2-configuration",
    standard: "UMA 2.0 Grant for OAuth 2.0",
    standardUrl: "https://docs.kantarainitiative.org/uma/wg/rec-oauth-uma-grant-2.0.html",
    registrar: "iana",
    ianaStatus: "permanent",
    category: "identity",
    summary:
      "User-Managed Access discovery — authorization servers that speak UMA publish their config here.",
    what:
      "UMA (User-Managed Access) extends OAuth so a resource owner can authorize a client to get a token from an authorization server. The AS publishes its configuration (authorization, token, permission and introspection endpoints) at /.well-known/uma2-configuration.",
    threat:
      "Resource servers and clients need to coordinate three parties (resource owner, AS, resource server) with consistent endpoints. UMA metadata makes that coordination discoverable and machine-checkable.",
    how: [
      "A resource server learns the UMA AS for a resource and fetches its /.well-known/uma2-configuration.",
      "The document lists permission_endpoint, token_endpoint, introspection_endpoint, and the UMA grant flow endpoints.",
      "All parties use the same published metadata, avoiding drift.",
    ],
    demoKind: "demo",
    demoLabel: "Demo — format-valid UMA 2.0 metadata; no UMA endpoints run here",
  },
  {
    slug: "idp-proxy",
    name: "idp-proxy",
    uri: "/.well-known/idp-proxy",
    standard: "RFC 8827",
    standardUrl: RFC(8827),
    registrar: "iana",
    ianaStatus: "permanent",
    category: "identity",
    summary: "TLS client-certificate based identity proxying for the WebRTC identity protocol.",
    what:
      "RFC 8827 defines the WebRTC identity proxy: a service that brokers identity assertions for WebRTC peers. The /.well-known/idp-proxy well-known URI identifies such a proxy for a domain.",
    threat:
      "WebRTC needs to authenticate peers without a central identity authority; the identity proxy model lets a domain run its own assertion service at a discoverable location.",
    how: [
      "A WebRTC client looks up /.well-known/idp-proxy on the peer's domain to find the identity provider.",
      "The proxy issues identity assertions bound to the peer's DTLS fingerprint.",
    ],
    demoKind: "demo",
    demoLabel:
      "Demo — format-valid RFC 8827 identity-proxy config; no WebRTC identity service runs here",
  },
  {
    slug: "gnap-as-rs",
    name: "GNAP AS-RS",
    uri: "/.well-known/gnap-as-rs",
    standard: "RFC 9767 (GNAP)",
    standardUrl: RFC(9767),
    registrar: "iana",
    ianaStatus: "permanent",
    category: "identity",
    summary:
      "Grant Negotiation and Authorization Protocol — the AS/RS trust-relationship endpoint.",
    what:
      "GNAP is the modern rethink of OAuth. RFC 9767 defines how an authorization server (AS) and resource server (RS) establish trust; the AS publishes its GNAP endpoints at /.well-known/gnap-as-rs so RSs can discover them.",
    threat:
      "OAuth's token-exchange between AS and RS has been extended repeatedly; GNAP builds in a cleaner model. The well-known URI gives RSs a standard place to find the AS's endpoints and key material.",
    how: [
      "The AS publishes /.well-known/gnap-as-rs describing its token endpoint and signing keys.",
      "Resource servers use it to validate tokens issued under GNAP.",
    ],
    demoKind: "demo",
    demoLabel: "Demo — format-valid GNAP AS metadata (RFC 9767); no GNAP endpoints run here",
  },

  // --------------------------------------------------------------- platform
  {
    slug: "apple-app-site-association",
    name: "apple-app-site-association",
    uri: "/.well-known/apple-app-site-association",
    standard: "Apple (Associated Domains)",
    standardUrl: "https://developer.apple.com/documentation/xcode/supporting-associated-domains",
    registrar: "defacto",
    category: "platform",
    summary: "Apple's universal links: the file that lets an iOS app claim URLs from a website.",
    what:
      "Apple apps declare associated domains like applinks:example.com; the domain must serve /.well-known/apple-app-site-association listing the app IDs and URL paths they may claim. It also powers webcredentials (password autofill between app and website) and App Clips.",
    threat:
      "Without a verifiable association, any app could claim any website's URLs, hijacking links. Apple verifies the file over HTTPS on the domain itself — the domain, not Apple, is the authority.",
    how: [
      "The app includes the domain in its associated-domains entitlement.",
      "The domain serves /.well-known/apple-app-site-association: applinks with appID (teamID.bundleID) and path patterns; optionally webcredentials and appclips.",
      "iOS fetches and caches it; when the user taps a matching link, the app opens instead of Safari.",
      "Apple requires serving it over HTTPS from the apex domain; some tools serve it without a JSON content-type quirk (historical gotcha).",
    ],
    notes: ["Demo: placeholder team/app IDs — real deployments use the app's actual identifiers."],
    demoKind: "demo",
    demoLabel: "Format-valid demo with placeholder identifiers",
  },
  {
    slug: "assetlinks-json",
    name: "assetlinks.json (Digital Asset Links)",
    uri: "/.well-known/assetlinks.json",
    standard: "Google Digital Asset Links",
    standardUrl: "https://developers.google.com/digital-asset-links",
    registrar: "iana",
    ianaStatus: "permanent",
    category: "platform",
    summary:
      "Android's counterpart to Apple's AASA: verify app-website associations for app links and TWAs.",
    what:
      "assetlinks.json lists Android apps (package name + signing-cert SHA-256 fingerprints) that are authorized to associate with a website: opening app links, trusted web activities, password autofill, and API access from apps.",
    threat:
      "Same hijacking problem as universal links: without verified association, any app could intercept web intents. The file is served by the domain and verified against the app's actual signing certificate — a cryptographic binding.",
    how: [
      "The domain serves /.well-known/assetlinks.json: an array of relation/target pairs.",
      "The app's certificate fingerprint must match what Google Play (or the app itself) reports.",
      "Chrome/Android verify the file before allowing the app to handle the website's intents.",
    ],
    notes: [
      "Demo: placeholder fingerprint — real deployments list the actual signing-cert SHA-256.",
    ],
    demoKind: "demo",
    demoLabel: "Format-valid demo with placeholder certificate fingerprint",
  },
  {
    slug: "change-password",
    name: "change-password",
    uri: "/.well-known/change-password",
    standard: "W3C change-password-url (webappsec)",
    standardUrl: "https://w3c.github.io/webappsec-change-password-url/",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "platform",
    summary:
      "The URL browsers and password managers navigate to when you need to change your password.",
    what:
      "When Chrome or Firefox detects a compromised or reused password, they show 'Change password' — which links to /.well-known/change-password. Servers redirect that URL to their real change-password page, and it's also used by password managers to jump straight to the right form.",
    threat:
      "Password managers and browsers can't know where every site puts its change-password form. The well-known URL gives them a deterministic target, so 'change your password' becomes one click instead of a hunt.",
    how: [
      "A site serves /.well-known/change-password as a redirect (302/307) to its change-password page, or responds 404/410 if there is none.",
      "This demo redirects to /account/password (a page that documents the pattern).",
    ],
    demoKind: "demo",
    demoLabel:
      "Live redirect pattern — 302 to the change-password page, exactly as browsers expect",
  },
  {
    slug: "webauthn",
    name: "webauthn (WebAuthn 3)",
    uri: "/.well-known/webauthn",
    standard: "W3C WebAuthn Level 3",
    standardUrl: "https://www.w3.org/TR/webauthn-3/",
    registrar: "iana",
    ianaStatus: "permanent",
    category: "platform",
    summary:
      "Brand-new (Jan 2026): an origin lists the other origins allowed to use it as a passkey RP ID.",
    what:
      "WebAuthn Level 3 registers /.well-known/webauthn: a JSON file listing origins that are authorized to use this domain as their Relying Party ID for passkeys. It's the web-native answer to Android's assetlinks and Apple's associated-domains for cross-origin passkey usage.",
    threat:
      "Passkeys are scoped to an RP ID; apps and other origins previously couldn't share a domain's passkeys without native platform files. This gives browsers a standard, web-controlled way to authorize related origins.",
    how: [
      'A domain serves /.well-known/webauthn with {"origins": ["https://other.example"]}.',
      "When a WebAuthn operation would fail an RP-ID scope check, the browser fetches this file and allows listed origins.",
      "Content must be application/json over HTTPS with a 200 status.",
    ],
    demoKind: "live",
    demoLabel: "Spec-accurate live response — lists this origin itself",
  },
  {
    slug: "related-website-set-json",
    name: "related-website-set.json",
    uri: "/.well-known/related-website-set.json",
    standard: "Chrome Related Website Sets (deprecated)",
    standardUrl: "https://github.com/GoogleChrome/related-website-sets",
    registrar: "iana",
    ianaStatus: "deprecated",
    category: "deprecated",
    summary:
      "The First-Party-Sets successor that declared groups of related sites — retired by Google in April 2026.",
    what:
      "Related Website Sets let an organization declare that a group of sites belong to the same entity, so Chrome would relax third-party-cookie restrictions among them. Sites listed their members and the set's primary in /.well-known/related-website-set.json.",
    threat:
      "When third-party cookies were being phased out, legitimate multi-site organizations (brands, federated logins) risked losing cross-site functionality that tracking-prevention tools couldn't distinguish from tracking. RWS was Chrome's structured answer.",
    how: [
      "The primary domain served /.well-known/related-website-set.json listing members (with their own files pointing back at the primary).",
      "Chrome fetched and validated the declaration before applying relaxed cookie rules within the set.",
      "Google deprecated the mechanism in April 2026 — an example of a well-known URI that lived and died with a platform transition.",
    ],
    notes: [
      "Format demo of the deprecated mechanism. Chrome stopped reading this file in April 2026; the example member domains are placeholders.",
    ],
    demoKind: "demo",
    demoLabel: "Format demo — mechanism deprecated April 2026; Chrome no longer reads this file",
  },

  // ------------------------------------------------------------------ email
  {
    slug: "autoconfig",
    name: "Mozilla autoconfig",
    uri: "/.well-known/autoconfig/mail/config-v1.1.xml",
    standard: "Mozilla autoconfig",
    standardUrl: "https://wiki.mozilla.org/Thunderbird:Autoconfiguration",
    registrar: "defacto",
    category: "email",
    summary: "The XML file that lets mail clients configure an account with zero user input.",
    what:
      "Thunderbird (and other clients) try to auto-configure a mail account by fetching a config-v1.1.xml describing the domain's IMAP/POP3/SMTP servers, ports, SSL and auth. It can be served by the mail domain at /.well-known/autoconfig/mail/config-v1.1.xml (or autoconfig.<domain>).",
    threat:
      "Manual mail setup means users entering ports, encryption and auth settings — error-prone, and it pushes users toward insecure defaults. Auto-configuration turns an email address into a complete setup.",
    how: [
      "The client fetches the well-known XML for the email address's domain.",
      "The XML declares emailProvider with incomingServer/outgoingServer blocks: hostname, port, socketType (SSL/STARTTLS), authentication, username pattern.",
      "If the file is absent the client falls back to DNS guessing — so publishing it is a correctness improvement.",
    ],
    notes: ["Demo: illustrative mail servers for the demo domain — no mail runs here."],
    demoKind: "demo",
    demoLabel: "Format-valid demo config (no real mail servers)",
  },
  {
    slug: "autodiscover",
    name: "Microsoft Autodiscover",
    uri: "/.well-known/autodiscover/autodiscover.xml",
    standard: "Microsoft Autodiscover",
    standardUrl:
      "https://learn.microsoft.com/en-us/exchange/client-developer/exchange-web-services/autodiscover-for-exchange",
    registrar: "defacto",
    category: "email",
    summary:
      "Exchange's autodiscovery: point mail clients at the right server, protocol and settings.",
    what:
      "Microsoft Exchange clients discover server settings via Autodiscover: a POST to /autodiscover/autodiscover.xml on the mail domain, or a GET of /.well-known/autodiscover/autodiscover.xml (the fallback used by non-Microsoft services and by Autodiscover for the SMTP domain).",
    threat:
      "Exchange users need their client pointed at the right server with the right auth without IT support tickets. Autodiscover automates it — and the well-known variant made it work for third-party mail domains too.",
    how: [
      "A client requests /.well-known/autodiscover/autodiscover.xml (GET) on the domain in the email address.",
      "The server returns XML describing Account → Protocol blocks (IMAP/POP/SMTP or Exchange), ports, SSL, auth.",
      "The client applies the settings; users are configured in seconds.",
    ],
    notes: ["Demo: illustrative protocol blocks — no Exchange server runs here."],
    demoKind: "demo",
    demoLabel: "Format-valid demo response (no real Exchange server)",
  },

  // ----------------------------------------------------------------- privacy
  {
    slug: "gpc-json",
    name: "gpc.json",
    uri: "/.well-known/gpc.json",
    standard: "W3C Global Privacy Control",
    standardUrl: "https://www.w3.org/TR/gpc/",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "privacy",
    summary:
      "A site's machine-readable statement that it honors the Global Privacy Control signal.",
    what:
      "GPC is the browser signal users send to say 'do not sell or share my personal information' (used for CCPA/CPRA compliance). gpc.json is the counterpart: a JSON file at /.well-known/gpc.json where a site declares whether it intends to honor the signal.",
    threat:
      "A user's opt-out preference is only useful if sites can be checked. gpc.json lets regulators, researchers and user agents verify — automatically — that a site claims to honor GPC, and gives sites a cheap way to publish that commitment.",
    how: [
      'The site serves /.well-known/gpc.json as application/json: {"gpc": true} (or false).',
      "A true value states the origin intends to abide by GPC requests at least to the extent legally obligated.",
      "The spec is deliberately minimal: extra members are ignored, and absence means 'support unknown'.",
    ],
    demoKind: "live",
    demoLabel:
      "Spec-accurate live response — this site sells nothing and shares nothing, so it honors GPC",
  },
  {
    slug: "dnt",
    name: "Do Not Track status resource",
    uri: "/.well-known/dnt/",
    standard: "W3C Tracking Preference Expression (DNT)",
    standardUrl: "https://www.w3.org/TR/tracking-dnt/",
    registrar: "iana",
    ianaStatus: "permanent",
    category: "privacy",
    summary:
      "The preflight resource where a site declares its tracking status (the Tk header's machine-readable home).",
    what:
      "The DNT spec defined the DNT request header, the Tk response header, and a well-known status resource at /.well-known/dnt/ where a site publishes its tracking behavior as a JSON status object with media type application/tracking-status+json.",
    threat:
      "A user's tracking preference needs a machine-checkable answer from the site: does it track, not track, or follow the DNT signal? The status resource makes the site's policy inspectable before any data is sent.",
    how: [
      'The site serves /.well-known/dnt/ with {"tracking": "N"} (not tracking), "Y" (tracks), "T" (tracks but honors DNT) or "D" (dynamic).',
      "Per-request variations can be exposed as /.well-known/dnt/<status-id> referenced from the Tk header.",
      "This site tracks nobody, so the honest value is N.",
    ],
    demoKind: "live",
    demoLabel: "Spec-accurate live response — tracking: N, with the correct media type",
    demoPath: "/.well-known/dnt/",
  },
  {
    slug: "privacy-sandbox-attestations",
    name: "privacy-sandbox-attestations.json",
    uri: "/.well-known/privacy-sandbox-attestations.json",
    standard: "Google Privacy Sandbox (deprecated)",
    standardUrl: "https://github.com/privacysandbox/attestation",
    registrar: "iana",
    ianaStatus: "deprecated",
    category: "deprecated",
    summary:
      "Privacy Sandbox enrollment attestations — deprecated alongside the sandbox's cookie phase-out.",
    what:
      "Sites using Privacy Sandbox APIs had to serve a JSON attestation file stating their compliance (no cross-site tracking abuse). Google deprecated it in April 2026 as the Privacy Sandbox's cookie-removal plans changed course.",
    threat:
      "Privacy APIs need an enforcement hook: attestation tied enrollment to a public, per-origin compliance statement, letting Chrome block non-compliant callers.",
    how: [
      "A site serving Privacy Sandbox APIs published /.well-known/privacy-sandbox-attestations.json with its attestation payload.",
      "Chrome verified the file against the enrolled account before allowing the APIs.",
      "Deprecated 2026-04-01 — a snapshot of how platform policy evolves.",
    ],
    demoKind: "demo",
    demoLabel: "Format demo of the deprecated attestations file — not a real attestation set",
  },

  // --------------------------------------------------------------- discovery
  {
    slug: "jmap",
    name: "JMAP session resource",
    uri: "/.well-known/jmap",
    standard: "RFC 8621 (JMAP)",
    standardUrl: RFC(8621),
    registrar: "iana",
    ianaStatus: "permanent",
    category: "discovery",
    summary:
      "JSON Meta Application Protocol: one URL that bootstraps an entire mail/calendar API session.",
    what:
      "JMAP is a modern JSON API for mail (RFC 8620/8621). A JMAP server publishes a session resource at /.well-known/jmap describing capabilities, accounts, and the API/upload/download/event URLs — a client needs only the domain and one GET to connect.",
    threat:
      "IMAP's many extensions and bespoke configs make clients fragile; each vendor invents its own API. JMAP's well-known session URL gives clients a single, discoverable entry point with explicit capability negotiation.",
    how: [
      "The server serves /.well-known/jmap with capabilities, accounts, and apiUrl/downloadUrl/uploadUrl templates.",
      "Clients fetch it once, then speak JSON to the apiUrl.",
      "EventSource URL enables push-style updates.",
    ],
    notes: ["Demo: illustrative session resource — no JMAP server runs here."],
    demoKind: "demo",
    demoLabel: "Format-valid demo session resource",
  },
  {
    slug: "caldav-carddav",
    name: "CalDAV / CardDAV",
    uri: ["/.well-known/caldav", "/.well-known/carddav"],
    standard: "RFC 6764",
    standardUrl: RFC(6764),
    registrar: "iana",
    ianaStatus: "permanent",
    category: "discovery",
    summary:
      "Autodiscovery for calendar and address-book servers: one redirect to the right DAV root.",
    what:
      "RFC 6764 defines /.well-known/caldav and /.well-known/carddav: servers answer with a redirect (301/302) to the actual CalDAV/CardDAV service root. Clients (calendar/contact apps) use them to configure accounts with just an email address.",
    threat:
      "Calendar and contacts sync clients used to require users to know obscure server paths. The well-known URIs let clients find the service root deterministically, making setup reliable and servers re-locatable without breaking clients.",
    how: [
      "The server serves /.well-known/caldav (and /carddav) redirecting to its DAV root.",
      "Clients follow the redirect, discover principals via the DAV protocol, and sync.",
      "This demo redirects to illustrative DAV roots.",
    ],
    demoKind: "demo",
    demoLabel: "Live redirect pattern — 302 to the DAV root, as RFC 6764 expects",
  },
  {
    slug: "csaf",
    name: "CSAF provider metadata",
    uri: "/.well-known/csaf/provider-metadata.json",
    standard: "OASIS CSAF 2.0",
    standardUrl: "https://docs.oasis-open.org/csaf/csaf/v2.0/os/csaf-v2.0-os.html",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "discovery",
    summary:
      "Where vendors publish machine-readable security advisory metadata (the CVE-era feed standard).",
    what:
      "The Common Security Advisory Framework (CSAF) standardizes machine-readable security advisories. A CSAF provider publishes provider-metadata.json at /.well-known/csaf/ describing its advisory feed: distribution, ROLIE categories, signing keys and publisher info.",
    threat:
      "Security advisories today are scattered PDFs, emails and HTML pages with no consistent structure — hard to aggregate, verify or automate. CSAF + this well-known file turns advisory distribution into a verifiable, discoverable feed.",
    how: [
      "The provider serves /.well-known/csaf/provider-metadata.json: publisher identity, PGP/OpenPGP signing keys, and ROLIE feed endpoints.",
      "Aggregators fetch the metadata, verify signatures on advisories, and index them.",
      "csaf-aggregator is the sibling URI for organizations that mirror others' advisories.",
    ],
    demoKind: "demo",
    demoLabel: "Format-valid demo provider metadata (no real advisory feed)",
  },
  {
    slug: "sbom",
    name: "sbom",
    uri: "/.well-known/sbom",
    standard: "RFC 9472",
    standardUrl: RFC(9472),
    registrar: "iana",
    ianaStatus: "permanent",
    category: "discovery",
    summary: "Software Bill of Materials discovery: tell the world where your SBOM lives.",
    what:
      "RFC 9472 defines /.well-known/sbom: a tiny JSON document pointing at the origin's SBOM (Software Bill of Materials — the list of software components in a product). It makes SBOMs discoverable by convention, like security.txt for components.",
    threat:
      "SBOMs are only useful if you can find them. With the rise of supply-chain attacks, every site serving software needs a standard location for its bill of materials; RFC 9472 provides exactly that.",
    how: [
      'The site serves /.well-known/sbom with {"sbom": ["https://origin/sbom.json"]}.',
      "The referenced SBOM follows SPDX or CycloneDX formats.",
      "This server serves both the discovery file and an honest SPDX document for itself.",
    ],
    demoKind: "live",
    demoLabel: "Spec-accurate live response — points at this project's real SBOM",
  },
  {
    slug: "api-catalog",
    name: "api-catalog",
    uri: "/.well-known/api-catalog",
    standard: "RFC 9727",
    standardUrl: RFC(9727),
    registrar: "iana",
    ianaStatus: "permanent",
    category: "discovery",
    summary: "Publish a machine-readable catalog of all the APIs your origin exposes.",
    what:
      "RFC 9727 defines /.well-known/api-catalog: a Linkset document (application/linkset+json) listing the origin's APIs with their specs, docs, and status endpoints. It's API discovery by convention — one URL for 'everything this site offers'.",
    threat:
      "Finding a site's APIs usually means reading docs or scraping the SPA. An api-catalog gives clients a standard, typed list of API resources, which is especially valuable to agents and automated tooling.",
    how: [
      "The site serves /.well-known/api-catalog as a Linkset with anchor = the origin and link relations (service-desc, service-doc, status, item) per API.",
      "The profile parameter signals RFC 9727 conformance.",
      "This server catalogs its own well-known endpoints — a recursive use of the format.",
    ],
    demoKind: "live",
    demoLabel: "Spec-accurate live response — catalogs this site's own well-known endpoints",
  },
  {
    slug: "terraform-json",
    name: "terraform.json",
    uri: "/.well-known/terraform.json",
    standard: "HashiCorp Terraform Remote Service Discovery",
    standardUrl: "https://developer.hashicorp.com/terraform/internals/remote-service-discovery",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "discovery",
    summary:
      "Terraform registry discovery: the file that tells Terraform where your registries live.",
    what:
      "Terraform resolves a registry hostname by fetching /.well-known/terraform.json, which maps service types (modules.v1, providers.v1, and custom services) to their base URLs. It's how custom Terraform registries plug into the ecosystem.",
    threat:
      "Terraform needs a standard way to discover registry endpoints without config sprawl. The well-known file lets any host advertise its registry services.",
    how: [
      "Terraform GETs https://<host>/.well-known/terraform.json.",
      'The response maps service versions to URL bases, e.g. {"service-discovery.v1": {"services": {"providers.v1": [...]}}}.',
    ],
    notes: ["Demo: illustrative service map — no Terraform services are actually offered."],
    demoKind: "demo",
    demoLabel: "Format-valid demo service discovery",
  },
  {
    slug: "oslc",
    name: "OSLC",
    uri: "/.well-known/oslc",
    standard: "OASIS OSLC Core 3.0",
    standardUrl: "https://docs.oasis-open-projects.org/oslc-op/core/v3.0/oslc-core.html",
    registrar: "iana",
    ianaStatus: "permanent",
    category: "discovery",
    summary:
      "Open Services for Lifecycle Collaboration — discovery for linked data tooling (ALM/PLM).",
    what:
      "OSLC integrates engineering tools (requirements, change, test management) using linked data. The /.well-known/oslc resource lets clients discover a tool's capabilities and shapes.",
    threat:
      "Engineering toolchains are notoriously siloed; integrating them means reinventing adapters per tool. OSLC's discovery makes tool capabilities machine-readable.",
    how: [
      "A client fetches /.well-known/oslc to find the tool's discovery document.",
      "Capability and shape documents describe the tool's linked-data interactions.",
    ],
    demoKind: "reference",
    demoLabel: "Reference only — not served",
  },
  {
    slug: "resourcesync",
    name: "ResourceSync",
    uri: "/.well-known/resourcesync",
    standard: "NISO Z39.99 (ResourceSync)",
    standardUrl: "http://www.openarchives.org/rs/resourcesync",
    registrar: "iana",
    ianaStatus: "permanent",
    category: "discovery",
    summary:
      "The web-resource synchronization framework: how repositories tell harvesters what changed.",
    what:
      "ResourceSync (NISO Z39.99) is the successor to OAI-PMH: repositories publish capability lists (source descriptions) so harvesters can synchronize changed resources. /.well-known/resourcesync is its discovery entry point.",
    threat:
      "Harvesting large repositories (research, libraries) needs efficient change notification without re-crawling everything. ResourceSync's document model describes resources, changes and capabilities at a well-known location.",
    how: [
      "A repository serves /.well-known/resourcesync pointing to its capability list.",
      "Harvesters follow the document graph (capability list → resource list / change list) to sync only what changed.",
    ],
    demoKind: "demo",
    demoLabel: "Demo — format-valid ResourceSync capability list (XML)",
  },
  {
    slug: "csvm",
    name: "csvm",
    uri: "/.well-known/csvm",
    standard: "W3C CSV on the Web",
    standardUrl: "https://www.w3.org/TR/tabular-data-model/",
    registrar: "iana",
    ianaStatus: "permanent",
    category: "discovery",
    summary:
      "Site-wide CSV metadata: describe the columns and types of the CSV files an origin serves.",
    what:
      "CSV on the Web lets publishers attach metadata (column types, units, linked data) to CSV files. A site can publish a site-wide metadata document at /.well-known/csvm describing the CSVs it serves, so consumers don't guess at headers.",
    threat:
      "Raw CSV is ambiguous — is '03/04/2020' March or April? CSVW metadata removes that ambiguity by describing tables and columns in a standard way.",
    how: [
      "A site serves /.well-known/csvm with metadata templates for its CSV files.",
      "Consumers (or the CSVW annotation process) match table files to their metadata and interpret columns correctly.",
    ],
    demoKind: "demo",
    demoLabel: "Demo — format-valid CSV on the Web metadata",
  },
  {
    slug: "void",
    name: "VoID",
    uri: "/.well-known/void",
    standard: "W3C VoID (Vocabulary of Interlinked Datasets)",
    standardUrl: "https://www.w3.org/TR/void/",
    registrar: "iana",
    ianaStatus: "permanent",
    category: "discovery",
    summary: "Describe the linked-data datasets an origin publishes.",
    what:
      "VoID is a W3C vocabulary for describing RDF datasets: their content, size, and links to other datasets. /.well-known/void points at a description of the datasets served by the origin.",
    threat:
      "Linked-data consumers can't easily discover what datasets a site offers. VoID gives dataset metadata a conventional home.",
    how: [
      "A data publisher serves /.well-known/void describing its datasets in RDF.",
      "Consumers use the vocabulary (void:Dataset, void:subset, void:triples) to understand and query the data.",
    ],
    demoKind: "demo",
    demoLabel: "Demo — format-valid VoID description (text/turtle)",
  },

  // ----------------------------------------------------------------- agents
  {
    slug: "tdmrep-json",
    name: "tdmrep.json",
    uri: "/.well-known/tdmrep.json",
    standard: "W3C TDMRep",
    standardUrl: "https://www.w3.org/community/reports/tdmrep/",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "agents",
    summary:
      "Machine-readable text-and-data-mining policy — how sites tell AI crawlers what's allowed.",
    what:
      "TDMRep (Text and Data Mining Reservation Protocol) lets a site publish, at /.well-known/tdmrep.json, rules about machine extraction of its content: which URL paths are reserved (opt-out, value 1) or open (value 0), optionally with a linked ODRL policy.",
    threat:
      "The AI-crawling era: sites need a standard, in-band way to state whether their content may be mined for training, beyond robots.txt conventions that lack a rights dimension. TDMRep gives a precise, path-scoped declaration that agents can honor.",
    how: [
      'The site serves /.well-known/tdmrep.json as an array of rules: {"location": "/path", "tdm-reservation": 0|1, "tdm-policy": "url"}.',
      "Agents match request paths against the most specific rule (with * and $ wildcards).",
      "Value 1 = rights reserved (mining requires permission); 0 = not reserved.",
      "This site publishes 0 for the whole origin — its entire purpose is public education.",
    ],
    demoKind: "live",
    demoLabel:
      "Spec-accurate live response — this site declares its content open to text/data mining",
  },
  {
    slug: "agent-card-json",
    name: "agent-card.json (A2A)",
    uri: "/.well-known/agent-card.json",
    standard: "Agent2Agent Protocol (A2A)",
    standardUrl: "https://a2a-protocol.org/latest/specification/",
    registrar: "iana",
    ianaStatus: "permanent",
    category: "agents",
    summary: "The A2A protocol's agent directory: how agents advertise themselves to other agents.",
    what:
      "The Agent2Agent protocol (Linux Foundation, 2025) defines the Agent Card: a JSON document at /.well-known/agent-card.json describing an agent — its name, provider, capabilities (streaming, push notifications), security requirements, and skills. Other agents fetch it to decide whether and how to interact.",
    threat:
      "For agents to interoperate they must discover each other, and for that discovery to be safe it must be verifiable (HTTPS + the card's own security declarations). Without a standard, every agent network reinvents discovery.",
    how: [
      "An agent's host serves /.well-known/agent-card.json (or DNS-based discovery).",
      "The card declares capabilities, security (authentication schemes), input/output modes, and skills.",
      "Client agents validate the card and invoke the agent's endpoint within its declared constraints.",
    ],
    notes: [
      "Format-valid demo: this card describes the archive site, which is not an agent — capabilities are empty, authentication is not required, and no skills are declared.",
    ],
    demoKind: "demo",
    demoLabel: "Format-valid agent card (this site is an archive, not an agent — the card says so)",
  },
  {
    slug: "open-resource-discovery",
    name: "Open Resource Discovery",
    uri: "/.well-known/open-resource-discovery",
    standard: "SAP Open Resource Discovery",
    standardUrl: "https://sap.github.io/open-resource-discovery/",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "agents",
    summary:
      "SAP's discovery mechanism: publish a link-format description of an origin's resources.",
    what:
      "Open Resource Discovery (SAP, 2023) serves a CoRE link-format document (RFC 6690) at /.well-known/open-resource-discovery, describing the resources an origin offers. It's designed for OAuth-protected APIs and edge computing.",
    threat:
      "Clients need a standard, low-cost way to discover an origin's resources without custom endpoints — especially across federated API landscapes.",
    how: [
      "The server serves /.well-known/open-resource-discovery in CoRE link format.",
      "Clients parse the typed links to find resources and their URIs.",
    ],
    demoKind: "reference",
    demoLabel: "Reference only — not served",
  },
  {
    slug: "scitt-keys",
    name: "scitt-keys",
    uri: "/.well-known/scitt-keys",
    standard: "RFC 9943 (SCITT)",
    standardUrl: RFC(9943),
    registrar: "iana",
    ianaStatus: "permanent",
    category: "agents",
    summary:
      "SCITT transparency ledger keys: where a transparency service publishes its verification keys.",
    what:
      "SCITT (Supply Chain Integrity, Transparency, and Trust) is the IETF's transparency framework for supply-chain artifacts. /.well-known/scitt-keys publishes a transparency service's public keys so clients can verify ledger statements.",
    threat:
      "Transparency ledgers are only trustworthy if their keys are discoverable and rotatable. The well-known URI gives clients a standard place to fetch current verification keys.",
    how: [
      "A transparency service serves /.well-known/scitt-keys with its key material.",
      "Clients verify SCITT statements against these keys before trusting them.",
    ],
    demoKind: "demo",
    demoLabel: "Demo — key list with this host's real demo JWK; no transparency service runs here",
  },
  {
    slug: "webweaver-json",
    name: "webweaver.json",
    uri: "/.well-known/webweaver.json",
    standard: "DigiOnline webweaver",
    standardUrl: "https://www.webweaver.de/well-known",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "agents",
    summary: "A school-platform federation registry (webweaver).",
    what:
      "webweaver.json lets school software platforms publish their service endpoints for interop with webweaver (a German school digitalization service).",
    threat:
      "School platforms need to federate without bespoke integrations; a well-known registry standardizes the handshake.",
    how: [
      "The platform serves /.well-known/webweaver.json describing its API endpoints for webweaver integration.",
    ],
    demoKind: "demo",
    demoLabel: "Demo — format-valid webweaver registry entry",
  },

  // ------------------------------------------------------------------ misc
  {
    slug: "dns-query",
    name: "dns-query (DoH)",
    uri: "/.well-known/dns-query",
    standard: "RFC 8484 (DNS-over-HTTPS)",
    standardUrl: RFC(8484),
    registrar: "defacto",
    category: "discovery",
    summary: "The default DNS-over-HTTPS endpoint — resolve DNS through HTTPS instead of port 53.",
    what:
      "RFC 8484 defines the standard DoH URI template; /.well-known/dns-query is the default path where a DoH server accepts GET (?dns=base64url) or POST (application/dns-message) queries and returns application/dns-message responses.",
    threat:
      "Classic DNS is plaintext and trivially snooped or hijacked on untrusted networks. DoH wraps queries in HTTPS, hiding them from network observers and verifying the resolver's identity.",
    how: [
      "A client sends the wire-format DNS query over HTTPS to /.well-known/dns-query.",
      "This server relays to the public resolver at cloudflare-dns.com — a real, working DoH endpoint you can point any resolver at.",
      "Responses come back as application/dns-message.",
    ],
    notes: [
      "This endpoint is a live relay to Cloudflare's public resolver, not a resolver itself.",
      "Not IANA-registered — RFC 8484 leaves the path to the operator; /.well-known/dns-query is the de-facto default used by browsers and resolvers.",
    ],
    demoKind: "live",
    demoLabel: "Working DoH relay — resolves real DNS through this server",
    demoPath: "/.well-known/dns-query?dns=EjQBAAABAAAAAAAAB2V4YW1wbGUDY29tAAABAAE",
  },
  {
    slug: "hosting-provider",
    name: "hosting-provider",
    uri: "/.well-known/hosting-provider",
    standard: "Automattic hosting-provider",
    standardUrl: "https://github.com/Automattic/hosting-provider",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "discovery",
    summary: "A plain-text hint about who hosts a site — useful for CDNs, abuse desks and support.",
    what:
      "A tiny text/plain file that names the hosting provider responsible for a domain. It helps CDN/DDoS mitigation services backtrack to the origin provider, and helps abuse desks route complaints.",
    threat:
      "When a site misbehaves (abuse, malware), the responsible provider is often hidden behind a CDN. The file lets providers self-identify so takedowns and support can be routed correctly.",
    how: [
      "The site serves /.well-known/hosting-provider with the provider's URL or name as plain text.",
      "This site runs on Deno Deploy, so the honest answer is https://deno.com.",
    ],
    demoKind: "live",
    demoLabel: "Spec-accurate live response — this site is genuinely hosted by Deno",
  },
  {
    slug: "mercure",
    name: "Mercure hub discovery",
    uri: "/.well-known/mercure",
    standard: "Mercure",
    standardUrl: "https://mercure.rocks/spec",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "discovery",
    summary: "Real-time updates protocol discovery: where a site advertises its Mercure hub.",
    what:
      "Mercure is a publish-subscribe protocol built on Server-Sent Events. A site can advertise its hub by serving /.well-known/mercure with the publish and subscribe URLs (and optional JWT), so clients can subscribe to live updates without configuration.",
    threat:
      "Live updates need a server push channel; SSE-based Mercure avoids WebSocket complexity but clients must find the hub. Well-known discovery makes the hub URL deterministic.",
    how: [
      "The site serves /.well-known/mercure with publishUrl, subscribeUrl and jwt.",
      "Clients subscribe via EventSource to the subscribe URL and receive updates as SSE.",
    ],
    notes: ["Demo: URLs are illustrative — no real hub runs here."],
    demoKind: "demo",
    demoLabel: "Format-valid demo (no real hub)",
  },
  {
    slug: "funding-manifest-urls",
    name: "funding-manifest-urls",
    uri: "/.well-known/funding-manifest-urls",
    standard: "funding.json (floss.fund)",
    standardUrl: "https://fundingjson.org/",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "discovery",
    summary: "Point users, tools and funding platforms at a project's funding manifest.",
    what:
      "The funding.json spec (floss.fund) gives open-source projects a machine-readable funding declaration. /.well-known/funding-manifest-urls tells tooling where the manifest lives.",
    threat:
      "OSS funding is scattered across sponsors pages, Ko-fi, OpenCollective. A standard manifest lets tools surface 'how to fund this project' uniformly.",
    how: [
      "The site serves /.well-known/funding-manifest-urls with the URL of its funding.json.",
      "Tooling fetches the manifest and renders funding options.",
    ],
    notes: ["Demo: points at a minimal manifest; no active funding platform is attached."],
    demoKind: "demo",
    demoLabel: "Format-valid demo manifest",
  },
  {
    slug: "trust-txt",
    name: "trust.txt",
    uri: "/.well-known/trust.txt",
    standard: "JournalList trust.txt",
    standardUrl: "https://journallist.net/trust.txt",
    registrar: "iana",
    ianaStatus: "provisional",
    category: "discovery",
    summary:
      "News outlets publish ownership, funding and corrections policy in a machine-readable text file.",
    what:
      "trust.txt (JournalList.net) lets news organizations declare their ownership, funding, editorial standards and corrections policy in a simple text format at /.well-known/trust.txt, so platforms and readers can assess trustworthiness.",
    threat:
      "Misinformation spreads partly because it's hard to tell who is behind a site and what its standards are. trust.txt makes the basics of newsroom accountability machine-readable.",
    how: [
      "The outlet serves /.well-known/trust.txt with fields like Owner, Funding, Corrections, Policies.",
      "Platforms and browser extensions can surface the data to readers.",
    ],
    notes: ["Demo: placeholder content — no real outlet runs here."],
    demoKind: "demo",
    demoLabel: "Format demonstration",
  },
  {
    slug: "dnt-policy-txt",
    name: "dnt-policy.txt",
    uri: "/.well-known/dnt-policy.txt",
    standard: "EFF DNT Policy",
    standardUrl: "https://www.eff.org/dnt-policy",
    registrar: "iana",
    ianaStatus: "permanent",
    category: "privacy",
    summary: "A site that claims to honor DNT can point at the policy it commits to.",
    what:
      "Sites that promise to honor Do Not Track could publish /.well-known/dnt-policy.txt pointing at the EFF's DNT policy they commit to, making the commitment checkable.",
    threat:
      "A DNT promise is only meaningful if it's tied to a specific, inspectable policy — this URI makes the commitment explicit.",
    how: ["The site serves the URL of the EFF policy it adopts."],
    demoKind: "demo",
    demoLabel: "Demo policy text — this site does not claim to honor DNT",
  },
  {
    slug: "manifest-webmanifest",
    name: "manifest.webmanifest (Isolated Web Apps)",
    uri: "/.well-known/manifest.webmanifest",
    standard: "Isolated Web Apps (Chrome / WICG)",
    standardUrl: "https://github.com/WICG/isolated-web-apps",
    registrar: "defacto",
    category: "platform",
    summary: "The fixed manifest location Isolated Web Apps must use — no HTML link tag needed.",
    what:
      'Normal PWAs are discovered by parsing HTML for a <link rel="manifest"> tag. Isolated Web Apps (IWAs) cannot rely on that: they run in a high-trust isolated-app:// context packaged in a Signed Web Bundle, and the browser must inspect app metadata (name, version, permissions) before executing any content. So the manifest must live at the deterministic path /.well-known/manifest.webmanifest, where the browser looks without needing HTML.',
    threat:
      "If metadata discovery depended on HTML, an IWA could only be evaluated after executing untrusted content, defeating the isolation model. A fixed, well-known path keeps install-time validation deterministic and makes updates checkable (the manifest carries a SemVer version and an update_manifest_url).",
    how: [
      "The IWA manifest is served at /.well-known/manifest.webmanifest as application/manifest+json.",
      "It extends the W3C Web App Manifest with IWA-specific fields: version (SemVer, required), update_manifest_url, and permissions_policy for powerful APIs.",
      'The browser fetches this path directly — a <link rel="manifest"> tag is neither required nor used for IWA install discovery.',
    ],
    notes: [
      "Demo: format-valid IWA-style manifest. No Signed Web Bundle exists for this host, so nothing here is installable as an IWA.",
    ],
    demoKind: "demo",
    demoLabel: "Format demo — IWA manifest shape; this host is not an installable IWA",
  },
  {
    slug: "web-app-origin-association",
    name: "web-app-origin-association (scope extensions)",
    uri: "/.well-known/web-app-origin-association",
    standard: "Web App Scope Extensions (WICG / Chrome)",
    standardUrl:
      "https://github.com/WICG/manifest-incubations/blob/gh-pages/scope_extensions-explainer.md",
    registrar: "defacto",
    category: "platform",
    summary:
      "The validation file a target origin hosts to grant a PWA extended scope across its domain.",
    what:
      "Scope extensions let an installed PWA claim pages on other origins (e.g. support.example.com) as part of its app. Because that is a dangerous power, it requires a two-way handshake: the PWA lists the origins in its manifest's scope_extensions, and each target origin must host a JSON file at /.well-known/web-app-origin-association granting that specific manifest id a scope.",
    threat:
      "Without the handshake, any site could claim ownership of another domain's pages by simply naming them in a manifest. The well-known file is the target origin's explicit opt-in: browsers only extend scope for ids that appear there, scoped to the path the file allows.",
    how: [
      "The main PWA declares scope_extensions in its manifest, naming each origin it wants to include.",
      "Each target origin serves /.well-known/web-app-origin-association (no .json extension, 200 OK, no redirects) mapping the PWA's manifest id to an allowed scope.",
      "On install, the browser fetches each validation file; missing files, 404s, or absent ids reject that extension.",
    ],
    notes: [
      "Demo: illustrative association file keyed by this host's manifest id. No PWA actually extends into this origin.",
    ],
    demoKind: "demo",
    demoLabel: "Format demo — the two-way handshake a PWA needs before it can claim this origin",
  },
];

export function specBySlug(slug: string): Spec | undefined {
  return SPECS.find((s) => s.slug === slug);
}
