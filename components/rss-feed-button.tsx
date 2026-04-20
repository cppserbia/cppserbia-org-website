"use client";

import { Rss } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function RSSFeedButton() {
  const t = useTranslations("feeds");

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-orange-500 text-orange-400 hover:bg-orange-950 hover:text-orange-300"
      asChild
    >
      <a
        href="/feed.xml"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2"
      >
        {t("rssFeed")} <Rss className="h-4 w-4" />
      </a>
    </Button>
  );
}
