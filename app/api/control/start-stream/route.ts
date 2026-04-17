import { NextResponse } from "next/server";
import { isControlApiAuthorized } from "@/server/control-api/auth";
import { setControlStreamState } from "@/server/control-api/stream-state";

export async function POST(request: Request) {
  if (!isControlApiAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = setControlStreamState(true);
  return NextResponse.json({ ok: true, stream: state });
}

