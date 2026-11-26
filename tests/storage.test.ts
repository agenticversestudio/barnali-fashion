import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { storage } from "@/server/storage";

const saved = { ...process.env };
beforeAll(() => {
  delete process.env.STORAGE_DRIVER;
  Object.assign(process.env, { R2_ACCOUNT_ID: "acct123", R2_ACCESS_KEY_ID: "AKIATEST", R2_SECRET_ACCESS_KEY: "secret", R2_BUCKET: "bf-photos" });
});
afterAll(() => {
  process.env = saved;
});

describe("R2 driver presigning (offline, no network)", () => {
  it("PUT url targets the bucket path, expires in 300 s and is signed", async () => {
    const u = new URL(await storage().presignPut("garments/LF-001/abc.webp", "image/webp", 300));
    expect(u.host).toBe("acct123.r2.cloudflarestorage.com");
    expect(u.pathname).toBe("/bf-photos/garments/LF-001/abc.webp");
    expect(u.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(u.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
    expect(u.searchParams.get("X-Amz-SignedHeaders")).toBe("host"); // content-type unsigned: any browser header works; size is enforced via HEAD at register
    expect(u.searchParams.get("X-Amz-Credential")).toContain("/auto/s3/aws4_request");
  });
  it("GET url is signed for 1 h", async () => {
    const u = new URL(await storage().presignGet("garments/LF-001/abc.webp", 3600));
    expect(u.searchParams.get("X-Amz-Expires")).toBe("3600");
    expect(u.searchParams.get("X-Amz-Signature")).toBeTruthy();
  });
  it("missing env → clear 500, not a crash", () => {
    delete process.env.R2_BUCKET;
    expect(() => storage()).toThrow(/not configured/);
  });
});
