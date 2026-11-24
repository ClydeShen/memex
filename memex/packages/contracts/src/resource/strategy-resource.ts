import { z } from "zod";
import { componentSpecSchema } from "./component-spec.ts";
import { resourceBaseSchema } from "./resource-base.ts";

export const strategyResourceSchema = resourceBaseSchema.extend({
  kind: z.literal("Strategy"),
  spec: componentSpecSchema,
});

export type StrategyResource = z.infer<typeof strategyResourceSchema>;
