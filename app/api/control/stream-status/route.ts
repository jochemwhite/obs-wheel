import { NextResponse } from "next/server";
import { isControlApiAuthorized } from "@/server/control-api/auth";
import { getControlStreamState } from "@/server/control-api/stream-state";

export async function GET(request: Request) {
  if (!isControlApiAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = getControlStreamState();
  return NextResponse.json({ ok: true, stream: state });
}

