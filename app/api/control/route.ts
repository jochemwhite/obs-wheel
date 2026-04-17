import { NextResponse } from "next/server";
import { isControlApiAuthorized } from "@/server/control-api/auth";

export async function GET(request: Request) {
  if (!isControlApiAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    service: "control-api",
    endpoints: [
      "GET /api/control",
      "GET /api/control/stream-status",
      "POST /api/control/start-stream",
      "POST /api/control/stop-stream",
      "POST /api/control/trigger-wheel",
    ],
    auth: ["x-api-key: <key>", "Authorization: Bearer <key>", "?key=<key>"],
  });
}

