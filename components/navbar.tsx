"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, Calendar } from "lucide-react"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-900/40 bg-[#0c0c1d]/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/logo.png" alt="C++ Serbia Logo" width={40} height={40} />
          <span className="text-xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-purple-400 to-blue-400">
            C++ Serbia
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-white hover:text-purple-300 transition-colors">
            Home
          </Link>
          <Link href="/events" className="text-sm font-medium text-white hover:text-purple-300 transition-colors">
            Events
          </Link>
          <Link href="/#join" className="text-sm font-medium text-white hover:text-purple-300 transition-colors">
            Join Us
          </Link>
          <Button
            size="sm"
            className="bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white ml-2"
          >
            <Link href="/events" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Upcoming Events
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
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-[#0c0c1d]/95 backdrop-blur-md">
          <nav className="flex flex-col items-center gap-6 p-8">
            <Link
              href="/"
              className="text-lg font-medium text-white hover:text-purple-300 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/events"
              className="text-lg font-medium text-white hover:text-purple-300 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Events
            </Link>
            <Link
              href="/#join"
              className="text-lg font-medium text-white hover:text-purple-300 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Join Us
            </Link>
            <Button
              className="w-full bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white mt-4"
              onClick={() => setIsMenuOpen(false)}
            >
              <Link href="/events" className="flex items-center justify-center gap-2 w-full">
                <Calendar className="h-5 w-5" /> Upcoming Events
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
