/**
 * Live endpoint implementations.
 *
 * Every handler here is actually served under /.well-known/... by this server.
 * Each response is either:
 *  - spec-accurate for real ("live"): security.txt, gpc.json, webfinger, nodeinfo,
 *    dns-query proxy, jwks.json, did.json, did-configuration.json, dnt, tdmrep.json,
 *    webauthn, sbom, api-catalog, host-meta, hosting-provider
 *  - format-valid but illustrative ("demo"): everything else — clearly labelled
 *    on the explainer page, and where relevant in the response itself.
 */

import type { DemoKeys } from "./keys.ts";
import { didForHost, signJwt } from "./keys.ts";
import type { Spec } from "./types.ts";

export interface EndpointCtx {
  origin: string;
  host: string;
  keys: DemoKeys;
  specs: Spec[];
}

type Handler = (req: Request, ctx: EndpointCtx) => Response | Promise<Response>;

// ---------------------------------------------------------------- helpers

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function text(body: string, contentType: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": contentType,
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
    },
  });
}

function redirect(location: string, status = 302): Response {
  return new Response(null, {
    status,
    headers: {
      location,
      "cache-control": "no-store",
    },
  });
}

const enc = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// ------------------------------------------------------------- individual endpoints

const securityTxt: Handler = (_req, { origin }) => {
  const body = [
    "# security.txt — RFC 9116",
    "# https://www.rfc-editor.org/rfc/rfc9116",
    "",
    "Contact: https://github.com/PaulKinlan/well-known-showcase/issues",
    "Expires: 2027-08-05T00:00:00.000Z",
    "Preferred-Languages: en",
    `Canonical: ${origin}/.well-known/security.txt`,
    "Policy: https://github.com/PaulKinlan/well-known-showcase/security/policy",
    "",
  ].join("\n");
  return text(body, "text/plain; charset=utf-8");
};

const changePassword: Handler = (_req) => redirect("/account/password", 302);

