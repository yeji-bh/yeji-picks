"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import AuthLoginForm from "@/components/AuthLoginForm";
import Modal from "@/components/Modal";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Modal
      open
      onClose={() => router.push("/")}
      title={t("auth.login")}
      description={t("auth.loginDesc")}
      maxWidthClass="max-w-sm"
    >
      <div className="px-4 py-4">
        <AuthLoginForm onSuccess={() => router.push("/")} />
      </div>
    </Modal>
  );
}
