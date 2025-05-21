"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import type { FormattedEvent } from "@/lib/meetup-api"

interface EventCalendarProps {
  events: FormattedEvent[]
}

export default function EventCalendar({ events }: EventCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOfMonth = getFirstDayOfMonth(year, month)

    const monthName = currentMonth.toLocaleString("default", { month: "long" })

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-purple-900/30 bg-purple-950/20"></div>)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateString = date.toISOString().split("T")[0] // YYYY-MM-DD format

      const dayEvents = events.filter((event) => {
        return event.date === dateString
      })

      days.push(
        <div
          key={`day-${day}`}
          className={`h-24 border border-purple-900/30 p-1 ${dayEvents.length > 0 ? "bg-purple-950/30" : "bg-purple-950/10"}`}
        >
          <div className="text-right text-sm mb-1">{day}</div>
          {dayEvents.map((event) => (
            <div
              key={event.slug}
              className="text-xs p-1 bg-purple-800/40 text-white rounded truncate"
              title={event.title}
            >
              {event.title}
            </div>
          ))}
        </div>,
      )
    }

    return (
      <div className="bg-[#0c0c1d] rounded-lg border border-purple-900 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-purple-900">
          <h3 className="font-bold text-xl text-purple-300">
            {monthName} {year}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevMonth}
              className="h-8 w-8 border-purple-700 text-purple-300"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous month</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className="h-8 w-8 border-purple-700 text-purple-300"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next month</span>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center py-2 border-b border-purple-900 bg-purple-950/30">
          <div className="text-sm font-medium text-purple-300">Sun</div>
          <div className="text-sm font-medium text-purple-300">Mon</div>
          <div className="text-sm font-medium text-purple-300">Tue</div>
          <div className="text-sm font-medium text-purple-300">Wed</div>
          <div className="text-sm font-medium text-purple-300">Thu</div>
          <div className="text-sm font-medium text-purple-300">Fri</div>
          <div className="text-sm font-medium text-purple-300">Sat</div>
        </div>
        <div className="grid grid-cols-7">{days}</div>
        <div className="p-4 border-t border-purple-900 text-sm text-gray-400 flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2 text-purple-400" />
          <span>Events are shown in purple</span>
        </div>
      </div>
    )
  }

  return <div className="w-full overflow-x-auto">{renderCalendar()}</div>
}