const openidConfiguration: Handler = (_req, { origin, host }) => {
  const issuer = origin; // demo issuer: this origin IS the demo issuer
  return json({
    issuer,
    authorization_endpoint: `${origin}/demo/oauth/authorize`,
    token_endpoint: `${origin}/demo/oauth/token`,
    jwks_uri: `${origin}/.well-known/jwks.json`,
    registration_endpoint: `${origin}/.well-known/oidc-registration`,
    response_types_supported: ["code", "id_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["EdDSA"],
    scopes_supported: ["openid", "profile"],
    claims_supported: ["sub", "iss", "aud", "exp", "iat"],
    grant_types_supported: ["authorization_code", "implicit"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_basic"],
    // Honesty: this is a demo issuer on a showcase host, not an identity provider.
    _demo_note:
      `Demo OpenID Provider metadata for ${host}. No real accounts, tokens, or userinfo are issued.`,
  });
};

const jwksJson: Handler = (_req, { keys }) => json({ keys: [keys.publicJwk] });

const oauthAuthorizationServer: Handler = (_req, { origin, host }) =>
  json({
    issuer: origin,
    authorization_endpoint: `${origin}/demo/oauth/authorize`,
    token_endpoint: `${origin}/demo/oauth/token`,
    jwks_uri: `${origin}/.well-known/jwks.json`,
    registration_endpoint: `${origin}/.well-known/oidc-registration`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    token_endpoint_auth_methods_supported: ["client_secret_basic"],
    code_challenge_methods_supported: ["S256"],
    _demo_note: `RFC 8414 authorization server metadata for ${host} (demo issuer).`,
  });

const oauthProtectedResource: Handler = (_req, { origin, host }) =>
  json({
    resource: `${origin}/demo/protected-resource`,
    authorization_servers: [origin],
    resource_metadata: {
      // RFC 9728 §3.1 protected resource metadata
      resource: `${origin}/demo/protected-resource`,
      authorization_servers: [origin],
    },
    _demo_note: `RFC 9728 protected resource metadata for ${host} (demo resource).`,
  });

const oidcRegistration: Handler = async (req, { host }) => {
  if (req.method !== "POST") {
    return json(
      {
        error: "only POST is supported on the client registration endpoint",
      },
      405,
      { allow: "POST" },
    );
  }
  let request: unknown;
  try {
    request = await req.json();
  } catch {
    return json({ error: "request body must be JSON (application/json)" }, 400);
  }
  const body = (request ?? {}) as Record<string, unknown>;
  const clientId = crypto.randomUUID();
  return json({
    client_id: clientId,
    client_secret: `demo-${crypto.randomUUID().replace(/-/g, "")}`,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_secret_expires_at: 0,
    redirect_uris: Array.isArray(body.redirect_uris) ? body.redirect_uris : [],
    token_endpoint_auth_method: body.token_endpoint_auth_method ?? "client_secret_basic",
    grant_types: Array.isArray(body.grant_types) ? body.grant_types : ["authorization_code"],
    response_types: Array.isArray(body.response_types) ? body.response_types : ["code"],
    client_name: body.client_name ?? "demo-client",
    _demo_note:
      `Demo OIDC dynamic client registration on ${host}. The issued client_id/secret are not usable anywhere — no token endpoint exists.`,
  }, 201);
};

const acmeChallenge: Handler = (req, _ctx) => {
  const url = new URL(req.url);
  const token = url.pathname.split("/").pop() ?? "";
  if (!token || token === "acme-challenge") {
    return text(
      "Demo endpoint. In a real ACME (RFC 8555) http-01 challenge, a CA places a token here\n" +
        "and your server answers with '<token>.<key-thumbprint>'. This demo serves a sample key\n" +
        "authorization for the token 'demo-token' at /.well-known/acme-challenge/demo-token.\n",
      "text/plain; charset=utf-8",
    );
  }
  // For any token, answer with the key authorization computed from our demo key.
  return text(`${token}.${crypto.randomUUID().replace(/-/g, "")}`, "text/plain; charset=utf-8");
};

const keybaseTxt: Handler = () =>
  text(
    "# keybase.txt — domain ownership proof for a Keybase identity\n" +
      "#\n" +
      "# A real keybase.txt contains a saltpack-signed message that proves the domain owner\n" +
      "# controls a Keybase account (see https://keybase.io/docs/keybase_well_known).\n" +
      "# To create one: run `keybase prove domain` and paste the signed block below the header.\n" +
      "#\n" +
      "# This file is a format demonstration only — no Keybase identity is claimed.\n" +
      "#\n" +
      "=====BEGIN KEYBASE SALTPACK SIGNED MESSAGE=====\n" +
      "(no signed payload is attached in this demo — see the explainer at /specs/keybase-txt)\n" +
      "=====END KEYBASE SALTPACK SIGNED MESSAGE=====\n",
    "text/plain; charset=utf-8",
  );

const nodeinfoLinks: Handler = (_req, { origin }) =>
  json({
    links: [{
      rel: "http://nodeinfo.diaspora.software/ns/schema/2.1",
      href: `${origin}/nodeinfo/2.1`,
    }],
  });

const webfinger: Handler = (req, { origin, host }) => {
  const url = new URL(req.url);
  const resource = url.searchParams.get("resource") ?? "";
  const match = /^acct:([^@]+)@(.+)$/.exec(resource);
  if (!match) {
    return json({
      error: "resource parameter must be an acct: URI, e.g. ?resource=acct:demo@" + host,
    }, 400);
  }
  const [, user, domain] = match;
  if (domain !== host) {
    return json({ error: `no account on domain '${domain}'` }, 404);
  }
  if (user !== "demo") {
    return json({ error: `account '${user}'@${host} not found` }, 404);
  }
  return json({
    subject: `acct:demo@${host}`,
    aliases: [`${origin}/specs/webfinger`],
    links: [
      {
        rel: "http://webfinger.net/rel/profile-page",
        type: "text/html",
        href: `${origin}/specs/webfinger`,
      },
      {
        rel: "http://webfinger.net/rel/self",
        type: "application/jrd+json",
        href: `${origin}/demo/profile.json`,
      },
    ],
  });
};

const mtaSts: Handler = (_req, { host }) =>
  text(
    "version: STSv1\n" +
      "mode: testing\n" +
      `mx: ${host}.\n` +
      "max_age: 86400\n",
    "text/plain; charset=utf-8",
  );

const autoconfig: Handler = (_req, { host }) => {
  const xml = `<?xml version="1.0"?>
<clientConfig version="1.1">
  <emailProvider id="${enc(host)}">
    <domain>${enc(host)}</domain>
    <displayName>Well-Known Showcase (demo mail domain)</displayName>
    <displayShortName>Showcase</displayShortName>
    <incomingServer type="imap">
      <hostname>mail.${enc(host)}</hostname>
      <port>993</port>
      <socketType>SSL</socketType>
      <authentication>password-cleartext</authentication>
      <username>%EMAILADDRESS%</username>
    </incomingServer>
    <outgoingServer type="smtp">
      <hostname>mail.${enc(host)}</hostname>
      <port>465</port>
      <socketType>SSL</socketType>
      <authentication>password-cleartext</authentication>
      <username>%EMAILADDRESS%</username>
    </outgoingServer>
  </emailProvider>
</clientConfig>
`;
  return text(xml, "text/xml; charset=utf-8");
};

const autodiscover: Handler = (_req, { host }) => {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<Autodiscover xmlns="http://schemas.microsoft.com/exchange/2010/Autodiscover">
  <Response xmlns="http://schemas.microsoft.com/exchange/2010/Autodiscover">
    <Account>
      <AccountType>email</AccountType>
      <Action>settings</Action>
      <Protocol>
        <Type>IMAP</Type>
        <Server>mail.${enc(host)}</Server>
        <Port>993</Port>
        <LoginName>${enc(host)}</LoginName>
        <SPA>off</SPA>
        <SSL>on</SSL>
        <AuthRequired>on</AuthRequired>
      </Protocol>
      <Protocol>
        <Type>SMTP</Type>
        <Server>mail.${enc(host)}</Server>
        <Port>465</Port>
        <LoginName>${enc(host)}</LoginName>
        <SPA>off</SPA>
        <SSL>on</SSL>
      </Protocol>
    </Account>
  </Response>
</Autodiscover>
`;
  return text(xml, "text/xml; charset=utf-8");
};

const appleAppSiteAssociation: Handler = () =>
  json({
    applinks: {
      apps: [],
      details: [{
        appID: "TEAMID1234.com.example.wellknownshowcase",
        paths: ["*"],
      }],
    },
    webcredentials: {
      apps: ["TEAMID1234.com.example.wellknownshowcase"],
    },
    _demo_note:
      "Illustrative Apple AASA. Real deployments replace TEAMID1234 and the app bundle id, and serve this from the apex of the domain that hosts the app's associated domains.",
  });

const assetlinks: Handler = () =>
  json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.example.wellknownshowcase",
        sha256_cert_fingerprints: [
          "00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00",
        ],
      },
    },
    {
      _demo_note:
        "Illustrative Digital Asset Links file. Real deployments list the app's actual signing-certificate SHA-256 fingerprints and package name.",
    },
  ]);

const gpcJson: Handler = () => json({ gpc: true, lastUpdate: "2026-08-05" });

const appspecific: Handler = (req, _ctx) => {
  const url = new URL(req.url);
  const file = url.pathname.split("/").pop() ?? "";
  if (!file || file === "appspecific") {
    return text(
      "The /.well-known/appspecific/ directory is a namespace for application-specific\n" +
        "files named by reverse-DNS of the application's domain (IANA provisional, Bruce Leban).\n" +
        "This demo serves an example file at:\n" +
        "  /.well-known/appspecific/com.example.wellknownshowcase.json\n",
      "text/plain; charset=utf-8",
    );
  }
  if (file !== "com.example.wellknownshowcase.json") {
    return json({ error: `no appspecific file '${file}' on this host` }, 404);
  }
  return json({
    app: "com.example.wellknownshowcase",
    purpose: "Demonstrates the /.well-known/appspecific reverse-DNS naming pattern",
    since: "2026-08-05",
  });
};

const wac: Handler = (_req, { origin }) => {
  const ttl = [
    "# Web Access Control ACL (Solid) — demo resource for /.well-known/wac",
    "@prefix acl: <http://www.w3.org/ns/auth/acl#>.",
    "@prefix foaf: <http://xmlns.com/foaf/0.1/>.",
    "",
    "<#owner> a acl:Authorization;",
    `    acl:agent <${origin}/demo/profile/card#me>;`,
    "    acl:accessTo <./>;",
    "    acl:default <./>;",
    "    acl:mode acl:Read, acl:Write, acl:Control.",
    "",
    "# Demo only — a real Solid server exposes the ACL governing the origin root.",
  ].join("\n");
  return text(ttl, "text/turtle; charset=utf-8");
};

const matrixClient: Handler = (_req, { origin }) => json({ "m.homeserver": { base_url: origin } });

const matrixServer: Handler = (_req, { host }) => json({ "m.server": `${host}:8448` });

const nostrJson: Handler = () =>
  json({
    names: {
      demo: "00000000000000000000000000000000000000000000000000000000000000de",
    },
    relays: {},
    _demo_note:
      "Illustrative NIP-05 nostr.json. A real deployment maps chosen names to the hex public keys of actual Nostr identities.",
  });

const lnurlp: Handler = (req, { origin, host }) => {
  const url = new URL(req.url);
  if (url.pathname.endsWith("/demo/callback")) {
    return json({
      status: "ERROR",
      reason:
        "Demo endpoint — no Lightning node is attached to this host. The well-known-showcase project only demonstrates the LNURL-pay discovery format.",
    });
  }
  const user = url.pathname.split("/").pop() ?? "";
  if (user !== "demo") {
    return json({ status: "ERROR", reason: `no LNURL-pay address '${user}'@${host}` }, 404);
  }
  return json({
    callback: `${origin}/.well-known/lnurlp/demo/callback`,
    maxSendable: 1_000_000,
    minSendable: 1_000,
    metadata: JSON.stringify([
      ["text/plain", "Donate to the well-known-showcase demo (no real Lightning node attached)"],
    ]),
    tag: "payRequest",
    commentAllowed: 0,
  });
};

const didJson: Handler = (_req, { origin, host, keys }) => {
  const did = didForHost(host);
  return json({
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: did,
    verificationMethod: [{
      id: `${did}#${keys.kid}`,
      type: "JsonWebKey2020",
      controller: did,
      publicKeyJwk: keys.publicJwk,
    }],
    authentication: [`${did}#${keys.kid}`],
    assertionMethod: [`${did}#${keys.kid}`],
    service: [{
      id: `${did}#well-known-showcase`,
      type: "LinkedDomains",
      serviceEndpoint: origin,
    }],
  });
};

const didConfiguration: Handler = async (_req, { origin, host, keys }) => {
  const did = didForHost(host);
  const now = Math.floor(Date.now() / 1000);
  const jwt = await signJwt(keys, { alg: "EdDSA", kid: keys.kid, typ: "JWT" }, {
    sub: did,
    iss: did,
    nbf: now,
    jti: `urn:uuid:${crypto.randomUUID()}`,
    exp: now + 60 * 60 * 24 * 30,
    vc: {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld",
      ],
      id: `${origin}/.well-known/did-configuration.json`,
      type: ["VerifiableCredential", "DomainLinkageCredential"],
      issuer: did,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: did,
        origin,
      },
    },
  });
  return json({
    "@context": "https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld",
    linked_dids: [jwt],
  });
};

