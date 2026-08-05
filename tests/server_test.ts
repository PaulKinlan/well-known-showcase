/**
 * Endpoint smoke tests. These run against a live server instance (spawned in
 * tests), asserting status codes, content types and the honesty invariants:
 * live endpoints must return real content, demo endpoints must be labelled.
 */

import { assert, assertEquals, assertMatch } from "@std/assert";
import { IANA } from "../lib/iana.ts";

const PORT = 8799;
const BASE = `http://127.0.0.1:${PORT}`;

async function startServer() {
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["run", "--allow-net", "--allow-env=PORT,HOST", "--allow-read=public", "server.ts"],
    env: { PORT: String(PORT), ...Deno.env.toObject() },
    cwd: new URL("../", import.meta.url).pathname,
    stdout: "null",
    stderr: "null",
  });
  const child = cmd.spawn();
  // Wait for the server to accept connections
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`${BASE}/`);
      if (res.ok) return child;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error("server did not start in time");
}

Deno.test("index renders and lists specs", async () => {
  const child = await startServer();
  try {
    const res = await fetch(`${BASE}/`);
    assertEquals(res.status, 200);
    const html = await res.text();
    assertMatch(res.headers.get("content-type") ?? "", /text\/html/);
    assert(html.includes("security.txt"), "index should mention security.txt");
    assert(html.includes("/.well-known/"), "index should mention the well-known prefix");
  } finally {
    child.kill();
    await child.status;
  }
});

