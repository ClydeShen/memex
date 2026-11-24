import { z } from "zod";
import { cognitiveStateSchema } from "./cognitive-state.ts";
import { stepBudgetSchema } from "./step-budget.ts";

export const stepContextSchema = z.strictObject({
  state: cognitiveStateSchema,
  budget: stepBudgetSchema,
});

export type StepServices = Readonly<Record<never, never>>;

export type StepContext = z.infer<typeof stepContextSchema> & { readonly services: StepServices };
