import { z } from "zod";
import { resourceNameSchema } from "./resource-name.ts";

export const metadataSchema = z.strictObject({
  name: resourceNameSchema,
});
