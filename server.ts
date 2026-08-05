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
import { serveSupporting } from "./lib/supporting.ts";
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
    return htmlResponse(await renderSpec(spec, origin, keys), 200, 300);
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
