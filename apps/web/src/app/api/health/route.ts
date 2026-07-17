import type { HealthCheckResponse } from "@aetherium/shared-types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET(): NextResponse<HealthCheckResponse> {
  return NextResponse.json({
    checks: {},
    service: "web",
    status: "ok",
    version: "0.1.0"
  });
}
