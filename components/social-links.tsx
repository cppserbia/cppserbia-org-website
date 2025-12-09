"use client"

import Link from "next/link"
import { Linkedin, MessageSquare, Youtube, Twitch, Send, Users, Github } from "lucide-react"

interface SocialLinksProps {
  size?: "sm" | "md" | "lg"
}

interface SocialLinkData {
  href: string
  icon: React.ReactNode
  label: string
  color: string
}

export default function SocialLinks({ size = "md" }: SocialLinksProps) {
  const sizeClasses = {
    sm: "p-2",
    md: "p-3",
    lg: "p-4",
  }

  const iconSize = {
    sm: 18,
    md: 24,
    lg: 28,
  }

  const socialLinks: SocialLinkData[] = [
    {
      href: "https://github.com/cppserbia",
      icon: <Github size={iconSize[size]} />,
      label: "GitHub",
      color: "#9ca3af"
    },
    {
      href: "https://www.youtube.com/@cppserbia",
      icon: <Youtube size={iconSize[size]} />,
      label: "YouTube",
      color: "#FF0000"
    },
    {
      href: "https://www.twitch.tv/cppserbia",
      icon: <Twitch size={iconSize[size]} />,
      label: "Twitch",
      color: "#9146FF"
    },
    {
      href: "https://www.linkedin.com/company/101931236/",
      icon: <Linkedin size={iconSize[size]} />,
      label: "LinkedIn",
      color: "#0077B5"
    },
    {
      href: "https://discord.gg/VDUn8YtHw8",
      icon: <MessageSquare size={iconSize[size]} />,
      label: "Discord",
      color: "#5865F2"
    },
    {
      href: "https://t.me/+l7NS0GrslBMwNzI0",
      icon: <Send size={iconSize[size]} />,
      label: "Telegram",
      color: "#0088cc"
    },
    {
      href: "https://www.meetup.com/cpp-serbia/",
      icon: <Users size={iconSize[size]} />,
      label: "Meetup",
      color: "#e51937"
    }
  ]

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {socialLinks.map(({ href, icon, label, color }) => (
        <Link
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${sizeClasses[size]} rounded-full transition-colors`}
          style={{
            backgroundColor: `${color}20`,
            color: color,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${color}30`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `${color}20`
          }}
          aria-label={label}
        >
          {icon}
        </Link>
      ))}
    </div>
  )
}
