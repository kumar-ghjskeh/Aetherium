import { z } from "zod";

export const passwordPolicy = {
  maxLength: 128,
  minLength: 12
} as const;

export const healthStatusSchema = z.enum(["ok", "degraded"]);

export const serviceNameSchema = z.enum(["api", "web"]);

export const healthCheckResponseSchema = z.object({
  checks: z.record(z.string()),
  service: serviceNameSchema,
  status: healthStatusSchema,
  version: z.string().min(1)
});

export const publicUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1),
  isEmailVerified: z.boolean(),
  createdAt: z.string().min(1),
  lastLoginAt: z.string().min(1).nullable()
});

export const authResponseSchema = z.object({
  user: publicUserSchema
});

export const passwordSchema = z
  .string()
  .min(
    passwordPolicy.minLength,
    `Password must be at least ${passwordPolicy.minLength} characters.`
  )
  .max(passwordPolicy.maxLength, `Password must be at most ${passwordPolicy.maxLength} characters.`)
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol.");

export const registerRequestSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  password: passwordSchema
});

export const loginRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required.").max(passwordPolicy.maxLength)
});

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    fields: z.record(z.string()).optional(),
    message: z.string()
  })
});

export type HealthCheckResponseInput = z.input<typeof healthCheckResponseSchema>;
export type HealthCheckResponseOutput = z.output<typeof healthCheckResponseSchema>;
export type RegisterRequestInput = z.input<typeof registerRequestSchema>;
export type LoginRequestInput = z.input<typeof loginRequestSchema>;
