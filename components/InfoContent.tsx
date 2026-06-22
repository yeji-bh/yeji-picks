"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import InfoUpdatesLog from "./InfoUpdatesLog";

export default function InfoContent({
  updatesMarkdown,
}: {
  updatesMarkdown: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="min-w-0 space-y-6">
      <section>
        <h2 className="text-xl font-semibold text-foreground">{t("info.aboutTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground-secondary sm:text-base">
          {t("info.aboutBody1")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground-secondary sm:text-base">
          {t("info.aboutBody2")}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">
          {t("info.reportIssueTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground-secondary sm:text-base">
          {t("info.reportIssueBody")}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">{t("info.creditsTitle")}</h2>
        <div className="mt-3 space-y-4 text-sm leading-relaxed text-foreground-secondary sm:text-base">
          <div>
            <p className="font-medium text-foreground">{t("info.credits.designDevLabel")}</p>
            <p>{t("info.credits.xLabel")}：
              <Link href="https://x.com/pjdklwlnnx" target="_blank" className="text-accent underline-offset-2 hover:underline">
                @pjdklwlnnx
              </Link>
            </p>
            <p>{t("info.credits.xiaohongshuLabel")}：
              <Link href="https://xhslink.com/m/ARTD8ztdqmq" target="_blank" className="text-accent underline-offset-2 hover:underline">
                @夏日碎片
              </Link>
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              {t("info.credits.matchingLabel")}
            </p>
            <Link
              href="https://x.com/yejiwears_"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline-offset-2 hover:underline"
            >
              @yejiwears_
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">{t("info.updatesTitle")}</h2>
        <div className="mt-3">
          <InfoUpdatesLog markdown={updatesMarkdown} />
        </div>
      </section>
    </div>
  );
}
