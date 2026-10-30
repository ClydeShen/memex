import type { Decision } from "@memex/contracts";
import type { ActionPolicy } from "./action-executor.ts";

// The Policy of the validation stage: every Action is allowed, and the reason says so.
export const createAllowAllPolicy = (): ActionPolicy => ({
  authorize: async (): Promise<Decision> => ({
    outcome: "allow",
    reason: "every Action is allowed",
  }),
});
