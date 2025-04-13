"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { TimePickerDialogProps } from "@/lib/types/ui";

export function TimePickerDialog({ date, setDate }: TimePickerDialogProps) {
  const [selectedTime, setSelectedTime] = React.useState(date);

  const times = React.useMemo(() => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 15) {
        const d = new Date(date);
        d.setHours(i, j, 0, 0);
        hours.push(d);
      }
    }
    return hours;
  }, [date]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-black">
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
                variant={
                  time.getTime() === selectedTime.getTime()
                    ? "default"
                    : "ghost"
                }
                onClick={() => {
                  setSelectedTime(time);
                  setDate(time);
                }}
                className="hover:bg-brandOrange hover:text-black"
              >
                {format(time, "h:mm a")}
              </Button>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 mt-4 px-4 pb-4">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="bg-brandOrange text-black hover:bg-brandWhite"
            >
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
