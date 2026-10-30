import { z } from "zod";

export const decisionSchema = z.strictObject({
  outcome: z
    .enum(["allow", "deny", "ask"])
    .describe('"ask" holds the Action until the user approves or rejects it.'),
  reason: z.string().min(1),
});

export type Decision = z.infer<typeof decisionSchema>;
