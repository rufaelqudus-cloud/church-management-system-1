import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outDir = "/Users/mussiekifleyesus/Documents/Codex/2026-06-04/files-mentioned-by-the-user-kidus/new_church_system/outputs";
await fs.mkdir(outDir, { recursive: true });

const wb = Workbook.create();
const dashboard = wb.worksheets.add("Dashboard");
const members = wb.worksheets.add("Members");
const payments = wb.worksheets.add("Membership Payments");
const expenses = wb.worksheets.add("Expenses");
const notes = wb.worksheets.add("Setup Notes");

const green = "#1f7a3a";
const lightGreen = "#eaf4ea";
const lightGray = "#f3f4f6";
const dark = "#1f2937";

function title(sheet, range, text) {
  sheet.getRange(range).merge();
  const r = sheet.getRange(range);
  r.values = [[text]];
  r.format = {
    fill: green,
    font: { bold: true, color: "#ffffff", size: 14 },
    horizontalAlignment: "center",
    verticalAlignment: "middle",
  };
}

function header(sheet, range) {
  sheet.getRange(range).format = {
    fill: lightGray,
    font: { bold: true, color: dark },
    horizontalAlignment: "center",
    verticalAlignment: "middle",
    wrapText: true,
  };
}

function widths(sheet, widthsByCol) {
  for (const [col, width] of Object.entries(widthsByCol)) {
    sheet.getRange(`${col}:${col}`).format.columnWidthPx = width;
  }
}

// Members
title(members, "A1:G1", "Church Members");
members.getRange("A2:G2").values = [[
  "Member ID", "Full Name", "Phone Number", "City", "Join Date", "Status", "Notes"
]];
header(members, "A2:G2");
members.freezePanes.freezeRows(2);
members.tables.add("A2:G1000", true, "MembersTable");
members.getRange("E3:E1000").setNumberFormat("yyyy-mm-dd");
members.getRange("F3:F1000").dataValidation = { rule: { type: "list", values: ["Active", "Inactive"] } };
widths(members, { A: 130, B: 220, C: 150, D: 140, E: 120, F: 120, G: 260 });

// Payments
title(payments, "A1:K1", "Membership Payments");
payments.getRange("A2:K2").values = [[
  "Transaction ID", "Payment Date", "Member ID", "Member Name", "Payment Type", "Year", "Amount",
  "Payment Reason", "Payment Method", "Recorded By", "Notes"
]];
header(payments, "A2:K2");
payments.freezePanes.freezeRows(2);
payments.tables.add("A2:K1000", true, "PaymentsTable");
payments.getRange("B3:B1000").setNumberFormat("yyyy-mm-dd");
payments.getRange("G3:G1000").setNumberFormat("€#,##0.00");
payments.getRange("E3:E1000").dataValidation = { rule: { type: "list", values: ["Yearly"] } };
payments.getRange("H3:H1000").dataValidation = { rule: { type: "list", values: [
  "Membership", "Buying Church", "Voluntary", "Wedding", "Epiphany", "Other"
] } };
payments.getRange("I3:I1000").dataValidation = { rule: { type: "list", values: ["Cash", "Bank Transfer"] } };
widths(payments, { A: 150, B: 120, C: 130, D: 200, E: 120, F: 90, G: 120, H: 160, I: 140, J: 140, K: 260 });

// Expenses
title(expenses, "A1:F1", "Expenses");
expenses.getRange("A2:F2").values = [[
  "Expense Date", "Category", "Description", "Amount", "Recorded By", "Notes"
]];
header(expenses, "A2:F2");
expenses.freezePanes.freezeRows(2);
expenses.tables.add("A2:F1000", true, "ExpensesTable");
expenses.getRange("A3:A1000").setNumberFormat("yyyy-mm-dd");
expenses.getRange("D3:D1000").setNumberFormat("€#,##0.00");
expenses.getRange("B3:B1000").dataValidation = { rule: { type: "list", values: [
  "General", "Rent", "Utilities", "Maintenance", "Events", "Charity", "Supplies", "Other"
] } };
widths(expenses, { A: 130, B: 150, C: 300, D: 120, E: 160, F: 260 });

// Dashboard
dashboard.showGridLines = false;
title(dashboard, "A1:H1", "Church Management Dashboard");
dashboard.getRange("A3:B7").values = [
  ["Selected Year", 2026],
  ["Total Active Members", null],
  ["Total Income", null],
  ["Total Expenses", null],
  ["Net Balance", null],
];
dashboard.getRange("B4").formulas = [["=COUNTIF(Members!F3:F1000,\"Active\")"]];
dashboard.getRange("B5").formulas = [["=SUMIFS('Membership Payments'!G3:G1000,'Membership Payments'!F3:F1000,$B$3)"]];
dashboard.getRange("B6").formulas = [["=SUMIFS(Expenses!D3:D1000,Expenses!A3:A1000,\">=\"&DATE($B$3,1,1),Expenses!A3:A1000,\"<\"&DATE($B$3+1,1,1))"]];
dashboard.getRange("B7").formulas = [["=B5-B6"]];
dashboard.getRange("A3:A7").format = { font: { bold: true }, fill: lightGray };
dashboard.getRange("B5:B7").setNumberFormat("€#,##0.00");
dashboard.getRange("B3:B7").format = { fill: lightGreen, font: { bold: true } };

