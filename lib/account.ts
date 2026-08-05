/**
 * Demo account for the /.well-known/change-password flow.
 *
 * One fictional account whose password is stored as a salted SHA-256 hash in
 * the project's Deno KV database (attached 2026-08-05), falling back to an
 * in-memory map when KV is unreachable (e.g. local tests without KV
 * permissions). The demo exists so the change-password flow can be exercised
 * end to end. It is not a real account: no identity, no sessions, nothing
 * sensitive — the initial password is printed on the page so visitors can run
 * the flow.
 */

export const INITIAL_PASSWORD = "demo-pass";
export const ACCOUNT_NAME = "demo@well-known-showcase";

const ACCOUNT_KEY = ["demo", "account", "v1"] as const;

interface AccountRecord {
  salt: string;
  hash: string;
  changedAt: string | null; // null = still the initial password
}

let kv: Deno.Kv | null | undefined; // undefined = not probed yet; null = unavailable
const memory = new Map<string, AccountRecord>();

async function store(): Promise<Deno.Kv | null> {
  if (kv !== undefined) return kv;
  try {
    kv = await Deno.openKv();
  } catch {
    kv = null;
  }
  return kv;
}

export function kvBacked(): boolean {
  return kv !== null && kv !== undefined;
}

async function sha256(input: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function salt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hash(password: string, saltHex: string): Promise<string> {
  return sha256(`${saltHex}:${password}`);
}

async function record(): Promise<AccountRecord> {
  const s = await store();
  if (s) {
    const found = await s.get<AccountRecord>(ACCOUNT_KEY);
    if (found.value) return found.value;
  } else {
    const found = memory.get(ACCOUNT_KEY.join("/"));
    if (found) return found;
  }
  // First touch: create the account with the initial password.
  const saltHex = salt();
  const initial: AccountRecord = {
    salt: saltHex,
    hash: await hash(INITIAL_PASSWORD, saltHex),
    changedAt: null,
  };
  await put(initial);
  return initial;
}

async function put(value: AccountRecord): Promise<void> {
  const s = await store();
  if (s) {
    await s.set(ACCOUNT_KEY, value);
  } else {
    memory.set(ACCOUNT_KEY.join("/"), value);
  }
}

export interface ChangeResult {
  ok: boolean;
  error?: string;
}

export async function changePassword(
  current: string,
  next: string,
  confirm: string,
): Promise<ChangeResult> {
  const rec = await record();
  const currentHash = await hash(current, rec.salt);
  if (currentHash !== rec.hash) {
    return {
      ok: false,
      error: "The current password doesn't match. The demo account's password is " +
        INITIAL_PASSWORD + " until you change it.",
    };
  }
  if (next.length < 8) {
    return {
      ok: false,
      error:
        "New passwords must be at least 8 characters — that's the only rule this demo enforces.",
    };
  }
  if (next !== confirm) {
    return { ok: false, error: "The two copies of the new password don't match." };
  }
  const saltHex = salt();
  const updated: AccountRecord = {
    salt: saltHex,
    hash: await hash(next, saltHex),
    changedAt: new Date().toISOString(),
  };
  await put(updated);
  return { ok: true };
}

export async function resetPassword(): Promise<void> {
  await record();
  const saltHex = salt();
  const reset: AccountRecord = {
    salt: saltHex,
    hash: await hash(INITIAL_PASSWORD, saltHex),
    changedAt: null,
  };
  await put(reset);
}

export async function accountStatus(): Promise<{ changedAt: string | null; backend: string }> {
  const rec = await record();
  return {
    changedAt: rec.changedAt,
    backend: (await store()) ? "Deno KV" : "in-memory (KV unreachable)",
  };
}