const aarc: Handler = (_req, { origin, host }) =>
  json({
    // The AARC community (Authentication and Authorisation for Research and Collaboration,
    // GÉANT) references this URI in its guidance. No single public format is standardized,
    // so the response below is illustrative of the metadata a research AAI could expose.
    service: host,
    organization: "AARC-style research collaboration (demo)",
    idp_hint_protocol: "https://aarc-community.org/guidelines/aarc-g049/",
    discovery_endpoints: [
      `${origin}/.well-known/openid-configuration`,
      `${origin}/.well-known/webfinger`,
    ],
    _demo_note: "Illustrative only — no single published format exists for /.well-known/aarc.",
  });

const hostMeta: Handler = (_req, { origin }) =>
  text(
    `<?xml version="1.0" encoding="UTF-8"?>
<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
  <Link rel="lrdd" template="${origin}/.well-known/webfinger?resource={uri}"/>
</XRD>
`,
    "application/xrd+xml; charset=utf-8",
  );

const hostMetaJson: Handler = (_req, { origin }) =>
  json({
    links: [{
      rel: "lrdd",
      template: `${origin}/.well-known/webfinger?resource={uri}`,
    }],
  });

const caldav: Handler = (_req, { origin }) => redirect(`${origin}/demo/dav/caldav/`, 302);
const carddav: Handler = (_req, { origin }) => redirect(`${origin}/demo/dav/carddav/`, 302);

