/**
 * Supporting (non-well-known) resources referenced by live endpoints and
 * explainer pages: /nodeinfo/2.1, /sbom.json, /funding.json, /account/password,
 * /demo/profile.json, /demo/dav/*.
 *
 * Kept in its own module so the demo panels can dispatch in-process (see
 * html.ts) instead of self-fetching over the network — Deno Deploy's edge
 * returns 508 LOOP_DETECTED when a deployment fetches its own domain.
 */

import { IANA } from "./iana.ts";
import { SPECS } from "./registry.ts";

const projectVersion = "0.1.0";

export function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function serveSupporting(pathname: string, origin: string): Response | null {
  switch (pathname) {
    case "/nodeinfo/2.1": {
      return jsonResponse({
        version: "2.1",
        software: { name: "well-known-showcase", version: projectVersion },
        protocols: [],
        services: { inbound: [], outbound: [] },
        openRegistrations: false,
        usage: { users: { total: 0 }, localPosts: 0 },
        metadata: {
          purpose: "Public archive of RFC 8615 well-known URIs with live endpoints",
          deepDiveSpecs: SPECS.length,
          ianaUrisCatalogued: IANA.length,
        },
      });
    }
    case "/sbom.json": {
      return jsonResponse({
        spdxVersion: "SPDX-2.3",
        dataLicense: "CC0-1.0",
        SPDXID: "SPDXRef-DOCUMENT",
        name: "well-known-showcase",
        documentNamespace: `${origin}/sbom.json`,
        creationInfo: {
          created: new Date().toISOString().slice(0, 10),
          creators: ["Tool: well-known-showcase (agent-built)"],
        },
        packages: [{
          name: "well-known-showcase",
          versionInfo: projectVersion,
          SPDXID: "SPDXRef-Package-well-known-showcase",
          downloadLocation: "https://github.com/PaulKinlan/well-known-showcase",
          licenseConcluded: "Apache-2.0",
          copyrightText: "NOASSERTION",
        }],
        comment:
          "This project has no third-party runtime dependencies — it runs on the Deno standard library and Web Platform APIs only.",
      });
    }
    case "/funding.json": {
      return jsonResponse({
        version: 0,
        funding: {
          platforms: [],
          note:
            "This demo project has no active funding platform. See /.well-known/funding-manifest-urls for the format demonstration.",
        },
      });
    }
    case "/demo/profile.json": {
      return jsonResponse({
        "@context": "https://www.w3.org/ns/activitystreams",
        id: `${origin}/demo/profile.json`,
        type: "Person",
        name: "demo (well-known-showcase)",
        url: `${origin}/specs/webfinger`,
        summary: "A demo account for the WebFinger explainer. No real person or service behind it.",
      });
    }
    case "/demo/dav/caldav/":
      return new Response("Demo CalDAV service root — no calendar server runs here.", {
        headers: { "content-type": "text/plain" },
      });
    case "/demo/dav/carddav/":
      return new Response("Demo CardDAV service root — no address-book server runs here.", {
        headers: { "content-type": "text/plain" },
      });
    default:
      return null;
  }
}
