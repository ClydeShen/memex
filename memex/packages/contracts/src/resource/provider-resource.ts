import { z } from "zod";
import { componentSpecSchema } from "./component-spec.ts";
import { resourceBaseSchema } from "./resource-base.ts";

export const providerResourceSchema = resourceBaseSchema.extend({
  kind: z.literal("Provider"),
  spec: componentSpecSchema,
});

export type ProviderResource = z.infer<typeof providerResourceSchema>;
