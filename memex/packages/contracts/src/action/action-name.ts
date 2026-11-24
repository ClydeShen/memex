import { z } from "zod";

export const actionNameSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/)
  .describe('A lowercase name, with dots between parts, for example "move" or "claim.form".');
