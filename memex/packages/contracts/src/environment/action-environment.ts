import type { ActionRequest } from "../action/action-request.ts";
import type { StepResult } from "./step-result.ts";

export type ActionEnvironment = {
  readonly step: (request: ActionRequest) => Promise<StepResult>;
};
