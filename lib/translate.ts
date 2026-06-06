import "server-only";

import { LOCALE_TO_TRANSLATE, type Locale } from "@/lib/i18n/settings";

const cache = new Map<string, string>();

function cacheKey(text: string, to: Locale): string {
  return `${to}::${text}`;
}

export async function translateText(
  text: string,
  to: Locale
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const key = cacheKey(trimmed, to);
  const cached = cache.get(key);
  if (cached) return cached;

  const target = LOCALE_TO_TRANSLATE[to];
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("langpair", `auto|${target}`);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
    const data = await res.json();
    const translated = data?.responseData?.translatedText as string | undefined;

    if (translated && translated !== trimmed) {
      cache.set(key, translated);
      return translated;
    }
  } catch {
    // fall through
  }

  return trimmed;
}

export async function translateTexts(
  texts: string[],
  to: Locale
): Promise<string[]> {
  return Promise.all(texts.map((text) => translateText(text, to)));
}
