"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { Download, Users, Vote, DollarSign, TrendingUp, LogOut, Info, ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";
import { useRouter } from "next/navigation";
import { exportDashboardPDF, exportDashboardExcel } from "@/lib/utils/exportUtils";

// Types
type MetricsData = {
  totalUsers: number;
  totalVotes: number;
  totalRevenue: number;
  conversionRate: number;
  // votePercentages now contains objects like { name: 'Alex', paid: 10, waitlist: 5 }
  votePercentages: Array<{ name: string; paid: number; waitlist: number }>; 
  deviceDistribution: Array<{ name: string; value: number }>;
  recentActivity: Array<{ email: string; status: string; date: string; paidAt?: string }>; 
  revenueTrend: Array<{ date: string; amount: number }>;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
};

export default function AdminDashboard() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const router = useRouter();

  // Check authentication status before rendering
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/auth-check");
        const data = await res.json();
        
        if (!data.authenticated) {
          router.push("/admin/login");
          return;
        }
        
        setCheckingAuth(false);
      } catch (err) {
        console.error("Auth check error:", err);
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [router]);

  const fetchMetrics = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/metrics?page=${pageNum}&limit=${limit}`);
      if (res.status === 401) {
          router.push("/admin/login");
          return;
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [limit, router]);

  useEffect(() => {
    fetchMetrics(page);
    // Poll every 60s for updates without resetting page ideally, but for now simple poll
    const interval = setInterval(() => fetchMetrics(page), 60000); 
    return () => clearInterval(interval);
  }, [fetchMetrics, page]);

  const handleExportPDF = async () => {
    if (!data) {
      alert("No data available to export");
      return;
    }

    try {
      console.log("Starting PDF Export...");
      await exportDashboardPDF({
        totalUsers: data.totalUsers,
        totalVotes: data.totalVotes,
        totalRevenue: data.totalRevenue,
        conversionRate: typeof data.conversionRate === 'string' ? data.conversionRate : String(data.conversionRate),
        votePercentages: data.votePercentages,
        deviceDistribution: data.deviceDistribution,
        revenueTrend: data.revenueTrend,
      });
      console.log("PDF Export Success");
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Failed to export PDF. Check console for details.");
    }
  };

  const handleExportExcel = () => {
    if (!data) {
      alert("No data available to export");
      return;
    }

    try {
      console.log("Starting Excel Export...");
      exportDashboardExcel({
        totalUsers: data.totalUsers,
        totalVotes: data.totalVotes,
        totalRevenue: data.totalRevenue,
        conversionRate: typeof data.conversionRate === 'string' ? data.conversionRate : String(data.conversionRate),
        votePercentages: data.votePercentages,
        deviceDistribution: data.deviceDistribution,
        revenueTrend: data.revenueTrend,
      });
      console.log("Excel Export Success");
    } catch (error) {
      console.error("Excel Export Error:", error);
      alert("Failed to export Excel. Check console for details.");
    }
  };

  const handleLogout = async () => {
      try {
        // Call logout API to clear server-side httpOnly cookie
        const res = await fetch("/api/admin/logout", {
          method: "POST",
          credentials: 'include', // Include cookies in request
        });
        
        if (res.ok) {
          // Redirect to login after successful logout
          router.push("/admin/login");
        } else {
          console.error("Logout failed");
          // Still redirect even if API call fails
          router.push("/admin/login");
        }
      } catch (error) {
        console.error("Logout error:", error);
        // Redirect to login even if there's an error
        router.push("/admin/login");
      }
  };
  
  const handlePageChange = (newPage: number) => {
      if (data?.pagination && newPage >= 1 && newPage <= data.pagination.totalPages) {
          setPage(newPage);
      }
  };

  // Don't render until auth check is complete
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (loading && !data) return (
    <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
    </div>
  );

  if (!data) return <div className="min-h-screen bg-black text-white p-8">Error loading data. Please try refreshing.</div>;

  const PIE_COLORS = ["#fb923c", "#3b82f6", "#ef4444"]; // Orange, Blue, Red

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-8 w-full">
        
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8 bg-gray-900/40 p-4 md:p-6 rounded-3xl border border-white/5 backdrop-blur-sm w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
            <div className="w-full md:w-auto">
              <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                  Executive Dashboard
              </h1>
              <p className="text-gray-400 mt-1 text-sm md:text-base">Real-time Performance & Growth Metrics</p>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer w-full md:w-auto justify-center md:justify-start"
            >
                <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
          
          {/* Mobile Export Select */}
          <div className="md:hidden w-full">
            <select
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'excel') {
                  handleExportExcel();
                } else if (value === 'pdf') {
                  handleExportPDF();
                }
                // Reset select after action
                e.target.value = '';
              }}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
            >
              <option value="">Export Dashboard...</option>
              <option value="excel">Export as Excel</option>
              <option value="pdf">Export as PDF</option>
            </select>
          </div>

          {/* Desktop Export Buttons */}
          <div className="hidden md:flex gap-3">
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-500 transition-colors shadow-lg shadow-green-600/20 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-lg shadow-white/5 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Total Revenue" 
            value={`$${data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
            icon={<DollarSign className="w-5 h-5 text-green-400" />} 
            change="Real-time from Stripe"
            trend="up"
            info="Total captured revenue from all paid memberships (Waitlist + Subscriptions)."
          />
          <MetricCard 
            title="Total Users" 
            value={data.totalUsers.toLocaleString()} 
            icon={<Users className="w-5 h-5 text-blue-400" />} 
            change="+12% growth"
            trend="up"
            info="Total number of registered users including both paid and waitlist status."
          />
          <MetricCard 
            title="Conversion Rate" 
            value={`${data.conversionRate}%`} 
            icon={<TrendingUp className="w-5 h-5 text-orange-400" />} 
            change="Above Industry Avg"
            trend="up"
            info="Percentage of total registered users who have converted to a paid membership."
          />
           <MetricCard 
            title="Total Votes" 
            value={data.totalVotes.toLocaleString()} 
            icon={<Vote className="w-5 h-5 text-purple-400" />} 
            change="High Engagement"
            trend="neutral"
            info="Weighted vote count. Paid members votes count significantly more than waitlist votes."
          />
        </div>

        {/* Revenue Trend - Line Chart */}
        <div className="bg-gray-900/40 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" /> Revenue Growth
            </h2>
            <div className="overflow-x-auto -mx-6 px-6">
                <div className="h-[300px] min-w-[600px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.revenueTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="date" stroke="#6b7280" tick={{fontSize: 12}} />
                            <YAxis stroke="#6b7280" tick={{fontSize: 12}} tickFormatter={(val) => `$${val}`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => [`$${value}`, "Revenue"]}
                            />
                            <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-8">
            {/* Voting Distribution - Stacked Chart */}
            <div className="bg-gray-900/40 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold">Vote Distribution (Stacked)</h2>
                    <div className="flex gap-4 text-xs flex-wrap">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-500 rounded-sm"></div> Paid Member</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-600 rounded-sm"></div> Waitlist</div>
                    </div>
                </div>
                {/* Desktop: Horizontal bars (vertical layout) */}
                <div className="hidden md:block">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.votePercentages} layout="vertical" margin={{ right: 20 }}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                                <XAxis type="number" stroke="#6b7280" tick={{fontSize: 12}} />
                                <YAxis type="category" dataKey="name" stroke="#6b7280" tick={{fontSize: 12}} width={100} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{fill: 'transparent'}}
                                />
                                {/* Stacked Bars */}
                                <Bar dataKey="waitlist" stackId="a" fill="#4b5563" radius={[0, 0, 0, 0]} name="Waitlist Vote" />
                                <Bar dataKey="paid" stackId="a" fill="#f97316" radius={[0, 6, 6, 0]} name="Paid Member Vote" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                {/* Mobile: Vertical bars (horizontal layout) */}
                <div className="block md:hidden">
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.votePercentages} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis 
                                    type="category" 
                                    dataKey="name" 
                                    stroke="#6b7280" 
                                    tick={{fontSize: 11}} 
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis type="number" stroke="#6b7280" tick={{fontSize: 12}} />
                            <Tooltip 
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                    cursor={{fill: 'transparent'}}
                                />
                                {/* Stacked Bars - vertical */}
                                <Bar dataKey="waitlist" stackId="a" fill="#4b5563" radius={[0, 0, 0, 0]} name="Waitlist Vote" />
                                <Bar dataKey="paid" stackId="a" fill="#f97316" radius={[6, 6, 0, 0]} name="Paid Member Vote" />
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Device/User Stats */}
            <div className="bg-gray-900/40 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-6">User Devices</h2>
                 <div className="h-[300px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.deviceDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.deviceDistribution.map((entry, index: number) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                 contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                 itemStyle={{ color: '#fff' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Recent Activity Table with Pagination */}
        <div className="bg-gray-900/40 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-6">Recent Signups</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                            <th className="pb-4 pl-4 font-medium">Email</th>
                            <th className="pb-4 font-medium">Status</th>
                            <th className="pb-4 font-medium">Joined Date</th>
                            <th className="pb-4 font-medium">Date Paid</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {data.recentActivity && data.recentActivity.map((user, i: number) => (
                            <tr key={i} className="border-b border-gray-800/50 last:border-0 hover:bg-white/5 transition-colors">
                                <td className="py-4 pl-4 font-medium text-gray-200">{user.email}</td>
                                <td className="py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                        user.status === 'paid' 
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                        : 'bg-gray-800 text-gray-400 border-gray-700'
                                    }`}>
                                        {user.status === 'paid' ? 'Paid Member' : 'Waitlist'}
                                    </span>
                                </td>
                                <td className="py-4 text-gray-500">{new Date(user.date).toLocaleDateString()}</td>
                                <td className="py-4 text-gray-500">
                                    {user.paidAt ? new Date(user.paidAt).toLocaleDateString() : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {data.pagination && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5 text-sm text-gray-400">
                    <div>
                        Showing <span className="text-white font-medium">{((page - 1) * limit) + 1}</span> to <span className="text-white font-medium">{Math.min(page * limit, data.pagination.totalItems)}</span> of <span className="text-white font-medium">{data.pagination.totalItems}</span>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="bg-white/5 hover:bg-white/10 p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="flex items-center px-4 font-medium bg-white/5 rounded-lg border border-white/5">
                            Page {page} of {data.pagination.totalPages}
                        </span>
                        <button 
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === data.pagination.totalPages}
                            className="bg-white/5 hover:bg-white/10 p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}

// Helper Components

type MetricCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change: string;
  trend?: 'up' | 'down' | 'neutral';
  info?: string;
};

function MetricCard({ title, value, icon, change, trend = 'neutral', info }: MetricCardProps) {
    const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';
    const trendBg = trend === 'up' ? 'bg-green-400/10' : trend === 'down' ? 'bg-red-400/10' : 'bg-gray-400/10';

    return (
        <div className="bg-gray-900/40 p-6 rounded-3xl border border-white/5 backdrop-blur-sm hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    {icon}
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${trendColor} ${trendBg} px-2 py-1 rounded-full`}>
                    {change}
                </span>
                    {info && <InfoTooltip text={info} />}
                </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        </div>
    )
}

function InfoTooltip({ text }: { text: string }) {
    return (
        <div className="relative group/tooltip">
            <Info className="w-4 h-4 text-gray-500 hover:text-white cursor-help transition-colors" />
            <div className="absolute right-0 top-full mt-2 w-48 p-3 bg-gray-800 text-xs text-gray-300 rounded-lg shadow-xl border border-white/10 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50">
                {text}
                {/* Arrow */}
                <div className="absolute top-[-4px] right-1 w-2 h-2 bg-gray-800 rotate-45 border-l border-t border-white/10"></div>
            </div>
        </div>
    );
}
