import { buildImageUploadFormData } from "@/lib/upload-form-images";

export async function uploadImageFile(
  file: File,
  failMessage = "上傳失敗",
  kind: "cover" | "item" = "item"
): Promise<string> {
  const { upload } = await buildImageUploadFormData(file, kind, failMessage);
  return upload();
}
