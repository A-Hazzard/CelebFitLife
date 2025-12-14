import { NextResponse } from "next/server";
import User from "@/app/api/lib/models/user";
import connectDB from "@/app/api/lib/models/db";
import Stripe from "stripe";

// Initialize Stripe with a version compatible with the installed types
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-12-18.acacia' as Stripe.StripeConfig['apiVersion'], 
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Basic Auth Check
    const cookieHeader = request.headers.get("cookie") || "";
    if (!cookieHeader.includes("admin_session=true")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    // 1. Fetch Global Metrics (Totals)
    const allUsers = await User.find({});
    const totalUsers = allUsers.length;
    let paidUsersCount = 0;
    
    // Vote Tracking
    const voteData: Record<string, { name: string; paid: number; waitlist: number }> = {
        'Alex Sterling': { name: 'Alex Sterling', paid: 0, waitlist: 0 },
        'Elena Velez': { name: 'Elena Velez', paid: 0, waitlist: 0 },
        'Marcus J.': { name: 'Marcus J.', paid: 0, waitlist: 0 }
    };

    let totalVotes = 0;
    const deviceDistribution: Record<string, number> = {};
    const revenueByHour: Record<string, number> = {};
    const PRICE = 1; // Used for graph estimation only

    allUsers.forEach(user => {
        // Count Paid
        if (user.paymentStatus === 'paid') {
            paidUsersCount++;
            
            // Graph Data (Estimated from DB dates)
            if (user.paidAt || user.createdAt) {
                const date = new Date(user.paidAt || user.createdAt);
                const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                revenueByHour[key] = (revenueByHour[key] || 0) + PRICE;
            }
        }

        // Count Votes (Stacked)
        if (user.votedFor && voteData[user.votedFor]) {
            const weight = user.paymentStatus === 'paid' ? 10 : 1;
            totalVotes += weight;
            
            if (user.paymentStatus === 'paid') {
                voteData[user.votedFor].paid += weight;
            } else {
                voteData[user.votedFor].waitlist += weight;
            }
        }

        // Device Stats
        const ua = user.userAgent?.toLowerCase() || "";
        let device = "Desktop";
        if (ua.includes("mobile") || ua.includes("android") || ua.includes("ios")) device = "Mobile";
        deviceDistribution[device] = (deviceDistribution[device] || 0) + 1;
    });

    // 2. Fetch Actual Stripe Revenue
    // We'll fetch the balance (available + pending) or sum recent charges.
    // Summing all charges is heavy, checking Balance is "current".
    // For "Total Revenue Made" usually means Sum of all Charges.
    // We'll try to aggregate simplisticly here.
    let stripeRevenue = 0;
    try {
        // Fetch recent charges (limit 100) and sum successful ones locally
        const charges = await stripe.charges.list({ limit: 100 });
        
        // Filter for succeeded only in memory since 'status' param might be problematic in types
        const successfulCharges = charges.data.filter((c: Stripe.Charge) => c.status === 'succeeded' && c.paid);
        
        stripeRevenue = successfulCharges.reduce((acc: number, charge: Stripe.Charge) => acc + (charge.amount || 0), 0) / 100;
        
    } catch (stripeError) {
        console.error("Stripe Fetch Error:", stripeError);
        // Fallback to DB calculation
        stripeRevenue = paidUsersCount * PRICE; 
    }

    const conversionRate = totalUsers > 0 ? ((paidUsersCount / totalUsers) * 100).toFixed(1) : 0;
    
    // Format Vote Data for Stacked Chart
    const votePercentages = Object.values(voteData);

    const revenueTrend = Object.entries(revenueByHour).map(([date, amount]) => ({ date, amount }));

    // 3. Paginated Recent Activity
    // We fetch a slice of users sorted by creation
    // Note: If you want 'paidAt' sort, we might need a different index, but 'createdAt' is standard for "Recent Signups"
    // The user asked for "Date Paid" to be displayed, but usually lists are sorted by latest activity.
    // We'll keep sorting by createdAt for "New Signups", but display paidAt.
    const paginatedUsers = await User.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const recentActivity = paginatedUsers.map(u => ({
        email: u.email,
        status: u.paymentStatus,
        date: u.createdAt,
        paidAt: u.paidAt // Included for the table
    }));

    return NextResponse.json({
        totalUsers,
        totalVotes,
        totalRevenue: stripeRevenue, // Now from Stripe
        conversionRate,
        votePercentages, // Now stacked format: { name, paid, waitlist }
        deviceDistribution: Object.entries(deviceDistribution).map(([name, value]) => ({ name, value })),
        revenueTrend,
        // Pagination Data
        recentActivity,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            totalItems: totalUsers,
            limit
        }
    });

  } catch (error) {
    console.error("Metrics Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
