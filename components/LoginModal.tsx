"use client";

import { useTranslation } from "react-i18next";
import AuthLoginForm from "./AuthLoginForm";
import Modal from "./Modal";

export default function LoginModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("auth.login")}
      description={t("auth.loginDesc")}
      maxWidthClass="max-w-sm"
    >
      <div className="px-4 py-4">
        <AuthLoginForm onSuccess={onClose} />
      </div>
    </Modal>
  );
}
