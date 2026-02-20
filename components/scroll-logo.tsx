"use client"

import { useEffect, useRef, useCallback } from "react"
import Image from "next/image"

// Wallpaper native dimensions (wallpaper.png)
const WALLPAPER_W = 6144
const WALLPAPER_H = 3456
// Approximate hex cell inscribed width in the native wallpaper (tunable)
const HEX_NATIVE_WIDTH = 850
// How much of the hex the logo should fill (0.0–1.0)
const HEX_FILL = 0.85

// Vertical nudge in native wallpaper pixels (scaled by bgScale at runtime)
const OFFSET = 22

interface ScrollLogoProps {
  src: string
  alt: string
  width: number
  height: number
  /** Pixels to pull the final resting position up from section center (positive = higher) */
  targetOffset?: number
}

export function ScrollLogo({ src, alt, width, height, targetOffset = OFFSET }: ScrollLogoProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const rafRef = useRef<number | null>(null)

  const update = useCallback(() => {
    const wrapper = wrapperRef.current
    const img = imgRef.current
    const section = wrapper?.closest("section")
    if (!wrapper || !img || !section) return

    const sectionRect = section.getBoundingClientRect()
    const wrapperRect = wrapper.getBoundingClientRect()

    // Compute the wallpaper's rendered scale (bg-cover logic)
    const bgScale = Math.max(sectionRect.width / WALLPAPER_W, sectionRect.height / WALLPAPER_H)

    // Where the logo center sits naturally (relative to the section top)
    const logoCenterNatural =
      wrapperRect.top - sectionRect.top + wrapperRect.height / 2
    // Where we want it: vertical center of the section, nudged up to align with wallpaper hex
    const target = sectionRect.height / 2 - targetOffset * bgScale
    // Max px the logo needs to travel downward
    const maxOffset = target - logoCenterNatural

    if (maxOffset <= 0) {
      // Logo is already at or below center — no animation needed
      img.style.transform = "translateY(0px) scale(1)"
      return
    }

    // How far the section top has scrolled past the viewport top
    const scrolled = -sectionRect.top
    // Complete the transition over 25% of the hero height
    const linear = Math.min(1, Math.max(0, scrolled / (sectionRect.height * 0.25)))
    // Ease-out curve: starts fast, decelerates into resting position
    const progress = 1 - Math.pow(1 - linear, 3)
    // Rendered hex width at this viewport
    const renderedHex = HEX_NATIVE_WIDTH * bgScale
    // Target scale: fit the logo inside the hex
    const targetScale = (renderedHex * HEX_FILL) / width
    const scale = 1 + progress * (targetScale - 1)
    const scrollOpacity = 1 - progress * 0.5
    img.style.transform = `translateY(${progress * maxOffset}px) scale(${scale})`
    img.style.setProperty("--scroll-opacity", String(scrollOpacity))
  }, [targetOffset, width])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (mq.matches) {
      // Jump straight to center
      const wrapper = wrapperRef.current
      const img = imgRef.current
      const section = wrapper?.closest("section")
      if (wrapper && img && section) {
        const sectionRect = section.getBoundingClientRect()
        const wrapperRect = wrapper.getBoundingClientRect()
        const bgScale = Math.max(sectionRect.width / WALLPAPER_W, sectionRect.height / WALLPAPER_H)
        const logoCenterNatural =
          wrapperRect.top - sectionRect.top + wrapperRect.height / 2
        const maxOffset = sectionRect.height / 2 - targetOffset * bgScale - logoCenterNatural
        const renderedHex = HEX_NATIVE_WIDTH * bgScale
        const targetScale = (renderedHex * HEX_FILL) / width
        if (maxOffset > 0) img.style.transform = `translateY(${maxOffset}px) scale(${targetScale})`
      }
      return
    }

    function onScroll() {
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        update()
      })
    }

    // Set initial position
    update()

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [update, targetOffset, width])

  return (
    <div ref={wrapperRef} className="relative z-0 flex justify-center mb-8">
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="animate-pulse-slow"
        style={{ willChange: "transform" }}
      />
    </div>
  )
}
