import InfoContent from "@/components/InfoContent";
import { getInfoUpdatesMarkdown } from "@/lib/info-updates";

export default async function InfoPage() {
  const updatesMarkdown = await getInfoUpdatesMarkdown();

  return <InfoContent updatesMarkdown={updatesMarkdown} />;
}
