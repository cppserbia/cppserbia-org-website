import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Admin - C++ Serbia Community",
  description: "Admin tools for the C++ Serbia Community website",
}

export default function AdminPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c1d] text-white">
      <section className="relative w-full py-12 px-4 overflow-hidden">
        <div className="relative z-10 max-w-5xl mx-auto">
          <Link href="/" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-purple-400 to-blue-400">
            Admin Dashboard
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mb-8">Manage and monitor the C++ Serbia Community website</p>

          <div className="mt-8 p-6 border border-purple-900 rounded-lg bg-[#0c0c1d]/80">
            <h2 className="text-xl font-bold mb-4 text-purple-300">Event Management Guide</h2>
            <div className="space-y-4 text-gray-300">
              <p>To add or edit events, follow these steps:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  Create a markdown file in the <code className="bg-purple-950/50 px-2 py-1 rounded">events</code>{" "}
                  directory
                </li>
                <li>
                  Name the file in the format{" "}
                  <code className="bg-purple-950/50 px-2 py-1 rounded">yyyy-mm-dd-event-name.md</code>
                </li>
                <li>Add frontmatter with event details (title, time, location, etc.)</li>
                <li>Write the event content in markdown format</li>
                <li>Deploy the changes to update the website</li>
              </ol>
              <p className="mt-4">Example frontmatter:</p>
              <pre className="bg-purple-950/30 p-3 rounded text-sm overflow-auto">
                {`---
title: "Event Title"
time: "6:00 PM - 8:00 PM"
location: "Event Location"
description: "Short description of the event"
registrationLink: "https://example.com/register"
isOnline: false
---`}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
