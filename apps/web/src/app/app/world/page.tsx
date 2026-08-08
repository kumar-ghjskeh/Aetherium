import { WorldPage as WorldDataPage } from "../../../features/world/world-page";
import { parseWorldCommandIntent } from "../../../features/world/engine/command-bridge-system";

export default async function WorldPage({
  searchParams
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>): Promise<React.ReactElement> {
  const resolvedSearchParams = await searchParams;
  const params = new URLSearchParams();
  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      params.set(key, value);
    }
  });
  return <WorldDataPage initialIntent={parseWorldCommandIntent(params)} />;
}
