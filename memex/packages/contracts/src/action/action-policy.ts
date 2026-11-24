import type { Decision } from "../policy/decision.ts";
import type { ActionDefinition } from "./action-definition.ts";
import type { ActionRequest } from "./action-request.ts";

export type ActionPolicy = {
  readonly authorize: (
    request: ActionRequest,
    actor: string,
    definition: ActionDefinition,
  ) => Promise<Decision>;
};
