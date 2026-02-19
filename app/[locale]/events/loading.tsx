"use client"

import { useTranslations } from "next-intl"

export default function Loading() {
  const t = useTranslations('loading')

  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c1d] text-white">
      <div className="flex-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-purple-300">{t('loadingEvents')}</p>
        </div>
      </div>
    </div>
  )
}
