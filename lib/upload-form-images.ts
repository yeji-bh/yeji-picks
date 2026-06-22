import {
  compressImageForUpload,
  compressThumbForUpload,
  shouldUploadThumb,
  type ClientImageKind,
} from "@/lib/compress-image-client";
import { prepareImageFile } from "@/lib/prepare-image-file";

export async function appendCompressedImagePair(
  formData: FormData,
  prepared: File,
  kind: ClientImageKind,
  outputName: string,
  options?: {
    fileField?: string;
    thumbField?: string;
  }
): Promise<void> {
  const fileField = options?.fileField ?? "file";
  const thumbField = options?.thumbField ?? "thumb";
  const webpName = outputName.replace(/\.\w+$/, ".webp");

  const compressed = await compressImageForUpload(prepared, kind);
  formData.append(fileField, compressed, webpName);

  if (shouldUploadThumb(kind)) {
    const thumb = await compressThumbForUpload(prepared);
    formData.append(thumbField, thumb, webpName.replace(/\.webp$/, "_t.webp"));
  }
}

export async function buildImageUploadFormData(
  file: File,
  kind: ClientImageKind,
  failMessage = "上傳失敗"
): Promise<{ formData: FormData; upload: () => Promise<string> }> {
  const { file: prepared } = await prepareImageFile(file);
  const formData = new FormData();
  await appendCompressedImagePair(formData, prepared, kind, file.name);
  formData.append("kind", kind);

  return {
    formData,
    upload: async () => {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? failMessage);
      return data.url as string;
    },
  };
}
