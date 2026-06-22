import BrandDetailLoader from "@/components/BrandDetailLoader";

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BrandDetailLoader slug={slug} />;
}
