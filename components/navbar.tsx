"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, Calendar } from "lucide-react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ScriptToggle } from "@/components/script-toggle"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const t = useTranslations('nav')

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-900/40 bg-[#0c0c1d]/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="link-with-icon">
          <Image src="/images/logo.png" alt="C++ Serbia Logo" width={40} height={40} />
          <span className="text-xl font-medium gradient-brand-text">
            {t('brand')}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-white hover:text-purple-300 transition-colors">
            {t('home')}
          </Link>
          <Link href="/events" className="text-sm font-medium text-white hover:text-purple-300 transition-colors">
            {t('events')}
          </Link>
          <Link href="/#join" className="text-sm font-medium text-white hover:text-purple-300 transition-colors">
            {t('joinUs')}
          </Link>
          <div className="flex items-center gap-2 ml-2">
            <LanguageSwitcher />
            <ScriptToggle />
          </div>
          <Button
            size="sm"
            className="gradient-brand-button text-white ml-2"
          >
            <Link href="/events" className="nav-link">
              <Calendar className="h-4 w-4" /> {t('upcomingEvents')}
            </Link>
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40">
          <div className="absolute inset-0 bg-[#0c0c1d]/95 backdrop-blur-lg backdrop-saturate-150" />
          <nav className="relative flex flex-col items-center gap-6 p-8 text-white z-10 bg-[#0c0c1d]/90 backdrop-blur-lg backdrop-saturate-150">
            <Link
              href="/"
              className="text-lg font-medium text-white hover:text-purple-300 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('home')}
            </Link>
            <Link
              href="/events"
              className="text-lg font-medium text-white hover:text-purple-300 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('events')}
            </Link>
            <Link
              href="/#join"
              className="text-lg font-medium text-white hover:text-purple-300 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('joinUs')}
            </Link>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <ScriptToggle />
            </div>
            <Button
              className="w-full gradient-brand-button text-white mt-4"
              onClick={() => setIsMenuOpen(false)}
            >
              <Link href="/events" className="flex-center gap-2 w-full">
                <Calendar className="h-5 w-5" /> {t('upcomingEvents')}
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
