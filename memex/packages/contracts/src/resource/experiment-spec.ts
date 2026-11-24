import { z } from "zod";
import { resourceNameSchema } from "./resource-name.ts";

export const experimentSpecSchema = z.strictObject({
  environment: resourceNameSchema.describe("The name of the Environment resource."),
  strategy: resourceNameSchema.describe("The name of the Strategy resource."),
  providers: z
    .array(resourceNameSchema)
    .default([])
    .describe("The names of the Provider resources that the Strategy may use."),
  seed: z.int().nonnegative().describe("The seed of the Environment and of every seeded Provider."),
  maxSteps: z.int().positive().describe("The cognitive loop stops after this many steps."),
});
