import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function EventNotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c1d] text-white">
      <div className="flex items-center justify-center flex-1">
        <div className="max-w-md text-center p-8">
          <h1 className="text-4xl font-bold mb-4 text-purple-400">Event Not Found</h1>
          <p className="text-gray-300 mb-8">The event you're looking for doesn't exist or has been removed.</p>
          <Button className="bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white">
            <Link href="/events">Back to Events</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
