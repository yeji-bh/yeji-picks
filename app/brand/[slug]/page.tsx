import { notFound } from "next/navigation";
import BrandDetailContent from "@/components/BrandDetailContent";
import { parseBrandSlug } from "@/lib/brand";
import { getBrandPageData } from "@/lib/brand-db";
import { primaryImage } from "@/lib/catalog-item";
import { listBrandStaticParams } from "@/lib/static-params";

export const dynamicParams = true;

export async function generateStaticParams() {
  return listBrandStaticParams();
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const key = parseBrandSlug(slug);

  if (!key) {
    notFound();
  }

  const data = await getBrandPageData(key);
  if (!data) {
    notFound();
  }

  return (
    <BrandDetailContent
      brand={data.displayName}
      items={data.rows.map((item) => ({
        id: item.id,
        type: item.type,
        brand: item.brand,
        productName: item.productName,
        image: primaryImage(item),
        useCount: item.useCount,
      }))}
    />
  );
}
