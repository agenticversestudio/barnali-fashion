// PBKDF2-SHA256 via WebCrypto. No imports from "@/..." so scripts can load it directly.
const enc = new TextEncoder();

function b64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function unb64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

/** Iterations are stored inside the hash, so raising the default later keeps old hashes valid. */
export async function hashPassword(password: string): Promise<string> {
  const iterations = Number(process.env.PBKDF2_ITERS) || 210_000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, iterations);
  return `pbkdf2$${iterations}$${b64(salt)}$${b64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iters, saltB64, hashB64] = stored.split("$");
  if (scheme !== "pbkdf2" || !iters || !saltB64 || !hashB64) return false;
  const expected = unb64(hashB64);
  const actual = await derive(password, unb64(saltB64), Number(iters));
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
