import { z } from "zod";
import { experimentSpecSchema } from "./experiment-spec.ts";
import { resourceBaseSchema } from "./resource-base.ts";

export const experimentResourceSchema = resourceBaseSchema.extend({
  kind: z.literal("Experiment"),
  spec: experimentSpecSchema,
});

export type ExperimentResource = z.infer<typeof experimentResourceSchema>;
