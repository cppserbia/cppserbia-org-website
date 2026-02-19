"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { useTranslations } from "next-intl"

export function ICalFeedButton() {
    const [isClient, setIsClient] = useState(false)
    const [isLocalhost, setIsLocalhost] = useState(false)
    const t = useTranslations('feeds')

    useEffect(() => {
        setIsClient(true)
        if (typeof window !== "undefined") {
            const hostname = window.location.hostname
            setIsLocalhost(hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168."))
        }
    }, [])

    const getHref = () => {
        if (isClient && typeof window !== "undefined") {
            if (isLocalhost) {
                return "/feed.ics"
            }
            return `webcal://${window.location.host}/feed.ics`
        }
        return "/feed.ics"
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className="border-blue-500 text-blue-400 hover:bg-blue-950 hover:text-blue-300"
            asChild
        >
            <a
                href={getHref()}
                download={isLocalhost ? "events.ics" : undefined}
                target={isLocalhost ? "_blank" : undefined}
                rel={isLocalhost ? "noopener noreferrer" : undefined}
                className="flex items-center gap-2"
            >
                {t('icalFeed')} <Calendar className="h-4 w-4" />
            </a>
        </Button>
    )
}
