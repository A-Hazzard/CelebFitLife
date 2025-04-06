"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  addDays,
  differenceInDays,
} from "date-fns";
import {
  CalendarIcon,
  Clock,
  Edit2,
  BarChart,
  MoreHorizontal,
  Play,
  Trash,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

// Mock upcoming streams data
const mockUpcomingStreams = [
  {
    id: "stream1",
    title: "Morning Yoga Flow",
    description: "Start your day with an energizing yoga session",
    scheduledAt: addDays(new Date(), 1).toISOString(),
    thumbnail:
      "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "Yoga",
    estimatedDuration: 45,
    subscriberOnly: true,
  },
  {
    id: "stream2",
    title: "HIIT Cardio Blast",
    description: "High intensity interval training to maximize calorie burn",
    scheduledAt: addDays(new Date(), 2).toISOString(),
    thumbnail:
      "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "HIIT",
    estimatedDuration: 30,
    subscriberOnly: false,
  },
  {
    id: "stream3",
    title: "Meditation & Mindfulness",
    description: "Guided meditation for stress relief and mental clarity",
    scheduledAt: addDays(new Date(), 3).toISOString(),
    thumbnail:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "Mindfulness",
    estimatedDuration: 20,
    subscriberOnly: false,
  },
  {
    id: "stream4",
    title: "Full Body Strength Training",
    description:
      "Build muscle and increase strength with this full body workout",
    scheduledAt: addDays(new Date(), 5).toISOString(),
    thumbnail:
      "https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "Strength",
    estimatedDuration: 50,
    subscriberOnly: true,
  },
  {
    id: "stream5",
    title: "Recovery & Stretching",
    description: "Essential stretches to improve flexibility and recovery",
    scheduledAt: addDays(new Date(), 7).toISOString(),
    thumbnail:
      "https://images.unsplash.com/photo-1616699002805-0741e1e4a9c5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "Recovery",
    estimatedDuration: 35,
    subscriberOnly: false,
  },
];

export default function UpcomingStreams() {
  const router = useRouter();
  const [view, setView] = useState<"list" | "calendar">("list");

  const formatScheduleDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return `Today, ${format(date, "h:mm a")}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  const getDaysUntil = (dateString: string) => {
    const date = parseISO(dateString);
    const days = differenceInDays(date, new Date());

    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `in ${days} days`;
  };

  const createNewStream = () => {
    router.push("/dashboard/streams/new");
  };

  const editStream = (streamId: string) => {
    router.push(`/dashboard/streams/manage/${streamId}`);
  };

  const startStream = (streamId: string) => {
    router.push(`/dashboard/streams/manage/${streamId}?action=start`);
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle className="text-xl font-medium">
              Upcoming Streams
            </CardTitle>
            <CardDescription className="text-gray-400">
              {mockUpcomingStreams.length} scheduled streams
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-gray-800 rounded-lg p-1 w-full sm:w-auto">
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
                className="h-8 px-3 flex-1 sm:flex-auto"
              >
                List
              </Button>
              <Button
                variant={view === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("calendar")}
                className="h-8 px-3 flex-1 sm:flex-auto"
              >
                Calendar
              </Button>
            </div>
            <Button
              onClick={createNewStream}
              size="sm"
              className="h-8 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Stream
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {view === "list" ? (
          <ScrollArea className="h-[420px]">
            <div className="space-y-4">
              {mockUpcomingStreams.map((stream) => (
                <div
                  key={stream.id}
                  className="rounded-lg overflow-hidden border border-gray-800 bg-gray-800/50 flex flex-col"
                >
                  <div className="relative w-full h-32 md:h-40 flex-shrink-0">
                    <Image
                      src={stream.thumbnail || "/placeholder-stream.jpg"}
                      alt={stream.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-gray-900/80 hover:bg-gray-900/90 text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">
                        {stream.category}
                      </Badge>
                    </div>
                    {stream.subscriberOnly && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-purple-600 hover:bg-purple-700 text-xs">
                          Subscribers
                        </Badge>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 flex items-center bg-gray-900/80 rounded px-2 py-1 text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {stream.estimatedDuration} min
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-base sm:text-lg font-medium truncate pr-6">
                          {stream.title}
                        </h3>
                        <DropdownMenu>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <DropdownMenuTrigger>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-white absolute top-2 right-2"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Stream options</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <DropdownMenuContent>
                            <div className="bg-gray-800 border-gray-700">
                              <DropdownMenuItem>
                                <div
                                  onClick={() => startStream(stream.id)}
                                  className="text-gray-200 focus:bg-gray-700 focus:text-white cursor-pointer w-full flex items-center"
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Start Stream
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <div
                                  onClick={() => editStream(stream.id)}
                                  className="text-gray-200 focus:bg-gray-700 focus:text-white cursor-pointer w-full flex items-center"
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <div className="text-red-400 focus:bg-red-900/30 focus:text-red-400 cursor-pointer w-full flex items-center">
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </div>
                              </DropdownMenuItem>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-gray-400 text-xs sm:text-sm mt-1 line-clamp-2">
                        {stream.description}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3 sm:mt-4">
                      <div className="flex flex-wrap items-center text-xs sm:text-sm gap-1">
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1 text-brandOrange" />
                          <span className="truncate max-w-[120px] sm:max-w-none">
                            {formatScheduleDate(stream.scheduledAt)}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-gray-700 text-gray-400 text-xs h-5"
                        >
                          {getDaysUntil(stream.scheduledAt)}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 bg-transparent border-gray-700 w-full sm:w-auto"
                        onClick={() => startStream(stream.id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Stream
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6 h-[420px] flex items-center justify-center">
            <div className="text-center">
              <BarChart className="h-10 w-10 opacity-30 text-gray-400 mb-2" />
              <p className="text-lg text-gray-300">Calendar View Coming Soon</p>
              <p className="text-sm text-gray-400 mt-1">
                We&apos;re working on a calendar view for your scheduled
                streams.
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={() => setView("list")}
              >
                Switch to List View
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
