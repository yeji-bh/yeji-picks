import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE_NAME = "session_token";

export type AuthUser = {
  id: string;
  account: string;
  role: "user" | "admin";
};

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: { select: { id: true, account: true, role: true } },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return {
    id: session.user.id,
    account: session.user.account,
    role: session.user.role as AuthUser["role"],
  };
});

export async function isAdminUser(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "admin";
}

export function normalizeAccount(account: string): string {
  return account.trim().toLowerCase();
}

export function isValidAccount(account: string): boolean {
  const n = account.trim();
  return n.length >= 2 && n.length <= 32 && /^[\w\u4e00-\u9fff.-]+$/.test(n);
}
