import { getServerConfig } from "../../../lib/config";

// Liveness/readiness probe target ([SRCH-CFG-3]): 200 once the server is up
// and the configuration validates; 503 with the reason otherwise.
export const dynamic = "force-dynamic";

export function GET() {
  try {
    getServerConfig();
    return Response.json({ status: "ok" });
  } catch (e) {
    return Response.json(
      { status: "invalid-config", message: (e as Error).message },
      { status: 503 },
    );
  }
}
