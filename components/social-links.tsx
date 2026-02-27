"use client"

import Link from "next/link"
import { Linkedin, Youtube, Twitch, Send, Users, Github, Instagram, Facebook } from "lucide-react"

function DiscordIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.36-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"/>
    </svg>
  )
}

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
      href: "https://discord.gg/VDUn8YtHw8",
      icon: <DiscordIcon size={iconSize[size]} />,
      label: "Discord",
      color: "#5865F2"
    },
    {
      href: "https://www.youtube.com/@cppserbia",
      icon: <Youtube size={iconSize[size]} />,
      label: "YouTube",
      color: "#FF0000"
    },
    {
      href: "https://www.linkedin.com/company/101931236/",
      icon: <Linkedin size={iconSize[size]} />,
      label: "LinkedIn",
      color: "#0077B5"
    },
    {
      href: "https://github.com/cppserbia",
      icon: <Github size={iconSize[size]} />,
      label: "GitHub",
      color: "#9ca3af"
    },
    {
      href: "https://www.instagram.com/cppserbia",
      icon: <Instagram size={iconSize[size]} />,
      label: "Instagram",
      color: "#E4405F"
    },
    {
      href: "https://www.facebook.com/cppserbia",
      icon: <Facebook size={iconSize[size]} />,
      label: "Facebook",
      color: "#1877F2"
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
    },
    {
      href: "https://www.twitch.tv/cppserbia",
      icon: <Twitch size={iconSize[size]} />,
      label: "Twitch",
      color: "#9146FF"
    },
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
