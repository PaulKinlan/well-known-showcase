/**
 * Server-rendered HTML for the archive: page shell, index, deep-dive explainer
 * pages and auto-generated reference pages. No client-side framework — the
 * live-demo panels are rendered server-side by self-fetching the actual
 * /.well-known endpoints, so what you see is the real response.
 */

import { CATEGORIES, SPECS } from "./registry.ts";
import { DEFACTO, IANA } from "./iana.ts";
import type { Spec } from "./types.ts";

const esc = (value: string): string => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function shell(title: string, body: string, activeSlug?: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — /.well-known/ Showcase</title>
<meta name="description" content="An archive of every known RFC 8615 /.well-known/ URI — what each one is, the threat it addresses, how it works, and a live endpoint you can query.">
<link rel="stylesheet" href="/public/styles.css">
<link rel="icon" href="data:image/svg+xml,${
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="18" fill="#4338ca"/><text x="50" y="68" font-size="52" text-anchor="middle" fill="#fff" font-family="monospace">.w</text></svg>',
    )
  }">
</head>
<body>
<header class="site-header">
  <a class="brand" href="/"><span class="brand-mark">/.well-known/</span><span class="brand-name">Showcase</span></a>
  <nav>
    <a href="/" class="${activeSlug === undefined ? "active" : ""}">Archive</a>
    <a href="/specs">Explorers</a>
    <a href="https://github.com/PaulKinlan/well-known-showcase">GitHub</a>
  </nav>
</header>
<main>${body}</main>
<footer>
  <p>An archive of <strong>${SPECS.length} deep-dive specs</strong> and <strong>${IANA.length} IANA-registered URIs</strong> (plus the well-known de-facto URIs the registry misses). Built by an agent, served from Deno Deploy, source on <a href="https://github.com/PaulKinlan/well-known-showcase">GitHub</a>.</p>
  <p class="fineprint">Every endpoint on this site is either spec-accurate (<span class="badge badge-live">live</span>), format-valid but illustrative (<span class="badge badge-demo">demo</span>), or documented only (<span class="badge badge-ref">reference</span>). Nothing here is faked as something it isn't.</p>
</footer>
</body>
</html>`;
}

const LABELS: Record<string, { label: string; cls: string; text: string }> = {
  live: {
    label: "Live · spec-accurate",
    cls: "badge-live",
    text: "This endpoint is served with a real, spec-accurate response.",
  },
  demo: {
    label: "Demo · format-valid",
    cls: "badge-demo",
    text: "Format-valid response with illustrative values — clearly labelled as a demonstration.",
  },
  reference: {
    label: "Reference · not served",
    cls: "badge-ref",
    text: "Documented here; no endpoint is served for it.",
  },
};

function badge(kind: string): string {
  const l = LABELS[kind] ?? LABELS.reference;
  return `<span class="badge ${l.cls}" title="${esc(l.text)}">${esc(l.label)}</span>`;
}

function ianaBadge(spec: Spec): string {
  if (spec.registrar === "iana" && spec.ianaStatus) {
    return `<span class="badge badge-iana ${
      spec.ianaStatus === "deprecated" || spec.ianaStatus === "obsoleted" ? "badge-iana-dead" : ""
    }">IANA · ${esc(spec.ianaStatus)}</span>`;
  }
  if (spec.registrar === "defacto") return `<span class="badge badge-iana">de-facto</span>`;
  if (spec.registrar === "w3c") return `<span class="badge badge-iana">W3C</span>`;
  return `<span class="badge badge-iana">community</span>`;
}

function uriList(spec: Spec): string {
  const uris = Array.isArray(spec.uri) ? spec.uri : [spec.uri];
  return uris.map((u) => `<code class="uri">${esc(u)}</code>`).join(" ");
}

// ------------------------------------------------------------------- index

