"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Clock,
  Heart,
  DollarSign,
  BarChart as BarChartIcon,
  TrendingUp,
  Filter,
  Check,
} from "lucide-react";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { MetricCardProps } from "@/lib/types/dashboard";
import { ExportButton } from "./ExportButton";

// Mock data for charts
const viewerData = [
  { name: "Mon", value: 156 },
  { name: "Tue", value: 213 },
  { name: "Wed", value: 297 },
  { name: "Thu", value: 354 },
  { name: "Fri", value: 286 },
  { name: "Sat", value: 412 },
  { name: "Sun", value: 487 },
];

const engagementData = [
  { name: "Mon", comments: 24, likes: 56, shares: 12 },
  { name: "Tue", comments: 32, likes: 78, shares: 18 },
  { name: "Wed", comments: 46, likes: 102, shares: 24 },
  { name: "Thu", comments: 38, likes: 89, shares: 16 },
  { name: "Fri", comments: 52, likes: 134, shares: 31 },
  { name: "Sat", comments: 67, likes: 156, shares: 42 },
  { name: "Sun", comments: 72, likes: 192, shares: 53 },
];

const revenueData = [
  { name: "Mon", value: 85 },
  { name: "Tue", value: 112 },
  { name: "Wed", value: 98 },
  { name: "Thu", value: 143 },
  { name: "Fri", value: 176 },
  { name: "Sat", value: 204 },
  { name: "Sun", value: 258 },
];

const categoryData = [
  { name: "Yoga", value: 35 },
  { name: "HIIT", value: 25 },
  { name: "Strength", value: 20 },
  { name: "Cardio", value: 15 },
  { name: "Other", value: 5 },
];

const COLORS = [
  "#FF7F30", // brandOrange
  "#FFA45B", // lighter orange
  "#FFB97A", // even lighter orange
  "#FFD2A6", // pale orange
  "#A6A6A6", // brandGray
];

