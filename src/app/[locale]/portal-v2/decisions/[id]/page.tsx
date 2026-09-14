import { DecisionDetailV2 } from "@/components/sections/portal-v2/DecisionDetailV2";

export default async function DecisionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DecisionDetailV2 id={id} />;
}
