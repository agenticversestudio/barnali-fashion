import { AwsClient } from "aws4fetch";
import { fail } from "./http";

/**
 * Object storage behind a tiny driver interface.
 *  - "r2"  : Cloudflare R2 over the S3 API (presigned URLs; browser uploads straight to R2).
 *  - "fake": in-memory, for tests (STORAGE_DRIVER=fake). `fakeStorage.put()` stands in for the browser upload.
 * Env for r2: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.
 */
export interface Storage {
  presignPut(key: string, contentType: string, ttlSec: number): Promise<string>;
  presignGet(key: string, ttlSec: number): Promise<string>;
  head(key: string): Promise<{ bytes: number } | null>;
  remove(key: string): Promise<void>;
}

export const PUT_TTL = 5 * 60;
export const GET_TTL = 60 * 60;

// ---------- fake (tests) ----------
const mem = new Map<string, number>();
export const fakeStorage = {
  put: (key: string, bytes: number) => void mem.set(key, bytes),
  has: (key: string) => mem.has(key),
  clear: () => mem.clear(),
};
const fake: Storage = {
  presignPut: async (key, ct, ttl) => `fake://put/${key}?ct=${encodeURIComponent(ct)}&ttl=${ttl}`,
  presignGet: async (key, ttl) => `fake://get/${key}?ttl=${ttl}`,
  head: async (key) => (mem.has(key) ? { bytes: mem.get(key)! } : null),
  remove: async (key) => void mem.delete(key),
};

// ---------- R2 ----------
function r2(): Storage {
  const { R2_ACCOUNT_ID: acct, R2_ACCESS_KEY_ID: id, R2_SECRET_ACCESS_KEY: secret, R2_BUCKET: bucket } = process.env;
  if (!acct || !id || !secret || !bucket) return fail("INTERNAL", "Photo storage is not configured (R2_* env vars missing)");
  const aws = new AwsClient({ accessKeyId: id, secretAccessKey: secret, service: "s3", region: "auto" });
  const url = (key: string) => `https://${acct}.r2.cloudflarestorage.com/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
  const presign = async (method: string, key: string, ttl: number, headers?: Record<string, string>) =>
    (await aws.sign(`${url(key)}?X-Amz-Expires=${ttl}`, { method, headers, aws: { signQuery: true } })).url;
  return {
    presignPut: (key, ct, ttl) => presign("PUT", key, ttl, { "Content-Type": ct }),
    presignGet: (key, ttl) => presign("GET", key, ttl),
    async head(key) {
      const res = await aws.fetch(url(key), { method: "HEAD" });
      if (res.status === 404) return null;
      if (!res.ok) return fail("INTERNAL", `Storage HEAD failed (${res.status})`);
      return { bytes: Number(res.headers.get("content-length") ?? 0) };
    },
    async remove(key) {
      const res = await aws.fetch(url(key), { method: "DELETE" });
      if (!res.ok && res.status !== 404) fail("INTERNAL", `Storage DELETE failed (${res.status})`);
    },
  };
}

/** Chosen at call time so tests can switch drivers via env. */
export function storage(): Storage {
  return process.env.STORAGE_DRIVER === "fake" ? fake : r2();
}