const MetricCard = ({ title, value, change, icon }: MetricCardProps) => (
  <div className="bg-brandBlack rounded-lg p-3 sm:p-4 flex items-center border-2 border-brandOrange">
    <div className="mr-3 sm:mr-4 bg-brandOrange/20 p-2 sm:p-3 rounded-lg flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-xs sm:text-sm text-brandGray truncate">{title}</div>
      <div className="text-lg sm:text-xl font-bold truncate text-brandWhite">
        {value}
      </div>
      <div
        className={`text-xs flex items-center mt-1 ${
          change >= 0 ? "text-brandOrange" : "text-red-400"
        }`}
      >
        {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% from last week
      </div>
    </div>
  </div>
);

export default function StreamStats() {
  const [activeTab, setActiveTab] = useState("viewers");
  const [timeRange, setTimeRange] = useState("7days");
  const [isFilterChanged, setIsFilterChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const timeRangeOptions = {
    "24hours": "Last 24 Hours",
    "7days": "Last 7 Days",
    "30days": "Last 30 Days",
    "90days": "Last 90 Days",
    year: "Last Year",
  };

  useEffect(() => {
    if (isFilterChanged) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
    // Return an empty cleanup function for the path where isFilterChanged is false
    return () => {};
  }, [isFilterChanged, timeRange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    setIsFilterChanged(true);
  };

  const MetricCardSkeleton = () => (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32 mb-1" />
      <Skeleton className="h-4 w-16" />
    </div>
  );

  const ChartSkeleton = () => (
    <div className="rounded-lg border bg-card shadow-sm p-4 md:p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-[200px] w-full rounded-md" />
      </div>
    </div>
  );

  return (
    <Card className="bg-brandBlack border-2 border-brandOrange">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle className="text-xl font-medium text-brandOrange">
              Stream Performance
            </CardTitle>
            <CardDescription className="text-brandGray">
              Analytics and metrics for your streams
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    isFilterChanged ? "border-brandOrange text-brandOrange" : ""
                  }
                >
                  <Filter
                    className={`h-4 w-4 mr-2 ${
                      isFilterChanged ? "text-brandOrange" : ""
                    }`}
                  />
                  {timeRangeOptions[timeRange as keyof typeof timeRangeOptions]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Time Range</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {Object.entries(timeRangeOptions).map(([key, label]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => handleTimeRangeChange(key)}
                    >
                      {key === timeRange && (
                        <Check className="mr-2 h-4 w-4 text-brandOrange" />
                      )}
                      <span
                        className={
                          key === timeRange ? "ml-4 text-brandOrange" : "ml-6"
                        }
                      >
                        {label}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <ExportButton />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <MetricCard
                title="Total Viewers"
                value="24.4K"
                change={12}
                icon={
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-brandOrange" />
                }
              />
              <MetricCard
                title="Watch Time"
                value="6.2K hrs"
                change={18}
                icon={
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-brandOrange" />
                }
              />
              <MetricCard
                title="Avg. Viewers"
                value="327"
                change={5}
                icon={
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-brandOrange" />
                }
              />
              <MetricCard
                title="Followers"
                value="1.2K"
                change={24}
                icon={
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-brandOrange" />
                }
              />
            </>
          )}
        </div>

        <Tabs
          defaultValue="viewers"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 mb-4 pb-1 gap-2">
            <TabsList className="bg-transparent h-auto sm:h-12 w-full sm:w-auto border-b-2 border-brandOrange">
              <TabsTrigger
                value="viewers"
                className="data-[state=active]:bg-brandOrange data-[state=active]:text-brandBlack text-xs sm:text-sm h-9 text-brandGray"
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Viewers</span>
                <span className="inline sm:hidden">Views</span>
              </TabsTrigger>
              <TabsTrigger
                value="engagement"
                className="data-[state=active]:bg-brandOrange data-[state=active]:text-brandBlack text-xs sm:text-sm h-9 text-brandGray"
              >
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Engagement</span>
                <span className="inline sm:hidden">Engage</span>
              </TabsTrigger>
              <TabsTrigger
                value="revenue"
                className="data-[state=active]:bg-brandOrange data-[state=active]:text-brandBlack text-xs sm:text-sm h-9 text-brandGray"
              >
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span>Revenue</span>
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="data-[state=active]:bg-brandOrange data-[state=active]:text-brandBlack text-xs sm:text-sm h-9 text-brandGray"
              >
                <BarChartIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Categories</span>
                <span className="inline sm:hidden">Cats</span>
              </TabsTrigger>
            </TabsList>

            <Button
              variant="ghost"
              size="sm"
              className="bg-transparent text-gray-400 hover:text-white h-9"
            >
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Filter
            </Button>
          </div>

          <TabsContent value="viewers" className="mt-0">
            <div className="rounded-lg bg-brandBlack p-3 sm:p-4 border-2 border-brandOrange">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-1">
                <h3 className="font-medium text-sm sm:text-base text-brandOrange">
                  Viewer Growth
                </h3>
                <div className="flex items-center text-xs text-brandOrange">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +24.3% vs. previous period
                </div>
              </div>
              <div className="h-[250px] sm:h-[300px] w-full">
                {isLoading ? (
                  <ChartSkeleton />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={viewerData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorViewer"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#FF7F30"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#FF7F30"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#333"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#A6A6A6" }}
                        fontSize={12}
                      />
                      <YAxis
                        tick={{ fill: "#A6A6A6" }}
                        fontSize={12}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111",
                          borderColor: "#FF7F30",
                        }}
                        itemStyle={{ color: "#FF7F30" }}
                        labelStyle={{ color: "#A6A6A6" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#FF7F30"
                        fillOpacity={1}
                        fill="url(#colorViewer)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="mt-0">
            <div className="rounded-lg bg-brandBlack p-3 sm:p-4 border-2 border-brandOrange">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-1">
                <h3 className="font-medium text-sm sm:text-base text-brandOrange">
                  Engagement Metrics
                </h3>
                <div className="flex items-center text-xs text-brandOrange">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +18.7% vs. previous period
                </div>
              </div>
              <div className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={engagementData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#333"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#A6A6A6" }}
                      fontSize={12}
                    />
                    <YAxis
                      tick={{ fill: "#A6A6A6" }}
                      fontSize={12}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111",
                        borderColor: "#FF7F30",
                      }}
                      itemStyle={{ color: "#FF7F30" }}
                      labelStyle={{ color: "#A6A6A6" }}
                    />
                    <Legend />
                    <Bar dataKey="comments" fill="#FF7F30" name="Comments" />
                    <Bar dataKey="likes" fill="#FF7F30" name="Likes" />
                    <Bar dataKey="shares" fill="#FF7F30" name="Shares" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="mt-0">
            <div className="rounded-lg bg-brandBlack p-3 sm:p-4 border-2 border-brandOrange">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-1">
                <h3 className="font-medium text-sm sm:text-base text-brandOrange">
                  Revenue Trends
                </h3>
                <div className="flex items-center text-xs text-brandOrange">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +15.4% vs. previous period
                </div>
              </div>
              <div className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#333"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#A6A6A6" }}
                      fontSize={12}
                    />
                    <YAxis
                      tick={{ fill: "#A6A6A6" }}
                      fontSize={12}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111",
                        borderColor: "#FF7F30",
                      }}
                      itemStyle={{ color: "#FF7F30" }}
                      labelStyle={{ color: "#A6A6A6" }}
                      formatter={(value) => [`$${value}`, "Revenue"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#FF7F30"
                      dot={{ stroke: "#FF7F30", strokeWidth: 2, r: 4 }}
                      activeDot={{ stroke: "#FF7F30", strokeWidth: 2, r: 6 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-0">
            <div className="rounded-lg bg-brandBlack p-3 sm:p-4 border-2 border-brandOrange">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-1">
                <h3 className="font-medium text-sm sm:text-base text-brandOrange">
                  Stream Categories
                </h3>
                <div className="flex items-center text-xs text-brandGray">
                  <span className="mr-2">Total streams: 32</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-[250px] sm:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#FF7F30"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {categoryData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111",
                          borderColor: "#FF7F30",
                        }}
                        itemStyle={{ color: "#FF7F30" }}
                        formatter={(value) => [`${value}%`, "Percentage"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="p-4 bg-brandBlack/50 rounded-lg">
                  <h4 className="font-medium mb-3 text-sm text-brandGray">
                    Category Breakdown
                  </h4>
                  <div className="space-y-3">
                    {categoryData.map((category, index) => (
                      <div key={category.name} className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-sm mr-2"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        ></div>
                        <div className="flex-1 text-sm text-brandGray">
                          <div className="flex justify-between mb-1">
                            <span className="truncate">{category.name}</span>
                            <span className="font-medium">
                              {category.value}%
                            </span>
                          </div>
                          <div className="w-full bg-brandBlack rounded-full h-1.5">
                            <div
                              className="rounded-full h-1.5"
                              style={{
                                width: `${category.value}%`,
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent border-brandGray text-brandGray"
                    >
                      View Full Report
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
