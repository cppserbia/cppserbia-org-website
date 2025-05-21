import Link from "next/link"
import { Linkedin, MessageSquare, Youtube, Twitch, Send, Users } from "lucide-react"

interface SocialLinksProps {
  size?: "sm" | "md" | "lg"
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

  return (
    <div className="flex flex-wrap justify-center gap-4">
      <Link
        href="https://www.linkedin.com/company/101931236/"
        target="_blank"
        rel="noopener noreferrer"
        className={`${sizeClasses[size]} bg-[#0077B5]/20 hover:bg-[#0077B5]/30 text-[#0077B5] rounded-full transition-colors`}
        aria-label="LinkedIn"
      >
        <Linkedin size={iconSize[size]} />
      </Link>

      <Link
        href="https://discord.gg/VDUn8YtHw8"
        target="_blank"
        rel="noopener noreferrer"
        className={`${sizeClasses[size]} bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#5865F2] rounded-full transition-colors`}
        aria-label="Discord"
      >
        <MessageSquare size={iconSize[size]} />
      </Link>

      <Link
        href="https://www.twitch.tv/cppserbia"
        target="_blank"
        rel="noopener noreferrer"
        className={`${sizeClasses[size]} bg-[#9146FF]/20 hover:bg-[#9146FF]/30 text-[#9146FF] rounded-full transition-colors`}
        aria-label="Twitch"
      >
        <Twitch size={iconSize[size]} />
      </Link>

      <Link
        href="https://www.youtube.com/@cppserbia"
        target="_blank"
        rel="noopener noreferrer"
        className={`${sizeClasses[size]} bg-[#FF0000]/20 hover:bg-[#FF0000]/30 text-[#FF0000] rounded-full transition-colors`}
        aria-label="YouTube"
      >
        <Youtube size={iconSize[size]} />
      </Link>

      <Link
        href="https://t.me/+l7NS0GrslBMwNzI0"
        target="_blank"
        rel="noopener noreferrer"
        className={`${sizeClasses[size]} bg-[#0088cc]/20 hover:bg-[#0088cc]/30 text-[#0088cc] rounded-full transition-colors`}
        aria-label="Telegram"
      >
        <Send size={iconSize[size]} />
      </Link>

      <Link
        href="https://www.meetup.com/cpp-serbia/"
        target="_blank"
        rel="noopener noreferrer"
        className={`${sizeClasses[size]} bg-[#e51937]/20 hover:bg-[#e51937]/30 text-[#e51937] rounded-full transition-colors`}
        aria-label="Meetup"
      >
        <Users size={iconSize[size]} />
      </Link>
    </div>
  )
}
