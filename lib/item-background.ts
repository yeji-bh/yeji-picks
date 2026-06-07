import "server-only";

import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";

/** Off by default — set ITEM_BG_REMOVAL=true to enable AI background removal. */
const ENABLED = process.env.ITEM_BG_REMOVAL === "true";

/** Remove item image background and composite onto pure white. */
export async function itemBackgroundToWhite(buffer: Buffer): Promise<Buffer> {
  const prepared = await sharp(buffer, { failOn: "error" })
    .rotate()
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  const blob = new Blob([Uint8Array.from(prepared)], { type: "image/png" });
  const removed = await removeBackground(blob, {
    model: "small",
    output: { format: "image/png", quality: 0.9 },
  });

  const foreground = Buffer.from(await removed.arrayBuffer());
  const meta = await sharp(foreground).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("無法讀取去背結果");
  }

  return sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite([{ input: foreground, top: 0, left: 0 }])
    .png()
    .toBuffer();
}

export async function maybeRemoveItemBackground(
  buffer: Buffer,
  enabled = ENABLED
): Promise<Buffer> {
  if (!enabled) return buffer;

  try {
    return await itemBackgroundToWhite(buffer);
  } catch (err) {
    console.error("[item-background] removal failed, using original:", err);
    return buffer;
  }
}
