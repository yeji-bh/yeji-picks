import "server-only";

import { cache } from "react";
import { after } from "next/server";
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

function isRemoteLibsql() {
  return (process.env.DATABASE_URL ?? "").startsWith("libsql:");
}

/** One Prisma client per HTTP request on edge — global singleton crashes under concurrency. */
const getRequestPrisma = cache((): PrismaClientSingleton => {
  const client = createPrismaClient();
  if (isRemoteLibsql()) {
    after(async () => {
      await client.$disconnect().catch(() => {});
    });
  }
  return client;
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

function resolvePrisma(): PrismaClientSingleton {
  if (isRemoteLibsql()) {
    return getRequestPrisma();
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClientSingleton, {
  get(_target, prop, receiver) {
    const client = resolvePrisma();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
