"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { useTranslation } from "react-i18next";

export const IMAGE_FILE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif";

type FileInputZoneProps = {
  accept?: string;
  disabled?: boolean;
  className?: string;
  onChange: (file: File | null) => void;
};

const FileInputZone = forwardRef<HTMLInputElement, FileInputZoneProps>(
  function FileInputZone(
    { accept = IMAGE_FILE_ACCEPT, disabled, className = "", onChange },
    ref
  ) {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    return (
      <div
        className={`file-input-zone ${className}`.trim()}
        data-disabled={disabled ? "true" : undefined}
      >
        <button
          type="button"
          disabled={disabled}
          className="file-input-zone-btn"
          onClick={() => inputRef.current?.click()}
        >
          {t("common.chooseFile")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </div>
    );
  }
);

export default FileInputZone;
