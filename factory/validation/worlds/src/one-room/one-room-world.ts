import type {
  ActionDefinition,
  ActionRequest,
  Goal,
  Observation,
  StepResult,
} from "@memex/contracts";

export type OneRoomWorld = {
  readonly reset: (seed: number) => Promise<{
    readonly goal: Goal;
    readonly observations: readonly Observation[];
  }>;
  readonly step: (request: ActionRequest) => Promise<StepResult>;
  readonly describe: () => Promise<{ readonly actions: readonly ActionDefinition[] }>;
};

const SOURCE = "environment.one-room";
const OPEN_DOOR = "open-door";
const START_TIME_MS = Date.parse("2026-01-01T00:00:00Z");
const MS_PER_TICK = 1000;

const OPEN_DOOR_DEFINITION: ActionDefinition = {
  name: OPEN_DOOR,
  paramsSchema: {},
  risk: "reversible",
};

type RoomState = {
  readonly seed: number;
  readonly tick: number;
  readonly doorOpen: boolean;
};

const simulatedTime = (tick: number): string =>
  new Date(START_TIME_MS + tick * MS_PER_TICK).toISOString();

const observe = (state: RoomState): Observation => ({
  id: `observation-${state.seed}-${state.tick}`,
  source: SOURCE,
  recordedAt: simulatedTime(state.tick),
  payload: { room: "room-a", door: state.doorOpen ? "open" : "closed" },
});

export const createOneRoomWorld = (): OneRoomWorld => {
  const world: { state: RoomState | undefined } = { state: undefined };

  const reset: OneRoomWorld["reset"] = async (seed: number) => {
    const first: RoomState = { seed, tick: 0, doorOpen: false };
    world.state = first;
    const goal: Goal = {
      id: `goal-${seed}`,
      description: "Open the door of the room.",
      params: { room: "room-a" },
    };
    return { goal, observations: [observe(first)] };
  };

  const step: OneRoomWorld["step"] = async (request: ActionRequest) => {
    const { state } = world;
    if (state === undefined) {
      throw new Error("reset must be called before step");
    }
    if (request.name !== OPEN_DOOR) {
      return { observations: [], valid: false, cost: 0, goalReached: state.doorOpen };
    }
    const next: RoomState = { ...state, tick: state.tick + 1, doorOpen: true };
    world.state = next;
    return { observations: [observe(next)], valid: true, cost: 1, goalReached: true };
  };

  const describe: OneRoomWorld["describe"] = async () => ({ actions: [OPEN_DOOR_DEFINITION] });

  return { reset, step, describe };
};
