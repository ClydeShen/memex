import type { ActionPolicy, Decision } from "@memex/contracts";

export const createAllowAllPolicy = (): ActionPolicy => ({
  authorize: async (): Promise<Decision> => ({
    outcome: "allow",
    reason: "every Action is allowed",
  }),
});
