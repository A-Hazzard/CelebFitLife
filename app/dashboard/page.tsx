"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import DashboardAreaChart from "@/components/dashboard/AreaChart";
import { Laptop, Users, Coins, Play } from "lucide-react";
import Loader from "@/components/dashboard/Loader";

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Redirect if user is not logged in
  useEffect(() => {
    if (!currentUser) {
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, [currentUser, router]);

  // Show loader while checking authentication
  if (loading) {
    return <Loader />;
  }

  // Metrics data for the chart
  const metricsData = [
    { month: "Jan", streams: 55, viewers: 150, earnings: 450 },
    { month: "Feb", streams: 80, viewers: 220, earnings: 650 },
    { month: "Mar", streams: 100, viewers: 280, earnings: 850 },
    { month: "Apr", streams: 127, viewers: 340, earnings: 1020 },
    { month: "May", streams: 900, viewers: 300, earnings: 950 },
    { month: "Jun", streams: 1100, viewers: 320, earnings: 1100 },
  ];

  const handleGoLive = () => {
    router.push("/dashboard/streams/new");
  };

  const statsCards = [
    {
      icon: <Laptop className="text-brandOrange text-4xl" />,
      title: "Total Streams",
      value: "12",
      bgClass: "bg-brandBlack border border-brandOrange/30",
    },
    {
      icon: <Users className="text-brandOrange text-4xl" />,
      title: "Total Viewers",
      value: "340",
      bgClass: "bg-brandBlack border border-brandOrange/30",
    },
    {
      icon: <Coins className="text-brandOrange text-4xl" />,
      title: "Monthly Earnings",
      value: "$1,020",
      bgClass: "bg-brandBlack border border-brandOrange/30",
    },
  ];

  if(loading){
    return <Loader />;
  }

  return (
      <div className="min-h-screen bg-brandBlack text-brandWhite p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-brandOrange">
            Welcome, {currentUser?.displayName || "Streamer"}
          </h1>
          <button
              onClick={handleGoLive}
              className="flex items-center gap-2 px-6 py-3 bg-brandOrange text-brandBlack
          rounded-full font-semibold hover:bg-opacity-90 transition-colors"
          >
            <Play className="text-2xl" />
            Go Live
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsCards.map((card, index) => (
              <div
                  key={index}
                  className={`p-6 rounded-xl ${card.bgClass} 
            flex items-center space-x-4 shadow-lg hover:scale-105 transition-transform`}
              >
                <div>{card.icon}</div>
                <div>
                  <h2 className="text-lg text-brandGray">{card.title}</h2>
                  <p className="text-3xl font-bold text-brandWhite">{card.value}</p>
                </div>
              </div>
          ))}
        </div>

        <div className="bg-brandBlack border border-brandOrange/30 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-brandOrange mb-6">
            Performance Overview
          </h2>
          <DashboardAreaChart data={metricsData} />
        </div>
      </div>
  );
}
