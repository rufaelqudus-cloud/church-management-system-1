function getAdminHandoverDashboard(form) {
  const admin = clean_(form && form.admin) || clean_(form && form.adminUser);
  if (!admin) throw new Error("Please login again.");
  requirePermission_(admin, "manageHandover");
  const handoverWindow = allPendingHandoverWindow_();
  const summary = buildHandoverSummary_(admin, handoverWindow.start, handoverWindow.end, true);
  const range = handoverRangeFromSummary_(summary);
  applyHandoverResponsibility_(admin, summary);
  const isSuper = roleForUser_(admin) === ROLES.superAdmin;
  const history = handoverHistoryForAdmin_(admin, isSuper);
  const current = buildCurrentResponsibility_(admin, summary, history);
  return {
    ok: true,
    admin,
    range: range.label,
    startDate: displayDate_(range.start),
    endDate: displayDate_(range.end),
    startDateInput: dateInputValue_(range.start),
    endDateInput: dateInputValue_(range.end),
    summary,
    currentResponsibility: current,
    handoverHistory: history,
    superAdmin: isSuper,
    allAdmins: isSuper ? buildAllAdminHandoverOverview_(handoverWindow.start, handoverWindow.end) : []
  };
}

function confirmAdminHandover(form) {
  return timed_("confirmAdminHandover", () => withWriteLock_("confirmAdminHandover", () => withIdempotency_("confirmAdminHandover", form && form.requestId, clean_(form && form.admin) || clean_(form && form.adminUser), () => {
    const admin = clean_(form && form.admin) || clean_(form && form.adminUser);
    if (!admin) throw new Error("Please login again.");
    requirePermission_(admin, "manageHandover");
    const receiver = clean_(form && form.receiver);
    if (!receiver) throw new Error("Receiver is required.");
    const handoverWindow = allPendingHandoverWindow_();
    const summary = buildHandoverSummary_(admin, handoverWindow.start, handoverWindow.end, true);
    const range = handoverRangeFromSummary_(summary);
    applyHandoverResponsibility_(admin, summary);
    if (!summary.transactions.length && !summary.expenses.length && Math.abs(summary.expectedCash || 0) < 0.01) throw new Error("No pending handover transactions found.");
    const expectedCash = Number(summary.cashToHandOver || 0);
    const notes = clean_(form && form.notes);
    const rawActual = form && form.actualCashHandedOver;
    const actualCashHandedOver = (rawActual !== undefined && rawActual !== null && rawActual !== "")
      ? Number(rawActual)
      : expectedCash;
    if (isNaN(actualCashHandedOver) || actualCashHandedOver < 0) {
      throw new Error("Actual cash handed over must be a valid non-negative number.");
    }
    summary.expectedCash = expectedCash;
    summary.actualCashHandedOver = Number(actualCashHandedOver.toFixed(2));
    summary.difference = Number((actualCashHandedOver - expectedCash).toFixed(2));
    summary.status = "Submitted - Awaiting Overall Handover";
    summary.outstandingRemaining = Number(
      Math.max(0, Number(summary.previousOutstanding || 0) + (expectedCash - actualCashHandedOver))
    .toFixed(2));
    const handoverId = nextId_("HND");
    // Handover PDFs always render in German + Tigrinya, regardless of the
    // admin's own dashboard language — the document is for recipients who
    // read German/Tigrinya, not for the admin generating it.
    const pdfUrl = createHandoverPdf_(handoverId, admin, receiver, range, summary, notes, "de");
    const handoverNotes = [notes, "[AUTO_PENDING_HANDOVER_MODEL]", "[ADMIN_EXPECTED_HANDOVER]"].filter(Boolean).join(" ");
    ensureHandoverSheet_().appendRow([
      handoverId,
      admin,
      receiver,
      new Date(),
      range.start,
      range.end,
      summary.cashCollected,
      summary.bankTransfers,
      summary.cashExpensesFromCollected,
      summary.actualCashHandedOver,
      summary.transactions.length,
      summary.expenses.length,
      pdfUrl,
      handoverNotes,
      summary.status,
      summary.expectedCash,
      summary.actualCashHandedOver,
      summary.difference,
      summary.previousOutstanding,
      summary.outstandingRemaining,
      "",
      "Pending Overall Handover",
      "",
      ""
    ]);
    markHandoverRows_(summary, handoverId);
    logAction_("SUBMIT_ADMIN_HANDOVER", SHEETS.handovers, handoverId, admin, "", JSON.stringify({ receiver, expectedCash: summary.expectedCash, previousOutstanding: summary.previousOutstanding, transactions: summary.transactions.length, expenses: summary.expenses.length, pdfUrl }));
    invalidateFastCaches_([SHEETS.payments, SHEETS.servicePayments, SHEETS.savingsHistory, SHEETS.expenses, SHEETS.churchTransactions, SHEETS.handovers]);
    SpreadsheetApp.flush();
    return { ok: true, handoverId, pdfUrl, summary };
  })));
}

