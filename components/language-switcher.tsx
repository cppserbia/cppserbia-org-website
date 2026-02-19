"use client"

import { useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import { type Locale } from "@/i18n/config"

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => switchLocale('en')}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === 'en'
            ? 'text-purple-300 font-semibold'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        EN
      </button>
      <span className="text-gray-600">|</span>
      <button
        onClick={() => switchLocale('sr')}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === 'sr'
            ? 'text-purple-300 font-semibold'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        SR
      </button>
    </div>
  )
}
