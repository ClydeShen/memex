import { z } from "zod";

export const actionNameSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/)
  .describe('A lowercase name, with dots between parts, for example "move" or "claim.form".');

// The Action Executor records who submitted a request from where it came in, so a request
// has no actor field and is rejected if it carries one.
export const actionRequestSchema = z.strictObject({
  name: actionNameSchema,
  params: z
    .record(z.string(), z.json())
    .default({})
    .describe("Checked against the params schema of the Action definition."),
});

export type ActionRequest = z.infer<typeof actionRequestSchema>;
