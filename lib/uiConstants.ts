// Dashboard Constants
export const STREAM_CATEGORIES = [
  "Fitness Coaching",
  "Workout Tutorials",
  "Nutrition Advice",
  "Weight Loss Journey",
  "Bodybuilding",
  "Yoga & Wellness",
];

export const STREAM_TAGS = [
  "Strength",
  "Cardio",
  "Flexibility",
  "Weight Loss",
  "Muscle Gain",
  "Endurance",
  "Core",
  "Balance",
];

export const DASHBOARD_METRICS_DATA = [
  { month: "Feb", streams: 80, viewers: 220, earnings: 650 },
  { month: "Mar", streams: 100, viewers: 280, earnings: 850 },
  { month: "Apr", streams: 127, viewers: 340, earnings: 1020 },
  { month: "May", streams: 900, viewers: 300, earnings: 950 },
  { month: "Jun", streams: 1100, viewers: 320, earnings: 1100 },
];

// Streaming Page Constants
export const MOCK_STREAMERS = [
  {
    name: "Alex Fitness",
    quote: "&ldquo;Let&rsquo;s get burning guys!&rdquo;",
    tags: ["Legs", "Arms", "Back"],
    followers: 15400,
    specialty: "HIIT",
    imageUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Emma Strength",
    quote: "&ldquo;Fitness is a lifestyle!&rdquo;",
    tags: ["Cardio", "Core", "Arms"],
    followers: 22100,
    specialty: "Pilates",
    imageUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Jake Power",
    quote: "&ldquo;Push your limits!&rdquo;",
    tags: ["Legs", "Back", "Strength"],
    followers: 18750,
    specialty: "Bodybuilding",
    imageUrl: "https://randomuser.me/api/portraits/men/85.jpg",
  },
];

export const DISCOVER_STREAMERS = [
  {
    name: "Sarah Flex",
    quote: "&ldquo;Transform your body, transform your life!&rdquo;",
    tags: ["Yoga", "Pilates", "Core"],
    followers: 12500,
    specialty: "Flexibility",
    imageUrl: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    name: "Mike Muscle",
    quote: "&ldquo;Strength is a skill!&rdquo;",
    tags: ["Strength", "Weightlifting", "Arms"],
    followers: 19800,
    specialty: "Bodybuilding",
    imageUrl: "https://randomuser.me/api/portraits/men/22.jpg",
  },
  {
    name: "Lisa Cardio",
    quote: "&ldquo;Every step counts!&rdquo;",
    tags: ["Cardio", "Running", "HIIT"],
    followers: 16700,
    specialty: "Endurance",
    imageUrl: "https://randomuser.me/api/portraits/women/79.jpg",
  },
  {
    name: "Tom Core",
    quote: "&ldquo;Core is the foundation!&rdquo;",
    tags: ["Core", "Abs", "Stability"],
    followers: 14300,
    specialty: "Core Training",
    imageUrl: "https://randomuser.me/api/portraits/men/44.jpg",
  },
  {
    name: "Elena Balance",
    quote: "&ldquo;Find your balance!&rdquo;",
    tags: ["Yoga", "Balance", "Meditation"],
    followers: 11900,
    specialty: "Mind-Body",
    imageUrl: "https://randomuser.me/api/portraits/women/33.jpg",
  },
  {
    name: "Carlos Power",
    quote: "&ldquo;Push beyond limits!&rdquo;",
    tags: ["Strength", "CrossFit", "Conditioning"],
    followers: 20500,
    specialty: "Performance",
    imageUrl: "https://randomuser.me/api/portraits/men/67.jpg",
  },
];

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