export function renderIndex(origin: string): string {
  const byCategory = new Map<string, Spec[]>();
  for (const s of SPECS) {
    if (!byCategory.has(s.category)) byCategory.set(s.category, []);
    byCategory.get(s.category)!.push(s);
  }
  const live = SPECS.filter((s) => s.demoKind === "live").length;
  const demo = SPECS.filter((s) => s.demoKind === "demo").length;

  const categorySections = [...byCategory.entries()]
    .filter(([cat]) => cat !== "reference")
    .map(([cat, specs]) => {
      const meta = CATEGORIES[cat];
      return `<section class="category">
        <h2 id="${cat}">${esc(meta.label)}</h2>
        <p class="category-blurb">${esc(meta.blurb)}</p>
        <div class="card-grid">
          ${
        specs.map((s) =>
          `<a class="card" href="/specs/${s.slug}">
            <div class="card-top">${badge(s.demoKind)}</div>
            <h3>${esc(s.name)}</h3>
            <p class="card-uri">${uriList(s)}</p>
            <p>${esc(s.summary)}</p>
          </a>`
        ).join("\n")
      }
        </div>
      </section>`;
    }).join("\n");

  return shell(
    "Archive",
    `
    <section class="hero">
      <h1>Every <code>/.well-known/</code> URI, explained and served live</h1>
      <p class="lede">RFC 8615 gives the web a convention: anything a site wants the world to find — security contacts, identity endpoints, policy files, agent cards — lives at a predictable URL under <code>/.well-known/</code>. This site archives the specs, explains the threat each one addresses, and <em>actually serves</em> most of them so you can poke the real thing.</p>
      <div class="hero-stats">
        <div><strong>${SPECS.length}</strong><span>deep-dive specs</span></div>
        <div><strong>${live}</strong><span>served live &amp; spec-accurate</span></div>
        <div><strong>${demo}</strong><span>served as format demos</span></div>
        <div><strong>${IANA.length}</strong><span>IANA-registered URIs catalogued</span></div>
      </div>
      <p class="tryit">Try it: <code>curl ${origin}/.well-known/security.txt</code> — it's a real file. So is <code>${origin}/.well-known/jwks.json</code> (a real Ed25519 key) and <code>${origin}/.well-known/webfinger?resource=acct:demo@${
      new URL(origin).host
    }</code>.</p>
    </section>
    <section>
      <h2>The honesty rule</h2>
      <p>Every endpoint carries one of three labels:</p>
      <ul class="honesty">
        <li>${
      badge("live")
    } — the response is <strong>spec-accurate for real</strong>: a genuine security.txt, a genuine signed JWT, a genuine NodeInfo document.</li>
        <li>${
      badge("demo")
    } — the response is <strong>format-valid but illustrative</strong>: right shape, right content types, placeholder values that are labelled as such (no fake accounts, keys or services are implied).</li>
        <li>${
      badge("reference")
    } — the spec is <strong>documented but not served</strong> (it would need real infrastructure we don't run).</li>
      </ul>
      <p class="fineprint">A demo is never presented as a live service. Where an endpoint needs real infrastructure (a CA, a mail server, a Lightning node, a homeserver), the response says so in-band.</p>
    </section>
    ${categorySections}
    <section class="category">
      <h2 id="registry">The full IANA registry</h2>
      <p class="category-blurb">All ${IANA.length} entries in the IANA Well-Known URIs registry (fetched 2026-08-05). Each has its own reference page.</p>
      <details class="table-wrap">
        <summary>Browse all ${IANA.length} registered URIs</summary>
        <table>
          <thead><tr><th>URI</th><th>Standard</th><th>Status</th><th>Controller</th><th>Registered</th></tr></thead>
          <tbody>
            ${
      IANA.map((e) =>
        `<tr>
              <td><a href="/registry/${esc(e.suffix)}"><code>${esc(e.uri)}</code></a></td>
              <td>${esc(e.standard)}</td>
              <td>${esc(e.status)}</td>
              <td>${esc(e.org)}</td>
              <td>${esc(e.registered)}</td>
            </tr>`
      ).join("\n")
    }
          </tbody>
        </table>
      </details>
    </section>
    <section class="category">
      <h2 id="defacto">The de-facto well-known URIs</h2>
      <p class="category-blurb">Widely deployed, standardized elsewhere — but not in the IANA registry. Apple, Microsoft, OpenID, Solid, Nostr, LNURL and AARC all live here.</p>
      <div class="card-grid">
        ${
      DEFACTO.map((e) => {
        const deep = e.deepDive ? SPECS.find((s) => s.slug === e.deepDive) : undefined;
        const href = deep ? `/specs/${deep.slug}` : `/registry/${esc(e.suffix)}`;
        return `<a class="card" href="${href}">
            <div class="card-top">${deep ? badge(deep.demoKind) : badge("reference")}</div>
            <h3>${esc(e.suffix)}</h3>
            <p class="card-uri"><code>${esc(e.uri)}</code></p>
            <p>${esc(e.summary)}</p>
          </a>`;
      }).join("\n")
    }
      </div>
    </section>
  `,
  );
}

