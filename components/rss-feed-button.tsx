"use client"

import { Button } from "@/components/ui/button"
import { Rss } from "lucide-react"

export function RSSFeedButton() {
    return (
        <Button
            variant="outline"
            size="sm"
            className="border-orange-500 text-orange-400 hover:bg-orange-950 hover:text-orange-300"
            asChild
        >
            <a
                href="/feed.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
            >
                RSS Feed <Rss className="h-4 w-4" />
            </a>
        </Button>
    )
}
