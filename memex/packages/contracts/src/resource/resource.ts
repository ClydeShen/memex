import { z } from "zod";
import { environmentResourceSchema } from "./environment-resource.ts";
import { experimentResourceSchema } from "./experiment-resource.ts";
import { providerResourceSchema } from "./provider-resource.ts";
import { strategyResourceSchema } from "./strategy-resource.ts";

export const resourceSchema = z.discriminatedUnion("kind", [
  experimentResourceSchema,
  environmentResourceSchema,
  strategyResourceSchema,
  providerResourceSchema,
]);

export type Resource = z.infer<typeof resourceSchema>;
