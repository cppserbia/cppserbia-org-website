"use client";

import { useLocale } from "next-intl";

import { type Locale } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => switchLocale("en")}
        className={`rounded px-1.5 py-0.5 transition-colors ${
          locale === "en" ? "font-semibold text-purple-300" : "text-gray-400 hover:text-white"
        }`}
      >
        EN
      </button>
      <span className="text-gray-600">|</span>
      <button
        onClick={() => switchLocale("sr")}
        className={`rounded px-1.5 py-0.5 transition-colors ${
          locale === "sr" ? "font-semibold text-purple-300" : "text-gray-400 hover:text-white"
        }`}
      >
        SR
      </button>
    </div>
  );
}
