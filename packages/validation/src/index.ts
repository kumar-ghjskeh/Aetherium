import { z } from "zod";

export const healthStatusSchema = z.enum(["ok", "degraded"]);

export const serviceNameSchema = z.enum(["api", "web"]);

export const healthCheckResponseSchema = z.object({
  checks: z.record(z.string()),
  service: serviceNameSchema,
  status: healthStatusSchema,
  version: z.string().min(1)
});

export type HealthCheckResponseInput = z.input<typeof healthCheckResponseSchema>;
export type HealthCheckResponseOutput = z.output<typeof healthCheckResponseSchema>;
