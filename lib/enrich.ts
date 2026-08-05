/**
 * Human explanations and curated "in the wild" examples for registry entries
 * that don't have their own deep-dive explainer page.
 *
 * `EXPLAIN` fills the gap where the IANA registry's own description is a bare
 * phrase (e.g. "Reputation query template."). `WILD` lists real deployments
 * verified to serve the URI (checked 2026-08-05 via HTTP HEAD/GET); where no
 * live endpoint could be verified, the entry links to the governing spec or
 * registry instead of inventing an example.
 */

export const EXPLAIN: Record<string, string> = {
  amphtml:
    "AMP caches (Google's, Cloudflare's, and others) ping this URL to tell the cache that a page changed and the cached copy should be refreshed.",
  appspecific:
    "A proposed reverse-DNS namespace: any application can publish /.well-known/appspecific/com.example.app.json files without colliding with other apps' names.",
  ashrae:
    "BACnet is the building-automation protocol; this URI is the well-known entry point for BACnet/Web services in smart buildings.",
  "broadband-labels":
    "US ISPs must publish a standardized 'broadband label' (price, speed, latency, data caps) as a machine-readable disclosure at this path.",
  brski:
    "BRSKI (Bootstrapping Remote Secure Key Infrastructure) lets a brand-new device discover its registrar over HTTPS and be enrolled with a certificate — no pre-shared secret needed.",
  cmp:
    "The Certificate Management Protocol (CMP) endpoints a certificate authority offers for automated certificate lifecycle management (RFC 9482/9811).",
  coap:
    "The discovery resource for CoAP (Constrained Application Protocol) services running over TCP/TLS rather than plain UDP.",
  "coap-eap":
    "Extends CoAP with EAP-based authentication; this URI is where the EAP-capable endpoints are announced for IoT devices.",
  core:
    "The CoRE Link Format discovery endpoint: CoAP devices answer GET /.well-known/core with a list of the resources they host (RFC 6690).",
  "csaf-aggregator":
    "CSAF (Common Security Advisory Framework) aggregators mirror vendors' advisories; this file announces which CSRF advisories an aggregator carries.",
  csipaus:
    "The Common Smart Inverter Profile (Australia, SA TS 5573:2025) — the well-known endpoint where a solar/battery inverter exposes its capabilities to the grid operator.",
  dots:
    "DDoS Open Threat Signaling (DOTS) — this is where a DOTS gateway publishes the signal channel used to request mitigation during an attack.",
  "easy-proxy":
    "ByteDance's G3 easy-proxy discovery: announces the proxy endpoint for a domain using that service.",
  ecips:
    "ECIP is the Ethereum-class improvement proposal process; this URI serves the resource describing an ECIP.",
  edhoc:
    "EDHOC (Ephemeral Diffie-Hellman Over COSE) is a lightweight key-exchange for constrained devices; this URI points at the EDHOC endpoint.",
  "enterprise-network-security":
    "ETSI TS 103 523-5: how smart appliances enroll for network security in the enterprise — the well-known enrollment endpoint.",
  "enterprise-transport-security":
    "ETSI TS 103 523-3: transport-security enrollment for smart appliances, complementing the network-security enrollment.",
  genid:
    "An RDF service that mints blank-node identifiers on demand (RFC 6920-adjacent); GET this URI to obtain a fresh identifier.",
  gs1resolver:
    "GS1 Digital Link — the discovery file a GS1 resolver publishes so applications can find the service that resolves GS1 identifiers (barcodes, QR codes).",
  "http-opportunistic":
    "Historic (RFC 8164, retired 2021): advertised support for opportunistic HTTP/2 encryption over cleartext ports. Kept in the registry for historical reference.",
  "ic-domains":
    "Internet Computer canisters with custom domains declare the mapping here so the Internet Computer gateway knows which canister owns the domain.",
  knx:
    "KNX is the building-automation bus standard; this URI is the discovery endpoint for KNX cloud services.",
  "looking-glass":
    "The Looking Glass protocol (RFC 8522) — network operators publish route/peering diagnostics through a looking-glass service found at this URI.",
  masque:
    "MASQUE (RFC 9298/9484) proxies HTTP/3 and UDP over HTTP — this URI publishes the proxy configuration.",
  mud:
    "Manufacturer Usage Description (RFC 8520, obsoleted 2021): let a network learn from the manufacturer exactly what access an IoT device should be allowed.",
  "nfv-oauth-server-configuration":
    "ETSI NFV security: the OAuth authorization-server configuration for Network Functions Virtualization management.",
  ni:
    "RFC 6920 Named Information URIs — a resolver that dereferences ni:// names to their content is found at this path.",
  "ohttp-gateway":
    "Oblivious HTTP (RFC 9540): the gateway that relays encrypted, unlinkable HTTP requests is announced at this URI.",
  "ojobpub.json":
    "Open Job Publication: a machine-readable job-posting manifest (letsemploy.org convention) at /.well-known/ojobpub.json.",
  openbindings:
    "OpenBindings specification discovery — a convention for announcing the OpenBindings document for an origin.",
  openorg:
    "Open data publishing metadata: where an origin announces its open datasets and publishing formats.",
  "private-token-issuer-directory":
    "RFC 9578: the directory of Private Access Token issuers (privacy-preserving attestation, used by the Privacy Pass ecosystem).",
  "probing.txt":
    "RFC 9511: the message format for active network probing — this URI serves the probe-format definition.",
  pvd:
    "RFC 8801 Provisioning Domains: how a network tells clients about its provisioning information over HTTPS.",
  rd:
    "RFC 9176 'Reliable and Available Wireless' (RAW): the endpoint announcing a RAW-capable wireless network service.",
  "reload-config":
    "RELOAD (RFC 6940) is a P2P overlay protocol; this URI serves the overlay configuration so peers can join.",
  "repute-template":
    "RFC 7072: the template that describes how to query a reputation service — which parameters it accepts and what reputation queries look like.",
  "ssf-configuration":
    "OpenID Shared Signals Framework: configuration for continuous access evaluation and security-event token delivery.",
  sshfp:
    "Publishes SSH host-key fingerprints over HTTPS so clients can verify a server's SSH key without a PKI (the well-known counterpart to DNS SSHFP records).",
  "stun-key":
    "RFC 7635: where a TURN server publishes the key a STUN client needs for authenticated TURN relay.",
  tea:
    "The Transparency Exchange API — discovery for a service that lets auditors verify a resource's provenance/transparency.",
  thread: "Thread Group: the well-known configuration endpoint for Thread mesh networks (IoT).",
  time:
    "The HTTP Time Protocol: GET this URI to receive the server's authoritative time (subsecond precision) — useful when a client can't trust its own clock.",
  timezone:
    "RFC 7808: the timezone database a domain uses, published so clients can resolve timezone information from the domain itself.",
  tpcd:
    "Third-party-cookie deprecation (3PCD) grace-period opt-out — Chrome's transitional mechanism, deprecated in 2026 alongside the 3PCD project.",
  "traffic-advice":
    "Private Prefetch Proxy: the site's traffic advice (what the PFP may prefetch, and when) is published at this URI.",
  "webhook-authorized-senders.json":
    "Intempus webhook authentication: the manifest listing which senders a webhook receiver authorizes.",
  wot:
    "W3C Web of Things Discovery: the directory of Things a WoT server exposes is discovered at this URI.",
};

