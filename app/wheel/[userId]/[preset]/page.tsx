import { notFound } from "next/navigation";
import { ObsWheelEmbed } from "@/components/wheel/ObsWheelEmbed";
import { loadPublicWheel } from "@/server/wheel/load-public-wheel";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    userId: string;
    preset: string;
  }>;
};

export default async function WheelEmbedPage({ params }: PageProps) {
  const { userId, preset } = await params;
  const config = await loadPublicWheel(userId, preset);

  if (!config || !config.items.length) {
    notFound();
  }

  return <ObsWheelEmbed userId={userId} presetId={config.presetId} items={config.items} />;
}
