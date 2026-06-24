"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default function DocumentTitle() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = t("siteMetaTitle");
    setMeta("description", t("siteMetaDescription"));
    setMeta("keywords", t("siteMetaKeywords"));
  }, [t, i18n.language]);

  return null;
}
