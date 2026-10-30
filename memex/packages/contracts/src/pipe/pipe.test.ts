import { expect, test } from "vitest";
import { pipe } from "./pipe.ts";

const double = (value: number): number => value * 2;
const increment = (value: number): number => value + 1;
const label = (value: number): string => `#${value}`;
const START = 3;

test("runs the steps from left to right", () => {
  expect(pipe(START, double, increment, label)).toBe("#7");
  expect(pipe(START, increment, double, label)).toBe("#8");
});

test("returns the value unchanged without steps", () => {
  expect(pipe("room-a")).toBe("room-a");
});
