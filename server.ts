/**
 * well-known-showcase — an archive of every known RFC 8615 /.well-known/ URI,
 * with live endpoints served from this host.
 *
 * Routing:
 *   /                      — archive index
 *   /specs                 — all deep-dive explainers
 *   /specs/<slug>          — one explainer (with a live demo panel)
 *   /registry/<suffix>     — IANA registry reference page
 *   /.well-known/...       — the live endpoints (the point of the site)
 *   /nodeinfo/2.1, /sbom.json, /funding.json, /demo/... — supporting resources
 *   /public/styles.css     — stylesheet
 */

import { type EndpointCtx, serveWellKnown } from "./lib/endpoints.ts";
import { createDemoKeys, type DemoKeys } from "./lib/keys.ts";
import { specBySlug, SPECS } from "./lib/registry.ts";
import { IANA } from "./lib/iana.ts";
import {
  renderIndex,
  renderNotFound,
  renderRegistryEntry,
  renderSpec,
  renderSpecsIndex,
} from "./lib/html.ts";

const PORT = Number(Deno.env.get("PORT") ?? "8787");
const HOST = Deno.env.get("HOST") ?? "0.0.0.0";

const projectVersion = "0.1.0";

// Supporting (non-well-known) resources referenced by live endpoints.
function serveSupporting(pathname: string, origin: string): Response | null {
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
    case "/account/password": {
      return new Response(
        `<!doctype html><html><head><title>Change password — demo</title><link rel="stylesheet" href="/public/styles.css"></head><body>
        <main class="hero"><h1>Change password</h1>
        <p class="lede">You arrived here via <code>/.well-known/change-password</code> — the W3C-specified URL that browsers and password managers navigate to. A real site would put its password-change form here.</p>
        <p><a href="/">← Back to the archive</a></p></main></body></html>`,
        { headers: { "content-type": "text/html; charset=utf-8" } },
      );
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

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function handler(req: Request, keys: DemoKeys): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const origin = url.origin;
  const ctx: EndpointCtx = { origin, host: url.host, keys, specs: SPECS };

  // Well-known endpoints first — they own the /.well-known/ namespace.
  if (pathname.startsWith("/.well-known/")) {
    const res = await serveWellKnown(pathname, req, ctx);
    if (res) return res;
    return new Response("404 — no well-known URI registered at this path\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }

  if (pathname === "/" || pathname === "") {
    return htmlResponse(await renderIndex(origin), 200, 300);
  }
  if (pathname === "/specs") {
    return htmlResponse(renderSpecsIndex(), 200, 300);
  }
  if (pathname.startsWith("/specs/")) {
    const slug = pathname.slice("/specs/".length).replace(/\/+$/, "");
    const spec = specBySlug(slug);
    if (!spec) return htmlResponse(renderNotFound(slug), 404, 300);
    return htmlResponse(await renderSpec(spec, origin), 200, 300);
  }
  if (pathname.startsWith("/registry/")) {
    const suffix = pathname.slice("/registry/".length).replace(/\/+$/, "");
    return htmlResponse(renderRegistryEntry(suffix, origin), 200, 300);
  }
  if (pathname === "/public/styles.css") {
    try {
      const css = await Deno.readFile(new URL("./public/styles.css", import.meta.url));
      return new Response(css, {
        headers: {
          "content-type": "text/css; charset=utf-8",
          "cache-control": "public, max-age=3600",
        },
      });
    } catch {
      return new Response("", { status: 404 });
    }
  }

  const supporting = serveSupporting(pathname, origin);
  if (supporting) return supporting;

  return htmlResponse(renderNotFound(pathname), 404, 300);
}

function htmlResponse(body: string, status: number, maxAge: number): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": `public, max-age=${maxAge}`,
    },
  });
}

// ------------------------------------------------------------------- boot

const keys = await createDemoKeys();
console.log(`well-known-showcase ${projectVersion} starting on ${HOST}:${PORT}`);
Deno.serve({ port: PORT, hostname: HOST }, (req) => handler(req, keys));
