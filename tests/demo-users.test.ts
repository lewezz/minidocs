import { describe, expect, it } from "vitest";

import { findDemoUser } from "@/lib/demo-users";

describe("demo identity allowlist", () => {
  it("resolves the two supported handles", () => {
    expect(findDemoUser("alice")?.name).toBe("Alice");
    expect(findDemoUser("bob")?.name).toBe("Bob");
  });

  it.each([undefined, null, "", "admin", "Alice", "alice OR 1=1", { handle: "alice" }, 1])(
    "rejects arbitrary identities: %j", (input) => {
      expect(findDemoUser(input)).toBeUndefined();
    },
  );
});