Deno.test("live endpoints return spec-accurate responses", async () => {
  const child = await startServer();
  try {
    // security.txt — real file, RFC 9116 fields
    const sec = await fetch(`${BASE}/.well-known/security.txt`);
    assertEquals(sec.status, 200);
    assertMatch(sec.headers.get("content-type") ?? "", /text\/plain/);
    const secBody = await sec.text();
    assert(secBody.includes("Contact:"), "security.txt must have a Contact field");
    assert(secBody.includes("Expires:"), "security.txt must have an Expires field");

    // jwks.json — a real JWK
    const jwks = await (await fetch(`${BASE}/.well-known/jwks.json`)).json();
    assertEquals(jwks.keys.length, 1);
    assertEquals(jwks.keys[0].kty, "OKP");
    assertEquals(jwks.keys[0].crv, "Ed25519");

    // did.json — host-consistent did:web
    const did = await (await fetch(`${BASE}/.well-known/did.json`)).json();
    assert(did.id === `did:web:127.0.0.1:${PORT}`, `unexpected did ${did.id}`);

    // did-configuration.json — a real signed JWT
    const didConf = await (await fetch(`${BASE}/.well-known/did-configuration.json`)).json();
    assertEquals(didConf.linked_dids.length, 1);
    const jwt = didConf.linked_dids[0] as string;
    assertEquals(jwt.split(".").length, 3, "linked_dids[0] must be a signed JWT");

    // gpc.json
    const gpc = await (await fetch(`${BASE}/.well-known/gpc.json`)).json();
    assertEquals(gpc.gpc, true);

    // webfinger — real resolution + honest 404
    const wf =
      await (await fetch(`${BASE}/.well-known/webfinger?resource=acct:demo@127.0.0.1:${PORT}`))
        .json();
    assertEquals(wf.subject, `acct:demo@127.0.0.1:${PORT}`);
    const wf404 = await fetch(
      `${BASE}/.well-known/webfinger?resource=acct:nobody@127.0.0.1:${PORT}`,
    );
    assertEquals(wf404.status, 404);

    // nodeinfo — schema links + document
    const ni = await (await fetch(`${BASE}/.well-known/nodeinfo`)).json();
    assert(ni.links.length >= 1);
    const niDoc = await (await fetch(ni.links[0].href)).json();
    assertEquals(niDoc.version, "2.1");
    assertEquals(niDoc.software.name, "well-known-showcase");

    // dnt — correct media type
    const dnt = await fetch(`${BASE}/.well-known/dnt/`);
    assertEquals(dnt.status, 200);
    assertMatch(dnt.headers.get("content-type") ?? "", /tracking-status\+json/);

    // tdmrep.json
    const tdm = await (await fetch(`${BASE}/.well-known/tdmrep.json`)).json();
    assertEquals(tdm[0]["tdm-reservation"], 0);

    // webauthn
    const wa = await (await fetch(`${BASE}/.well-known/webauthn`)).json();
    assert(Array.isArray(wa.origins) && wa.origins.length >= 1);

    // sbom — discovery + document
    const sbom = await (await fetch(`${BASE}/.well-known/sbom`)).json();
    assertEquals(sbom.sbom.length, 1);
    const sbomDoc = await (await fetch(sbom.sbom[0])).json();
    assertEquals(sbomDoc.spdxVersion, "SPDX-2.3");

    // api-catalog — linkset with profile
    const cat = await fetch(`${BASE}/.well-known/api-catalog`);
    assertMatch(cat.headers.get("content-type") ?? "", /linkset\+json/);
    const catJson = await cat.json();
    assert(Array.isArray(catJson.linkset[0].item));
    assert(catJson.linkset[0].item.length > 5);

    // hosting-provider — plain text
    const hp = await fetch(`${BASE}/.well-known/hosting-provider`);
    assertEquals(hp.status, 200);
    assertMatch(hp.headers.get("content-type") ?? "", /text\/plain/);

    // host-meta + host-meta.json
    const hm = await fetch(`${BASE}/.well-known/host-meta.json`);
    assertEquals(hm.status, 200);
    const hmj = await hm.json();
    assert(hmj.links.some((l: { rel: string }) => l.rel === "lrdd"));

    // change-password redirect
    const cp = await fetch(`${BASE}/.well-known/change-password`, { redirect: "manual" });
    assertEquals(cp.status, 302);
    assertEquals(cp.headers.get("location"), "/account/password");

    // caldav / carddav redirects
    for (const p of ["caldav", "carddav"]) {
      const r = await fetch(`${BASE}/.well-known/${p}`, { redirect: "manual" });
      assertEquals(r.status, 302);
      assert((r.headers.get("location") ?? "").includes("/demo/dav/"));
    }

    // oidc-registration — POST flow
    const reg = await fetch(`${BASE}/.well-known/oidc-registration`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ redirect_uris: ["https://client.example/cb"], client_name: "test" }),
    });
    assertEquals(reg.status, 201);
    const regJson = await reg.json();
    assert(typeof regJson.client_id === "string" && regJson.client_id.length > 0);

    // dns-query — real DoH relay (build a valid example.com A query)
    const q = new Uint8Array([
      0x12,
      0x34,
      0x01,
      0x00,
      0x00,
      0x01,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x07,
      ...new TextEncoder().encode("example"),
      0x03,
      ...new TextEncoder().encode("com"),
      0x00,
      0x00,
      0x01,
      0x00,
      0x01,
    ]);
    const dnsParam = btoa(String.fromCharCode(...q)).replace(/\+/g, "-").replace(/\//g, "_")
      .replace(/=+$/, "");
    const dns = await fetch(`${BASE}/.well-known/dns-query?dns=${dnsParam}`);
    assertEquals(dns.status, 200);
    assertMatch(dns.headers.get("content-type") ?? "", /dns-message/);
  } finally {
    child.kill();
    await child.status;
  }
});

