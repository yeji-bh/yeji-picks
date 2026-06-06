import "server-only";

export type LinkCheckResult = "ok" | "dead" | "unknown";

export async function checkLink(url: string): Promise<LinkCheckResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "yeji-outfits-link-checker/1.0",
      },
    });

    clearTimeout(timeout);

    if (response.status >= 200 && response.status < 400) {
      return "ok";
    }

    if (response.status === 405 || response.status === 403) {
      return checkLinkWithGet(url);
    }

    return "dead";
  } catch {
    return checkLinkWithGet(url);
  }
}

async function checkLinkWithGet(url: string): Promise<LinkCheckResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "yeji-outfits-link-checker/1.0",
      },
    });

    clearTimeout(timeout);

    if (response.status >= 200 && response.status < 400) {
      return "ok";
    }

    return "dead";
  } catch {
    return "unknown";
  }
}
