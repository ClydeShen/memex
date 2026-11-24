import { z } from "zod";
import { actionNameSchema } from "./action-name.ts";

export const actionRequestSchema = z.strictObject({
  name: actionNameSchema,
  params: z
    .record(z.string(), z.json())
    .default({})
    .describe("Checked against the params schema of the Action definition."),
});

export type ActionRequest = z.infer<typeof actionRequestSchema>;
