import { z } from "zod";

const RESOURCE_NAME = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export const resourceNameSchema = z
  .string()
  .regex(RESOURCE_NAME)
  .describe(
    "A lowercase name of up to 63 letters, digits and hyphens. Other resources refer to it.",
  );
