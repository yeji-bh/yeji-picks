import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { isLocale } from "@/lib/i18n/settings";
import { translateTexts } from "@/lib/translate";

export async function POST(request: NextRequest) {
  try {
    const { texts, to } = await request.json();

    if (!Array.isArray(texts) || !isLocale(to)) {
      return apiError(request, "api.errors.invalidRequest", 400);
    }

    const validTexts = texts.filter((t) => typeof t === "string");
    const translations = await translateTexts(validTexts, to);

    return NextResponse.json({ translations });
  } catch {
    return apiError(request, "api.errors.translationFailed", 500);
  }
}
