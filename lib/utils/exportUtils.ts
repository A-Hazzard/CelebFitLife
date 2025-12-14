/**
 * Export Utilities for CelebFitLife Dashboard
 *
 * Comprehensive utility functions for exporting dashboard data to PDF and Excel formats.
 * Features:
 * - PDF export with branding and structured tables
 * - Excel export with proper formatting
 * - Summary metrics and analytical reports
 * - CelebFitLife branding with logo
 *
 * @module lib/utils/exportUtils
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import axios from 'axios';

// ============================================================================
// Types
// ============================================================================

export type DashboardExportData = {
  totalUsers: number;
  totalVotes: number;
  totalRevenue: number;
  conversionRate: string | number;
  votePercentages: Array<{ name: string; paid: number; waitlist: number }>;
  deviceDistribution: Array<{ name: string; value: number }>;
  revenueTrend: Array<{ date: string; amount: number }>;
};

// ============================================================================
// Logo Helper
// ============================================================================

/**
 * Loads the CelebFitLife logo and converts it to base64
 * @returns Promise<string> - Base64 data URL of the logo
 */
async function getCelebFitLifeLogoBase64(): Promise<string> {
  try {
    const response = await axios.get('/logo.png', {
      responseType: 'blob',
    });
    const blob = response.data;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Could not load CelebFitLife logo:', error);
    return '';
  }
}

// ============================================================================
// PDF Export
// ============================================================================

/**
 * Exports dashboard metrics as a styled PDF report
 * @param data - Dashboard metrics data
 */
