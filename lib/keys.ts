/**
 * A single Ed25519 keypair generated at boot.
 *
 * It powers the real, spec-accurate endpoints that need a key:
 *  - /.well-known/jwks.json            (RFC 7517 JWK Set)
 *  - /.well-known/did.json             (did:web verification method)
 *  - /.well-known/did-configuration.json (DIF domain-linkage JWT, signed)
 *
 * The private key never leaves the process — only the public JWK is served.
 */

export interface DemoKeys {
  publicJwk: JsonWebKey;
  /** RFC 7638 JWK thumbprint (base64url) */
  thumbprint: string;
  /** Sign a UTF-8 string (JWT signing input), returning base64url signature */
  sign: (input: string) => Promise<string>;
  kid: string;
}

/** did:web identifier for a host — computed per request, since hosts vary. */
export function didForHost(host: string): string {
  return `did:web:${host}`;
}

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlJson(value: unknown): string {
  return b64url(new TextEncoder().encode(JSON.stringify(value)));
}

export async function createDemoKeys(): Promise<DemoKeys> {
  const kid = "well-known-showcase-demo-1";
  const keyPair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ]) as CryptoKeyPair;
  const exported = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const publicJwk = {
    kty: exported.kty,
    crv: exported.crv,
    x: exported.x,
    use: "sig",
    alg: "EdDSA",
    kid,
  } as JsonWebKey;

  // RFC 7638 thumbprint over the required members only
  const thumbInput = { crv: publicJwk.crv, kty: publicJwk.kty, x: publicJwk.x };
  const thumbBytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(thumbInput)),
  );
  const thumbprint = b64url(new Uint8Array(thumbBytes));

  return {
    publicJwk,
    thumbprint,
    kid,
    async sign(input: string): Promise<string> {
      const sig = await crypto.subtle.sign(
        { name: "Ed25519" },
        keyPair.privateKey,
        new TextEncoder().encode(input),
      );
      return b64url(new Uint8Array(sig));
    },
  };
}

export function signJwt(
  keys: DemoKeys,
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<string> {
  const signingInput = `${b64urlJson(header)}.${b64urlJson(payload)}`;
  return keys.sign(signingInput).then((sig) => `${signingInput}.${sig}`);
}
