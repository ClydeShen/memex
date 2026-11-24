import { describe, expect, test } from "vitest";
import { checkMainExport, kebabCase, runtimeExports } from "./exports.ts";

describe("runtimeExports", () => {
  test("counts values, functions and re-exports, not types", () => {
    const source = [
      "export const first = 1;",
      "export function second() {}",
      "export type Third = string;",
      "export interface Fourth {}",
      'export { fifth, type Sixth } from "./other.ts";',
    ].join("\n");
    expect(runtimeExports("a.ts", source)).toEqual(["first", "second", "fifth"]);
  });
});

describe("kebabCase", () => {
  test("splits words at capitals", () => {
    expect(kebabCase("oneRoomWorld")).toBe("one-room-world");
    expect(kebabCase("APIVersion")).toBe("api-version");
  });
});

describe("checkMainExport", () => {
  test("passes a file named after its one main export", () => {
    expect(checkMainExport("memex/a/event-log.ts", "export const eventLog = 1;")).toEqual([]);
  });

  test("ignores a leading create and a trailing Schema", () => {
    expect(checkMainExport("a/event-log.ts", "export const createEventLog = 1;")).toEqual([]);
    expect(checkMainExport("a/event.ts", "export const eventSchema = 1;")).toEqual([]);
  });

  test("passes type exports next to the main export", () => {
    const source = "export type Event = string;\nexport const eventSchema = 1;";
    expect(checkMainExport("a/event.ts", source)).toEqual([]);
  });

  test("fails a file with two runtime exports and says to split it", () => {
    const [problem] = checkMainExport("a/pair.ts", "export const ok = 1;\nexport const err = 2;");
    expect(problem?.message).toContain("Split the file");
  });

  test("fails a file whose name is not the main export and says to rename it", () => {
    const [problem] = checkMainExport("a/other.ts", "export const eventLog = 1;");
    expect(problem?.message).toContain("event-log.ts");
  });

  test("skips the entry file and tests", () => {
    const source = "export const one = 1;\nexport const two = 2;";
    expect(checkMainExport("a/index.ts", source)).toEqual([]);
    expect(checkMainExport("a/x.test.ts", source)).toEqual([]);
  });
});
