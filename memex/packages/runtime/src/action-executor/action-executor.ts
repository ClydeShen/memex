import {
  type ActionDefinition,
  type ActionRequest,
  type Decision,
  err,
  type Observation,
  ok,
  type Result,
  type StepResult,
} from "@memex/contracts";
import type { EventLog } from "../event-log/event-log.ts";

// Where a request came in. The executor derives the actor from it; the request carries no actor.
export type ActionOrigin = "strategy" | "user";

export type ActionResult = {
  readonly status: "executed";
  readonly observations: readonly Observation[];
};

export type ActionPolicy = {
  readonly authorize: (
    request: ActionRequest,
    actor: string,
    definition: ActionDefinition,
  ) => Promise<Decision>;
};

export type ActionEnvironment = {
  readonly step: (request: ActionRequest) => Promise<StepResult>;
};

export type SubmitError =
  | { readonly kind: "unknown-action"; readonly name: string; readonly message: string }
  | { readonly kind: "not-allowed"; readonly decision: Decision; readonly message: string }
  | { readonly kind: "log-failed"; readonly message: string };

export type ActionExecutor = {
  readonly submit: (
    request: ActionRequest,
    origin: ActionOrigin,
  ) => Promise<Result<ActionResult, SubmitError>>;
};

export type ActionExecutorDependencies = {
  readonly definitions: readonly ActionDefinition[];
  readonly eventLog: EventLog;
  readonly environment: ActionEnvironment;
  readonly policy: ActionPolicy;
  readonly clock: { readonly now: () => string };
  readonly instance: string;
};

const SOURCE = "/memex/runtime/action-executor";

const ACTOR_OF_ORIGIN: Readonly<Record<ActionOrigin, string>> = {
  strategy: "agent",
  user: "user",
};

export const createActionExecutor = (dependencies: ActionExecutorDependencies): ActionExecutor => {
  const { definitions, eventLog, environment, policy, clock, instance } = dependencies;

  const submit = async (
    request: ActionRequest,
    origin: ActionOrigin,
  ): Promise<Result<ActionResult, SubmitError>> => {
    const definition = definitions.find((candidate) => candidate.name === request.name);
    if (definition === undefined) {
      return err({
        kind: "unknown-action",
        name: request.name,
        message: `No Action is defined with the name "${request.name}".`,
      });
    }
    const actor = ACTOR_OF_ORIGIN[origin];
    const decision = await policy.authorize(request, actor, definition);
    if (decision.outcome !== "allow") {
      return err({
        kind: "not-allowed",
        decision,
        message: `The Policy did not allow "${request.name}": ${decision.reason}`,
      });
    }
    const appended = await eventLog.append({
      specversion: "1.0",
      source: SOURCE,
      type: "memex.action.executed",
      time: clock.now(),
      datacontenttype: "application/json",
      data: { name: request.name, params: request.params },
      memexactor: actor,
      memexinstance: instance,
    });
    if (!appended.ok) return err({ kind: "log-failed", message: appended.error.message });
    const step = await environment.step(request);
    return ok({ status: "executed", observations: step.observations });
  };

  return { submit };
};