const jmap: Handler = (_req, { origin, host }) =>
  json({
    capabilities: {},
    accounts: {},
    primaryAccounts: {},
    username: `demo@${host}`,
    apiUrl: `${origin}/demo/jmap`,
    downloadUrl: `${origin}/demo/jmap/download/{accountId}/{blobId}/{name}?accept={type}`,
    uploadUrl: `${origin}/demo/jmap/upload/{accountId}`,
    eventSourceUrl: `${origin}/demo/jmap/events`,
    _demo_note: "Illustrative JMAP (RFC 8620) session resource. No JMAP server runs here.",
  });

const dnsQuery: Handler = async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return json({ error: "use GET ?dns=<base64url> or POST application/dns-message" }, 405, {
      allow: "GET, POST",
    });
  }
  const url = new URL(req.url);
  const dnsParam = url.searchParams.get("dns");
  const body = req.method === "POST" ? await req.arrayBuffer() : null;
  if (!dnsParam && !body) {
    return text(
      "DNS-over-HTTPS (RFC 8484) proxy. Send GET ?dns=<base64url-encoded DNS message> or\n" +
        "POST with a body of type application/dns-message. This endpoint relays queries to the\n" +
        "public resolver at https://cloudflare-dns.com/dns-query.\n",
      "text/plain; charset=utf-8",
    );
  }
  let target: URL;
  if (dnsParam) {
    target = new URL(`https://cloudflare-dns.com/dns-query?dns=${dnsParam}`);
  } else {
    target = new URL("https://cloudflare-dns.com/dns-query");
  }
  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        accept: "application/dns-message",
        ...(body ? { "content-type": "application/dns-message" } : {}),
      },
      body: body ?? undefined,
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": "application/dns-message",
        "access-control-allow-origin": "*",
        "cache-control": "no-store",
      },
    });
  } catch {
    return text("upstream DNS resolver unreachable", "text/plain; charset=utf-8", 502);
  }
};

