"use client";

import type { AetheriumApiClient } from "@aetherium/api-client";
import { AetheriumApiError } from "@aetherium/api-client";
import { loginRequestSchema, registerRequestSchema } from "@aetherium/validation";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

import { createBrowserApiClient, useAuth } from "./auth-provider";

type AuthMode = "login" | "register";

type FieldErrors = Record<string, string>;
type ValidationIssue = {
  message: string;
  path: Array<number | string>;
};

function friendlyAuthError(error: unknown): string {
  if (error instanceof AetheriumApiError) {
    if (error.code === "invalid_credentials" || error.code === "email_unavailable") {
      return error.message;
    }
    if (error.code === "rate_limited") {
      return error.message;
    }
    return "Aetherium could not complete that authentication request.";
  }

  return "Aetherium is unavailable. Check the API service and try again.";
}

function fieldErrorsFromIssues(issues: ReadonlyArray<ValidationIssue>): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.join(".");
    if (key && errors[key] === undefined) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function AuthForm({
  client,
  mode,
  onAuthenticated
}: Readonly<{
  client?: AetheriumApiClient;
  mode: AuthMode;
  onAuthenticated?: () => void;
}>): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const apiClient = React.useMemo(() => client ?? createBrowserApiClient(), [client]);
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    setIsSubmitting(true);
    try {
      if (isRegister) {
        const validation = registerRequestSchema.safeParse({ displayName, email, password });
        if (!validation.success) {
          setFieldErrors(fieldErrorsFromIssues(validation.error.issues));
          return;
        }
        await apiClient.auth.register(validation.data);
      } else {
        const validation = loginRequestSchema.safeParse({ email, password });
        if (!validation.success) {
          setFieldErrors(fieldErrorsFromIssues(validation.error.issues));
          return;
        }
        await apiClient.auth.login(validation.data);
      }
      await refresh();
      if (onAuthenticated) {
        onAuthenticated();
      } else {
        router.push(searchParams.get("next") ?? "/command");
      }
    } catch (error) {
      setFormError(friendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-panel" noValidate onSubmit={(event) => void handleSubmit(event)}>
      <div>
        <p className="eyebrow">Aetherium Identity</p>
        <h1>{isRegister ? "Create your account" : "Sign in"}</h1>
        <p className="form-copy">
          {isRegister
            ? "Create an Aetherium-only account for this standalone learning world."
            : "Use your Aetherium email and password to enter Command Mode."}
        </p>
      </div>

      {formError ? (
        <div className="form-alert" role="alert">
          {formError}
        </div>
      ) : null}

      {isRegister ? (
        <label className="field-label" htmlFor="displayName">
          Display name
          <input
            autoComplete="name"
            id="displayName"
            name="displayName"
            onChange={(event) => setDisplayName(event.target.value)}
            type="text"
            value={displayName}
          />
          {fieldErrors.displayName ? (
            <span className="field-error">{fieldErrors.displayName}</span>
          ) : null}
        </label>
      ) : null}

      <label className="field-label" htmlFor="email">
        Email
        <input
          autoComplete="email"
          id="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          value={email}
        />
        {fieldErrors.email ? <span className="field-error">{fieldErrors.email}</span> : null}
      </label>

      <label className="field-label" htmlFor="password">
        Password
        <span className="password-control">
          <input
            autoComplete={isRegister ? "new-password" : "current-password"}
            id="password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="inline-control"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </span>
        {fieldErrors.password ? <span className="field-error">{fieldErrors.password}</span> : null}
      </label>

      <button className="primary-action" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Working..." : isRegister ? "Create account" : "Sign in"}
      </button>

      <p className="form-switch">
        {isRegister ? "Already have an account?" : "New to Aetherium?"}{" "}
        <Link href={isRegister ? "/login" : "/register"}>
          {isRegister ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
