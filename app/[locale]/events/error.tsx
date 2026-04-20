"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0c0c1d] text-white">
      <div className="flex-center min-h-[50vh]">
        <div className="flex max-w-md flex-col items-center rounded-lg border border-red-500/30 bg-red-950/10 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-red-400">{t("title")}</h2>
          <p className="mb-6 text-muted">{t("eventsDescription")}</p>
          <Button onClick={reset} className="gradient-brand-button text-white">
            {t("tryAgain")}
          </Button>
        </div>
      </div>
    </div>
  );
}
