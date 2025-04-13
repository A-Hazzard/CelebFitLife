export const SLIDER_SETTINGS = {
  infinite: true,
  speed: 500,
  slidesToShow: 3,
  slidesToScroll: 1,
  centerMode: true,
  focusOnSelect: true,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 600,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
      },
    },
  ],
};

// Dashboard metrics data for the analytics cards
export const ANALYTICS_METRICS_DATA = [
  {
    label: "Total Views",
    value: "1.2K",
    change: "+12%",
    trend: "up",
  },
  {
    label: "Followers",
    value: "358",
    change: "+5%",
    trend: "up",
  },
  {
    label: "Stream Time",
    value: "24h",
    change: "+30%",
    trend: "up",
  },
  {
    label: "Engagement Rate",
    value: "4.8%",
    change: "-2%",
    trend: "down",
  },
];

// Data for the area chart that follows the MetricsData type
export const DASHBOARD_METRICS_DATA = [
  { month: "Jan", streams: 4, viewers: 45, earnings: 200 },
  { month: "Feb", streams: 6, viewers: 85, earnings: 380 },
  { month: "Mar", streams: 8, viewers: 120, earnings: 500 },
  { month: "Apr", streams: 12, viewers: 210, earnings: 650 },
  { month: "May", streams: 10, viewers: 185, earnings: 820 },
  { month: "Jun", streams: 15, viewers: 320, earnings: 1100 },
];
