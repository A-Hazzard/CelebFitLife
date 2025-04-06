// Remove unused imports
// import { Download, FileText, FileJson } from "lucide-react";

// Import the type definitions from the centralized types file
import { ExportFormat, StreamData } from "@/lib/types/dashboard";

// Sample data for export
const sampleStreamData: StreamData[] = [
  {
    id: "stream-1",
    title: "Morning Yoga Flow",
    date: new Date("2023-05-15T08:00:00"),
    duration: 45,
    viewers: 2341,
    likes: 876,
    comments: 142,
    category: "Yoga",
  },
  {
    id: "stream-2",
    title: "HIIT Workout Challenge",
    date: new Date("2023-05-17T18:30:00"),
    duration: 60,
    viewers: 3150,
    likes: 1240,
    comments: 215,
    category: "HIIT",
  },
  {
    id: "stream-3",
    title: "Nutrition for Athletes",
    date: new Date("2023-05-20T12:00:00"),
    duration: 75,
    viewers: 1890,
    likes: 702,
    comments: 193,
    category: "Nutrition",
  },
  {
    id: "stream-4",
    title: "Red Carpet Ready Routine",
    date: new Date("2023-05-22T17:00:00"),
    duration: 90,
    viewers: 4275,
    likes: 1875,
    comments: 328,
    category: "Fitness",
  },
  {
    id: "stream-5",
    title: "Mindfulness Meditation",
    date: new Date("2023-05-24T20:00:00"),
    duration: 30,
    viewers: 1560,
    likes: 528,
    comments: 97,
    category: "Mindfulness",
  },
];

// Convert data to CSV
const convertToCSV = (data: StreamData[]): string => {
  const headers = [
    "Title",
    "Date",
    "Duration (min)",
    "Viewers",
    "Likes",
    "Comments",
    "Category",
  ];
  const rows = data.map((stream) => [
    `"${stream.title}"`,
    stream.date.toLocaleDateString(),
    stream.duration.toString(),
    stream.viewers.toString(),
    stream.likes.toString(),
    stream.comments.toString(),
    `"${stream.category}"`,
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
};

// Convert data to JSON
const convertToJSON = (data: StreamData[]): string => {
  // Create a deep copy of the data to avoid modifying the original
  const processedData = data.map((stream) => ({
    ...stream,
    // Convert date to ISO string format
    date: stream.date.toISOString(),
  }));

  return JSON.stringify(processedData, null, 2);
};

// Export data in the specified format
export function exportStreamData(format: ExportFormat = "csv"): void {
  // Cannot use hooks at the top level outside of components
  // Replace with a simple console message
  try {
    // In a real app, you would filter data based on timeRange
    const data = sampleStreamData;

    let content = "";
    let filename = `stream-data-${new Date().toISOString().split("T")[0]}`;
    let type = "";

    if (format === "csv") {
      content = convertToCSV(data);
      filename += ".csv";
      type = "text/csv;charset=utf-8";
    } else {
      content = convertToJSON(data);
      filename += ".json";
      type = "application/json;charset=utf-8";
    }

    // Generate the appropriate file
    const blob = new Blob([content], { type });

    // Create a download link and trigger it
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);

    // Use alert instead of toast since we can't use hooks here
    console.log(`Export successful: Data exported as ${format.toUpperCase()}`);
  } catch (error) {
    console.error("Error exporting data:", error);
    alert(
      `Export failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
