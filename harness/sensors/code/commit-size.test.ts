import { describe, expect, test } from "vitest";
import { changedLines, checkCommitSize } from "./commit-size.ts";

describe("commit size", () => {
  test("adds the added and deleted lines of each file", () => {
    expect(changedLines("10\t5\ta.ts\n3\t0\tb.ts\n")).toBe(18);
  });

  test("does not count the lock file and generated files", () => {
    const numstat =
      "900\t900\tpnpm-lock.yaml\n50\t0\tfactory/as-built/generated/exports.md\n2\t1\ta.ts\n";
    expect(changedLines(numstat)).toBe(3);
  });

  test("passes 400 lines and fails 401 lines with a message that says to split the change", () => {
    expect(checkCommitSize("400\t0\ta.ts\n")).toEqual([]);
    const [message] = checkCommitSize("200\t201\ta.ts\n");
    expect(message).toContain("401 lines");
    expect(message).toContain("Split the change into smaller commits");
  });

  test("skips binary files", () => {
    expect(changedLines("-\t-\timage.png\n")).toBe(0);
  });
});
