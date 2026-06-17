"use client";

import { useTranslation } from "react-i18next";
import AuthRegisterForm from "./AuthRegisterForm";
import Modal from "./Modal";

export default function RegisterModal({
  open,
  onClose,
  onLoginClick,
}: {
  open: boolean;
  onClose: () => void;
  onLoginClick?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("auth.register")}
      description={t("auth.registerDesc")}
      maxWidthClass="max-w-sm"
    >
      <div className="px-4 py-4">
        <AuthRegisterForm onSuccess={onClose} onLoginClick={onLoginClick} />
      </div>
    </Modal>
  );
}
