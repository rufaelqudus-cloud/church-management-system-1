function runDataIntegrityCheck(admin) {
  requirePermission_(admin, "viewReports");
  ensureTransactionInfrastructure_();
  ensureHandoverSheet_();
  ensureReceiptSheet_();
  const warnings = [];
  const memberIds = {};
  dataRows_(SHEETS.members).forEach(row => {
    const id = clean_(row[0]);
    if (id) memberIds[id] = true;
  });
  const paymentIds = {};
  dataRows_(SHEETS.payments).forEach(row => {
    const txId = clean_(row[0]);
    const memberId = clean_(row[2]);
    if (txId) paymentIds[txId] = true;
    if (txId) paymentIds[baseReceiptIdForPaymentId_(txId)] = true;
    if (!txId) warnings.push("Payment row is missing Transaction ID.");
    if (!memberId || !memberIds[memberId]) warnings.push("Payment " + (txId || "(blank)") + " references missing member: " + (memberId || "(blank)"));
    if (isSavingsConversionPaymentRow_(row) && !clean_(row[10]).match(/Auto-converted from savings deposit/i)) {
      warnings.push("Savings conversion payment " + txId + " is missing savings conversion note.");
    }
  });
  dataRows_(SHEETS.servicePayments).forEach(row => {
    const txId = clean_(row[0]);
    if (txId) paymentIds[txId] = true;
    if (txId) paymentIds[baseReceiptIdForPaymentId_(txId)] = true;
  });
  const churchTransactionIds = {};
  currentDataRows_(SHEETS.churchTransactions).forEach(row => {
    const txId = clean_(row[0]);
    if (txId) churchTransactionIds[txId] = true;
  });
  const savingsTxIds = {};
  dataRows_(SHEETS.savingsHistory).forEach(row => {
    const depositId = clean_(row[0]);
    const memberId = clean_(row[2]);
    if (depositId) savingsTxIds[depositId] = true;
    if (memberId && !memberIds[memberId]) warnings.push("Savings deposit " + depositId + " references missing member: " + memberId);
  });
  dataRows_(SHEETS.coverage).forEach(row => {
    const memberId = clean_(row[0]);
    if (memberId && !memberIds[memberId]) warnings.push("Coverage row references missing member: " + memberId);
  });
  const receiptCounts = {};
  dataRows_(SHEETS.receipts).forEach(row => {
    const receiptId = clean_(row[0]);
    const status = receiptStatus_(row);
    if (receiptId && status !== "Voided") {
      const key = receiptId.toLowerCase();
      receiptCounts[key] = (receiptCounts[key] || 0) + 1;
    }
    if (receiptId && !paymentIds[receiptId] && !churchTransactionIds[receiptId] && !savingsTxIds[receiptId]) {
      warnings.push("Receipt has no matching transaction: " + receiptId);
    }
  });
  Object.keys(receiptCounts).forEach(key => {
    if (receiptCounts[key] > 1) warnings.push("Duplicate active receipt ID: " + key + " (" + receiptCounts[key] + " rows)");
  });
  const handoverIds = {};
  dataRows_(SHEETS.handovers).forEach(row => {
    const id = clean_(row[0]);
    if (id) handoverIds[id] = true;
  });
  dataRows_(SHEETS.churchTransactions).forEach(row => {
    const txId = clean_(row[0]);
    const handoverId = clean_(row[19]);
    if (handoverId && !handoverIds[handoverId]) warnings.push("Church transaction " + txId + " references missing handover: " + handoverId);
  });
  dataRows_(SHEETS.payments).forEach(row => {
    const txId = clean_(row[0]);
    const handoverId = clean_(row[16]);
    if (handoverId && !handoverIds[handoverId]) warnings.push("Payment " + txId + " references missing handover: " + handoverId);
    if (isSavingsConversionPaymentRow_(row) && !handoverId && clean_(row[17]).toLowerCase() !== "internal conversion") {
      warnings.push("Savings conversion payment " + txId + " is excluded from handover cash and should be marked Internal Conversion.");
    }
  });
  currentDataRows_(SHEETS.materialInventory).forEach(row => {
    const itemId = clean_(row[0]);
    const remaining = Number(row[4]) || 0;
    if (remaining < 0) warnings.push("Negative inventory quantity for item " + itemId + ": " + remaining);
  });
  const accounting = accountingReconciliation_();
  accounting.warnings.forEach(warning => warnings.push(warning));
  const result = {
    ok: warnings.length === 0,
    status: warnings.length ? "Warnings Found" : "System Healthy",
    checkedAt: new Date().toISOString(),
    warnings,
    accounting,
    counts: {
      members: Object.keys(memberIds).length,
      payments: Object.keys(paymentIds).length,
      churchTransactions: Object.keys(churchTransactionIds).length,
      handovers: Object.keys(handoverIds).length
    }
  };
  logAction_("DATA_INTEGRITY_CHECK", "System", result.status, admin, "", JSON.stringify({ warnings: warnings.length }));
  return result;
}

