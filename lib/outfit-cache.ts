import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";

export const getOutfitRecord = cache((id: string) =>
  prisma.outfit.findUnique({ where: { id } })
);
