"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useTranslation } from "react-i18next";
import { getCroppedImageBlob } from "@/lib/crop-image";

const ASPECT_PRESETS = [
  { key: "tall", ratio: 9 / 16 },
  { key: "portrait", ratio: 3 / 4 },
  { key: "square", ratio: 1 },
] as const;

type CoverImageCropperProps = {
  imageSrc: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
};

export default function CoverImageCropper({
  imageSrc,
  onConfirm,
  onCancel,
}: CoverImageCropperProps) {
  const { t } = useTranslation();
  const [aspect, setAspect] = useState(ASPECT_PRESETS[0].ratio);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, area: Area) => {
    setCroppedArea(area);
  }, []);

  function handleAspectChange(ratio: number) {
    setAspect(ratio);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
  }

  async function handleConfirm() {
    if (!croppedArea) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedArea);
      const file = new File([blob], "cover.jpg", { type: "image/jpeg" });
      onConfirm(file);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-border bg-white shadow-2xl">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-neutral-900">
            {t("submit.cropTitle")}
          </h3>
          <p className="mt-0.5 text-xs text-muted">{t("submit.cropDesc")}</p>
        </div>

        <div className="relative h-[72vh] max-h-[640px] bg-neutral-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            minZoom={1}
            maxZoom={4}
            restrictPosition
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="space-y-2 border-t border-border px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {ASPECT_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => handleAspectChange(preset.ratio)}
                className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  aspect === preset.ratio
                    ? "bg-neutral-900 text-white"
                    : "border border-border bg-white text-neutral-600 hover:border-neutral-300"
                }`}
              >
                {t(`submit.cropRatio.${preset.key}`)}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-3 text-xs text-muted">
            <span className="shrink-0">{t("submit.cropZoom")}</span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm text-neutral-700"
            >
              {t("submit.cropCancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={processing || !croppedArea}
              className="flex-1 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {processing ? t("submit.cropProcessing") : t("submit.cropConfirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
