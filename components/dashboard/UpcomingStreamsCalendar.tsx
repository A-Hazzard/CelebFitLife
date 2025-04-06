import React, { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import Image from "next/image";

interface UpcomingStream {
  id: string;
  title: string;
  date: Date;
  category: string;
  thumbnailUrl: string;
  duration: number; // in minutes
  isSubscriberOnly: boolean;
  description?: string;
}

// Generate fake streams for the next 2 weeks
const generateFakeUpcomingStreams = (): UpcomingStream[] => {
  const categories = ["Yoga", "HIIT", "Nutrition", "Mindfulness", "Strength"];
  const titles = [
    "Morning Energizer",
    "Full Body Burn",
    "Zen Flow",
    "Nutrition Essentials",
    "Red Carpet Ready",
    "Core Crusher",
    "Mind & Body Balance",
    "Celebrity Training Secrets",
    "Power Hour",
    "Stretching for Flexibility",
  ];

  const streams: UpcomingStream[] = [];
  const today = new Date();

  // Create streams for the next 14 days
  for (let i = 1; i <= 14; i++) {
    const streamDate = new Date();
    streamDate.setDate(today.getDate() + i);

    // Randomly decide if we create 0-2 streams for this day
    const streamsToday = Math.floor(Math.random() * 3);

    for (let j = 0; j < streamsToday; j++) {
      // Decide time - morning (7-10), afternoon (12-4), evening (5-8)
      const timeSlot = Math.floor(Math.random() * 3);
      const hours =
        timeSlot === 0
          ? 7 + Math.floor(Math.random() * 4)
          : timeSlot === 1
          ? 12 + Math.floor(Math.random() * 5)
          : 17 + Math.floor(Math.random() * 4);

      const minutes = [0, 15, 30, 45][Math.floor(Math.random() * 4)];

      streamDate.setHours(hours, minutes, 0, 0);

      const title = titles[Math.floor(Math.random() * titles.length)];
      const category =
        categories[Math.floor(Math.random() * categories.length)];
      const duration = [30, 45, 60, 90][Math.floor(Math.random() * 4)];
      const isSubscriberOnly = Math.random() > 0.7;

      // Use static images that exist instead of random ones
      let thumbnailUrl = "";
      switch (category) {
        case "Yoga":
          thumbnailUrl =
            "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b";
          break;
        case "HIIT":
          thumbnailUrl =
            "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3";
          break;
        case "Nutrition":
          thumbnailUrl =
            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd";
          break;
        case "Mindfulness":
          thumbnailUrl =
            "https://images.unsplash.com/photo-1545389336-cf090694435e";
          break;
        case "Strength":
          thumbnailUrl =
            "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e";
          break;
        default:
          thumbnailUrl =
            "https://images.unsplash.com/photo-1518611012118-696072aa579a";
      }

      // Add sizing parameters
      thumbnailUrl += "?w=500&h=300&fit=crop&auto=format&q=80";

      streams.push({
        id: `stream-${i}-${j}`,
        title,
        date: new Date(streamDate),
        category,
        thumbnailUrl,
        duration,
        isSubscriberOnly,
        description: `Join me for this ${duration}-minute ${category.toLowerCase()} session designed for all fitness levels.`,
      });
    }
  }

  return streams.sort((a, b) => a.date.getTime() - b.date.getTime());
};

export default function UpcomingStreamsCalendar() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const streams = React.useMemo(() => generateFakeUpcomingStreams(), []);

  // Get streams for the selected date in calendar view
  const selectedDateStreams = selectedDate
    ? streams.filter(
        (stream) =>
          stream.date.getDate() === selectedDate.getDate() &&
          stream.date.getMonth() === selectedDate.getMonth() &&
          stream.date.getFullYear() === selectedDate.getFullYear()
      )
    : [];

  // Get dates with streams for calendar highlighting
  const datesWithStreams = streams.map((stream) => stream.date);

  // Function to format time from date
  const formatStreamTime = (date: Date) => {
    return format(date, "h:mm a");
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <h3 className="text-lg font-medium">Upcoming Streams</h3>
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-800 rounded-md p-0.5">
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              className={`text-xs ${
                view === "list" ? "bg-gray-700" : "bg-transparent text-gray-400"
              }`}
              onClick={() => setView("list")}
            >
              List
            </Button>
            <Button
              variant={view === "calendar" ? "default" : "ghost"}
              size="sm"
              className={`text-xs ${
                view === "calendar"
                  ? "bg-gray-700"
                  : "bg-transparent text-gray-400"
              }`}
              onClick={() => setView("calendar")}
            >
              Calendar
            </Button>
          </div>

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-gray-700 text-sm text-white"
              >
                <Calendar className="h-4 w-4 mr-2 text-brandOrange" />
                {selectedDate
                  ? format(selectedDate, "MMM d, yyyy")
                  : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border-gray-300">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setIsCalendarOpen(false);
                }}
                className="rounded-md"
                modifiers={{
                  hasStream: datesWithStreams,
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {view === "list" ? (
        <div className="space-y-4">
          {streams.slice(0, 5).map((stream) => (
            <div
              key={stream.id}
              className="bg-gray-800 rounded-lg overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="relative w-full sm:w-40 h-32 sm:h-auto">
                  <Image
                    src={stream.thumbnailUrl}
                    alt={stream.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {stream.category && (
                    <span className="absolute top-2 left-2 bg-gray-900/80 text-white text-xs px-2 py-1 rounded">
                      {stream.category}
                    </span>
                  )}
                  {stream.isSubscriberOnly && (
                    <span className="absolute top-2 right-2 bg-brandOrange text-white text-xs px-2 py-1 rounded">
                      Subscribers
                    </span>
                  )}
                  <div className="absolute bottom-2 left-2 bg-gray-900/80 text-white text-xs px-2 py-1 rounded flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(stream.date, "MMM d, h:mm a")}
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between flex-1">
                  <div>
                    <h4 className="font-medium mb-1">{stream.title}</h4>
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {stream.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">
                      {stream.duration} min
                    </span>
                    <Button
                      size="sm"
                      className="bg-brandOrange hover:bg-brandOrange/90 text-white text-xs"
                    >
                      Set Reminder
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {streams.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>No upcoming streams scheduled</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-300 mb-2">
            {selectedDate
              ? `Streams for ${format(selectedDate, "MMMM d, yyyy")}`
              : "Select a date to view streams"}
          </div>

          {selectedDateStreams.length > 0 ? (
            <div className="space-y-3">
              {selectedDateStreams.map((stream) => (
                <div
                  key={stream.id}
                  className="flex gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 relative">
                    <Image
                      src={stream.thumbnailUrl}
                      alt={stream.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{stream.title}</h4>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatStreamTime(stream.date)}
                      <span className="mx-1">•</span>
                      {stream.duration} min
                    </div>
                    <div className="flex items-center mt-2">
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded mr-2">
                        {stream.category}
                      </span>
                      {stream.isSubscriberOnly && (
                        <span className="text-xs bg-brandOrange/50 text-white px-2 py-0.5 rounded">
                          Subscribers Only
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 border border-dashed border-gray-700 rounded-lg">
              <p>No streams scheduled for this day</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
