import { AppShell } from "../../features/app-shell/app-shell";

export default function AuthenticatedAppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return <AppShell>{children}</AppShell>;
}
