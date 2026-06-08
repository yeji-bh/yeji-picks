export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function withIdSlug(id: string, label: string): string {
  const slug = slugify(label);
  return slug ? `${id}-${slug}` : id;
}

export function extractIdFromSlugParam(param: string): string {
  const matched = param.match(/^([a-z0-9]{20,})(?:-.+)?$/i);
  return matched?.[1] ?? param;
}