export async function exportDashboardPDF(data: DashboardExportData): Promise<void> {
  const doc = new jsPDF();

  // Add logo
  try {
    const logoBase64 = await getCelebFitLifeLogoBase64();
    if (logoBase64) {
      // Only specify width to preserve aspect ratio (no stretching)
      // Setting height to 0 lets jsPDF auto-calculate based on aspect ratio
      doc.addImage(logoBase64, 'PNG', 15, 15, 50, 0);
    }
  } catch (error) {
    console.warn('Could not add logo to PDF:', error);
  }

  // Title - Right aligned
  doc.setFontSize(20);
  doc.setTextColor(255, 102, 0); // Orange (#FF6600)
  const titleText = 'CelebFitLife Analytics Report';
  const titleWidth = doc.getTextWidth(titleText);
  doc.text(titleText, doc.internal.pageSize.width - titleWidth - 15, 40);

  // Metadata with readable date format - Right aligned
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const generatedAt = format(new Date(), 'MMMM d, yyyy, h:mm:ss a');
  const generatedAtText = `Generated at: ${generatedAt}`;
  const generatedAtWidth = doc.getTextWidth(generatedAtText);
  doc.text(generatedAtText, doc.internal.pageSize.width - generatedAtWidth - 15, 50);
  const dashboardText = 'CelebFitLife Executive Dashboard';
  const dashboardTextWidth = doc.getTextWidth(dashboardText);
  doc.text(dashboardText, doc.internal.pageSize.width - dashboardTextWidth - 15, 56);

  let yPosition = 60;

  // ============================================================================
  // Key Metrics Summary
  // ============================================================================
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Key Metrics Summary', 15, yPosition);
  yPosition += 10;

  const conversionRateStr = typeof data.conversionRate === 'string' ? data.conversionRate : data.conversionRate.toFixed(1);
  const summaryData = [
    ['Total Users', data.totalUsers.toLocaleString()],
    ['Total Revenue', `$${data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    ['Conversion Rate', `${conversionRateStr}%`],
    ['Total Votes', data.totalVotes.toLocaleString()],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [255, 102, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10 },
    margin: { left: 15, right: 15 },
  });

  yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // ============================================================================
  // Voting Distribution
  // ============================================================================
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Voting Distribution', 15, yPosition);
  yPosition += 10;

  const voteData = data.votePercentages.map(vote => [
    vote.name,
    vote.paid.toString(),
    vote.waitlist.toString(),
    (vote.paid + vote.waitlist).toString(),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Trainer', 'Paid Votes', 'Waitlist Votes', 'Total Votes']],
    body: voteData,
    theme: 'striped',
    headStyles: { fillColor: [255, 102, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9 },
    margin: { left: 15, right: 15 },
  });

  yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // ============================================================================
  // Device Distribution
  // ============================================================================
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Device Distribution', 15, yPosition);
  yPosition += 10;

  const deviceData = data.deviceDistribution.map(device => [
    device.name,
    device.value.toString(),
    `${((device.value / data.totalUsers) * 100).toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Device Type', 'Count', 'Percentage']],
    body: deviceData,
    theme: 'striped',
    headStyles: { fillColor: [255, 102, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9 },
    margin: { left: 15, right: 15 },
  });

  yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // ============================================================================
  // Revenue Trend (Last 10 entries)
  // ============================================================================
  if (data.revenueTrend.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Revenue Trend (Recent)', 15, yPosition);
    yPosition += 10;

    // Show last 10 entries to fit on page
    const recentRevenue = data.revenueTrend.slice(-10);
    const revenueData = recentRevenue.map(entry => [
      entry.date,
      `$${entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Revenue']],
      body: revenueData,
      theme: 'striped',
      headStyles: { fillColor: [255, 102, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9 },
      margin: { left: 15, right: 15 },
      columnStyles: {
        1: { halign: 'right' }, // Right align revenue amounts
      },
    });
  }

  // ============================================================================
  // Footer
  // ============================================================================
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(127, 140, 141);
    doc.text(
      `Page ${i} of ${pageCount} | CelebFitLife Analytics`,
      15,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      generatedAt,
      doc.internal.pageSize.width - (doc.getTextWidth(generatedAt) + 15),
      doc.internal.pageSize.height - 10
    );
  }

  // Save the PDF
  const fileName = `celebfitlife-analytics-${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.pdf`;
  doc.save(fileName);
}

// ============================================================================
// Excel Export
// ============================================================================

/**
 * Exports dashboard metrics as a formatted Excel file
 * @param data - Dashboard metrics data
 */
export function exportDashboardExcel(data: DashboardExportData): void {
  const workbook = XLSX.utils.book_new();

  // ============================================================================
  // Summary Sheet
  // ============================================================================
  const summarySheet = [
    ['CelebFitLife Analytics Report'],
    [''],
    [`Generated at: ${format(new Date(), 'MMMM d, yyyy, h:mm:ss a')}`],
    [''],
    ['Key Metrics Summary'],
    ['Metric', 'Value'],
    ['Total Users', data.totalUsers],
    ['Total Revenue', data.totalRevenue],
    ['Conversion Rate', typeof data.conversionRate === 'string' ? `${data.conversionRate}%` : `${data.conversionRate.toFixed(1)}%`],
    ['Total Votes', data.totalVotes],
    [''],
    ['Voting Distribution'],
    ['Trainer', 'Paid Votes', 'Waitlist Votes', 'Total Votes'],
    ...data.votePercentages.map(vote => [
      vote.name,
      vote.paid,
      vote.waitlist,
      vote.paid + vote.waitlist,
    ]),
    [''],
    ['Device Distribution'],
    ['Device Type', 'Count', 'Percentage'],
    ...data.deviceDistribution.map(device => [
      device.name,
      device.value,
      `${((device.value / data.totalUsers) * 100).toFixed(1)}%`,
    ]),
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheet);

  // Set column widths for summary sheet
  wsSummary['!cols'] = [
    { wch: 25 }, // Metric/Trainer/Device Type
    { wch: 15 }, // Value/Paid Votes/Count
    { wch: 15 }, // Waitlist Votes/Percentage
    { wch: 15 }, // Total Votes
  ];

  // Format revenue as currency
  const revenueCell = XLSX.utils.encode_cell({ r: 6, c: 1 }); // Row 6 (Total Revenue), Column 1 (Value)
  if (wsSummary[revenueCell]) {
    wsSummary[revenueCell].z = '$#,##0.00';
  }

  // Format numbers in voting distribution
  data.votePercentages.forEach((_, index) => {
    const rowIndex = 13 + index; // Starting at row 13
    ['B', 'C', 'D'].forEach((col) => {
      const cellAddress = `${col}${rowIndex + 1}`;
      if (wsSummary[cellAddress]) {
        wsSummary[cellAddress].z = '#,##0';
      }
    });
  });

  // Format numbers in device distribution
  data.deviceDistribution.forEach((_, index) => {
    const rowIndex = 14 + data.votePercentages.length + index; // After voting section
    const cellAddress = `B${rowIndex + 1}`;
    if (wsSummary[cellAddress]) {
      wsSummary[cellAddress].z = '#,##0';
    }
  });

  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Summary');

  // ============================================================================
  // Revenue Trend Sheet
  // ============================================================================
  if (data.revenueTrend.length > 0) {
    const revenueSheet = [
      ['Revenue Trend'],
      [''],
      ['Date', 'Revenue'],
      ...data.revenueTrend.map(entry => [
        entry.date,
        entry.amount,
      ]),
    ];

    const wsRevenue = XLSX.utils.aoa_to_sheet(revenueSheet);

    // Set column widths
    wsRevenue['!cols'] = [
      { wch: 20 }, // Date
      { wch: 15 }, // Revenue
    ];

    // Format revenue column as currency
    data.revenueTrend.forEach((_, index) => {
      const cellAddress = `B${index + 4}`; // Starting at row 4 (0-indexed + 1)
      if (wsRevenue[cellAddress]) {
        wsRevenue[cellAddress].z = '$#,##0.00';
      }
    });

    XLSX.utils.book_append_sheet(workbook, wsRevenue, 'Revenue Trend');
  }

  // ============================================================================
  // Save Excel File
  // ============================================================================
  const fileName = `celebfitlife-analytics-${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

