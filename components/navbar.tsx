"use client";

import { Calendar, Menu, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ScriptToggle } from "@/components/script-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-900/40 bg-[#0c0c1d]/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="link-with-icon">
          <Image src="/images/logo.png" alt="C++ Serbia Logo" width={40} height={40} />
          <span className="gradient-brand-text text-xl font-medium">{t("brand")}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-white transition-colors hover:text-purple-300"
          >
            {t("home")}
          </Link>
          <Link
            href="/events"
            className="text-sm font-medium text-white transition-colors hover:text-purple-300"
          >
            {t("events")}
          </Link>
          <Link
            href="/#join"
            className="text-sm font-medium text-white transition-colors hover:text-purple-300"
          >
            {t("joinUs")}
          </Link>
          <div className="ml-2 flex items-center gap-2">
            <LanguageSwitcher />
            <ScriptToggle />
          </div>
          <Button size="sm" className="gradient-brand-button ml-2 text-white">
            <Link href="/events" className="nav-link">
              <Calendar className="h-4 w-4" /> {t("upcomingEvents")}
            </Link>
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <button className="p-2 text-white md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 md:hidden">
          <div className="absolute inset-0 bg-[#0c0c1d]/95 backdrop-blur-lg backdrop-saturate-150" />
          <nav className="relative z-10 flex flex-col items-center gap-6 bg-[#0c0c1d]/90 p-8 text-white backdrop-blur-lg backdrop-saturate-150">
            <Link
              href="/"
              className="text-lg font-medium text-white transition-colors hover:text-purple-300"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("home")}
            </Link>
            <Link
              href="/events"
              className="text-lg font-medium text-white transition-colors hover:text-purple-300"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("events")}
            </Link>
            <Link
              href="/#join"
              className="text-lg font-medium text-white transition-colors hover:text-purple-300"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("joinUs")}
            </Link>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <ScriptToggle />
            </div>
            <Button
              className="gradient-brand-button mt-4 w-full text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              <Link href="/events" className="flex-center w-full gap-2">
                <Calendar className="h-5 w-5" /> {t("upcomingEvents")}
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
