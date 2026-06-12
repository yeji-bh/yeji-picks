"use client";

import { useTranslation } from "react-i18next";
import CatalogItemEditForm from "./CatalogItemEditForm";
import Modal from "./Modal";

export default function CatalogItemEditModal({
  itemId,
  open,
  onClose,
  onUpdated,
}: {
  itemId: string;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("item.catalogEditTitle")}
      description={t("item.editCatalogHint")}
      maxWidthClass="max-w-lg"
    >
      <CatalogItemEditForm
        itemId={itemId}
        mode="modal"
        onClose={onClose}
        onUpdated={onUpdated}
      />
    </Modal>
  );
}
