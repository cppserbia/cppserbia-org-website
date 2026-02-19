"use client"

import { Button } from "@/components/ui/button"
import { useEffect } from "react"
import { useTranslations } from "next-intl"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('error')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c1d] text-white">
      <div className="flex-center min-h-[50vh]">
        <div className="flex flex-col items-center text-center max-w-md p-8 border border-red-500/30 rounded-lg bg-red-950/10">
          <h2 className="text-2xl font-bold text-red-400 mb-4">{t('title')}</h2>
          <p className="text-muted mb-6">
            {t('eventsDescription')}
          </p>
          <Button
            onClick={reset}
            className="gradient-brand-button text-white"
          >
            {t('tryAgain')}
          </Button>
        </div>
      </div>
    </div>
  )
}