// ---------------------------------------------------------------- spec page

async function demoPanel(spec: Spec, origin: string): Promise<string> {
  if (spec.demoKind === "reference") {
    return `<div class="panel panel-ref"><p>Reference only — no endpoint is served for this spec on this host.</p></div>`;
  }
  const defaultPath = typeof spec.uri === "string" ? spec.uri : (spec.uri[0] ?? "/");
  const path = (spec.demoPath ?? defaultPath)
    .replace("__HOST__", new URL(origin).host);
  const fetchOpts = spec.demoFetch ?? {};
  const label = spec.demoLabel ?? LABELS[spec.demoKind].text;

  let fetched: { status: number; contentType: string; body: string };
  try {
    const res = await fetch(new URL(path, origin), {
      method: fetchOpts.method ?? "GET",
      headers: {
        accept: "application/json, text/plain, application/xml, text/xml, text/turtle, */*",
        ...(fetchOpts.headers ?? {}),
      },
      body: fetchOpts.body,
    });
    const textBody = await res.text();
    fetched = {
      status: res.status,
      contentType: res.headers.get("content-type") ?? "",
      body: textBody.length > 6000 ? textBody.slice(0, 6000) + "\n… (truncated)" : textBody,
    };
  } catch (err) {
    fetched = { status: 0, contentType: "", body: `(self-fetch failed: ${esc(String(err))})` };
  }

  const isJson = fetched.contentType.includes("json");
  const pretty = isJson ? prettyJson(fetched.body) : fetched.body;

  return `<div class="panel">
    <div class="panel-head">
      <div>
        <h3>Live demo</h3>
        <p class="fineprint">${esc(label)}</p>
      </div>
      <div class="panel-actions">
        <span class="http-status">HTTP ${fetched.status || "—"}</span>
        <a class="btn" href="${esc(path)}" target="_blank" rel="noopener">Open ${
    esc(fetchOpts.method ?? "GET")
  } ${esc(path)} ↗</a>
      </div>
    </div>
    <div class="panel-meta">Content-Type: <code>${esc(fetched.contentType)}</code></div>
    <pre class="response ${isJson ? "response-json" : ""}"><code>${esc(pretty)}</code></pre>
  </div>`;
}

