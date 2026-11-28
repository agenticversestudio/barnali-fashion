import { describe, expect, it } from "vitest";
import { plural } from "@/lib/utils";

describe("plural", () => {
  it("renders one string with correct singular/plural", () => {
    expect(plural(0, "client")).toBe("0 clients");
    expect(plural(1, "client")).toBe("1 client");
    expect(plural(2, "job")).toBe("2 jobs");
    expect(plural(1, "pending action")).toBe("1 pending action");
  });
});
