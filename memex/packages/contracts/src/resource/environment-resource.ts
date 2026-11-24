import { z } from "zod";
import { componentSpecSchema } from "./component-spec.ts";
import { resourceBaseSchema } from "./resource-base.ts";

export const environmentResourceSchema = resourceBaseSchema.extend({
  kind: z.literal("Environment"),
  spec: componentSpecSchema,
});

export type EnvironmentResource = z.infer<typeof environmentResourceSchema>;