Deno.test("demo endpoints are labelled and 404 unknown paths honestly", async () => {
  const child = await startServer();
  try {
    // appspecific example file exists; unknown file 404s
    const app =
      await (await fetch(`${BASE}/.well-known/appspecific/com.example.wellknownshowcase.json`))
        .json();
    assert(app.app === "com.example.wellknownshowcase");
    const app404 = await fetch(`${BASE}/.well-known/appspecific/other.json`);
    assertEquals(app404.status, 404);

    // lnurlp demo user + honest callback error
    const ln = await (await fetch(`${BASE}/.well-known/lnurlp/demo`)).json();
    assertEquals(ln.tag, "payRequest");
    assert(ln.maxSendable > ln.minSendable);
    const cb = await (await fetch(ln.callback)).json();
    assertEquals(cb.status, "ERROR");

    // acme-challenge demo token
    const acme = await fetch(`${BASE}/.well-known/acme-challenge/demo-token`);
    assertEquals(acme.status, 200);
    assert((await acme.text()).length > 0);

    // matrix client
    const mx = await (await fetch(`${BASE}/.well-known/matrix/client`)).json();
    assert(typeof mx["m.homeserver"].base_url === "string");

    // unknown well-known suffix → 404
    const nope = await fetch(`${BASE}/.well-known/no-such-uri-xyz`);
    assertEquals(nope.status, 404);

    // registry pages exist for every IANA entry
    const res = await fetch(`${BASE}/registry/security.txt`);
    assertEquals(res.status, 200);
    assert((await res.text()).includes("RFC 9116"));

    // every IANA suffix has a registry page
    for (const e of IANA.slice(0, 8)) {
      const r = await fetch(`${BASE}/registry/${e.suffix}`);
      assertEquals(r.status, 200, `registry page for ${e.suffix} should exist`);
    }

    // every deep-dive spec has a page
    const { SPECS } = await import("../lib/registry.ts");
    for (const s of SPECS.slice(0, 10)) {
      const r = await fetch(`${BASE}/specs/${s.slug}`);
      assertEquals(r.status, 200, `spec page for ${s.slug} should exist`);
      const html = await r.text();
      assert(
        html.includes("The threat it addresses"),
        `spec page ${s.slug} should have threat section`,
      );
    }

    // every demo/live spec page's panel must render a REAL response — the
    // in-process dispatch must never produce Deno's 508 loop error (regression
    // for the edge self-fetch bug) or a failed-dispatch message.
    for (const s of SPECS) {
      if (s.demoKind === "reference") continue;
      const r = await fetch(`${BASE}/specs/${s.slug}`);
      const html = await r.text();
      assert(
        !html.includes("Loop Detected") && !html.includes("508") &&
          !html.includes("dispatch failed"),
        `spec page ${s.slug} panel must dispatch in-process (no 508/loop)`,
      );
    }

    // dns-query panel must render the DNS message as base64 (binary-safe)
    const dnsPage = await (await fetch(`${BASE}/specs/dns-query`)).text();
    assert(
      dnsPage.includes("binary DNS message"),
      "dns-query panel should base64-render the response",
    );
  } finally {
    child.kill();
    await child.status;
  }
});

