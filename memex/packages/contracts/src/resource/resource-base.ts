import { z } from "zod";
import { API_VERSION } from "./api-version.ts";
import { metadataSchema } from "./metadata.ts";

export const resourceBaseSchema = z.strictObject({
  apiVersion: z.literal(API_VERSION),
  metadata: metadataSchema,
});
