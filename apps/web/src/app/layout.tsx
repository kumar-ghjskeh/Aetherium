import type { Metadata } from "next";

import { AuthProvider } from "../features/auth/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  description: "Aetherium application scaffold.",
  title: "Aetherium"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
