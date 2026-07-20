import { Suspense } from "react";

import { AuthForm } from "../../features/auth/auth-form";

export default function LoginPage(): React.ReactElement {
  return (
    <main className="auth-shell">
      <Suspense
        fallback={
          <section className="auth-panel" role="status">
            Loading sign-in form...
          </section>
        }
      >
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