function accountingReconciliation_() {
  const round = value => Number(Number(value || 0).toFixed(2));
  const warnings = [];
  let membershipExternal = 0;
  let membershipApplied = 0;
  let internalConversionPayments = 0;
  const paymentIds = {};
  const conversionPaymentIds = {};
  const savingsDepositIds = {};
  dataRows_(SHEETS.payments).forEach(row => {
    const txId = clean_(row[0]);
    const amount = Number(row[6]) || 0;
    if (txId) paymentIds[txId] = true;
    if (clean_(row[7]) !== "Membership") return;
    membershipApplied += amount;
    if (isSavingsConversionPaymentRow_(row)) {
      internalConversionPayments += amount;
      if (txId) conversionPaymentIds[txId] = true;
      const depositId = savingsDepositIdFromPaymentRow_(row);
      if (depositId && !savingsDepositIds[depositId]) {
        // Resolved after savings history is read below.
      }
    } else {
      membershipExternal += amount;
    }
  });
  const serviceIncome = currentDataRows_(SHEETS.servicePayments).reduce((sum, row) => sum + (Number(row[6]) || 0), 0);
  let savingsCreated = 0;
  let savingsUsedFromHistory = 0;
  currentDataRows_(SHEETS.savingsHistory).forEach(row => {
    const id = clean_(row[0]);
    if (id) savingsDepositIds[id] = true;
    savingsCreated += Number(row[4]) || 0;
    savingsUsedFromHistory += Number(row[10]) || 0;
  });
  let savingsUsedFromLog = 0;
  currentDataRows_(SHEETS.savingsConversionLog).forEach(row => {
    const txId = clean_(row[4]);
    savingsUsedFromLog += Number(row[6]) || 0;
    if (txId && !paymentIds[txId]) warnings.push("Auto Conversion Log references missing membership payment: " + txId);
  });
  dataRows_(SHEETS.payments).forEach(row => {
    if (!isSavingsConversionPaymentRow_(row)) return;
    const depositId = savingsDepositIdFromPaymentRow_(row);
    if (depositId && !savingsDepositIds[depositId]) warnings.push("Savings conversion payment references missing savings deposit: " + clean_(row[0]) + " -> " + depositId);
  });
  let churchIncome = 0;
  let churchExpenses = 0;
  currentDataRows_(SHEETS.churchTransactions).forEach(row => {
    const type = clean_(row[2]);
    const amount = Number(row[8]) || 0;
    if (type === "Income") churchIncome += amount;
    if (type === "Expense") churchExpenses += amount;
  });
  const operatingExpenses = currentDataRows_(SHEETS.expenses).reduce((sum, row) => sum + (Number(row[3]) || 0), 0);
  const savingsBalanceSheetTotal = currentDataRows_(SHEETS.savingsBalance).reduce((sum, row) => sum + (Number(row[2]) || 0), 0);
  const expectedSavingsRemaining = round(savingsCreated - Math.max(savingsUsedFromLog, savingsUsedFromHistory));
  const dashboardIncome = round(membershipExternal + serviceIncome + savingsCreated + churchIncome);
  const dashboardExpenses = round(operatingExpenses + churchExpenses);
  if (Math.abs(round(internalConversionPayments) - round(savingsUsedFromLog)) > 0.009) {
    warnings.push("Savings conversion payment total does not match Auto Conversion Log total.");
  }
  if (Math.abs(round(savingsUsedFromHistory) - round(savingsUsedFromLog)) > 0.009) {
    warnings.push("Savings History converted total does not match Auto Conversion Log total.");
  }
  if (Math.abs(round(savingsBalanceSheetTotal) - expectedSavingsRemaining) > 0.009) {
    warnings.push("Savings Balance total does not match Savings History minus Auto Conversion Log.");
  }
  return {
    warnings,
    activeMembers: currentDataRows_(SHEETS.members).filter(row => clean_(row[0]) && clean_(row[5]).toLowerCase() === "active").length,
    membershipExternal: round(membershipExternal),
    membershipApplied: round(membershipApplied),
    internalConversionPayments: round(internalConversionPayments),
    serviceIncome: round(serviceIncome),
    savingsCreated: round(savingsCreated),
    savingsUsedFromHistory: round(savingsUsedFromHistory),
    savingsUsedFromLog: round(savingsUsedFromLog),
    savingsRemainingExpected: expectedSavingsRemaining,
    savingsBalanceSheetTotal: round(savingsBalanceSheetTotal),
    churchIncome: round(churchIncome),
    churchExpenses: round(churchExpenses),
    operatingExpenses: round(operatingExpenses),
    dashboardIncome,
    dashboardExpenses,
    dashboardNet: round(dashboardIncome - dashboardExpenses),
    identity: {
      membershipCoverageApplied: "Membership Payments + Savings Auto Conversions",
      totalCashReceived: "Membership cash + service payments + savings deposits + church transaction income"
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Financial Integrity Checker (read-only — never modifies any data)
// ─────────────────────────────────────────────────────────────────────────────

function runFinancialIntegrityCheck(admin) {
  requirePermission_(clean_(admin), "viewReports");
  const round2 = function(v) { return Number(Number(v || 0).toFixed(2)); };
  const issues = [];
  let checksRun = 0;
  let passed = 0;

  function addIssue(severity, checkId, checkName, memberId, memberName, txId, expected, actual, source, cause, fix) {
    issues.push({
      severity: severity, checkId: checkId, checkName: checkName,
      memberId: clean_(memberId) || "", memberName: clean_(memberName) || "",
      txId: clean_(txId) || "",
      expected: round2(expected), actual: round2(actual), difference: round2(actual - expected),
      source: source, cause: cause, fix: fix
    });
  }

  function runCheck(id, name, fn) {
    checksRun++;
    var before = issues.length;
    try { fn(); } catch(e) {
      addIssue("Critical", id, name, "", "", "", 0, 0, "System",
        "Check threw exception: " + (e && e.message || String(e)),
        "Investigate the error and re-run the Financial Integrity Check");
    }
    if (issues.length === before) passed++;
  }

  // Pre-load shared data once
  var memberById = {};
  dataRows_(SHEETS.members).forEach(function(row) {
    var id = clean_(row[0]);
    if (id) memberById[id] = { id: id, name: clean_(row[1]), status: clean_(row[5]) };
  });
  var paymentRows = dataRows_(SHEETS.payments);
  var receiptRows = dataRows_(SHEETS.receipts);
  var coverageRows = dataRows_(SHEETS.coverage);

  // C01: Receipt amount must match its payment amount ─────────────
  runCheck("C01", "Receipt-Payment Amount Match", function() {
    var paymentAmounts = {};
    var paymentInfo = {};
    paymentRows.forEach(function(row) {
      var txId = clean_(row[0]);
      if (!txId) return;
      var baseId = baseReceiptIdForPaymentId_(txId);
      var amount = round2(Number(row[6]) || 0);
      paymentAmounts[baseId] = round2((paymentAmounts[baseId] || 0) + amount);
      if (!paymentInfo[baseId]) paymentInfo[baseId] = { memberId: clean_(row[2]), memberName: clean_(row[3]) };
    });
    receiptRows.forEach(function(row) {
      var rId = clean_(row[0]);
      if (!rId || receiptStatus_(row) === "Voided") return;
      var baseId = baseReceiptIdForPaymentId_(rId);
      var expected = paymentAmounts[baseId];
      if (expected === undefined) return;
      var actual = round2(Number(row[7]) || 0);
      if (Math.abs(actual - expected) > 0.009) {
        var info = paymentInfo[baseId] || {};
        addIssue("High", "C01", "Receipt-Payment Amount", info.memberId, info.memberName, rId,
          expected, actual, SHEETS.receipts,
          "Receipt amount (€" + actual + ") does not match payment total (€" + expected + ")",
          "Void this receipt and regenerate it, or correct the amount in the Receipts sheet");
      }
    });
  });

  // C02: No orphan receipts (active receipt has no matching transaction) ─────
  runCheck("C02", "Orphan Receipts", function() {
    var allTxIds = {};
    paymentRows.forEach(function(row) {
      var txId = clean_(row[0]);
      if (txId) { allTxIds[txId] = true; allTxIds[baseReceiptIdForPaymentId_(txId)] = true; }
    });
    dataRows_(SHEETS.servicePayments).forEach(function(row) {
      var txId = clean_(row[0]);
      if (txId) { allTxIds[txId] = true; allTxIds[baseReceiptIdForPaymentId_(txId)] = true; }
    });
    currentDataRows_(SHEETS.churchTransactions).forEach(function(row) {
      var txId = clean_(row[0]);
      if (txId) allTxIds[txId] = true;
    });
    currentDataRows_(SHEETS.savingsHistory).forEach(function(row) {
      var id = clean_(row[0]);
      if (id) allTxIds[id] = true;
    });
    receiptRows.forEach(function(row) {
      var rId = clean_(row[0]);
      if (!rId || receiptStatus_(row) === "Voided") return;
      var baseId = baseReceiptIdForPaymentId_(rId);
      if (!allTxIds[rId] && !allTxIds[baseId]) {
        addIssue("Medium", "C02", "Orphan Receipt", clean_(row[2]), clean_(row[3]), rId,
          1, 0, SHEETS.receipts,
          "Active receipt has no matching payment, service payment, church transaction, or savings deposit",
          "Void this orphan receipt or link it to the correct transaction");
      }
    });
  });

  // C03: Duplicate coverage rows for same member+year ───────────
  runCheck("C03", "Duplicate Coverage Rows", function() {
    var coverageCounts = {};
    var coverageInfo = {};
    coverageRows.forEach(function(row) {
      var mId = clean_(row[0]); var year = Number(row[2]) || 0;
      if (!mId || !year) return;
      var key = mId + "|" + year;
      coverageCounts[key] = (coverageCounts[key] || 0) + 1;
      if (!coverageInfo[key]) coverageInfo[key] = { name: clean_(row[1]) };
    });
    Object.keys(coverageCounts).forEach(function(key) {
      if (coverageCounts[key] <= 1) return;
      var parts = key.split("|");
      var info = coverageInfo[key] || {};
      addIssue("High", "C03", "Duplicate Coverage Row", parts[0], info.name, "",
        1, coverageCounts[key], SHEETS.coverage,
        "Member " + parts[0] + " has " + coverageCounts[key] + " coverage rows for year " + parts[1] + " — paid months may be double-counted",
        "Delete the duplicate coverage row, keeping the most recently updated one");
    });
  });

  // C04: Orphan coverage rows (paid months but no payment found) ─
  runCheck("C04", "Orphan Coverage (no payment)", function() {
    var paymentYearsByMember = {};
    paymentRows.forEach(function(row) {
      var mId = clean_(row[2]);
      if (!mId || clean_(row[7]) !== "Membership" || (Number(row[6]) || 0) <= 0) return;
      var items = coverageItemsFromPaymentRow_(row);
      var years = {};
      items.forEach(function(i) { years[i.year] = true; });
      var payYear = Number(row[5]) || 0;
      if (payYear) years[payYear] = true;
      Object.keys(years).forEach(function(y) { paymentYearsByMember[mId + "|" + y] = true; });
    });
    coverageRows.forEach(function(row) {
      var mId = clean_(row[0]); var year = Number(row[2]) || 0;
      if (!mId || !year) return;
      var anyPaid = MONTHS.some(function(m, i) { return clean_(String(row[3 + i] || "")) === "Paid"; });
      if (!anyPaid) return;
      if (!paymentYearsByMember[mId + "|" + year]) {
        addIssue("High", "C04", "Orphan Coverage (no payment)", mId, clean_(row[1]), "",
          0, 1, SHEETS.coverage,
          "Coverage row has Paid months for member " + mId + "/" + year + " but no membership payment exists for that year",
          "Delete the orphan coverage row or restore the missing payment");
      }
    });
  });

  // C05: Coverage references missing member ─────────────────────
  runCheck("C05", "Coverage References Missing Member", function() {
    coverageRows.forEach(function(row) {
      var mId = clean_(row[0]);
      if (!mId || memberById[mId]) return;
      addIssue("Medium", "C05", "Coverage: Missing Member", mId, clean_(row[1]), "",
        1, 0, SHEETS.coverage,
        "Coverage row references member " + mId + " who does not exist in the Members sheet",
        "Delete this coverage row or restore the missing member");
    });
  });

  // C06: Savings ledger consistency ─────────────────────────────
  runCheck("C06", "Savings Ledger Consistency", function() {
    var acct = accountingReconciliation_();
    if (Math.abs(acct.internalConversionPayments - acct.savingsUsedFromLog) > 0.009) {
      addIssue("High", "C06", "Savings Conversion vs Log", "", "", "",
        acct.internalConversionPayments, acct.savingsUsedFromLog, SHEETS.savingsConversionLog,
        "Savings auto-conversion payments (€" + acct.internalConversionPayments + ") ≠ Auto Conversion Log total (€" + acct.savingsUsedFromLog + ")",
        "Check Auto Conversion Log for missing or extra entries versus savings conversion payments");
    }
    if (Math.abs(acct.savingsUsedFromHistory - acct.savingsUsedFromLog) > 0.009) {
      addIssue("High", "C06", "Savings History vs Log", "", "", "",
        acct.savingsUsedFromHistory, acct.savingsUsedFromLog, SHEETS.savingsHistory,
        "Savings History used-amount (€" + acct.savingsUsedFromHistory + ") ≠ Auto Conversion Log total (€" + acct.savingsUsedFromLog + ")",
        "Reconcile the Savings History 'amount used' column with the Auto Conversion Log");
    }
    if (Math.abs(acct.savingsBalanceSheetTotal - acct.savingsRemainingExpected) > 0.009) {
      addIssue("High", "C06", "Savings Balance vs Ledger", "", "", "",
        acct.savingsRemainingExpected, acct.savingsBalanceSheetTotal, SHEETS.savingsBalance,
        "Savings Balance sheet (€" + acct.savingsBalanceSheetTotal + ") ≠ expected remaining (€" + acct.savingsRemainingExpected + ")",
        "Identify which member's savings balance row is wrong and recalculate from their savings history");
    }
  });

  // C07: Zero or negative payment amounts ───────────────────────
  runCheck("C07", "No Zero/Negative Payment Amounts", function() {
    paymentRows.forEach(function(row) {
      var txId = clean_(row[0]);
      if (!txId) return;
      var amount = Number(row[6]) || 0;
      if (amount <= 0) {
        addIssue("Medium", "C07", "Zero/Negative Payment", clean_(row[2]), clean_(row[3]), txId,
          0.01, amount, SHEETS.payments,
          "Payment " + txId + " has amount ≤ 0 (€" + amount + ") — may be a failed reversal or data entry error",
          "Review this payment. Delete the row if it was intentionally reversed; do not leave a zero-amount row");
      }
    });
  });

  // C08: Payments reference valid members ───────────────────────
  runCheck("C08", "Payment References Valid Member", function() {
    paymentRows.forEach(function(row) {
      var txId = clean_(row[0]); var mId = clean_(row[2]);
      if (!txId || !mId || memberById[mId]) return;
      addIssue("High", "C08", "Payment: Missing Member", mId, clean_(row[3]), txId,
        1, 0, SHEETS.payments,
        "Payment " + txId + " references member " + mId + " who does not exist in the Members sheet",
        "Restore the missing member or re-assign this payment to the correct member");
    });
  });

  // C09: Church transactions have valid amounts ─────────────────
  runCheck("C09", "Church Transaction Amounts Valid", function() {
    currentDataRows_(SHEETS.churchTransactions).forEach(function(row) {
      var txId = clean_(row[0]); var amount = Number(row[8]) || 0;
      if (!txId || amount >= 0) return;
      addIssue("Medium", "C09", "Negative Church Transaction", clean_(row[6]), clean_(row[7]), txId,
        0, amount, SHEETS.churchTransactions,
        "Church transaction " + txId + " has a negative amount (€" + amount + ")",
        "Delete or correct this transaction. Use the Expense category for outflows, not negative income");
    });
    currentDataRows_(SHEETS.expenses).forEach(function(row, i) {
      var amount = Number(row[3]) || 0;
      if (amount >= 0) return;
      addIssue("Medium", "C09", "Negative Expense Amount", "", "", "",
        0, amount, SHEETS.expenses,
        "Expense row " + (i + 3) + " has a negative amount (€" + amount + ")",
        "Correct or delete this expense row");
    });
  });

  // C10: Fee history sanity ─────────────────────────────────────
  runCheck("C10", "Fee History Sanity", function() {
    var history = getFeeHistory_();
    var yearsSeen = {};
    history.forEach(function(r) {
      var year = r.date.getFullYear();
      if (yearsSeen[year]) {
        addIssue("Medium", "C10", "Duplicate Fee Year", "", "", "",
          1, 2, SHEETS.config,
          "Two fee history entries share effective year " + year,
          "Remove the duplicate fee entry for " + year + " from the Config sheet (columns F–J, row 11+)");
      }
      yearsSeen[year] = true;
      if (r.newFee <= 0) {
        addIssue("Medium", "C10", "Zero/Negative Fee", "", "", "",
          0.01, r.newFee, SHEETS.config,
          "Fee history entry has fee ≤ 0 (€" + r.newFee + "/month) effective " + displayDate_(r.date),
          "Remove or correct this fee entry in the Config sheet");
      }
    });
  });

  // C11: Funding index total ≤ payment total per member ─────────
  runCheck("C11", "Funding Index vs Payment Totals", function() {
    var paymentSumByMember = {};
    paymentRows.forEach(function(row) {
      var mId = clean_(row[2]);
      if (!mId || clean_(row[7]) !== "Membership") return;
      var amount = Number(row[6]) || 0;
      if (amount <= 0) return;
      paymentSumByMember[mId] = round2((paymentSumByMember[mId] || 0) + amount);
    });
    var fundingIndex = membershipFundingIndex_();
    var fundingTotalByMember = {};
    Object.keys(fundingIndex.amountByMemberYear || {}).forEach(function(key) {
      var mId = key.split("|")[0];
      fundingTotalByMember[mId] = round2((fundingTotalByMember[mId] || 0) + (fundingIndex.amountByMemberYear[key] || 0));
    });
    Object.keys(fundingTotalByMember).forEach(function(mId) {
      var funded = fundingTotalByMember[mId];
      var paid = paymentSumByMember[mId] || 0;
      if (funded > paid + 0.02) {
        var member = memberById[mId] || {};
        addIssue("Critical", "C11", "Funding Exceeds Payments", mId, member.name, "",
          paid, funded, SHEETS.payments,
          "Funding index allocates €" + funded + " for member " + mId + " but total payments are only €" + paid + " — indicates corrupted data",
          "Rebuild the membership funding index (clear cache) and investigate this member's payment history");
      }
    });
  });

  // C12: Year overfunding (more applied than required) ──────────
  runCheck("C12", "Year Overfunding Check", function() {
    var fundingIndex = membershipFundingIndex_();
    var memberList = memberIndex_().list;
    var membersById = {};
    memberList.forEach(function(m) { membersById[m.id] = m; });
    Object.keys(fundingIndex.amountByMemberYear || {}).forEach(function(key) {
      var parts = key.split("|");
      var mId = parts[0]; var year = Number(parts[1]);
      var member = membersById[mId];
      if (!member) return;
      var months = dueMonthsForMemberYear_(member, year);
      if (!months.length) return;
      var required = expectedAmountForItems_(months.map(function(month) { return { year: year, month: month }; }));
      var funded = round2(fundingIndex.amountByMemberYear[key] || 0);
      if (required > 0 && funded > required + 0.009) {
        addIssue("Low", "C12", "Year Overfunded", mId, member.name, "",
          required, funded, SHEETS.payments,
          "Member " + mId + " has €" + funded + " applied to year " + year + " but only €" + required + " required (overpayment €" + round2(funded - required) + ")",
          "Review this member's payments. Overpayment of ≤€1 is usually a rounding artifact; larger amounts may indicate a misclassified payment");
      }
    });
  });

  var criticalCount = issues.filter(function(i) { return i.severity === "Critical"; }).length;
  var highCount = issues.filter(function(i) { return i.severity === "High"; }).length;
  var mediumCount = issues.filter(function(i) { return i.severity === "Medium"; }).length;
  var lowCount = issues.filter(function(i) { return i.severity === "Low"; }).length;
  var status = criticalCount > 0 || highCount > 0 ? "FAIL" : (mediumCount > 0 || lowCount > 0) ? "WARNING" : "PASS";

  logAction_("FINANCIAL_INTEGRITY_CHECK", "System", status, clean_(admin), "",
    JSON.stringify({ checksRun: checksRun, issues: issues.length, critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount }));

  return {
    status: status,
    totalChecksRun: checksRun,
    passed: passed,
    failed: criticalCount + highCount,
    warnings: mediumCount + lowCount,
    critical: criticalCount,
    high: highCount,
    medium: mediumCount,
    low: lowCount,
    totalIssues: issues.length,
    issues: issues,
    timestamp: new Date().toISOString(),
    admin: clean_(admin)
  };
}

function exportFinancialIntegrityReportAsPdf(admin) {
  requirePermission_(clean_(admin), "viewReports");
  var report = runFinancialIntegrityCheck(admin);
  var tz = Session.getScriptTimeZone();
  var fileName = "Financial_Integrity_" + Utilities.formatDate(new Date(), tz, "yyyy-MM-dd") + ".pdf";
  var genDate = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm");
  var severityColors = { Critical: "#c0392b", High: "#e67e22", Medium: "#f39c12", Low: "#27ae60" };
  var statusColor = report.status === "PASS" ? "#27ae60" : report.status === "WARNING" ? "#e67e22" : "#c0392b";

  var trs = report.issues.map(function(iss) {
    var color = severityColors[iss.severity] || "#666";
    return "<tr>" +
      "<td style='color:" + color + ";font-weight:bold'>" + iss.severity + "</td>" +
      "<td>" + iss.checkId + ": " + iss.checkName + "</td>" +
      "<td>" + (iss.memberId || "-") + "</td>" +
      "<td>" + (iss.memberName || "-") + "</td>" +
      "<td style='font-size:7pt'>" + (iss.txId || "-") + "</td>" +
      "<td>€" + Number(iss.expected || 0).toFixed(2) + "</td>" +
      "<td>€" + Number(iss.actual || 0).toFixed(2) + "</td>" +
      "<td style='color:" + (iss.difference < 0 ? "#c0392b" : iss.difference > 0 ? "#e67e22" : "#666") + "'>" +
        (iss.difference > 0 ? "+" : "") + "€" + Number(iss.difference || 0).toFixed(2) + "</td>" +
      "<td style='font-size:7pt'>" + (iss.source || "-") + "</td>" +
      "<td style='font-size:7pt'>" + (iss.cause || "-") + "</td>" +
      "</tr>";
  }).join("");

  var summaryBlock = "<div class='sg'>" +
    "<div class='si'><b>Checks Run:</b> " + report.totalChecksRun + "</div>" +
    "<div class='si'><b>Passed:</b> " + report.passed + "</div>" +
    "<div class='si'><b>Total Issues:</b> " + report.totalIssues + "</div>" +
    "<div class='si'><b>Critical:</b> " + report.critical + " &nbsp;|&nbsp; <b>High:</b> " + report.high +
      " &nbsp;|&nbsp; <b>Medium:</b> " + report.medium + " &nbsp;|&nbsp; <b>Low:</b> " + report.low + "</div>" +
    "</div>";

  var html = "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
    "<style>body{font-family:Arial,sans-serif;font-size:9pt;margin:20px}" +
    "h1{font-size:13pt;margin-bottom:2px}.meta{color:#666;font-size:8pt;margin:0 0 8px}" +
    ".status{font-size:13pt;font-weight:bold;padding:3px 10px;border-radius:3px;display:inline-block;color:white;margin-bottom:8px}" +
    ".sg{display:flex;gap:12px;flex-wrap:wrap;margin:6px 0}.si{background:#f5f5f5;padding:4px 8px;border-radius:3px;font-size:8pt}" +
    "table{border-collapse:collapse;width:100%;margin-top:10px}" +
    "th{background:#2c5f2e;color:white;padding:5px 6px;text-align:left;font-size:8pt}" +
    "td{padding:4px 6px;border-bottom:1px solid #ddd;font-size:8pt;vertical-align:top}" +
    "tr:nth-child(even) td{background:#f9f9f9}" +
    ".pass{color:#27ae60;font-weight:bold}.footer{margin-top:16px;font-size:7pt;color:#999}" +
    "</style></head><body>" +
    "<h1>St.Rufael Church Münster &mdash; Financial Integrity Report</h1>" +
    "<p class='meta'>Generated " + genDate + " by " + clean_(admin) + "</p>" +
    "<div class='status' style='background:" + statusColor + "'>" + report.status + "</div>" +
    summaryBlock +
    (report.issues.length === 0
      ? "<p class='pass'>&#10003; All " + report.totalChecksRun + " financial checks passed. No issues detected.</p>"
      : "<h2 style='font-size:11pt;margin-top:14px'>Issues Found (" + report.issues.length + ")</h2>" +
        "<table><thead><tr><th>Severity</th><th>Check</th><th>Member ID</th><th>Name</th>" +
        "<th>TX/Receipt ID</th><th>Expected</th><th>Actual</th><th>Diff</th><th>Source</th><th>Probable Cause</th></tr></thead>" +
        "<tbody>" + trs + "</tbody></table>") +
    "<div class='footer'>St.Rufael Eritrean Orthodox Church &middot; Münster &middot; Financial Integrity Report</div>" +
    "</body></html>";

  var pdfBlob = Utilities.newBlob(html, "text/html", fileName.replace(/\.pdf$/, ".html")).getAs(MimeType.PDF);
  var folder = backupFolder_();
  var file = folder.createFile(pdfBlob.setName(fileName));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { url: file.getUrl(), filename: fileName, status: report.status, totalIssues: report.totalIssues };
}

// ─────────────────────────────────────────────────────────────
// Dashboard Summary Cache
// ─────────────────────────────────────────────────────────────

