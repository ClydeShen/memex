import { z } from "zod";

export const stepBudgetSchema = z.strictObject({
  remainingSteps: z.int().nonnegative(),
});

export type StepBudget = z.infer<typeof stepBudgetSchema>;
