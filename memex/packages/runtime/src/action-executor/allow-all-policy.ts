import type { Decision } from "@memex/contracts";
import type { ActionPolicy } from "./action-executor.ts";

export const createAllowAllPolicy = (): ActionPolicy => ({
  authorize: async (): Promise<Decision> => ({
    outcome: "allow",
    reason: "every Action is allowed",
  }),
});
