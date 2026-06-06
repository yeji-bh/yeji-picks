import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, normalizeAccount } from "@/lib/auth";
import { syncBrowserDataToUser } from "@/lib/browser-sync";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

const SESSION_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    const { account, password, submissionIds, favoriteIds, favorites } =
      await request.json();

    if (typeof account !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "請輸入帳號與密碼" },
        { status: 400 }
      );
    }

    const normalized = normalizeAccount(account);
    const user = await prisma.user.findUnique({
      where: { account: normalized },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "帳號或密碼錯誤" },
        { status: 401 }
      );
    }

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
  } catch {
    return NextResponse.json({ error: "登入失敗" }, { status: 500 });
  }
}
