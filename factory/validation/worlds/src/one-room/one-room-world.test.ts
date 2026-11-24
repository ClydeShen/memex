import { expect, test } from "vitest";
import { createOneRoomWorld } from "./one-room-world.ts";

const OPEN_DOOR = { name: "open-door", params: {} };
const SEED = 7;

test("the same seed gives the same Goal and Observations", async () => {
  const first = await createOneRoomWorld().reset(SEED);
  const second = await createOneRoomWorld().reset(SEED);
  expect(second).toEqual(first);
});

test("another seed gives another Goal", async () => {
  const first = await createOneRoomWorld().reset(SEED);
  const other = await createOneRoomWorld().reset(SEED + 1);
  expect(other.goal.id).not.toBe(first.goal.id);
});

test("describes one Action that can be undone", async () => {
  const info = await createOneRoomWorld().describe();
  expect(info.actions).toEqual([{ name: "open-door", paramsSchema: {}, risk: "reversible" }]);
});

test("the goal is not reached before the first step", async () => {
  const world = createOneRoomWorld();
  const { observations } = await world.reset(SEED);
  expect(observations[0]?.payload).toMatchObject({ door: "closed" });
});

test("one step with the Action reaches the goal", async () => {
  const world = createOneRoomWorld();
  await world.reset(SEED);
  const result = await world.step(OPEN_DOOR);
  expect(result.valid).toBe(true);
  expect(result.goalReached).toBe(true);
  expect(result.observations[0]?.payload).toMatchObject({ door: "open" });
});

test("an Action that does not exist is not valid and leaves the World as it was", async () => {
  const untouched = createOneRoomWorld();
  await untouched.reset(SEED);
  const expected = await untouched.step(OPEN_DOOR);

  const world = createOneRoomWorld();
  await world.reset(SEED);
  const invalid = await world.step({ name: "fly", params: {} });
  expect(invalid).toMatchObject({ valid: false, goalReached: false, observations: [] });
  expect(await world.step(OPEN_DOOR)).toEqual(expected);
});

test("reset starts the World again", async () => {
  const world = createOneRoomWorld();
  await world.reset(SEED);
  await world.step(OPEN_DOOR);
  const { observations } = await world.reset(SEED);
  expect(observations[0]?.payload).toMatchObject({ door: "closed" });
});
