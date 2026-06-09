import "server-only";

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL as PrismaLibSQLNode } from "@prisma/adapter-libsql";
import { PrismaLibSQL as PrismaLibSQLWeb } from "@prisma/adapter-libsql/web";

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./local.db";
  const config = { url, authToken: process.env.TURSO_AUTH_TOKEN };

  const Adapter = url.startsWith("file:") ? PrismaLibSQLNode : PrismaLibSQLWeb;
  return new PrismaClient({ adapter: new Adapter(config) });
}

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma: PrismaClientSingleton =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