export interface WildExample {
  label: string;
  url: string;
}

/**
 * Real deployments verified 2026-08-05. Entries point at live endpoints that
 * returned HTTP 200 for an anonymous GET, or at the governing spec/registry
 * where no verifiable live deployment exists.
 */
export const WILD: Record<string, WildExample[]> = {
  "security.txt": [
    { label: "GitHub", url: "https://github.com/.well-known/security.txt" },
    { label: "Google", url: "https://www.google.com/.well-known/security.txt" },
  ],
  webfinger: [
    {
      label: "Mastodon (mastodon.social)",
      url: "https://mastodon.social/.well-known/webfinger?resource=acct:Gargron@mastodon.social",
    },
  ],
  nodeinfo: [
    { label: "mastodon.social", url: "https://mastodon.social/.well-known/nodeinfo" },
    { label: "hachyderm.io", url: "https://hachyderm.io/.well-known/nodeinfo" },
  ],
  "host-meta": [
    { label: "Mastodon (mastodon.social)", url: "https://mastodon.social/.well-known/host-meta" },
  ],
  "openid-configuration": [
    { label: "Google", url: "https://accounts.google.com/.well-known/openid-configuration" },
    { label: "Apple", url: "https://appleid.apple.com/.well-known/openid-configuration" },
  ],
  "jwks.json": [
    { label: "Google OAuth2 certs", url: "https://www.googleapis.com/oauth2/v3/certs" },
  ],
  "change-password": [
    { label: "GitHub", url: "https://github.com/.well-known/change-password" },
  ],
  "mta-sts.txt": [
    { label: "Spec (RFC 8461)", url: "https://datatracker.ietf.org/doc/html/rfc8461" },
  ],
  matrix: [
    { label: "matrix.org", url: "https://matrix.org/.well-known/matrix/client" },
  ],
  "dns-query": [
    { label: "Cloudflare public resolver", url: "https://cloudflare-dns.com/dns-query" },
  ],
  "apple-app-site-association": [
    { label: "Apple", url: "https://www.apple.com/.well-known/apple-app-site-association" },
  ],
  gpc: [
    { label: "Global Privacy Control adopters", url: "https://globalprivacycontrol.org/" },
  ],
  tdmrep: [
    {
      label: "TDMRep spec (W3C)",
      url: "https://www.w3.org/community/reports/tdmrep/CG-FINAL-tdmrep-20240702/",
    },
  ],
  "llms.txt": [
    { label: "llmstxt.org registry", url: "https://llmstxt.org/" },
  ],
  lnurlp: [
    { label: "Lightning Address convention", url: "https://www.lightningaddress.com/" },
  ],
};
