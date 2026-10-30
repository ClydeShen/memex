import { z } from "zod";
import { goalSchema } from "../goal/goal.ts";
import { observationSchema } from "../observation/observation.ts";

// The Cognitive State that the Strategy sees in one step.
export const cognitiveStateSchema = z.strictObject({
  goal: goalSchema,
  recentObservations: z.array(observationSchema).describe("The latest Observations, newest last."),
  step: z.int().nonnegative().describe("How many steps the loop has already taken."),
});

export const stepBudgetSchema = z.strictObject({
  remainingSteps: z.int().nonnegative(),
});

// The data part of the step context. The services are functions, so they have a type but no schema.
export const stepContextSchema = z.strictObject({
  state: cognitiveStateSchema,
  budget: stepBudgetSchema,
});

// The ports that the Strategy is granted. The scripted Strategy needs none.
export type StepServices = Readonly<Record<never, never>>;

export type CognitiveState = z.infer<typeof cognitiveStateSchema>;
export type StepBudget = z.infer<typeof stepBudgetSchema>;
export type StepContext = z.infer<typeof stepContextSchema> & { readonly services: StepServices };
