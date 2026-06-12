import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  isValidAccount,
  normalizeAccount,
} from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { moderateAccount } from "@/lib/content-moderation";
import { syncBrowserDataToUser } from "@/lib/browser-sync";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const SESSION_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    const { account, password, submissionIds, favoriteIds, favorites } =
      await request.json();

    if (typeof account !== "string" || !isValidAccount(account)) {
      return apiError(request, "api.account.format", 400);
    }

    const accountCheck = moderateAccount(account);
    if (!accountCheck.ok) {
      return apiError(request, `api.account.${accountCheck.code}`, 400);
    }

    if (typeof password !== "string" || password.length < 6) {
      return apiError(request, "api.errors.passwordMin", 400);
    }

    const normalized = normalizeAccount(account);
    const existing = await prisma.user.findUnique({
      where: { account: normalized },
    });

    if (existing) {
      return apiError(request, "api.account.inUse", 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        account: normalized,
        passwordHash,
        role: "user",
      },
    });

    const sync = await syncBrowserDataToUser(
      user.id,
      Array.isArray(submissionIds) ? submissionIds : [],
      favorites ?? favoriteIds ?? { outfits: [], items: [] }
    );

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

    await prisma.session.create({
      data: { userId: user.id, token, expiresAt },
    });

    const response = NextResponse.json({
      user: { id: user.id, account: user.account, role: user.role },
      synced: sync,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error("Register failed:", err);
    return apiError(request, "api.errors.registerFailed", 500);
  }
}
