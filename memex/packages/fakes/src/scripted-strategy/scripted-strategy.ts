import type { ActionRequest, StepContext, StepDecision } from "@memex/contracts";

export type ScriptedStrategy = {
  readonly step: (ctx: StepContext) => StepDecision;
};

export const createScriptedStrategy = (script: readonly ActionRequest[]): ScriptedStrategy => ({
  step: (ctx: StepContext): StepDecision => {
    const action = script[ctx.state.step];
    if (action === undefined) {
      return { actions: [], done: true };
    }
    return { actions: [action], done: ctx.state.step + 1 >= script.length };
  },
});