function dateInputValue_(date) {
  if (!date || isNaN(date)) return "";
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function allPendingHandoverWindow_() {
  return {
    start: new Date(2000, 0, 1),
    end: new Date(2099, 11, 31, 23, 59, 59, 999),
    label: "All Pending"
  };
}

function handoverRangeFromSummary_(summary) {
  const dates = (summary.transactions || []).concat(summary.expenses || [])
    .map(item => item.date)
    .filter(date => date && !isNaN(date));
  const today = new Date();
  if (!dates.length) {
    return { start: today, end: today, label: "All Pending" };
  }
  const start = dates.reduce((oldest, date) => date.getTime() < oldest.getTime() ? date : oldest, dates[0]);
  const end = dates.reduce((latest, date) => date.getTime() > latest.getTime() ? date : latest, dates[0]);
  return { start, end, label: "All Pending" };
}

function applyHandoverResponsibility_(admin, summary) {
  const carryForward = handoverCarryForwardForAdmin_(admin);
  const pendingCash = Number(summary.cashToHandOver || 0);
  const totalResponsibility = Number((carryForward + pendingCash).toFixed(2));
  summary.previousOutstanding = carryForward;
  summary.newCollectionsDuringPeriod = Number(summary.cashCollected.toFixed(2));
  summary.pendingCashToHandOver = pendingCash;
  summary.totalResponsibility = totalResponsibility;
  summary.expectedCash = Number(Math.max(0, totalResponsibility).toFixed(2));
  summary.cashToHandOver = summary.expectedCash;
  summary.outstandingRemaining = totalResponsibility;
  return summary;
}

function handoverCarryForwardForAdmin_(admin) {
  ensureOverallHandoverSheet_();
  const overallRows = dataRows_(SHEETS.overallHandovers)
    .filter(row => clean_(row[3]) === admin)
    .sort((a, b) => {
      const aDate = coerceDate_(a[19]) || coerceDate_(a[1]);
      const bDate = coerceDate_(b[19]) || coerceDate_(b[1]);
      return (aDate ? aDate.getTime() : 0) - (bDate ? bDate.getTime() : 0);
    });
  if (overallRows.length) return Number(overallRows[overallRows.length - 1][16]) || 0;
  const rows = dataRows_(SHEETS.handovers)
    .filter(row => clean_(row[1]) === admin)
    .sort((a, b) => {
      const aDate = coerceDate_(a[3]);
      const bDate = coerceDate_(b[3]);
      return (aDate ? aDate.getTime() : 0) - (bDate ? bDate.getTime() : 0);
    });
  if (!rows.length) return 0;
  let carry = 0;
  rows.forEach(row => {
    const notes = clean_(row[13]);
    if (notes.indexOf("[AUTO_PENDING_HANDOVER_MODEL]") >= 0) {
      carry = Number(row[19]) || 0;
    } else {
      carry = Number((carry + (Number(row[15]) || 0) - (Number(row[16]) || 0)).toFixed(2));
    }
  });
  return Number(carry.toFixed(2));
}

function buildHandoverSummary_(admin, start, end, pendingOnly) {
  ensureSavingsSheets_();
  normalizePaymentSheetHeaders_();
  normalizeExpenseSheetHeaders_();
  ensureHandoverSheet_();
  const summary = {
    cashCollected: 0,
    bankTransfers: 0,
    membershipTotal: 0,
    serviceTotal: 0,
    savingsTotal: 0,
    totalExpenses: 0,
    cashExpensesFromCollected: 0,
    cashToHandOver: 0,
    transactions: [],
    expenses: [],
    needsReview: []
  };
  collectPaymentHandoverRows_(SHEETS.payments, admin, start, end, pendingOnly).forEach(item => {
    summary.transactions.push(item);
    addHandoverIncome_(summary, item, "Membership");
  });
  collectPaymentHandoverRows_(SHEETS.servicePayments, admin, start, end, pendingOnly).forEach(item => {
    summary.transactions.push(item);
    addHandoverIncome_(summary, item, "Service");
  });
  collectSavingsHandoverRows_(admin, start, end, pendingOnly).forEach(item => {
    summary.transactions.push(item);
    addHandoverIncome_(summary, item, "Savings");
  });
  collectChurchTransactionHandoverRows_(admin, start, end, pendingOnly).forEach(item => {
    if (item.transactionType === "Income") {
      summary.transactions.push(item);
      addHandoverIncome_(summary, item, "Service");
    } else if (item.transactionType === "Expense") {
      summary.expenses.push(item);
      summary.totalExpenses += item.amount;
      if (item.paidFromCollectedCash) summary.cashExpensesFromCollected += item.amount;
    }
  });
  collectExpenseHandoverRows_(admin, start, end, pendingOnly).forEach(item => {
    summary.expenses.push(item);
    summary.totalExpenses += item.amount;
    if (item.paidFromCollectedCash) summary.cashExpensesFromCollected += item.amount;
  });
  ["cashCollected", "bankTransfers", "membershipTotal", "serviceTotal", "savingsTotal", "totalExpenses", "cashExpensesFromCollected"].forEach(key => {
    summary[key] = Number(summary[key].toFixed(2));
  });
  summary.cashToHandOver = Number((summary.cashCollected - summary.cashExpensesFromCollected).toFixed(2));
  summary.incomeBreakdown = incomeBreakdown_(summary.transactions);
  summary.needsReview = collectHandoverNeedsReviewRows_(admin, pendingOnly);
  summary.transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  summary.expenses.sort((a, b) => a.date.getTime() - b.date.getTime());
  return summary;
}

function collectHandoverNeedsReviewRows_(admin, pendingOnly) {
  const needsReview = [];
  const addIfInvalidDate = item => {
    if (!item.id || item.admin !== admin || item.amount <= 0) return;
    if (pendingOnly && item.handoverId) return;
    if (item.date && !isNaN(item.date)) return;
    item.reviewReason = "Missing or invalid date. Correct the date before confirming handover.";
    needsReview.push(item);
  };

  [SHEETS.payments, SHEETS.servicePayments].forEach(sheetName => {
    currentDataRows_(sheetName).forEach((row, index) => {
      const item = {
        source: "payment",
        sheetName,
        rowNumber: index + 3,
        id: clean_(row[0]),
        date: coerceDate_(row[1]),
        memberName: clean_(row[3]),
        paymentType: sameSheet_(sheetName, SHEETS.payments) ? "Membership Fee" : "Service Fee",
        reason: clean_(row[7]),
        method: clean_(row[8]) || "Cash",
        amount: Number(row[6]) || 0,
        admin: clean_(row[9]),
        handoverId: clean_(row[16]),
        handoverStatus: clean_(row[17]) || "Pending",
        raw: row
      };
      if (!isInternalSavingsConversionPayment_(item)) addIfInvalidDate(item);
    });
  });

  currentDataRows_(SHEETS.savingsHistory).forEach((row, index) => addIfInvalidDate({
      source: "savings",
      sheetName: SHEETS.savingsHistory,
      rowNumber: index + 3,
      id: clean_(row[0]),
      date: coerceDate_(row[1]),
      memberName: clean_(row[3]),
      paymentType: "Savings / Deposit",
      reason: "Savings Deposit",
      method: clean_(row[5]) || "Cash",
      amount: Number(row[4]) || 0,
      admin: clean_(row[6]),
      handoverId: clean_(row[12]),
      handoverStatus: clean_(row[13]) || "Pending"
    }));

  currentDataRows_(SHEETS.expenses).forEach((row, index) => addIfInvalidDate({
      source: "expense",
      sheetName: SHEETS.expenses,
      rowNumber: index + 3,
      id: clean_(row[7]) || "EXP-ROW-" + (index + 3),
      date: coerceDate_(row[0]),
      category: clean_(row[1]),
      description: clean_(row[2]),
      amount: Number(row[3]) || 0,
      admin: clean_(row[4]),
      paidFromCollectedCash: clean_(row[6]).toLowerCase() === "yes",
      handoverId: clean_(row[8]),
      handoverStatus: clean_(row[9]) || "Pending"
    }));

  currentDataRows_(SHEETS.churchTransactions).forEach((row, index) => {
      const type = clean_(row[2]);
      if (!["Income", "Expense"].includes(type)) return;
      addIfInvalidDate({
        source: "churchTransaction",
        sheetName: SHEETS.churchTransactions,
        rowNumber: index + 3,
        id: clean_(row[0]),
        date: coerceDate_(row[1]),
        transactionType: type,
        memberName: clean_(row[7]),
        paymentType: type === "Income" ? "Service Fee" : "Expense",
        reason: clean_(row[4]),
        category: clean_(row[4]),
        description: clean_(row[18]),
        method: clean_(row[9]) || "Cash",
        amount: Number(row[8]) || 0,
        admin: clean_(row[17]),
        paidFromCollectedCash: clean_(row[10]).toLowerCase() === "yes",
        handoverId: clean_(row[19]),
        handoverStatus: clean_(row[20]) || "Pending"
      });
    });
  return needsReview;
}

function getHandoverPreviousOutstandingDiagnostic(form) {
  const admin = clean_(form && form.admin) || clean_(form && form.adminUser);
  if (!admin) throw new Error("Please login again.");
  requirePermission_(admin, "manageHandover");
  const handoverWindow = allPendingHandoverWindow_();
  const summary = applyHandoverResponsibility_(admin, buildHandoverSummary_(admin, handoverWindow.start, handoverWindow.end, true));
  const diagnostic = {
    ok: true,
    admin,
    selectedRange: handoverWindow.label,
    selectedStartDate: "",
    diagnosticStartDate: displayDate_(handoverWindow.start),
    diagnosticEndDate: displayDate_(handoverWindow.end),
    previousOutstanding: summary.previousOutstanding,
    cashToHandOver: summary.cashToHandOver,
    contributors: [],
    excludedInternalSavingsConversions: [],
    oldDoubleCountEstimate: 0,
    likelyOldDoubleCountPattern: false
  };
  diagnostic.contributors = handoverDiagnosticRows_(summary);
  diagnostic.excludedInternalSavingsConversions = collectSavingsConversionPaymentRows_(admin, handoverWindow.start, handoverWindow.end, true)
    .map(item => handoverDiagnosticItem_(item, "Excluded: internal savings auto-conversion membership row. Original cash is counted from Savings History only."));
  diagnostic.oldDoubleCountEstimate = Number(diagnostic.excludedInternalSavingsConversions
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toFixed(2));
  diagnostic.likelyOldDoubleCountPattern = diagnostic.oldDoubleCountEstimate > 0;
  return diagnostic;
}

function handoverDiagnosticRows_(summary) {
  const rows = [];
  (summary.transactions || []).forEach(item => {
    if (cashMethod_(item.method)) {
      rows.push(handoverDiagnosticItem_(item, "Included: pending cash income before selected handover start date.", item.amount));
    }
  });
  (summary.expenses || []).forEach(item => {
    if (item.paidFromCollectedCash) {
      rows.push(handoverDiagnosticItem_(item, "Included: pending expense paid from collected cash before selected handover start date, deducted from cash responsibility.", -item.amount));
    }
  });
  return rows;
}

function handoverDiagnosticItem_(item, why, contributionAmount) {
  return {
    sheetName: item.sheetName,
    rowNumber: item.rowNumber,
    transactionId: item.id,
    date: displayDate_(item.date),
    amount: Number(item.amount) || 0,
    contributionAmount: Number(contributionAmount || 0),
    paymentMethod: item.method || "",
    handoverStatus: item.handoverStatus || "",
    handoverId: item.handoverId || "",
    whyIncluded: why
  };
}

function incomeBreakdown_(transactions) {
  const order = ["Mitgliedsbeitrag", "Hochzeit (መርዓ)", "Taufe (ጥምቀት)", "ዕሽር", "ናይ ካርዲ ኣባልነት", "Ersparnis / Einzahlung", "Sonstige Gebühren"];
  const map = {};
  order.forEach(label => map[label] = { paymentType: label, count: 0, amount: 0 });
  (transactions || []).forEach(item => {
    const label = handoverPaymentTypeLabel_(item);
    if (!map[label]) map[label] = { paymentType: label, count: 0, amount: 0 };
    map[label].count += 1;
    map[label].amount += Number(item.amount) || 0;
  });
  return order.concat(Object.keys(map).filter(key => !order.includes(key))).map(key => {
    const row = map[key];
    row.amount = Number(row.amount.toFixed(2));
    return row;
  }).filter(row => row.count > 0);
}

function handoverPaymentTypeLabel_(item) {
  if (item.source === "savings") return "Ersparnis / Einzahlung";
  if (item.paymentType === "Membership Fee") return "Mitgliedsbeitrag";
  const reason = clean_(item.reason);
  if (reason === "Wedding") return "Hochzeit (መርዓ)";
  if (reason === "Baptism") return "Taufe (ጥምቀት)";
  if (reason === "Tithe" || reason === "ዕሽር") return "ዕሽር";
  if (reason === "Membership Card" || reason === "ናይ ካርዲ ኣባልነት") return "ናይ ካርዲ ኣባልነት";
  return reason && reason !== "Other" ? reason : "Sonstige Gebühren";
}

// Display-only translation for the PDF — does not touch the stored payment
// method value (used elsewhere for cash/bank totals) or any comparisons.
function handoverMethodLabel_(method) {
  const value = clean_(method);
  if (value === "Cash") return "Barzahlung";
  if (value === "Bank Transfer") return "Banküberweisung";
  return value;
}

// Display-only translation for the PDF — does not touch summary.status,
// which is stored as-is in the Handovers sheet and used for branching logic.
function handoverStatusLabel_(status) {
  const value = clean_(status);
  if (value === "Submitted - Awaiting Overall Handover") return "Eingereicht - Wartet auf Gesamtübergabe";
  return value;
}

function buildCurrentResponsibility_(admin, preparedSummary, preparedHistory) {
  const handoverWindow = allPendingHandoverWindow_();
  const pending = preparedSummary || applyHandoverResponsibility_(admin, buildHandoverSummary_(admin, handoverWindow.start, handoverWindow.end, true));
  const history = preparedHistory || handoverHistoryForAdmin_(admin, false);
  const last = history.length ? history[0] : null;
  return {
    cashUnderResponsibility: pending.cashToHandOver,
    pendingCashToHandOver: pending.pendingCashToHandOver || 0,
    carryForward: pending.previousOutstanding || 0,
    unhandedTransactionCount: pending.transactions.length,
    outstanding: pending.outstandingRemaining,
    status: pending.transactions.length || Math.abs(pending.cashToHandOver) >= 0.01 ? "Pending" : "All Handed Over",
    lastHandoverDate: last ? last.date : "",
    lastHandoverAmount: last ? last.cashHandedOver : 0,
    lastHandoverPdfUrl: last ? last.pdfUrl : ""
  };
}

function handoverHistoryForAdmin_(admin, includeAll) {
  ensureHandoverSheet_();
  const adminKey = clean_(admin).toLowerCase();
  return dataRows_(SHEETS.handovers).filter(row => includeAll || clean_(row[1]).toLowerCase() === adminKey).map(row => ({
    handoverId: clean_(row[0]),
    admin: clean_(row[1]),
    receiver: clean_(row[2]),
    date: displayDate_(row[3]),
    startDate: displayDate_(row[4]),
    endDate: displayDate_(row[5]),
    cashHandedOver: Number(row[9]) || 0,
    pdfUrl: clean_(row[12]),
    status: clean_(row[21]) ? "Overall " + clean_(row[21]) : (clean_(row[14]) || "Completed"),
    difference: Number(row[17]) || 0,
    outstandingRemaining: Number(row[19]) || 0
  })).sort((a, b) => clean_(b.date).localeCompare(clean_(a.date))).slice(0, 25);
}

function addHandoverIncome_(summary, item, category) {
  if (!cashMethod_(item.method)) summary.bankTransfers += item.amount;
  else summary.cashCollected += item.amount;
  if (category === "Membership") summary.membershipTotal += item.amount;
  else if (category === "Service") summary.serviceTotal += item.amount;
  else summary.savingsTotal += item.amount;
}

function cashMethod_(method) {
  const value = clean_(method).toLowerCase();
  const bankMethods = [
    "bank transfer",
    "bank",
    "banküberweisung",
    "überweisung",
    "banküberweisung / ባንክ",
    "transfer",
    "sepa"
  ];
  return !bankMethods.includes(value);
}

function isSavingsConversionPaymentRow_(row) {
  return clean_(row[15]) === "Savings Conversion" || clean_(row[10]).indexOf("Auto-converted from savings deposit ") >= 0;
}

function isInternalSavingsConversionPayment_(item) {
  return sameSheet_(item.sheetName, SHEETS.payments) && isSavingsConversionPaymentRow_(item.raw || []);
}

function collectPaymentHandoverRows_(sheetName, admin, start, end, pendingOnly) {
  const sh = sh_(sheetName);
  const last = sh.getLastRow();
  if (last < 3) return [];
  const values = sh.getRange(3, 1, last - 2, PAYMENT_HEADERS.length).getValues();
  return values.map((row, index) => {
    const date = coerceDate_(row[1]);
    return {
      source: "payment",
      sheetName,
      rowNumber: index + 3,
      id: clean_(row[0]),
      date,
      memberName: clean_(row[3]),
      paymentType: sameSheet_(sheetName, SHEETS.payments) ? "Membership Fee" : "Service Fee",
      reason: clean_(row[7]),
      method: clean_(row[8]) || "Cash",
      amount: Number(row[6]) || 0,
      admin: clean_(row[9]),
      handoverId: clean_(row[16]),
      handoverStatus: clean_(row[17]) || "Pending",
      raw: row
    };
  }).filter(item => item.id && item.admin === admin && item.amount > 0 && dateInRange_(item.date, start, end) && !isInternalSavingsConversionPayment_(item) && (!pendingOnly || !item.handoverId));
}

function collectSavingsConversionPaymentRows_(admin, start, end, pendingOnly) {
  const sh = sh_(SHEETS.payments);
  const last = sh.getLastRow();
  if (last < 3) return [];
  return sh.getRange(3, 1, last - 2, PAYMENT_HEADERS.length).getValues().map((row, index) => ({
    source: "payment",
    sheetName: SHEETS.payments,
    rowNumber: index + 3,
    id: clean_(row[0]),
    date: coerceDate_(row[1]),
    memberName: clean_(row[3]),
    paymentType: "Membership Fee",
    reason: clean_(row[7]),
    method: clean_(row[8]) || "Cash",
    amount: Number(row[6]) || 0,
    admin: clean_(row[9]),
    handoverId: clean_(row[16]),
    handoverStatus: clean_(row[17]) || "Pending",
    raw: row
  })).filter(item => item.id && item.admin === admin && item.amount > 0 && dateInRange_(item.date, start, end) && isInternalSavingsConversionPayment_(item) && (!pendingOnly || !item.handoverId));
}

function collectSavingsHandoverRows_(admin, start, end, pendingOnly) {
  const sh = sh_(SHEETS.savingsHistory);
  const last = sh.getLastRow();
  if (last < 3) return [];
  const values = sh.getRange(3, 1, last - 2, 14).getValues();
  return values.map((row, index) => {
    const date = coerceDate_(row[1]);
    return {
      source: "savings",
      sheetName: SHEETS.savingsHistory,
      rowNumber: index + 3,
      id: clean_(row[0]),
      date,
      memberName: clean_(row[3]),
      paymentType: "Savings / Deposit",
      reason: "Savings Deposit",
      method: clean_(row[5]) || "Cash",
      amount: Number(row[4]) || 0,
      admin: clean_(row[6]),
      handoverId: clean_(row[12]),
      handoverStatus: clean_(row[13]) || "Pending"
    };
  }).filter(item => item.id && item.admin === admin && item.amount > 0 && dateInRange_(item.date, start, end) && (!pendingOnly || !item.handoverId));
}

function collectExpenseHandoverRows_(admin, start, end, pendingOnly) {
  const sh = sh_(SHEETS.expenses);
  const last = sh.getLastRow();
  if (last < 3) return [];
  const values = sh.getRange(3, 1, last - 2, EXPENSE_HEADERS.length).getValues();
  return values.map((row, index) => {
    const date = coerceDate_(row[0]);
    return {
      source: "expense",
      sheetName: SHEETS.expenses,
      rowNumber: index + 3,
      id: clean_(row[7]) || "EXP-ROW-" + (index + 3),
      date,
      category: clean_(row[1]),
      description: clean_(row[2]),
      amount: Number(row[3]) || 0,
      admin: clean_(row[4]),
      paidFromCollectedCash: clean_(row[6]).toLowerCase() === "yes",
      handoverId: clean_(row[8]),
      handoverStatus: clean_(row[9]) || "Pending"
    };
  }).filter(item => item.admin === admin && item.amount > 0 && dateInRange_(item.date, start, end) && (!pendingOnly || !item.handoverId));
}

function collectChurchTransactionHandoverRows_(admin, start, end, pendingOnly) {
  ensureChurchTransactionSheet_();
  const sh = sh_(SHEETS.churchTransactions);
  const last = sh.getLastRow();
  if (last < 3) return [];
  const values = sh.getRange(3, 1, last - 2, CHURCH_TRANSACTION_HEADERS.length).getValues();
  return values.map((row, index) => {
    const type = clean_(row[2]);
    const date = coerceDate_(row[1]);
    return {
      source: "churchTransaction",
      sheetName: SHEETS.churchTransactions,
      rowNumber: index + 3,
      id: clean_(row[0]),
      date,
      transactionType: type,
      memberName: clean_(row[7]),
      paymentType: type === "Income" ? "Service Fee" : "Expense",
      reason: clean_(row[4]),
      category: clean_(row[4]),
      description: clean_(row[18]),
      method: clean_(row[9]) || "Cash",
      amount: Number(row[8]) || 0,
      admin: clean_(row[17]),
      paidFromCollectedCash: clean_(row[10]).toLowerCase() === "yes",
      handoverId: clean_(row[19]),
      handoverStatus: clean_(row[20]) || "Pending"
    };
  }).filter(item => item.id && item.admin === admin && item.amount > 0 && ["Income", "Expense"].includes(item.transactionType) && dateInRange_(item.date, start, end) && (!pendingOnly || !item.handoverId));
}

function markHandoverRows_(summary, handoverId) {
  (summary.transactions || []).forEach(item => {
    if (item.source === "savings") sh_(item.sheetName).getRange(item.rowNumber, 13, 1, 2).setValues([[handoverId, "Handed Over"]]);
    else if (item.source === "churchTransaction") sh_(item.sheetName).getRange(item.rowNumber, 20, 1, 2).setValues([[handoverId, "Handed Over"]]);
    else sh_(item.sheetName).getRange(item.rowNumber, 17, 1, 2).setValues([[handoverId, "Handed Over"]]);
  });
  (summary.expenses || []).forEach(item => {
    if (item.source === "churchTransaction") sh_(item.sheetName).getRange(item.rowNumber, 20, 1, 2).setValues([[handoverId, "Handed Over"]]);
    else sh_(item.sheetName).getRange(item.rowNumber, 9, 1, 2).setValues([[handoverId, "Handed Over"]]);
  });
}

function buildAllAdminHandoverOverview_(start, end) {
  const admins = {};
  const entryFor = admin => admins[admin] || (admins[admin] = { admin, collected: 0, handedOver: 0, pending: 0, cashDifference: 0 });
  const addCash = (admin, amount, handoverId) => {
    if (!admin || !amount) return;
    const entry = entryFor(admin);
    entry.collected += amount;
    if (handoverId) entry.handedOver += amount; else entry.pending += amount;
  };
  const deductCash = (admin, amount, handoverId) => {
    if (!admin || !amount) return;
    const entry = entryFor(admin);
    if (handoverId) entry.handedOver -= amount; else entry.pending -= amount;
  };
  [SHEETS.payments, SHEETS.servicePayments].forEach(sheetName => {
    dataRows_(sheetName).forEach(row => {
      if (sameSheet_(sheetName, SHEETS.payments) && isSavingsConversionPaymentRow_(row)) return;
      const admin = clean_(row[9]);
      const amount = Number(row[6]) || 0;
      if (!admin || !amount || !dateInRange_(coerceDate_(row[1]), start, end)) return;
      addCash(admin, amount, clean_(row[16]));
    });
  });
  currentDataRows_(SHEETS.savingsHistory).forEach(row => {
    const admin = clean_(row[6]);
    const amount = Number(row[4]) || 0;
    if (!admin || !amount || !dateInRange_(coerceDate_(row[1]), start, end)) return;
    addCash(admin, amount, clean_(row[12]));
  });
  collectAllChurchTransactionOverviewRows_(start, end).forEach(item => {
    if (item.transactionType === "Income") {
      addCash(item.admin, item.amount, item.handoverId);
    } else if (item.transactionType === "Expense" && item.paidFromCollectedCash) {
      deductCash(item.admin, item.amount, item.handoverId);
    }
  });
  currentDataRows_(SHEETS.expenses).forEach(row => {
    if (clean_(row[6]).toLowerCase() !== "yes") return;
    const admin = clean_(row[4]);
    const amount = Number(row[3]) || 0;
    if (!admin || !amount || !dateInRange_(coerceDate_(row[0]), start, end)) return;
    deductCash(admin, amount, clean_(row[8]));
  });
  dataRows_(SHEETS.handovers).forEach(row => {
    const admin = clean_(row[1]);
    if (!admin || !dateInRange_(coerceDate_(row[3]), start, end)) return;
    const entry = entryFor(admin);
    entry.cashDifference += Number(row[9]) || 0;
  });
  return Object.keys(admins).sort().map(key => {
    const item = admins[key];
    item.collected = Number(item.collected.toFixed(2));
    item.handedOver = Number(item.handedOver.toFixed(2));
    item.pending = Number(item.pending.toFixed(2));
    item.cashDifference = Number(item.cashDifference.toFixed(2));
    return item;
  });
}

function getOverallHandoverDashboard(form) {
  const admin = clean_(form && form.admin) || clean_(form && form.adminUser);
  if (!admin) throw new Error("Please login again.");
  requirePermission_(admin, "manageHandover");
  if (roleForUser_(admin) !== ROLES.superAdmin) throw new Error("Your role does not allow this action.");
  ensureOverallHandoverSheet_();
  const summaries = buildPendingOverallHandoverSummaries_();
  return {
    ok: true,
    meetingDate: dateInputValue_(new Date()),
    summaries,
    grandTotals: overallGrandTotals_(summaries),
    history: overallHandoverHistory_()
  };
}

function confirmOverallHandover(form) {
  return timed_("confirmOverallHandover", () => withWriteLock_("confirmOverallHandover", () => withIdempotency_("confirmOverallHandover", form && form.requestId, clean_(form && form.admin) || clean_(form && form.adminUser), () => {
    const superAdmin = clean_(form && form.admin) || clean_(form && form.adminUser);
    if (!superAdmin) throw new Error("Please login again.");
    requirePermission_(superAdmin, "manageHandover");
    if (roleForUser_(superAdmin) !== ROLES.superAdmin) throw new Error("Your role does not allow this action.");
    const summaries = buildPendingOverallHandoverSummaries_();
    if (!summaries.length) throw new Error("No pending admin handovers found.");
    const byAdmin = {};
    summaries.forEach(item => byAdmin[item.admin] = item);
    let confirmations = [];
    try {
      confirmations = JSON.parse(clean_(form && form.confirmationsJson) || "[]");
    } catch (err) {
      throw new Error("Overall handover confirmations could not be read.");
    }
    if (!Array.isArray(confirmations) || !confirmations.length) throw new Error("Confirm at least one admin handover.");
    const confirmed = confirmations.map(row => {
      const admin = clean_(row.admin);
      const summary = byAdmin[admin];
      if (!summary) throw new Error("Pending handover not found for admin: " + admin);
      const status = clean_(row.status) === "Partial" ? "Partial" : "Full";
      const remaining = status === "Partial" ? Number(row.remainingUnpaid) : 0;
      if (status === "Partial" && (isNaN(remaining) || remaining < 0)) throw new Error("Remaining unpaid amount must be valid for " + admin + ".");
      if (remaining > summary.totalResponsibility) throw new Error("Remaining unpaid cannot exceed total responsibility for " + admin + ".");
      const cashReceived = Number((summary.totalResponsibility - remaining).toFixed(2));
      return Object.assign({}, summary, {
        confirmationStatus: status === "Partial" ? "Partial" : "Complete",
        remainingUnpaid: Number(remaining.toFixed(2)),
        cashReceived
      });
    });
    const overallId = nextId_("OVH");
    const meetingDate = form && form.meetingDate ? new Date(form.meetingDate) : new Date();
    const notes = clean_(form && form.notes);
    // Handover PDFs always render in German + Tigrinya, regardless of the
    // admin's own dashboard language — the document is for recipients who
    // read German/Tigrinya, not for the admin generating it.
    const pdfUrl = createOverallHandoverPdf_(overallId, meetingDate, superAdmin, confirmed, notes, "de");
    const sh = ensureOverallHandoverSheet_();
    confirmed.forEach(item => {
      sh.appendRow([
        overallId,
        meetingDate,
        superAdmin,
        item.admin,
        item.handoverIds.join(", "),
        item.membershipIncome,
        item.serviceIncome,
        item.materialSaleIncome,
        item.otherIncome,
        item.expensesFromCash,
        item.bankTransfers,
        item.cashExpected,
        item.previousOutstanding,
        item.totalResponsibility,
        item.cashReceived,
        item.confirmationStatus,
        item.remainingUnpaid,
        pdfUrl,
        notes,
        new Date()
      ]);
      markAdminHandoversOverall_(item.handoverIds, overallId, item.confirmationStatus, item.cashReceived, item.remainingUnpaid);
    });
    logAction_("CONFIRM_OVERALL_HANDOVER", SHEETS.overallHandovers, overallId, superAdmin, "", JSON.stringify({ admins: confirmed.length, totalResponsibility: overallGrandTotals_(confirmed).totalResponsibility, cashReceived: overallGrandTotals_(confirmed).cashReceived, pdfUrl }));
    invalidateFastCaches_([SHEETS.handovers, SHEETS.overallHandovers]);
    SpreadsheetApp.flush();
    return { ok: true, overallHandoverId: overallId, pdfUrl, summaries: confirmed, grandTotals: overallGrandTotals_(confirmed) };
  })));
}

function buildPendingOverallHandoverSummaries_() {
  ensureHandoverSheet_();
  ensureOverallHandoverSheet_();
  const pending = dataRows_(SHEETS.handovers).map((row, index) => ({
    rowNumber: index + 3,
    handoverId: clean_(row[0]),
    admin: clean_(row[1]),
    pdfUrl: clean_(row[12]),
    notes: clean_(row[13]),
    status: clean_(row[14]),
    overallId: clean_(row[20])
  })).filter(item => item.handoverId && item.admin && !item.overallId && item.notes.indexOf("[ADMIN_EXPECTED_HANDOVER]") >= 0);
  const grouped = {};
  pending.forEach(item => {
    const entry = grouped[item.admin] || (grouped[item.admin] = emptyOverallSummary_(item.admin));
    entry.handoverIds.push(item.handoverId);
    entry.adminHandoverRows.push(item.rowNumber);
    if (item.pdfUrl) entry.adminPdfUrls.push(item.pdfUrl);
  });
  Object.keys(grouped).forEach(admin => {
    const entry = grouped[admin];
    aggregateOverallLinkedRows_(entry);
    entry.previousOutstanding = handoverCarryForwardForAdmin_(admin);
    finalizeOverallSummary_(entry);
  });
  return Object.keys(grouped).sort().map(admin => grouped[admin]);
}

function emptyOverallSummary_(admin) {
  return {
    admin,
    handoverIds: [],
    adminHandoverRows: [],
    adminPdfUrls: [],
    membershipIncome: 0,
    serviceIncome: 0,
    materialSaleIncome: 0,
    otherIncome: 0,
    expensesFromCash: 0,
    bankTransfers: 0,
    cashIncome: 0,
    cashExpected: 0,
    previousOutstanding: 0,
    totalResponsibility: 0
  };
}

function aggregateOverallLinkedRows_(entry) {
  const ids = {};
  entry.handoverIds.forEach(id => ids[id] = true);
  [SHEETS.payments, SHEETS.servicePayments].forEach(sheetName => {
    const sh = sh_(sheetName);
    const last = sh.getLastRow();
    if (last < 3) return;
    sh.getRange(3, 1, last - 2, PAYMENT_HEADERS.length).getValues().forEach(row => {
      if (!ids[clean_(row[16])]) return;
      const amount = Number(row[6]) || 0;
      const method = clean_(row[8]) || "Cash";
      if (!amount || isInternalSavingsConversionPayment_({ sheetName, raw: row })) return;
      if (sameSheet_(sheetName, SHEETS.payments)) entry.membershipIncome += amount;
      else entry.serviceIncome += amount;
      if (cashMethod_(method)) entry.cashIncome += amount;
      else entry.bankTransfers += amount;
    });
  });
  const savings = sh_(SHEETS.savingsHistory);
  const savingsLast = savings.getLastRow();
  if (savingsLast >= 3) {
    savings.getRange(3, 1, savingsLast - 2, 14).getValues().forEach(row => {
      if (!ids[clean_(row[12])]) return;
      const amount = Number(row[4]) || 0;
      const method = clean_(row[5]) || "Cash";
      if (!amount) return;
      entry.otherIncome += amount;
      if (cashMethod_(method)) entry.cashIncome += amount;
      else entry.bankTransfers += amount;
    });
  }
  const church = sh_(SHEETS.churchTransactions);
  const churchLast = church.getLastRow();
  if (churchLast >= 3) {
    church.getRange(3, 1, churchLast - 2, CHURCH_TRANSACTION_HEADERS.length).getValues().forEach(row => {
      if (!ids[clean_(row[19])]) return;
      const type = clean_(row[2]);
      const amount = Number(row[8]) || 0;
      if (!amount) return;
      if (type === "Income") {
        const category = clean_(row[4]);
        if (isMaterialSaleCategory_(category)) entry.materialSaleIncome += amount;
        else if (isServiceIncomeCategory_(category)) entry.serviceIncome += amount;
        else entry.otherIncome += amount;
        if (cashMethod_(row[9])) entry.cashIncome += amount;
        else entry.bankTransfers += amount;
      } else if (type === "Expense" && clean_(row[10]).toLowerCase() === "yes") {
        entry.expensesFromCash += amount;
      }
    });
  }
  const expenses = sh_(SHEETS.expenses);
  const expensesLast = expenses.getLastRow();
  if (expensesLast >= 3) {
    expenses.getRange(3, 1, expensesLast - 2, EXPENSE_HEADERS.length).getValues().forEach(row => {
      if (!ids[clean_(row[8])]) return;
      const amount = Number(row[3]) || 0;
      if (amount && clean_(row[6]).toLowerCase() === "yes") entry.expensesFromCash += amount;
    });
  }
}

function isMaterialSaleCategory_(category) {
  return clean_(category).toLowerCase() === "material sale";
}

function isServiceIncomeCategory_(category) {
  const value = clean_(category).toLowerCase();
  return ["wedding", "baptism", "funeral", "certificate", "epiphany", "other church services", "መርዓ", "ጥምቀት", "ናይ ካርዲ ኣባልነት"].includes(value);
}

function finalizeOverallSummary_(entry) {
  ["membershipIncome", "serviceIncome", "materialSaleIncome", "otherIncome", "expensesFromCash", "bankTransfers", "cashIncome", "previousOutstanding"].forEach(key => entry[key] = Number(entry[key].toFixed(2)));
  entry.cashExpected = Number((entry.cashIncome - entry.expensesFromCash).toFixed(2));
  entry.totalResponsibility = Number((entry.cashExpected + entry.previousOutstanding).toFixed(2));
  return entry;
}

function overallGrandTotals_(summaries) {
  const totals = { membershipIncome: 0, serviceIncome: 0, materialSaleIncome: 0, otherIncome: 0, expensesFromCash: 0, bankTransfers: 0, cashExpected: 0, previousOutstanding: 0, totalResponsibility: 0, cashReceived: 0, remainingUnpaid: 0 };
  (summaries || []).forEach(item => Object.keys(totals).forEach(key => totals[key] += Number(item[key]) || 0));
  Object.keys(totals).forEach(key => totals[key] = Number(totals[key].toFixed(2)));
  return totals;
}

function markAdminHandoversOverall_(handoverIds, overallId, status, cashReceived, remainingUnpaid) {
  const sh = ensureHandoverSheet_();
  const rows = dataRows_(SHEETS.handovers);
  const ids = {};
  handoverIds.forEach(id => ids[id] = true);
  rows.forEach((row, index) => {
    if (!ids[clean_(row[0])]) return;
    sh.getRange(index + 3, 15).setValue(status === "Complete" ? "Overall Complete" : "Overall Partial");
    sh.getRange(index + 3, 21, 1, 4).setValues([[overallId, status, cashReceived, remainingUnpaid]]);
  });
}

function overallHandoverHistory_() {
  ensureOverallHandoverSheet_();
  const seen = {};
  dataRows_(SHEETS.overallHandovers).forEach(row => {
    const id = clean_(row[0]);
    if (!id) return;
    const entry = seen[id] || (seen[id] = { overallHandoverId: id, meetingDate: displayDate_(row[1]), superAdmin: clean_(row[2]), pdfUrl: clean_(row[17]), admins: 0, totalResponsibility: 0, cashReceived: 0, remainingUnpaid: 0 });
    entry.admins += 1;
    entry.totalResponsibility += Number(row[13]) || 0;
    entry.cashReceived += Number(row[14]) || 0;
    entry.remainingUnpaid += Number(row[16]) || 0;
  });
  return Object.keys(seen).map(id => {
    const item = seen[id];
    item.totalResponsibility = Number(item.totalResponsibility.toFixed(2));
    item.cashReceived = Number(item.cashReceived.toFixed(2));
    item.remainingUnpaid = Number(item.remainingUnpaid.toFixed(2));
    return item;
  }).sort((a, b) => clean_(b.meetingDate).localeCompare(clean_(a.meetingDate))).slice(0, 25);
}

function collectAllChurchTransactionOverviewRows_(start, end) {
  ensureChurchTransactionSheet_();
  return currentDataRows_(SHEETS.churchTransactions).map(row => ({
    transactionType: clean_(row[2]),
    amount: Number(row[8]) || 0,
    admin: clean_(row[17]),
    date: coerceDate_(row[1]),
    paidFromCollectedCash: clean_(row[10]).toLowerCase() === "yes",
    handoverId: clean_(row[19])
  })).filter(item => item.admin && item.amount > 0 && ["Income", "Expense"].includes(item.transactionType) && dateInRange_(item.date, start, end));
}

function createHandoverPdf_(handoverId, admin, receiver, range, summary, notes, language) {
  const labels = handoverPdfLabels_(language);
  const generated = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  const rangeText = clean_(range && range.label) === "All Pending"
    ? labels.allPending
    : displayDate_(range.start) + " - " + displayDate_(range.end);
  const grandTotal = (summary.incomeBreakdown || []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const balanced = Math.abs(Number(summary.difference || 0)) < 0.01;
  const status = balanced ? labels.balanced : labels.differenceDetected;
  const adminExpectedOnly = clean_(summary.status) === "Submitted - Awaiting Overall Handover";
  const handoverSummaryRows = adminExpectedOnly
    ? [[labels.expectedCash, euro_(summary.expectedCash)], [labels.status, handoverStatusLabel_(summary.status)]]
    : [[labels.expectedCash, euro_(summary.expectedCash)], [labels.actualCashHandedOver, euro_(summary.actualCashHandedOver)], [labels.difference, euro_(summary.difference)], [labels.status, status]];
  const incomeRows = (summary.incomeBreakdown || []).map(row => [row.paymentType, row.count, euro_(row.amount)]);
  if (incomeRows.length) incomeRows.push([labels.grandTotalIncome, "", euro_(grandTotal)]);
  const txRows = (summary.transactions || []).map(item => [
    displayDate_(item.date),
    item.memberName || "-",
    handoverPaymentTypeLabel_(item),
    euro_(item.amount),
    handoverMethodLabel_(item.method),
    item.id
  ]);
  const expenseRows = (summary.expenses || []).map(item => [
    displayDate_(item.date),
    item.category || item.description || "-",
    euro_(item.amount),
    item.paidFromCollectedCash ? labels.yes : labels.no
  ]);
  return createStandardChurchPdf_({
    folder: receiptFolder_(),
    fileName: safeCsvName_("Handover " + handoverId) + ".pdf",
    language: language,
    titleDe: labels.title,
    titleTi: "ጸብጻብ ምርኽኻብ",
    metaTitle: labels.handoverSummary,
    metaSubtitle: "ሓበሬታ ምርኽኻብ",
    metaRows: [
      [labels.handoverId, handoverId],
      [labels.date, displayDate_(new Date())],
      [labels.range, rangeText],
      [labels.generated, generated]
    ],
    partyTitle: labels.people,
    partySubtitle: "ዘረከበ / ዝተቐበለ",
    partyRows: [
      [labels.handedBy, admin],
      [labels.receivedBy, receiver],
      [labels.status, status]
    ],
    highlightLabel: adminExpectedOnly ? labels.expectedCash : labels.finalCashHandedOver,
    highlightSubLabel: adminExpectedOnly ? "ዝጽበ ጥረ ገንዘብ" : "ዝተረከበ ጥረ ገንዘብ",
    highlightValue: euro_(summary.expectedCash),
    methodLabel: labels.status,
    methodSubLabel: "ኩነታት",
    methodValue: status,
    sections: [
      { title: labels.incomeSummary, subtitle: "ጽማቝ እቶት", headers: [labels.paymentType, labels.count, labels.amount], rows: incomeRows, emptyText: labels.noTransactions },
      { title: labels.financialSummary, subtitle: "ጽማቝ ገንዘብ", type: "keyValue", rows: [[labels.totalCashCollected, euro_(summary.cashCollected)], [labels.totalBankTransfers, euro_(summary.bankTransfers)], [labels.totalSavingsReceived, euro_(summary.savingsTotal)], [labels.cashExpensesFromCollected, euro_(summary.cashExpensesFromCollected)], [adminExpectedOnly ? labels.expectedCash : labels.finalCashHandedOver, euro_(summary.expectedCash)]] },
      { title: labels.responsibilitySummary, subtitle: "ጽማቝ ሓላፍነት", type: "keyValue", rows: [[labels.previousOutstanding, euro_(summary.previousOutstanding)], [labels.newCollections, euro_(summary.newCollectionsDuringPeriod)], [labels.totalResponsibility, euro_(summary.totalResponsibility)], [adminExpectedOnly ? labels.expectedCash : labels.amountHandedOver, euro_(summary.expectedCash)], [labels.outstandingRemaining, euro_(summary.outstandingRemaining)]] },
      { title: labels.transactionDetails, subtitle: "ዝርዝር ክፍሊት", headers: [labels.date, labels.memberName, labels.paymentType, labels.amount, labels.method, labels.receiptNumber], rows: txRows, emptyText: labels.noTransactions },
      { title: labels.expenseDetails, subtitle: "ዝርዝር ወጻኢ", headers: [labels.expenseDate, labels.category, labels.amount, labels.paidFromCollected], rows: expenseRows, emptyText: labels.noExpenses },
      { title: labels.handoverSummary, subtitle: "መደምደምታ", type: "keyValue", rows: handoverSummaryRows }
    ],
    notesTitle: labels.status,
    notes: notes || status,
    signatures: [labels.handedBy + ": " + admin, labels.receivedBy + ": " + receiver, labels.date + ":"]
  });
}

function createOverallHandoverPdf_(overallId, meetingDate, superAdmin, summaries, notes, language) {
  const labels = handoverPdfLabels_(language);
  const totals = overallGrandTotals_(summaries);
  const generated = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  const rows = (summaries || []).map(item => [
    item.admin,
    euro_(item.membershipIncome),
    euro_(item.serviceIncome),
    euro_(item.materialSaleIncome),
    euro_(item.otherIncome),
    euro_(item.expensesFromCash),
    euro_(item.bankTransfers),
    euro_(item.cashExpected),
    euro_(item.previousOutstanding),
    euro_(item.totalResponsibility),
    euro_(item.cashReceived || 0),
    item.confirmationStatus === "Partial" ? labels.partial : item.confirmationStatus === "Complete" ? labels.complete : (item.confirmationStatus || ""),
    euro_(item.remainingUnpaid || 0)
  ]);
  if (rows.length) rows.push([
    labels.grandTotalIncome,
    euro_(totals.membershipIncome),
    euro_(totals.serviceIncome),
    euro_(totals.materialSaleIncome),
    euro_(totals.otherIncome),
    euro_(totals.expensesFromCash),
    euro_(totals.bankTransfers),
    euro_(totals.cashExpected),
    euro_(totals.previousOutstanding),
    euro_(totals.totalResponsibility),
    euro_(totals.cashReceived),
    "",
    euro_(totals.remainingUnpaid)
  ]);
  return createStandardChurchPdf_({
    folder: receiptFolder_(),
    fileName: safeCsvName_("Overall Handover " + overallId) + ".pdf",
    language: language,
    titleDe: labels.overallHandoverTitle,
    titleTi: "ጠቕላላ ጸብጻብ ምርኽኻብ",
    metaTitle: labels.overallHandoverMeta,
    metaSubtitle: "ጠቕላላ ምርኽኻብ",
    metaRows: [
      [labels.overallHandoverId, overallId],
      [labels.meetingDate, displayDate_(meetingDate)],
      [labels.generatedDate, generated]
    ],
    partyTitle: labels.meetingConfirmation,
    partySubtitle: "ምርግጋጽ ኣኼባ",
    partyRows: [
      [labels.superAdmin, superAdmin],
      [labels.adminCount, String((summaries || []).length)],
      [labels.status, totals.remainingUnpaid > 0 ? labels.partial : labels.complete]
    ],
    highlightLabel: labels.totalCashReceived,
    highlightSubLabel: "ጠቕላላ ዝተቐበለ ጥረ ገንዘብ",
    highlightValue: euro_(totals.cashReceived),
    methodLabel: labels.remainingUnpaid,
    methodSubLabel: "ዝተረፈ ዘይተኸፍለ",
    methodValue: euro_(totals.remainingUnpaid),
    sections: [
      { title: labels.summaryByAdmin, subtitle: "ጽማቝ ብኣካያዲ", headers: [labels.admin, labels.membership, labels.service, labels.materialSale, labels.otherIncome, labels.cashExpenses, labels.bank, labels.currentExpectedCash, labels.previousOutstanding, labels.totalResponsibility, labels.actualCashReceived, labels.status, labels.remainingOutstanding], rows, emptyText: labels.noTransactions },
      { title: labels.grandTotals, subtitle: "ጠቕላላ", type: "keyValue", rows: [[labels.membershipIncome, euro_(totals.membershipIncome)], [labels.serviceIncome, euro_(totals.serviceIncome)], [labels.materialSaleIncome, euro_(totals.materialSaleIncome)], [labels.otherIncome, euro_(totals.otherIncome)], [labels.expensesFromCash, euro_(totals.expensesFromCash)], [labels.totalBankTransfers, euro_(totals.bankTransfers)], [labels.currentExpectedCash, euro_(totals.cashExpected)], [labels.previousOutstanding, euro_(totals.previousOutstanding)], [labels.totalResponsibility, euro_(totals.totalResponsibility)], [labels.actualCashReceived, euro_(totals.cashReceived)], [labels.remainingOutstanding, euro_(totals.remainingUnpaid)]] },
      { title: labels.signatures, subtitle: "ፊርማ", type: "keyValue", rows: [[labels.superAdminSignature, "____________________________"], [labels.churchStamp, "____________________________"], [labels.notes, notes || "-"]] }
    ],
    notes: notes
  });
}

function handoverPdfLabels_(language) {
  const lang = clean_(language);
  const en = {
    title: "Church Money Handover Report (ጸብጻብ ምርኽኻብ)", handoverId: "Handover ID", date: "Date", range: "Date Range Covered", generated: "Generated Date", people: "Handover Parties", handedBy: "Handed By", receivedBy: "Received By", status: "Status", incomeSummary: "Income Summary", paymentType: "Payment Type", count: "Count", amount: "Amount", grandTotalIncome: "Grand Total Income", financialSummary: "Financial Summary", totalCashCollected: "Total Cash Collected", totalBankTransfers: "Total Bank Transfers", totalSavingsReceived: "Total Savings Received", cashExpensesFromCollected: "Total Expenses Paid From Collected Cash", finalCashHandedOver: "Final Cash Handed Over", responsibilitySummary: "Responsibility Summary", previousOutstanding: "Previous Outstanding Balance", newCollections: "New Collections During Period", totalResponsibility: "Total Responsibility", amountHandedOver: "Amount Handed Over", outstandingRemaining: "Outstanding (Not Yet Handed Over)", transactionDetails: "Transaction Details", memberName: "Member Name", method: "Payment Method", receiptNumber: "Receipt Number", expenseDetails: "Expense Details", expenseDate: "Expense Date", category: "Category", paidFromCollected: "Paid From Collected Cash", handoverSummary: "Handover Summary", expectedCash: "Expected Cash", actualCashHandedOver: "Actual Cash Handed Over", difference: "Difference", balanced: "Balanced ✓", differenceDetected: "Difference Detected ⚠", yes: "Yes", no: "No", noTransactions: "No transactions", noExpenses: "No expenses",
    allPending: "All pending transactions",
    admin: "Admin", overallHandoverTitle: "Overall Church Money Handover Report", overallHandoverMeta: "Overall Handover", overallHandoverId: "Overall Handover ID", meetingDate: "Meeting Date", generatedDate: "Generated Date", meetingConfirmation: "Meeting Confirmation", superAdmin: "Super Admin", adminCount: "Admin Count", partial: "Partial", complete: "Complete", totalCashReceived: "Total Cash Received", remainingUnpaid: "Remaining Unpaid", summaryByAdmin: "Summary by Admin", membership: "Membership", service: "Service", materialSale: "Material Sale", otherIncome: "Other Income", cashExpenses: "Cash Expenses", bank: "Bank", currentExpectedCash: "Current Expected Cash", remainingOutstanding: "Remaining Outstanding", grandTotals: "Grand Totals", membershipIncome: "Membership Income", serviceIncome: "Service Income", materialSaleIncome: "Material Sale Income", expensesFromCash: "Expenses From Cash", actualCashReceived: "Actual Cash Received", signatures: "Signatures", superAdminSignature: "Super Admin Signature", churchStamp: "Church Stamp", notes: "Notes"
  };
  if (lang === "de") return Object.assign({}, en, { title: "Kirchenkasse Übergabebericht", date: "Datum", range: "Zeitraum", generated: "Erstellt am", handedBy: "Übergeben von", receivedBy: "Empfangen von", status: "Status", incomeSummary: "Einnahmenübersicht", paymentType: "Zahlungsart", count: "Anzahl", amount: "Betrag", grandTotalIncome: "Gesamteinnahmen", financialSummary: "Finanzübersicht", totalCashCollected: "Gesammeltes Bargeld", totalBankTransfers: "Banküberweisungen", totalSavingsReceived: "Spar-/Einzahlungsbetrag", cashExpensesFromCollected: "Ausgaben aus eingesammeltem Bargeld", finalCashHandedOver: "Endgültig übergebenes Bargeld", responsibilitySummary: "Verantwortungsübersicht", previousOutstanding: "Vorheriger offener Betrag", newCollections: "Neue Sammlungen im Zeitraum", totalResponsibility: "Gesamtverantwortung", amountHandedOver: "Übergebener Betrag", outstandingRemaining: "Offen (noch nicht übergeben)", transactionDetails: "Transaktionsdetails", memberName: "Mitgliedsname", method: "Zahlungsmethode", receiptNumber: "Belegnummer", expenseDetails: "Ausgabendetails", expenseDate: "Ausgabedatum", category: "Kategorie", paidFromCollected: "Aus eingesammeltem Bargeld bezahlt", handoverSummary: "Übergabeübersicht", expectedCash: "Erwarteter Kassenbestand", actualCashHandedOver: "Tatsächlich übergebenes Bargeld", difference: "Differenz", balanced: "Ausgeglichen ✓", differenceDetected: "Differenz festgestellt ⚠", yes: "Ja", no: "Nein", noTransactions: "Keine Transaktionen", noExpenses: "Keine Ausgaben",
    handoverId: "Übergabe-ID", people: "Übergabepersonen",
    allPending: "Alle ausstehenden Transaktionen",
    admin: "Admin", overallHandoverTitle: "Gesamtübergabebericht", overallHandoverMeta: "Gesamtübergabe", overallHandoverId: "Gesamtübergabe-ID", meetingDate: "Sitzungsdatum", generatedDate: "Erstellt am", meetingConfirmation: "Sitzungsbestätigung", superAdmin: "Super-Admin", adminCount: "Anzahl Admins", partial: "Teilweise", complete: "Abgeschlossen", totalCashReceived: "Gesamt erhaltenes Bargeld", remainingUnpaid: "Verbleibend unbezahlt", summaryByAdmin: "Zusammenfassung nach Admin", membership: "Mitgliedschaft", service: "Dienstleistung", materialSale: "Materialverkauf", otherIncome: "Sonstige Einnahmen", cashExpenses: "Bargeldausgaben", bank: "Bank", currentExpectedCash: "Aktuell erwartetes Bargeld", remainingOutstanding: "Verbleibend offen", grandTotals: "Gesamtsummen", membershipIncome: "Mitgliedsbeiträge", serviceIncome: "Dienstleistungseinnahmen", materialSaleIncome: "Materialverkaufseinnahmen", expensesFromCash: "Ausgaben aus Bargeld", actualCashReceived: "Tatsächlich erhaltenes Bargeld", signatures: "Unterschriften", superAdminSignature: "Unterschrift Super-Admin", churchStamp: "Kirchenstempel", notes: "Bemerkungen" });
  if (lang === "ti") return Object.assign({}, en, { title: "Church Money Handover Report (ጸብጻብ ምርኽኻብ)", handoverId: "መለለዪ ምርኽኻብ", date: "ዕለት", range: "ዝሽፈን ግዜ", generated: "ዝተፈጥረሉ ዕለት", people: "ተረካቢን ዘረከበን", handedBy: "ዘረከበ", receivedBy: "ዝተቐበለ", status: "ኩነታት", incomeSummary: "ጽማቝ እቶት", paymentType: "ዓይነት ክፍሊት", count: "ብዝሒ", amount: "መጠን", grandTotalIncome: "ጠቕላላ እቶት", financialSummary: "ጽማቝ ገንዘብ", totalCashCollected: "ጠቕላላ ጥረ ገንዘብ", totalBankTransfers: "ጠቕላላ ባንክ", totalSavingsReceived: "ጠቕላላ ኣዋህልለለይ", cashExpensesFromCollected: "ካብ ዝተኣከበ ጥረ ገንዘብ ዝተኸፍለ ወጻኢ", finalCashHandedOver: "ዝተረከበ ጥረ ገንዘብ", responsibilitySummary: "ጽማቝ ሓላፍነት", previousOutstanding: "ቅድሚ ሕጂ ዝተረፈ", newCollections: "ሓድሽ ዝተኣከበ", totalResponsibility: "ጠቕላላ ሓላፍነት", amountHandedOver: "ዝተረከበ መጠን", outstandingRemaining: "ዝተረፈ ዘይተረከበ", transactionDetails: "ዝርዝር ክፍሊት", memberName: "ስም ኣባል", method: "ኣገባብ ክፍሊት", receiptNumber: "ቁጽሪ ቅብሊት", expenseDetails: "ዝርዝር ወጻኢ", expenseDate: "ዕለት ወጻኢ", category: "ዓይነት", paidFromCollected: "ካብ ዝተኣከበ ገንዘብ ተኸፊሉ", handoverSummary: "ጽማቝ ምርኽኻብ", expectedCash: "ዝጽበ ጥረ ገንዘብ", actualCashHandedOver: "ብሓቂ ዝተረከበ", difference: "ፍልልይ", balanced: "ተመዓራርዩ ✓", differenceDetected: "ፍልልይ ተረኺቡ ⚠", yes: "እወ", no: "ኣይፋል", noTransactions: "ክፍሊት የለን", noExpenses: "ወጻኢ የለን" });
  return en;
}

function dateInRange_(date, start, end) {
  return date && !isNaN(date) && date >= start && date <= end;
}

