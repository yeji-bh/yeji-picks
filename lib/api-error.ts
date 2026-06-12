import { NextResponse, type NextRequest } from "next/server";
import type { ModerationCode, ModerationField } from "@/lib/content-moderation";
import { apiT, resolveApiLocale } from "@/lib/i18n/server";

export function apiError(
  request: NextRequest,
  key: string,
  status: number,
  params?: Record<string, string | number>
) {
  const locale = resolveApiLocale(request);
  return NextResponse.json(
    { error: apiT(locale, key, params), errorKey: key },
    { status }
  );
}

export function moderationError(
  request: NextRequest,
  field: ModerationField,
  code: ModerationCode
) {
  const locale = resolveApiLocale(request);
  const fieldLabel = apiT(locale, `api.fields.${field}`);
  return NextResponse.json(
    {
      error: apiT(locale, `api.moderation.${code}`, { field: fieldLabel }),
      errorKey: `api.moderation.${code}`,
      errorParams: { field, fieldLabel },
    },
    { status: 400 }
  );
}