dashboard.getRange("A10:B13").values = [
  ["Yearly Income Summary", "Amount"],
  ["Membership payments", null],
  ["Service / other payments", null],
  ["Total income", null],
];
header(dashboard, "A10:B10");
dashboard.getRange("B11").formulas = [["=SUMIFS('Membership Payments'!$G$3:$G$1000,'Membership Payments'!$F$3:$F$1000,$B$3,'Membership Payments'!$H$3:$H$1000,\"Membership\")"]];
dashboard.getRange("B12").formulas = [["0"]];
dashboard.getRange("B13").formulas = [["=B11+B12"]];
dashboard.getRange("B11:B13").setNumberFormat("€#,##0.00");

dashboard.getRange("D3:H3").values = [["Unpaid Members For Year", "", "", "", ""]];
dashboard.getRange("D3:H3").merge();
dashboard.getRange("D4:H4").values = [["Member ID", "Full Name", "Phone", "Registration Year", "Balance Due"]];
header(dashboard, "D4:H4");
dashboard.getRange("D5").formulas = [[
  "=IFERROR(FILTER({Members!A3:A1000,Members!B3:B1000,Members!C3:C1000,YEAR(Members!E3:E1000),60},Members!F3:F1000=\"Active\",YEAR(Members!E3:E1000)<=B3,COUNTIFS('Membership Payments'!C3:C1000,Members!A3:A1000,'Membership Payments'!F3:F1000,B3,'Membership Payments'!H3:H1000,\"Membership\")=0),\"All active members paid for this year\")"
]];

dashboard.getRange("D15:H15").values = [["Recent Payments", "", "", "", ""]];
dashboard.getRange("D15:H15").merge();
dashboard.getRange("D16:H16").values = [["Date", "Member", "Payment Type", "Year", "Amount"]];
header(dashboard, "D16:H16");
dashboard.getRange("D17").formulas = [[
  "=IFERROR(QUERY('Membership Payments'!B3:H1000,\"select B,D,E,F,G where A is not null order by B desc limit 8\",0),\"No payments yet\")"
]];

dashboard.getRange("D28:H28").values = [["Recent Expenses", "", "", "", ""]];
dashboard.getRange("D28:H28").merge();
dashboard.getRange("D29:H29").values = [["Date", "Category", "Description", "Amount", "Recorded By"]];
header(dashboard, "D29:H29");
dashboard.getRange("D30").formulas = [[
  "=IFERROR(QUERY(Expenses!A3:E1000,\"select A,B,C,D,E where A is not null order by A desc limit 8\",0),\"No expenses yet\")"
]];
dashboard.getRange("A1:H40").format.wrapText = true;
widths(dashboard, { A: 190, B: 140, C: 24, D: 130, E: 190, F: 130, G: 120, H: 160 });

// Setup Notes
title(notes, "A1:F1", "Setup Notes");
notes.getRange("A3:F22").values = [
  ["Purpose", "Professional church member, payment, expense, and transparency system.", "", "", "", ""],
  ["Currency", "Euro (€), suitable for Germany.", "", "", "", ""],
  ["Adding members", "Use the Members tab or the Apps Script sidebar Add Member form.", "", "", "", ""],
  ["Adding payments", "Use Membership Payments or sidebar Add Payment. Use one row per paid year.", "", "", "", ""],
  ["Adding expenses", "Use Expenses or sidebar Add Expense. Keep descriptions clear.", "", "", "", ""],
  ["Dropdowns", "Status, payment type, year, payment reason, payment method, and expense category have dropdowns.", "", "", "", ""],
  ["Dashboard", "Dashboard formulas update automatically from Members, Membership Payments, and Expenses.", "", "", "", ""],
  ["Protected cells", "Dashboard and formula ranges should be protected so users do not delete formulas.", "", "", "", ""],
  ["Admin login", "Default Apps Script setup creates username admin and password change-me in Script Properties.", "", "", "", ""],
  ["Mobile access", "Deploy the Apps Script as a web app, then share the web app URL or QR code with approved admins.", "", "", "", ""],
  ["Security", "Only share the spreadsheet and web app with approved church committee admins.", "", "", "", ""],
  ["Tigrinya labels", "English labels are used now; labels can be translated later without changing the data structure.", "", "", "", ""],
];
notes.getRange("A3:A22").format = { font: { bold: true }, fill: lightGray };
widths(notes, { A: 170, B: 520, C: 50, D: 50, E: 50, F: 50 });

// General polish
for (const s of [members, payments, expenses, dashboard, notes]) {
  s.getUsedRange()?.format.autofitRows();
}

const check = await wb.inspect({
  kind: "table",
  range: "Dashboard!A1:H35",
  include: "values,formulas",
  tableMaxRows: 35,
  tableMaxCols: 8,
  maxChars: 7000,
});
console.log(check.ndjson);

const errors = await wb.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

const xlsx = await SpreadsheetFile.exportXlsx(wb);
const outputPath = `${outDir}/church_management_system_germany.xlsx`;
await xlsx.save(outputPath);
console.log(outputPath);
