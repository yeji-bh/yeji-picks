import { prepareImageFile } from "@/lib/prepare-image-file";

export async function uploadImageFile(
  file: File,
  failMessage = "上傳失敗",
  kind: "cover" | "item" = "item"
): Promise<string> {
  const { file: prepared } = await prepareImageFile(file);
  const formData = new FormData();
  formData.append("file", prepared);
  formData.append("kind", kind);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? failMessage);
  return data.url as string;
}
