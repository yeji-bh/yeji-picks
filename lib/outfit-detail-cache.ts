import type { OutfitDetailData } from "@/lib/outfit-detail";

const cache = new Map<string, OutfitDetailData>();
const inflight = new Map<string, Promise<OutfitDetailData | null>>();

export function getOutfitDetailCache(id: string): OutfitDetailData | undefined {
  return cache.get(id);
}

export function setOutfitDetailCache(id: string, data: OutfitDetailData): void {
  cache.set(id, data);
}

export async function prefetchOutfitDetail(
  id: string
): Promise<OutfitDetailData | null> {
  const cached = cache.get(id);
  if (cached) return cached;

  const pending = inflight.get(id);
  if (pending) return pending;

  const promise = fetch(`/api/outfits/${id}`)
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as OutfitDetailData;
      cache.set(id, data);
      return data;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(id);
    });

  inflight.set(id, promise);
  return promise;
}
