import { expect, test } from "vitest";
import { err, ok, type Result } from "./result.ts";

const describeResult = (result: Result<string, { kind: "missing" }>): string =>
  result.ok ? `value ${result.value}` : `error ${result.error.kind}`;

test("ok carries a value and err carries an error", () => {
  expect(ok("room-a")).toEqual({ ok: true, value: "room-a" });
  expect(err({ kind: "missing" })).toEqual({ ok: false, error: { kind: "missing" } });
});

test("the ok field tells the caller which case it has", () => {
  expect(describeResult(ok("room-a"))).toBe("value room-a");
  expect(describeResult(err({ kind: "missing" }))).toBe("error missing");
});
