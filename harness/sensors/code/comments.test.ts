import { describe, expect, test } from "vitest";
import { checkComments, findComments } from "./comments.ts";

const REMOVE_MESSAGE =
  "Express this fact as a name, a type, a test or a document. See harness/rules/coding.md.";
const DIRECTIVE_MESSAGE =
  "Write the reason and the issue number (#123) on the same line as the directive, or fix the cause.";

describe("checkComments", () => {
  test("fails a line comment with the message that says where the fact goes", () => {
    expect(checkComments("a.ts", "const value = 1;\n// note\n")).toEqual([
      { line: 2, message: REMOVE_MESSAGE },
    ]);
  });

  test("fails a block comment and a trailing comment", () => {
    const problems = checkComments("a.ts", "/* block */\nconst value = 1; // trailing\n");
    expect(problems.map(({ line }) => line)).toEqual([1, 2]);
  });

  test("passes a string, a template and a regular expression that contain slashes", () => {
    const source = [
      'const url = "http://example.com";',
      "const path = `a//b`;",
      "const pattern = /\\/\\//;",
    ].join("\n");
    expect(checkComments("a.ts", source)).toEqual([]);
  });

  test("passes the shebang line", () => {
    expect(checkComments("a.mjs", "#!/usr/bin/env node\nexport const value = 1;\n")).toEqual([]);
  });

  test("passes a directive with a reason and an issue number", () => {
    const biomeIgnore =
      "// biome-ignore lint/style/noNonNullAssertion: the map is filled above #123\nconst a = 1;\n";
    const tsExpectError = "// @ts-expect-error the library types are wrong #45\nconst a = 1;\n";
    expect(checkComments("a.ts", biomeIgnore)).toEqual([]);
    expect(checkComments("a.ts", tsExpectError)).toEqual([]);
  });

  test("fails a directive without an issue number or without a reason", () => {
    const noIssue = checkComments(
      "a.ts",
      "// biome-ignore lint/style/noNonNullAssertion: reason\nconst a = 1;\n",
    );
    const noReason = checkComments("a.ts", "// @ts-ignore #123\nconst a = 1;\n");
    expect(noIssue).toEqual([{ line: 1, message: DIRECTIVE_MESSAGE }]);
    expect(noReason).toEqual([{ line: 1, message: DIRECTIVE_MESSAGE }]);
  });

  test("finds a comment at the end of a file", () => {
    expect(findComments("a.ts", "export const value = 1;\n// last")).toHaveLength(1);
  });
});
