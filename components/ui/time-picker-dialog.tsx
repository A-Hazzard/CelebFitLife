
"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"

interface TimePickerDialogProps {
  date: Date
  setDate: (date: Date) => void
}

export function TimePickerDialog({ date, setDate }: TimePickerDialogProps) {
  const [selectedTime, setSelectedTime] = React.useState(date)

  const times = React.useMemo(() => {
    const hours = []
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 15) {
        const d = new Date(date)
        d.setHours(i, j, 0, 0)
        hours.push(d)
      }
    }
    return hours
  }, [date])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          {format(date, "h:mm a")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>Select Time</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-72">
          <div className="grid grid-cols-1 gap-1">
            {times.map((time, i) => (
              <Button
                key={i}
                variant={time.getTime() === selectedTime.getTime() ? "default" : "ghost"}
                onClick={() => {
                  setSelectedTime(time)
                  setDate(time)
                }}
              >
                {format(time, "h:mm a")}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