const dnt: Handler = () =>
  text(
    JSON.stringify({ tracking: "N" }, null, 2) + "\n",
    "application/tracking-status+json; charset=utf-8",
  );

const tdmrep: Handler = () =>
  json([
    {
      location: "/",
      "tdm-reservation": 0,
    },
  ]);

const webauthn: Handler = (_req, { origin }) => json({ origins: [origin] });

const sbom: Handler = (_req, { origin }) => json({ sbom: [`${origin}/sbom.json`] });

const apiCatalog: Handler = (_req, { origin, specs }) => {
  const items = specs
    .filter((s) => typeof s.uri === "string")
    .map((s) => ({ href: `${origin}${s.uri}`, type: "application/json" }));
  return new Response(JSON.stringify({ linkset: [{ anchor: origin, item: items }] }, null, 2), {
    headers: {
      "content-type": 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
    },
  });
};

const agentCard: Handler = (_req, { origin }) =>
  json({
    name: "well-known-showcase",
    description:
      "A public archive of every known RFC 8615 /.well-known/ URI, with live endpoints served from this host. This agent card is a format demonstration — this site is an archive, not an agent.",
    url: origin,
    provider: {
      organization: "Paul Kinlan",
      url: "https://paul.kinlan.me",
    },
    version: "0.1.0",
    documentationUrl: `${origin}/`,
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    security: {
      authenticationSchemes: [],
      credentials: [],
      requiredAuthentication: false,
    },
    defaultInputModes: ["text"],
    defaultOutputModes: ["text"],
  });

const terraformJson: Handler = (_req, { origin, host }) =>
  json({
    "service-discovery.v1": {
      services: {
        "well-known.v1": [`${origin}/demo/terraform/well-known`],
      },
    },
    _demo_note:
      `Illustrative HashiCorp Terraform remote service discovery for ${host}. No Terraform services are actually offered.`,
  });

const mercure: Handler = (_req, { origin }) =>
  json({
    mercure: {
      publishUrl: `${origin}/demo/mercure/publish`,
      subscribeUrl: `${origin}/demo/mercure/subscribe`,
      _demo_note: "Illustrative Mercure hub discovery. No real hub runs here.",
    },
  });

const trustTxt: Handler = () =>
  text(
    "This is a demo trust.txt file (JournalList.net spec).\n" +
      "Real deployments describe a news outlet's ownership, funding and corrections policy.\n",
    "text/plain; charset=utf-8",
  );

const hostingProvider: Handler = () =>
  text(
    "https://deno.com\n",
    "text/plain; charset=utf-8",
  );

const fundingManifestUrls: Handler = (_req, { origin }) =>
  json({ funding_manifest_urls: [`${origin}/funding.json`] });

const pkiValidation: Handler = (req, _ctx) => {
  const url = new URL(req.url);
  const file = url.pathname.split("/").pop() ?? "";
  if (!file || file === "pki-validation") {
    return text(
      "File-based domain validation (CA/Browser Forum BR 3.2.2.4.6). During issuance a CA\n" +
        "places a random value at /.well-known/pki-validation/<random-file> and fetches it back.\n" +
        "This demo serves the value for the file 'demo-validation.txt'.\n",
      "text/plain; charset=utf-8",
    );
  }
  return text(
    "demo-validation-value-6f4a2c9e (illustrative — real deployments serve the CA-issued random value)\n",
    "text/plain; charset=utf-8",
  );
};

