export function formatOutfitTitle(date: string, eventName: string): string {
  const parts: string[] = [];
  if (date?.trim()) parts.push(date.replace(/-/g, ""));
  if (eventName?.trim()) parts.push(eventName.trim());
  return parts.join(" ") || "outfit";
}
