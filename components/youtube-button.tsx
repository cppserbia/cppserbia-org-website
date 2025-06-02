import Link from "next/link"
import { YouTubeIcon } from "./icons"

interface YouTubeButtonProps {
  href: string
  size?: "sm" | "md" | "lg"
  variant?: "icon" | "text"
  className?: string
}

export function YouTubeButton({
  href,
  size = "md",
  variant = "icon",
  className = ""
}: YouTubeButtonProps) {
  const sizeClasses = {
    sm: variant === "icon" ? "p-2" : "px-3 py-2 text-sm",
    md: variant === "icon" ? "p-3" : "px-4 py-2 text-sm",
    lg: variant === "icon" ? "p-4" : "px-6 py-3 text-base"
  }

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 28
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 bg-[#FF0000] hover:bg-[#FF0000]/80 text-white rounded-lg transition-colors ${sizeClasses[size]} ${className}`}
      aria-label="Watch on YouTube"
    >
      <YouTubeIcon width={iconSizes[size]} height={iconSizes[size]} color="white" />
      {variant === "text" && "Watch"}
    </Link>
  )
}
