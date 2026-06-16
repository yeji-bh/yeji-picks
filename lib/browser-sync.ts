import { prisma } from "@/lib/db";
import type { FavoriteStore } from "@/lib/favorites";

function parseFavorites(
  input: FavoriteStore | string[] | undefined
): FavoriteStore {
  if (!input) return { outfits: [], items: [], nailArts: [], phoneCases: [] };
  if (Array.isArray(input)) {
    return {
      outfits: input.filter((id) => typeof id === "string" && id.length > 0),
      items: [],
      nailArts: [],
      phoneCases: [],
    };
  }
  return {
    outfits: (input.outfits ?? []).filter(
      (id) => typeof id === "string" && id.length > 0
    ),
    items: (input.items ?? []).filter(
      (id) => typeof id === "string" && id.length > 0
    ),
    nailArts: (input.nailArts ?? []).filter(
      (id) => typeof id === "string" && id.length > 0
    ),
    phoneCases: (input.phoneCases ?? []).filter(
      (id) => typeof id === "string" && id.length > 0
    ),
  };
}

async function upsertFavorite(
  userId: string,
  type: string,
  targetId: string
): Promise<void> {
  await prisma.favorite.upsert({
    where: {
      userId_type_targetId: { userId, type, targetId },
    },
    create: { userId, type, targetId },
    update: {},
  });
}

export async function syncBrowserDataToUser(
  userId: string,
  submissionIds: string[],
  favoritesInput: FavoriteStore | string[]
): Promise<{
  submissionsLinked: number;
  favoritesLinked: number;
}> {
  let submissionsLinked = 0;
  let favoritesLinked = 0;

  const validSubmissionIds = submissionIds.filter(
    (id) => typeof id === "string" && id.length > 0
  );
  const favorites = parseFavorites(favoritesInput);

  if (validSubmissionIds.length > 0) {
    const result = await prisma.submission.updateMany({
      where: { id: { in: validSubmissionIds }, userId: null },
      data: { userId },
    });
    submissionsLinked = result.count;
  }

  for (const outfitId of favorites.outfits) {
    const exists = await prisma.outfit.findUnique({
      where: { id: outfitId },
      select: { id: true },
    });
    if (!exists) continue;

    await upsertFavorite(userId, "outfit", outfitId);
    favoritesLinked += 1;
  }

  for (const itemId of favorites.items) {
    const exists = await prisma.catalogItem.findUnique({
      where: { id: itemId },
      select: { id: true },
    });
    if (!exists) continue;

    await upsertFavorite(userId, "item", itemId);
    favoritesLinked += 1;
  }

  for (const nailArtId of favorites.nailArts) {
    const exists = await prisma.nailArt.findUnique({
      where: { id: nailArtId },
      select: { id: true },
    });
    if (!exists) continue;

    await upsertFavorite(userId, "nailArt", nailArtId);
    favoritesLinked += 1;
  }

  for (const phoneCaseId of favorites.phoneCases) {
    const exists = await prisma.phoneCase.findUnique({
      where: { id: phoneCaseId },
      select: { id: true },
    });
    if (!exists) continue;

    await upsertFavorite(userId, "phoneCase", phoneCaseId);
    favoritesLinked += 1;
  }

  return { submissionsLinked, favoritesLinked };
}