Deno.test("upgraded reference specs serve format-valid demo endpoints", async () => {
  const child = await startServer();
  try {
    const cases: Array<{ path: string; type: RegExp; check: (body: string) => boolean }> = [
      {
        path: "/.well-known/uma2-configuration",
        type: /json/,
        check: (b) => b.includes("permission_endpoint") && b.includes("_demo_note"),
      },
      {
        path: "/.well-known/openid-federation",
        type: /json/,
        check: (b) => b.includes('"iss":') && b.includes("jwks") && b.includes("_demo_note"),
      },
      {
        path: "/.well-known/gnap-as-rs",
        type: /json/,
        check: (b) => b.includes("grant_request_endpoint") && b.includes("_demo_note"),
      },
      {
        path: "/.well-known/idp-proxy",
        type: /json/,
        check: (b) => b.includes('"services"') && b.includes("_demo_note"),
      },
      {
        path: "/.well-known/related-website-set.json",
        type: /json/,
        check: (b) => b.includes("associatedSites") && b.includes("_demo_note"),
      },
      {
        path: "/.well-known/privacy-sandbox-attestations.json",
        type: /json/,
        check: (b) => b.trim().startsWith("[") && b.includes("attestation"),
      },
      {
        path: "/.well-known/resourcesync",
        type: /xml/,
        check: (b) => b.includes("<urlset") && b.includes("openarchives.org/rs/terms"),
      },
      {
        path: "/.well-known/csvm",
        type: /json/,
        check: (b) => b.includes("csvw") && b.includes("tableSchema"),
      },
      {
        path: "/.well-known/void",
        type: /turtle/,
        check: (b) => b.includes("void:Dataset") && b.includes("@prefix"),
      },
      {
        path: "/.well-known/scitt-keys",
        type: /json/,
        check: (b) => b.includes('"keys"') && b.includes('"crv"'),
      },
      {
        path: "/.well-known/webweaver.json",
        type: /json/,
        check: (b) => b.includes("WebWeaver") && b.includes("_demo_note"),
      },
      {
        path: "/.well-known/dnt-policy.txt",
        type: /text\/plain/,
        check: (b) => b.includes("Demo DNT policy"),
      },
      {
        path: "/.well-known/manifest.webmanifest",
        type: /manifest\+json/,
        check: (b) =>
          b.includes('"version"') && b.includes("update_manifest_url") && b.includes("_demo_note"),
      },
      {
        path: "/.well-known/web-app-origin-association",
        type: /json/,
        check: (b) => b.includes('"scope"') && b.includes("_demo_note"),
      },
    ];
    for (const c of cases) {
      const res = await fetch(`${BASE}${c.path}`);
      assertEquals(res.status, 200, `${c.path} should return 200`);
      assertMatch(res.headers.get("content-type") ?? "", c.type, `${c.path} content type`);
      const body = await res.text();
      assert(
        c.check(body),
        `${c.path} body should be format-valid and honest: ${body.slice(0, 120)}`,
      );
    }
  } finally {
    child.kill();
    await child.status;
  }
});

Deno.test("change-password demo flow works end to end", async () => {
  const child = await startServer();
  try {
    // Hermetic start: the demo account may carry state from earlier runs
    // (local KV is a persistent file in tests).
    await fetch(`${BASE}/account/password?reset=1`, { method: "POST" });

    // /.well-known/change-password still redirects to the demo page
    const cp = await fetch(`${BASE}/.well-known/change-password`, { redirect: "manual" });
    assertEquals(cp.status, 302);
    assertEquals(cp.headers.get("location"), "/account/password");

    // The demo page is served with the initial-password hint
    const page = await fetch(`${BASE}/account/password`);
    assertEquals(page.status, 200);
    const html = await page.text();
    assert(html.includes("demo-pass"), "page should state the initial demo password");

    // Wrong current password is rejected honestly
    const bad = await fetch(`${BASE}/account/password`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "current=wrong&next=supersecret&confirm=supersecret",
    });
    assertEquals(bad.status, 200);
    assert(
      (await bad.text()).includes("doesn&#39;t match"),
      "wrong current password must be rejected",
    );

    // Correct flow: change, verify success, then verify the new password is accepted
    const good = await fetch(`${BASE}/account/password`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "current=demo-pass&next=supersecret&confirm=supersecret",
      redirect: "manual",
    });
    assertEquals(good.status, 303);
    assertEquals(good.headers.get("location"), "/account/password?changed=ok");
    const changedPage = await fetch(`${BASE}/account/password?changed=ok`);
    assert((await changedPage.text()).includes("Password changed"));

    // Old password now fails, new one works
    const old = await fetch(`${BASE}/account/password`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "current=demo-pass&next=whatever123&confirm=whatever123",
    });
    assert(
      (await old.text()).includes("doesn&#39;t match"),
      "old password must be rejected after change",
    );
    const again = await fetch(`${BASE}/account/password`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "current=supersecret&next=whatever123&confirm=whatever123",
      redirect: "manual",
    });
    assertEquals(again.status, 303);

    // Reset returns the demo to its initial state
    const reset = await fetch(`${BASE}/account/password?reset=1`, {
      method: "POST",
      redirect: "manual",
    });
    assertEquals(reset.status, 303);
    assert(reset.headers.get("location")?.includes("reset=ok"));
  } finally {
    child.kill();
    await child.status;
  }
});
