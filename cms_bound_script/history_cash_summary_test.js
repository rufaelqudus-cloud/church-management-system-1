function isInternalSavingsConversionPayment(row) {
  return String(row[15] || "") === "Savings Conversion" ||
    String(row[10] || "").indexOf("Auto-converted from savings deposit ") >= 0;
}

function memberHistoryFinanceSummary(membershipPayments, servicePayments, savingsHistory) {
  const round = value => Number(Number(value || 0).toFixed(2));
  const membershipApplied = round(membershipPayments.reduce((sum, row) => sum + (Number(row[6]) || 0), 0));
  const externalMembershipCash = round(membershipPayments
    .filter(row => !isInternalSavingsConversionPayment(row))
    .reduce((sum, row) => sum + (Number(row[6]) || 0), 0));
  const servicePaymentsTotal = round(servicePayments.reduce((sum, row) => sum + (Number(row[6]) || 0), 0));
  const savingsCreated = round(savingsHistory.reduce((sum, row) => sum + (Number(row[4]) || 0), 0));
  const savingsUsed = round(savingsHistory.reduce((sum, row) => sum + (Number(row[10]) || 0), 0));
  const savingsRemaining = round(savingsCreated - savingsUsed);
  return {
    totalCashReceived: round(externalMembershipCash + servicePaymentsTotal + savingsCreated),
    membershipApplied,
    savingsCreated,
    savingsUsed,
    savingsRemaining
  };
}

const membershipPayments = [
  ["TXN-2019-2021", "2026-01-01", "MEM-TEST", "Test Member", "Yearly", 2019, 180, "Membership", "Cash", "tester", ""],
  ["TXN-2022-2024", "2026-01-02", "MEM-TEST", "Test Member", "Yearly", 2022, 180, "Membership", "Cash", "tester", ""],
  ["TXN-2026", "2026-01-03", "MEM-TEST", "Test Member", "Yearly", 2026, 180, "Membership", "Cash", "tester", ""],
  ["TXN-SAV-CONV", "2026-01-04", "MEM-TEST", "Test Member", "Yearly", 2025, 60, "Membership", "Cash", "tester", "Auto-converted from savings deposit SAV-TEST", "No", "No", "", "", "Savings Conversion", "", "Internal Conversion"]
];

const savingsHistory = [
  ["SAV-239", "2026-01-01", "MEM-TEST", "Test Member", 59, "Cash", "tester", "Extra amount from membership payment TXN-2019-2021", 0, 59, 0, ""],
  ["SAV-181", "2026-01-02", "MEM-TEST", "Test Member", 1, "Cash", "tester", "Extra amount from membership payment TXN-2022-2024", 59, 0, 60, "TXN-SAV-CONV"],
  ["SAV-189", "2026-01-03", "MEM-TEST", "Test Member", 9, "Cash", "tester", "Extra amount from membership payment TXN-2026", 0, 9, 0, ""]
];

const expected = {
  totalCashReceived: 609,
  membershipApplied: 600,
  savingsCreated: 69,
  savingsUsed: 60,
  savingsRemaining: 9
};

const actual = memberHistoryFinanceSummary(membershipPayments, [], savingsHistory);
const failures = Object.keys(expected).filter(key => actual[key] !== expected[key]);
if (failures.length) {
  console.error(JSON.stringify({ ok: false, expected, actual, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, expected, actual }, null, 2));
