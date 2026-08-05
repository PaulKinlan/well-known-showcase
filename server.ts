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
import { ACCOUNT_NAME, accountStatus, changePassword, resetPassword } from "./lib/account.ts";
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

  // Demo account pages for the /.well-known/change-password flow.
  if (pathname === "/account/password" || pathname === "/account/password/") {
    return await accountPassword(req, origin);
  }

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

// ------------------------------------------------------- account demo pages

async function accountPassword(req: Request, origin: string): Promise<Response> {
  if (req.method === "POST" && new URL(req.url).searchParams.get("reset") === "1") {
    await resetPassword();
    return htmlRedirect("/account/password?reset=ok");
  }

  if (req.method === "POST") {
    const form = await req.formData();
    const current = String(form.get("current") ?? "");
    const next = String(form.get("next") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    const result = await changePassword(current, next, confirm);
    if (!result.ok) {
      return accountPage(origin, `error:${result.error ?? "unknown error"}`);
    }
    return htmlRedirect("/account/password?changed=ok");
  }

  const query = new URL(req.url).searchParams;
  const flash = query.get("changed") === "ok"
    ? "Password changed. The new hash is stored in this project's KV database."
    : query.get("reset") === "ok"
    ? "Demo reset — the account password is back to demo-pass."
    : "";
  return accountPage(origin, flash ? `ok:${flash}` : "");
}

function htmlRedirect(location: string): Response {
  return new Response(null, {
    status: 303,
    headers: { location },
  });
}

async function accountPage(_origin: string, message: string): Promise<Response> {
  const esc = (v: string) => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const { changedAt, backend } = await accountStatus();
  const msg = message.startsWith("error:")
    ? `<p class="flash flash-err">${esc(message.slice(6))}</p>`
    : message.startsWith("ok:")
    ? `<p class="flash flash-ok">${esc(message.slice(3))}</p>`
    : "";
  const current = changedAt
    ? `Changed on ${esc(changedAt.slice(0, 10))} — reset below to try again.`
    : `Still the initial password — change it below to exercise the flow.`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Change password (demo) — /.well-known/ Showcase</title>
<link rel="stylesheet" href="/public/styles.css"></head>
<body>
<header class="site-header">
  <a class="brand" href="/"><span class="brand-mark">/.well-known/</span><span class="brand-name">Showcase</span></a>
  <nav><a href="/">Archive</a><a href="/specs">Explorers</a></nav>
</header>
<main class="hero">
  <h1>Change password (demo)</h1>
  <p class="lede">This page is where <code>/.well-known/change-password</code> lands — the URL the W3C tells browsers and password managers to navigate to when a user needs to reset a password. A real site puts its password form here. This one works: one fictional account (<code>${
    esc(ACCOUNT_NAME)
  }</code>), password stored as a salted SHA-256 hash in ${esc(backend)}.</p>
  ${msg}
  <p><strong>Account status:</strong> ${current}</p>
  <form method="post" action="/account/password" class="password-form">
    <label>Current password <input type="password" name="current" autocomplete="current-password"></label>
    <label>New password (min 8 chars) <input type="password" name="next" autocomplete="new-password"></label>
    <label>Repeat new password <input type="password" name="confirm" autocomplete="new-password"></label>
    <button type="submit" class="btn">Change password</button>
  </form>
  <p class="fineprint">The initial password is <code>demo-pass</code>. No real account exists; nothing here guards a real identity.</p>
  <form method="post" action="/account/password?reset=1"><button type="submit" class="btn btn-secondary">Reset demo to demo-pass</button></form>
  <p><a href="/specs/change-password">← The change-password explainer</a></p>
</main>
</body></html>`;
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

// ------------------------------------------------------------------- boot

const keys = await createDemoKeys();
console.log(`well-known-showcase ${projectVersion} starting on ${HOST}:${PORT}`);
Deno.serve({ port: PORT, hostname: HOST }, (req) => handler(req, keys));
