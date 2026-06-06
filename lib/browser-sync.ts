import { prisma } from "@/lib/db";
import type { FavoriteStore } from "@/lib/favorites";

function parseFavorites(
  input: FavoriteStore | string[] | undefined
): FavoriteStore {
  if (!input) return { outfits: [], items: [] };
  if (Array.isArray(input)) {
    return {
      outfits: input.filter((id) => typeof id === "string" && id.length > 0),
      items: [],
    };
  }
  return {
    outfits: (input.outfits ?? []).filter(
      (id) => typeof id === "string" && id.length > 0
    ),
    items: (input.items ?? []).filter(
      (id) => typeof id === "string" && id.length > 0
    ),
  };
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

    await prisma.favorite.upsert({
      where: {
        userId_type_targetId: {
          userId,
          type: "outfit",
          targetId: outfitId,
        },
      },
      create: { userId, type: "outfit", targetId: outfitId },
      update: {},
    });
    favoritesLinked += 1;
  }

  for (const itemId of favorites.items) {
    const exists = await prisma.catalogItem.findUnique({
      where: { id: itemId },
      select: { id: true },
    });
    if (!exists) continue;

    await prisma.favorite.upsert({
      where: {
        userId_type_targetId: {
          userId,
          type: "item",
          targetId: itemId,
        },
      },
      create: { userId, type: "item", targetId: itemId },
      update: {},
    });
    favoritesLinked += 1;
  }

  return { submissionsLinked, favoritesLinked };
}
