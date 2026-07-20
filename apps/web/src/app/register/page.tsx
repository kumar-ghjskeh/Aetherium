import { Suspense } from "react";

import { AuthForm } from "../../features/auth/auth-form";

export default function RegisterPage(): React.ReactElement {
  return (
    <main className="auth-shell">
      <Suspense
        fallback={
          <section className="auth-panel" role="status">
            Loading registration form...
          </section>
        }
      >
        <AuthForm mode="register" />
      </Suspense>
    </main>
  );
}
