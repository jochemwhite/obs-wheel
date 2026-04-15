import { NextResponse } from "next/server";
import { loadPublicWheel } from "@/server/wheel/load-public-wheel";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/public-wheel/[userId]/[presetId]">
) {
  const { userId, presetId } = await context.params;
  const config = await loadPublicWheel(userId, presetId);

  if (!config || !config.items.length) {
    return NextResponse.json({ error: "Wheel preset not found" }, { status: 404 });
  }

  return NextResponse.json({
    presetId: config.presetId,
    items: config.items,
  });
}
