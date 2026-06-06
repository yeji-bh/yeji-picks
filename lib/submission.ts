import { normalizeItemType, type SubmissionPayload } from "./types";

export function validateSubmissionPayload(
  body: unknown
): SubmissionPayload | null {
  if (!body || typeof body !== "object") return null;

  const data = body as Record<string, unknown>;

  if (typeof data.mainImage !== "string" || !data.mainImage) {
    return null;
  }

  if (!Array.isArray(data.items)) return null;

  const items = data.items
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const i = item as Record<string, unknown>;
      const type = normalizeItemType(
        typeof i.type === "string" ? i.type : "other"
      );

      const images = Array.isArray(i.images)
        ? i.images.filter((url): url is string => typeof url === "string")
        : undefined;

      return {
        catalogItemId:
          typeof i.catalogItemId === "string" ? i.catalogItemId : undefined,
        type,
        brand: typeof i.brand === "string" ? i.brand : undefined,
        productName:
          typeof i.productName === "string" ? i.productName : undefined,
        image: typeof i.image === "string" ? i.image : undefined,
        images,
        officialLink:
          typeof i.officialLink === "string" ? i.officialLink : undefined,
        notes: typeof i.notes === "string" ? i.notes : undefined,
      };
    });

  return {
    eventName:
      typeof data.eventName === "string" ? data.eventName.trim() : "",
    date: typeof data.date === "string" ? data.date : "",
    mainImage: data.mainImage,
    items,
  };
}
