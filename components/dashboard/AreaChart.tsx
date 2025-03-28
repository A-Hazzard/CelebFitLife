"use client";

import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// Define the type for the metrics data
interface MetricsData {
  month: string;
  streams: number;
  viewers: number;
  earnings: number;
}

// Props interface for the component
interface DashboardAreaChartProps {
  data: MetricsData[];
}

export default function DashboardAreaChart({ data }: DashboardAreaChartProps) {
  return (
    <div className="w-full h-[400px] bg-gray-900 rounded-lg p-4 shadow-lg">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff7f30" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ff7f30" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              color: '#ffffff', 
              borderRadius: '8px' 
            }} 
            labelStyle={{ color: '#ff7f30' }}
          />
          <Area 
            type="monotone" 
            dataKey="streams" 
            stroke="#ff7f30" 
            fillOpacity={1} 
            fill="url(#colorStreams)" 
          />
          <Area 
            type="monotone" 
            dataKey="viewers" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorViewers)" 
          />
          <Area 
            type="monotone" 
            dataKey="earnings" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorEarnings)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}