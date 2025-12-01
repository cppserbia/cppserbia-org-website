import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AddToCalendarButtonProps {
    slug: string
    className?: string
}

export function AddToCalendarButton({ slug, className }: AddToCalendarButtonProps) {
    return (
        <Button
            variant="outline"
            size="sm"
            className={className || "border-green-500 text-green-400 hover:bg-green-950 hover:text-green-300 min-w-[70px] px-0"}
            asChild
        >
            <a
                href={`/events/${slug}/calendar.ics`}
                download
                className="flex items-center justify-center gap-1 w-full"
            >
                <Calendar className="h-4 w-4" />
                <span className="text-lg font-bold">+</span>
            </a>
        </Button>
    )
}