function prettyJson(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

export async function renderSpec(spec: Spec, origin: string): Promise<string> {
  const demo = await demoPanel(spec, origin);
  const uris = Array.isArray(spec.uri) ? spec.uri : [spec.uri];
  return shell(
    `${spec.name} — ${spec.standard}`,
    `
    <article class="spec">
      <nav class="crumbs"><a href="/">Archive</a> › ${esc(CATEGORIES[spec.category].label)} › ${
      esc(spec.name)
    }</nav>
      <header class="spec-head">
        <h1>${esc(spec.name)}</h1>
        <div class="spec-badges">${badge(spec.demoKind)} ${ianaBadge(spec)}</div>
        <p class="spec-uris">${uris.map((u) => `<code class="uri">${esc(u)}</code>`).join(" ")}</p>
        <p class="spec-standard">Standard: <a href="${esc(spec.standardUrl)}" rel="noopener">${
      esc(spec.standard)
    }</a></p>
        <p class="spec-summary">${esc(spec.summary)}</p>
      </header>
      <section>
        <h2>What it is</h2>
        <p>${esc(spec.what)}</p>
      </section>
      <section>
        <h2>The threat it addresses</h2>
        <p>${esc(spec.threat)}</p>
      </section>
      <section>
        <h2>How it works</h2>
        <ul>${spec.how.map((h) => `<li>${esc(h)}</li>`).join("\n")}</ul>
      </section>
      ${
      spec.notes && spec.notes.length
        ? `<section>
        <h2>Honesty notes</h2>
        <ul>${spec.notes.map((n) => `<li>${esc(n)}</li>`).join("\n")}</ul>
      </section>`
        : ""
    }
      <section>
        <h2>Try it</h2>
        ${demo}
      </section>
    </article>
  `,
    spec.slug,
  );
}

export function renderSpecsIndex(): string {
  return shell(
    "Explorers",
    `
    <h1>All deep-dive explainers</h1>
    <p class="lede">${SPECS.length} specs, grouped by the problem space they live in. Every page explains what the spec is, the threat it addresses, how it works — and where possible serves the real endpoint.</p>
    <div class="index-list">
      ${
      SPECS.map((s) =>
        `<a class="index-row" href="/specs/${s.slug}">
        <span class="index-name">${esc(s.name)}</span>
        <span class="index-uri">${uriList(s)}</span>
        <span class="index-badge">${badge(s.demoKind)}</span>
      </a>`
      ).join("\n")
    }
    </div>
  `,
  );
}

// ------------------------------------------------------------ reference page

export function renderRegistryEntry(suffix: string, _origin: string): string {
  const entry = IANA.find((e) => e.suffix === suffix) ??
    DEFACTO.find((e) => e.suffix === suffix);
  if (!entry) return renderNotFound(suffix);
  const deep = entry.deepDive ? SPECS.find((s) => s.slug === entry.deepDive) : undefined;
  return shell(
    `${entry.suffix} — registry entry`,
    `
    <article class="spec">
      <nav class="crumbs"><a href="/">Archive</a> › <a href="/#registry">IANA registry</a> › ${
      esc(entry.suffix)
    }</nav>
      <header class="spec-head">
        <h1><code>${esc(entry.uri)}</code></h1>
        <div class="spec-badges"><span class="badge badge-iana">IANA · ${
      esc(entry.status)
    }</span></div>
        <p class="spec-standard">Specification: <a href="${esc(entry.url)}" rel="noopener">${
      esc(entry.standard)
    }</a></p>
        <p class="spec-standard">Change controller: ${esc(entry.org)} · Registered: ${
      esc(entry.registered)
    }</p>
        <p class="spec-summary">${esc(entry.summary)}</p>
        ${
      deep
        ? `<p class="spec-standard"><a href="/specs/${deep.slug}">→ Full explainer + live demo for this URI</a></p>`
        : ""
    }
      </header>
      ${
      deep
        ? demoPanelSyncNote()
        : `<section><p>This URI is registered in the IANA Well-Known URIs registry (RFC 8615) but is not served on this host.</p></section>`
    }
    </article>
  `,
  );
}

function demoPanelSyncNote(): string {
  return `<p class="fineprint">See the linked explainer page for the live demo panel.</p>`;
}

// ------------------------------------------------------------------- 404

export function renderNotFound(what: string): string {
  return shell(
    "Not found",
    `
    <section class="hero">
      <h1>404 — <code>${esc(what)}</code> isn't here</h1>
      <p class="lede">Not every path is a well-known path. <a href="/">Back to the archive.</a></p>
    </section>
  `,
  );
}