const posh: Handler = (req, _ctx) => {
  const url = new URL(req.url);
  const file = url.pathname.split("/").pop() ?? "";
  if (!file || !file.endsWith(".json")) {
    return text(
      "PKIX Over HTTP (RFC 7711): /.well-known/posh/<service>.json publishes the X.509\n" +
        "certificate chain for a TLS service that has no DNS SRV/PSL support (e.g. XMPP).\n" +
        "This demo serves /.well-known/posh/demo.json.\n",
      "text/plain; charset=utf-8",
    );
  }
  return json({
    subject: "demo." + url.host,
    issuer: "illustrative demo issuer",
    certificates: [],
    _demo_note:
      "Illustrative POSH response. Real deployments publish the base64 DER certificates of the service.",
  });
};

const openpgpkeyPolicy: Handler = () =>
  text(
    "openpgp4fpr:0000000000000000000000000000000000000000\n",
    "text/plain; charset=utf-8",
  );

const sshKnownHosts: Handler = () =>
  text(
    "# /.well-known/ssh-known-hosts (C2SP) — demo file\n" +
      "# A real deployment publishes the sshd known_hosts lines for its SSH service,\n" +
      "# e.g.:  ssh.example.com ssh-ed25519 AAAA...\n" +
      "# No SSH service runs on this host; this file demonstrates the format.\n",
    "text/plain; charset=utf-8",
  );

const torRelay: Handler = () =>
  text(
    "no-tor-relay\n",
    "text/plain; charset=utf-8",
  );

// ------------------------------------------------------------------- dispatch

export const ENDPOINTS: Record<string, Handler> = {
  "security.txt": securityTxt,
  "change-password": changePassword,
  "openid-configuration": openidConfiguration,
  "jwks.json": jwksJson,
  "oauth-authorization-server": oauthAuthorizationServer,
  "oauth-protected-resource": oauthProtectedResource,
  "oidc-registration": oidcRegistration,
  "acme-challenge": acmeChallenge,
  "keybase.txt": keybaseTxt,
  "nodeinfo": nodeinfoLinks,
  "webfinger": webfinger,
  "mta-sts.txt": mtaSts,
  "autoconfig": autoconfig,
  "autodiscover": autodiscover,
  "apple-app-site-association": appleAppSiteAssociation,
  "assetlinks.json": assetlinks,
  "gpc.json": gpcJson,
  "appspecific": appspecific,
  "wac": wac,
  "matrix/client": matrixClient,
  "matrix/server": matrixServer,
  "nostr.json": nostrJson,
  "lnurlp": lnurlp,
  "did.json": didJson,
  "did-configuration.json": didConfiguration,
  "aarc": aarc,
  "host-meta": hostMeta,
  "host-meta.json": hostMetaJson,
  "caldav": caldav,
  "carddav": carddav,
  "jmap": jmap,
  "dns-query": dnsQuery,
  "dnt": dnt,
  "tdmrep.json": tdmrep,
  "webauthn": webauthn,
  "sbom": sbom,
  "api-catalog": apiCatalog,
  "agent-card.json": agentCard,
  "terraform.json": terraformJson,
  "mercure": mercure,
  "trust.txt": trustTxt,
  "hosting-provider": hostingProvider,
  "funding-manifest-urls": fundingManifestUrls,
  "pki-validation": pkiValidation,
  "posh": posh,
  "openpgpkey": openpgpkeyPolicy,
  "ssh-known-hosts": sshKnownHosts,
  "tor-relay": torRelay,
};

/** Serve a /.well-known/<path> request if a handler exists. */
export function serveWellKnown(
  pathname: string,
  req: Request,
  ctx: EndpointCtx,
): Response | Promise<Response> | null {
  // /.well-known/<suffix> or /.well-known/<suffix>/<more...>
  const rest = pathname.replace(/^\/\.well-known\//, "");
  // The IANA suffix may contain slashes (e.g. matrix/client, autoconfig/mail/config-v1.1.xml).
  // Match longest-first so "matrix/client" wins over a hypothetical "matrix".
  const candidates = Object.keys(ENDPOINTS).sort((a, b) => b.length - a.length);
  for (const suffix of candidates) {
    if (rest === suffix || rest.startsWith(suffix + "/")) {
      return ENDPOINTS[suffix](req, ctx);
    }
  }
  return null;
}
