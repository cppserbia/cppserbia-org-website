"use client"

import { useLocale } from "next-intl"
import { getSerbianScriptClient, setSerbianScriptCookie } from "@/lib/serbian-script"
import { useEffect, useState } from "react"
import type { SerbianScript } from "@/i18n/config"

export function ScriptToggle() {
  const locale = useLocale()
  const [script, setScript] = useState<SerbianScript>('cyrillic')

  useEffect(() => {
    setScript(getSerbianScriptClient())
  }, [])

  if (locale !== 'sr') return null

  function toggle() {
    const newScript: SerbianScript = script === 'cyrillic' ? 'latin' : 'cyrillic'
    setSerbianScriptCookie(newScript)
    window.location.reload()
  }

  return (
    <button
      onClick={toggle}
      className="px-2 py-0.5 text-sm rounded border border-purple-500/50 text-purple-300 hover:bg-purple-950/50 transition-colors"
      title={script === 'cyrillic' ? 'Пребаци на латиницу' : 'Prebaci na ćirilicu'}
    >
      {script === 'cyrillic' ? 'Lat' : 'Ћир'}
    </button>
  )
}
