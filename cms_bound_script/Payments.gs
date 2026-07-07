function addPayment(form) {
  return timed_("addPayment", () => withWriteLock_("addPayment", () => withIdempotency_("addPayment", form && form.requestId, form && form.recordedBy, () => addPaymentUnlocked_(form))));
}

function addPaymentUnlocked_(form) {
  const recordedBy = clean_(form.recordedBy);
  if (!recordedBy) throw new Error("Recorded By is required.");
  requirePermission_(recordedBy, "managePayments");
  const isNonMemberPayment = clean_(form.payerType) === "nonMember";
  const member = isNonMemberPayment ? null : (form.memberId ? findMember_(form.memberId) : findMember_(form.memberQuery));
  const memberId = isNonMemberPayment ? (clean_(form.memberId) || "") : (member ? member.id : clean_(form.memberQuery));
  const memberName = isNonMemberPayment ? (clean_(form.memberName) || clean_(form.memberQuery) || "Non-member donor") : (member ? member.name : clean_(form.memberName));
  const memberPhone = isNonMemberPayment ? clean_(form.payerPhone) : (member ? member.phone : "");
  if (!isNonMemberPayment && !memberId && !memberName) throw new Error("Member ID or Member Name is required.");
  let amount = Number(form.amount) || 0;
  if (amount <= 0) throw new Error("Amount must be greater than 0.");
  const paymentKind = normalizePaymentKind_(form.paymentKind || form.paymentType || form.reason);
  if (paymentKind === "Savings") {
    if (isNonMemberPayment || !member) throw new Error("Choose a valid member first.");
    return addSavingsDepositUnlocked_(form, member, amount, recordedBy);
  }
  const reason = paymentKind === "Service"
    ? (clean_(form.serviceType) || clean_(form.reason) || "Other")
    : (clean_(form.reason) || (isNonMemberPayment ? "Voluntary" : "Membership"));
  const isMembership = !isNonMemberPayment && paymentKind === "Membership";
  const coverageItems = isMembership ? getSelectedCoverage_(form, member, amount) : [];
  if (isMembership) assertMembershipCoverageIsFullYears_(member, coverageItems);
  const membershipFunding = isMembership ? membershipFundingIndex_() : null;
  if (isMembership) {
    assertCoverageIsUnpaid_(memberId, coverageItems);
    const existingPayment = existingMembershipPaymentForCoverage_(memberId, coverageItems, form.paymentDate, recordedBy);
    if (existingPayment) {
      return existingMembershipPaymentResponse_(form, member, coverageItems, existingPayment, amount, recordedBy);
    }
    const selectedDue = remainingDueForCoverage_(member, coverageItems, membershipFunding);
    if (Math.abs(amount - selectedDue) > 0.009) {
      throw new Error("This amount cannot be saved as Membership Payment. Please use Savings/Deposit.");
    }
    amount = selectedDue;
  }
  const selectedMonths = isMembership ? coverageItems.map(item => item.month) : [];
  const paymentDate = form.paymentDate ? new Date(form.paymentDate) : new Date();
  const year = isMembership ? coverageYearLabel_(coverageItems) : (Number(form.year) || new Date().getFullYear());
  const baseTxId = nextId_("TXN");
  const monthLabel = isMembership ? coverageYearLabel_(coverageItems) : "";
  const donorNote = isNonMemberPayment ? "Non-member donor payment" : "";
  const transactionType = clean_(form.transactionType) || "Normal";
  const savedNotes = [donorNote, transactionType === "Historical" ? "Historical/backfill transaction" : "", clean_(form.notes)].filter(Boolean).join(" | ");
  const targetSheetName = isMembership ? SHEETS.payments : SHEETS.servicePayments;
  const method = clean_(form.method) || "Cash";
  const txIds = [];
  const paymentRowsToAppend = [];
  const paymentNotesToSet = [];
  if (isMembership) {
    const grouped = coverageByYear_(coverageItems);
    const years = Object.keys(grouped).map(Number).sort((a, b) => a - b);
    const expectedByYear = years.map(y => remainingDueForYear_(member, y, membershipFunding).amountDue);
    years.forEach((y, index) => {
      const yearItems = grouped[y].map(month => ({ year: y, month }));
      const yearNotes = [transactionType === "Historical" ? "Historical/backfill transaction" : "", clean_(form.notes)].filter(Boolean).join(" | ");
      const txId = years.length === 1 ? baseTxId : baseTxId + "-" + String(index + 1).padStart(2, "0");
      const yearAmount = Number((expectedByYear[index] || 0).toFixed(2));
      txIds.push(txId);
      paymentRowsToAppend.push([
        txId, paymentDate, memberId, memberName, "Yearly", y, yearAmount, reason, method, recordedBy, yearNotes,
        "No", "No", "", "", transactionType, "", "Pending"
      ]);
      paymentNotesToSet.push("Coverage: " + coverageText_(yearItems));
    });
    appendPaymentRows_(targetSheetName, paymentRowsToAppend, paymentNotesToSet);
    updateMembershipCoverage_(memberId, memberName, coverageItems, baseTxId);
    coverageByYearForFundingDelta_(coverageItems).forEach(item => {
      appendMembershipFundingDelta_(memberId, item.year, item.amount, item.monthsSet);
    });
  } else {
    txIds.push(baseTxId);
    appendPaymentRows_(targetSheetName, [[
      baseTxId, paymentDate, memberId, memberName, "", year, amount, reason, method, recordedBy, savedNotes,
      "No", "No", "", "", transactionType, "", "Pending"
    ]], [""]);
  }
  const allTxIds = txIds;
  const membershipApplied = isMembership ? remainingDueForCoverage_(member, coverageItems, membershipFunding) : amount;
  const totalReceived = Number(amount.toFixed(2));
  logAction_("ADD_PAYMENT", targetSheetName, allTxIds.join(", "), recordedBy, "", JSON.stringify({ memberId, memberName, amount: totalReceived, membershipAmount: membershipApplied, cashMembershipAmount: amount, savingsUsedAmount: 0, extraSavingsAmount: 0, reason, monthLabel, txIds: allTxIds, transactionType, receiptGenerated: false }), clean_(form.reasonNote));
  invalidateFastCaches_([targetSheetName, SHEETS.coverage, SHEETS.savingsBalance, SHEETS.savingsConversionLog]);
  return {
    ok: true,
    id: baseTxId,
    transactionIds: allTxIds,
    receiptId: baseTxId,
    receiptUrl: "",
    receiptError: "",
    whatsappUrl: "",
    memberPhone,
    monthLabel,
    total: totalReceived,
    membershipTotal: membershipApplied,
    savingsUsedAmount: 0,
    extraSavedAsSavings: false,
    extraSavingsAmount: 0,
    savingsBalance: undefined,
    conversions: [],
    sheetName: targetSheetName
  };
}

function existingMembershipPaymentForCoverage_(memberId, coverageItems, paymentDateValue, recordedBy) {
  if (!coverageItems || !coverageItems.length) return null;
  const targetMemberId = clean_(memberId);
  const selectedYears = [...new Set(coverageItems.map(item => Number(item.year)))].sort((a, b) => a - b);
  const expectedTotal = Number(expectedAmountForItems_(coverageItems).toFixed(2));
  const grouped = {};
  dataRows_(SHEETS.payments).forEach(row => {
    if (clean_(row[2]) !== targetMemberId) return;
    if (clean_(row[7]) !== "Membership") return;
    const baseId = baseReceiptIdForPaymentId_(row[0]);
    if (!grouped[baseId]) grouped[baseId] = { baseId, rows: [], years: {}, amount: 0 };
    grouped[baseId].rows.push(row);
    grouped[baseId].years[Number(row[5])] = true;
    grouped[baseId].amount = Number((grouped[baseId].amount + (Number(row[6]) || 0)).toFixed(2));
  });
  const selectedKey = selectedYears.join(",");
  return Object.keys(grouped).map(key => grouped[key]).find(item => {
    const years = Object.keys(item.years).map(Number).sort((a, b) => a - b).join(",");
    if (years !== selectedKey) return false;
    if (Math.abs(item.amount - expectedTotal) < 0.01) return true;
    const availableSavings = savingsBalanceForMember_(targetMemberId);
    return item.amount < expectedTotal && item.amount + availableSavings + 0.001 >= expectedTotal;
  }) || null;
}

function existingMembershipPaymentResponse_(form, member, coverageItems, existing, enteredAmount, recordedBy) {
  const expectedTotal = Number((existing.amount || 0).toFixed(2));
  const fullExpectedTotal = Number(expectedAmountForItems_(coverageItems).toFixed(2));
  const savingsRepair = repairMissingSavingsCoverageRows_(form, member, coverageItems, existing, fullExpectedTotal, recordedBy);
  existing.amount = Number((existing.amount + Number(savingsRepair.savingsUsedAmount || 0)).toFixed(2));
  if (savingsRepair.rows && savingsRepair.rows.length) existing.rows = existing.rows.concat(savingsRepair.rows);
  const membershipTotal = Number((existing.amount || fullExpectedTotal).toFixed(2));
  const extraSavingsAmount = Math.max(0, Number(((Number(enteredAmount) || 0) - membershipTotal).toFixed(2)));
  const savingsUsedAmount = Number(existing.rows
    .filter(row => isSavingsConversionPaymentRow_(row))
    .reduce((sum, row) => sum + (Number(row[6]) || 0), 0)
    .toFixed(2));
  let extraSavingsResult = null;
  if (extraSavingsAmount > 0 && clean_(form.extraPaymentHandling) === "saveAsSavings" && !extraSavingsExistsForMembership_(existing.baseId)) {
    const savingsForm = Object.assign({}, form, {
      amount: extraSavingsAmount,
      notes: [clean_(form.notes), "Extra amount from membership payment " + existing.baseId].filter(Boolean).join(" | ")
    });
    extraSavingsResult = addSavingsDepositUnlocked_(savingsForm, member, extraSavingsAmount, recordedBy);
  }
  // Ensure Coverage sheet reflects all coverage items. Safe even if already written —
  // updateMembershipCoverage_ only sets months to "Paid" and never clears them.
  updateMembershipCoverage_(member.id, member.name, coverageItems, existing.baseId);
  const transactionIds = existing.rows.map(row => clean_(row[0])).filter(Boolean);
  const allTxIds = extraSavingsResult ? transactionIds.concat(extraSavingsResult.transactionIds || []) : transactionIds;
  logAction_("IDEMPOTENT_ADD_PAYMENT", SHEETS.payments, allTxIds.join(", "), recordedBy, "", JSON.stringify({
    memberId: member.id,
    baseId: existing.baseId,
    membershipAmount: membershipTotal,
    extraSavingsAmount,
    reusedExistingRows: transactionIds
  }));
  invalidateFastCaches_([SHEETS.payments, SHEETS.savingsBalance, SHEETS.savingsHistory, SHEETS.savingsConversionLog, SHEETS.coverage]);
  return {
    ok: true,
    id: existing.baseId,
    transactionIds: allTxIds,
    receiptId: existing.baseId,
    receiptUrl: "",
    receiptError: "",
    whatsappUrl: "",
    memberPhone: member.phone,
    monthLabel: existing.rows.map(row => row[5]).filter(Boolean).join(", "),
    total: Number(Number(enteredAmount || expectedTotal).toFixed(2)),
    membershipTotal,
    savingsUsedAmount,
    extraSavedAsSavings: extraSavingsAmount > 0,
    extraSavingsAmount,
    savingsBalance: extraSavingsResult ? extraSavingsResult.savingsBalance : savingsBalanceForMember_(member.id),
    conversions: extraSavingsResult ? (extraSavingsResult.conversions || []) : [],
    sheetName: SHEETS.payments,
    idempotent: true
  };
}

function repairMissingSavingsCoverageRows_(form, member, coverageItems, existing, expectedTotal, recordedBy) {
  const existingByYear = {};
  existing.rows.forEach(row => {
    const year = Number(row[5]);
    if (!year) return;
    existingByYear[year] = Number(((existingByYear[year] || 0) + (Number(row[6]) || 0)).toFixed(2));
  });
  const grouped = coverageByYear_(coverageItems);
  const paymentDate = form.paymentDate ? new Date(form.paymentDate) : new Date();
  const method = clean_(form.method) || "Cash";
  const rows = [];
  const notes = [];
  const rowCoverageItems = [];
  let savingsUsedAmount = 0;
  Object.keys(grouped).map(Number).sort((a, b) => a - b).forEach((year, index) => {
    const items = grouped[year].map(month => ({ year, month }));
    const required = Number(expectedAmountForItems_(items).toFixed(2));
    const existingAmount = Number(existingByYear[year] || 0);
    const missing = Number((required - existingAmount).toFixed(2));
    if (missing <= 0.0001) return;
    const txId = existing.baseId + "-SR" + String(index + 1).padStart(2, "0");
    rows.push([
      txId, paymentDate, member.id, member.name, "Yearly", year, missing, "Membership", method, recordedBy,
      ["Savings used with membership payment " + existing.baseId, clean_(form.notes)].filter(Boolean).join(" | "),
      "No", "No", "", "", "Savings Conversion", "", "Internal Conversion"
    ]);
    notes.push("Coverage: " + coverageText_(items));
    rowCoverageItems.push({ txId, items });
    savingsUsedAmount = Number((savingsUsedAmount + missing).toFixed(2));
  });
  if (!rows.length) return { savingsUsedAmount: 0, rows: [] };
  const before = savingsBalanceForMember_(member.id);
  if (before + 0.001 < savingsUsedAmount) return { savingsUsedAmount: 0, rows: [] };
  appendPaymentRows_(SHEETS.payments, rows, notes);
  applySavingsToMembershipPayment_(member, savingsUsedAmount, existing.baseId, paymentDate, method, recordedBy, clean_(form.notes));
  rowCoverageItems.forEach(entry => {
    updateMembershipCoverage_(member.id, member.name, entry.items, entry.txId);
  });
  clearCachedMembershipFundingIndex_();
  return { savingsUsedAmount, rows };
}

function extraSavingsExistsForMembership_(baseTxId) {
  const base = clean_(baseTxId);
  if (!base || !sheetByName_(SHEETS.savingsHistory)) return false;
  return dataRows_(SHEETS.savingsHistory).some(row => clean_(row[7]).indexOf("Extra amount from membership payment " + base) >= 0);
}

function normalizePaymentKind_(value) {
  const raw = clean_(value);
  const lower = raw.toLowerCase();
  if (lower === "service" || lower === "service fee" || ["Wedding", "Baptism", "Funeral", "Certificate", "Epiphany", "Membership Card", "Tithe", "ናይ ካርዲ ኣባልነት", "ዕሽር", "Other"].indexOf(raw) >= 0) return "Service";
  if (lower === "savings" || lower === "saving" || lower === "deposit" || lower === "savings / deposit" || raw === "ኣዋህልለለይ") return "Savings";
  return "Membership";
}

function addSavingsDepositUnlocked_(form, member, amount, recordedBy) {
  const sheets = ensureSavingsSheets_();
  const paymentDate = form.paymentDate ? new Date(form.paymentDate) : new Date();
  const method = clean_(form.method) || "Cash";
  const notes = clean_(form.notes);
  const depositId = nextId_("SAV");
  const before = savingsBalanceForMember_(member.id);
  const conversions = savingsConversionsForBalance_(member, Number((before + amount).toFixed(2)));
  const conversionResults = [];
  let convertedAmount = 0;
  const conversionRows = [];
  const conversionNotes = [];
  conversions.forEach(conversion => {
    const conversionTxId = nextId_("TXN");
    const yearNotes = ["Auto-converted from savings deposit " + depositId, notes].filter(Boolean).join(" | ");
    conversionRows.push([
      conversionTxId, paymentDate, member.id, member.name, "Yearly", conversion.year, conversion.amount, "Membership", method, recordedBy, yearNotes,
      "No", "No", "", "", "Savings Conversion", "", "Internal Conversion"
    ]);
    conversionNotes.push("Coverage: " + coverageText_(conversion.items));
    conversionResults.push({
      transactionId: conversionTxId,
      year: conversion.year,
      amount: conversion.amount,
      items: conversion.items
    });
    convertedAmount = Number((convertedAmount + conversion.amount).toFixed(2));
  });

  // --- Phase 1: validate all prerequisites before any sheet write ---
  if (!clean_(depositId)) throw new Error("Failed to generate deposit ID. No data was written.");
  if (!clean_(member.id)) throw new Error("Member ID is missing. No data was written.");
  if (!(amount > 0)) throw new Error("Deposit amount must be greater than zero. No data was written.");
  const finalBalance = Number((before + amount - convertedAmount).toFixed(2));
  if (finalBalance < 0) throw new Error("Computed final balance is negative (" + finalBalance + "). No data was written.");
  const conversionTxIds = conversionResults.map(item => item.transactionId).join(", ");
  conversionResults.forEach((result, i) => {
    if (!clean_(result.transactionId)) throw new Error("Conversion " + i + " is missing a transaction ID. No data was written.");
    if (!(result.amount > 0)) throw new Error("Conversion " + i + " has an invalid amount. No data was written.");
    if (!result.items || !result.items.length) throw new Error("Conversion " + i + " has no coverage items. No data was written.");
  });
  if (conversionRows.length !== conversionResults.length) throw new Error("Conversion row count mismatch. No data was written.");

  // --- Phase 2: write in safe order — deposit first, conversions second ---

  // Step 1: Savings History — the source-of-truth record for this deposit.
  // All conversion artefacts (payment rows, conversion log) reference this depositId.
  // Writing it first ensures no artefact can exist for a deposit that was never recorded.
  sheets.history.appendRow([depositId, paymentDate, member.id, member.name, amount, method,
    recordedBy, notes, before, finalBalance, convertedAmount, conversionTxIds]);

  // Step 2: Savings Balance — derived from the now-recorded deposit.
  const balanceRow    = savingsBalanceRow_(member.id);
  const balanceValues = [member.id, member.name, finalBalance, new Date(), depositId, conversionTxIds];
  if (balanceRow > 0) {
    sheets.balance.getRange(balanceRow, 1, 1, balanceValues.length).setValues([balanceValues]);
  } else {
    sheets.balance.appendRow(balanceValues);
  }

  // Step 3: Deposit audit log.
  logAction_("ADD_SAVINGS_DEPOSIT", SHEETS.savingsHistory, depositId, recordedBy, "",
    JSON.stringify({ memberId: member.id, amount, balanceBefore: before, balanceAfter: finalBalance,
      conversions: conversionResults.map(item => ({ transactionId: item.transactionId, year: item.year, amount: item.amount })) }));

  // Steps 4–8: Conversion artefacts — only reached after the deposit is durably recorded.
  if (conversionRows.length) {
    // Step 4: Payment rows.
    appendPaymentRows_(SHEETS.payments, conversionRows, conversionNotes);

    // Step 5: Membership coverage.
    conversionResults.forEach(result => {
      updateMembershipCoverage_(member.id, member.name, result.items, result.transactionId);
    });

    // Step 6: Conversion Log + per-conversion audit.
    let runningBalance = Number((before + amount).toFixed(2));
    conversionResults.forEach(result => {
      const beforeConversion = runningBalance;
      runningBalance = Number((runningBalance - result.amount).toFixed(2));
      sheets.log.appendRow([paymentDate, member.id, member.name, depositId, result.transactionId,
        result.year, result.amount, beforeConversion, runningBalance, recordedBy, notes]);
      logAction_("AUTO_CONVERT_SAVINGS", SHEETS.payments, result.transactionId, recordedBy, "",
        JSON.stringify({ memberId: member.id, depositId, convertedYear: result.year,
          convertedAmount: result.amount, balanceAfter: runningBalance }));
    });

    // Step 7: Cache refresh.
    clearCachedMembershipFundingIndex_();
  }

  invalidateFastCaches_([SHEETS.savingsBalance, SHEETS.savingsHistory, SHEETS.savingsConversionLog, SHEETS.payments, SHEETS.coverage]);
  return {
    ok: true,
    id: conversionResults.length ? conversionResults[0].transactionId : depositId,
    depositId,
    transactionIds: conversionResults.length ? conversionResults.map(item => item.transactionId) : [depositId],
    receiptId: conversionResults.length ? conversionResults[0].transactionId : depositId,
    receiptUrl: "",
    receiptError: "",
    whatsappUrl: "",
    memberPhone: member.phone,
    monthLabel: conversionResults.length ? conversionResults.map(item => item.year).join(", ") : "Savings Deposit",
    total: amount,
    savingsBalance: finalBalance,
    converted: conversionResults.length > 0,
    conversion: conversionResults[0] || null,
    conversions: conversionResults.map(item => ({ transactionId: item.transactionId, year: item.year, amount: item.amount })),
    savingsPreview: savingsConversionPreview_(member, finalBalance),
    sheetName: conversionResults.length ? SHEETS.payments : SHEETS.savingsHistory
  };
}

function applySavingsToMembershipPayment_(member, amount, baseTxId, paymentDate, method, recordedBy, notes) {
  const sheets = ensureSavingsSheets_();
  const before = savingsBalanceForMember_(member.id);
  const savingsUsedAmount = Number(Number(amount || 0).toFixed(2));
  if (savingsUsedAmount <= 0) return { savingsUsedAmount: 0, savingsBalance: before };
  if (before + 0.001 < savingsUsedAmount) {
    throw new Error("Savings balance is not enough to complete this membership payment.");
  }
  const after = Number((before - savingsUsedAmount).toFixed(2));
  const conversionId = baseTxId + "-SAV";
  const balanceRow = savingsBalanceRow_(member.id);
  const balanceValues = [member.id, member.name, after, new Date(), "", conversionId];
  if (balanceRow > 0) {
    sheets.balance.getRange(balanceRow, 1, 1, balanceValues.length).setValues([balanceValues]);
  } else {
    sheets.balance.appendRow(balanceValues);
  }
  sheets.log.appendRow([
    paymentDate || new Date(),
    member.id,
    member.name,
    "Existing Savings Balance",
    conversionId,
    "Membership Payment",
    savingsUsedAmount,
    before,
    after,
    recordedBy,
    ["Savings used with membership payment " + baseTxId, clean_(notes)].filter(Boolean).join(" | ")
  ]);
  logAction_("USE_SAVINGS_FOR_MEMBERSHIP", SHEETS.savingsConversionLog, conversionId, recordedBy, "", JSON.stringify({
    memberId: member.id,
    baseTxId,
    savingsUsedAmount,
    balanceBefore: before,
    balanceAfter: after
  }));
  return { savingsUsedAmount, savingsBalance: after, conversionId };
}

function savingsBalanceForMember_(memberId) {
  const ledgerBalance = ledgerSavingsBalanceForMember_(memberId);
  const row = savingsBalanceRow_(memberId);
  if (row < 0) {
    if (Math.abs(ledgerBalance) > 0.009) {
      const member = findMember_(memberId);
      sh_(SHEETS.savingsBalance).appendRow([clean_(memberId), member ? member.name : "", ledgerBalance, new Date(), "", "Ledger repair"]);
      logAction_("SAVINGS_BALANCE_REPAIR", SHEETS.savingsBalance, clean_(memberId), "System",
        "no row", String(ledgerBalance), "Balance row missing — created from ledger");
    }
    return ledgerBalance;
  }
  const sh    = sh_(SHEETS.savingsBalance);
  const value = Number(sh.getRange(row, 3).getValue()) || 0;
  if (Math.abs(value - ledgerBalance) > 0.009) {
    sh.getRange(row, 3, 1, 3).setValues([[ledgerBalance, new Date(), clean_(sh.getRange(row, 5).getValue())]]);
    logAction_("SAVINGS_BALANCE_REPAIR", SHEETS.savingsBalance, clean_(memberId), "System",
      String(value), String(ledgerBalance), "Stored balance diverged from ledger — auto-corrected");
  }
  return ledgerBalance;
}

function savingsBalanceRow_(memberId) {
  ensureSavingsSheets_();
  const values = dataRows_(SHEETS.savingsBalance);
  const target = clean_(memberId);
  for (let i = 0; i < values.length; i++) {
    if (clean_(values[i][0]) === target) return i + 3;
  }
  return -1;
}

function ledgerSavingsBalanceForMember_(memberId) {
  ensureSavingsSheets_();
  const key = "savings:ledger:" + clean_(memberId);
  if (CMS_DATA_CONTEXT_[key] !== undefined) return CMS_DATA_CONTEXT_[key];
  const target = clean_(memberId);
  if (!target) return 0;
  const deposits = currentDataRows_(SHEETS.savingsHistory)
    .filter(row => clean_(row[2]) === target)
    .reduce((sum, row) => sum + (Number(row[4]) || 0), 0);
  const usedFromLog = currentDataRows_(SHEETS.savingsConversionLog)
    .filter(row => clean_(row[1]) === target)
    .reduce((sum, row) => sum + (Number(row[6]) || 0), 0);
  const used = usedFromLog;
  const balance = Number((deposits - used).toFixed(2));
  CMS_DATA_CONTEXT_[key] = balance;
  return balance;
}

function nextSavingsConversion_(member, availableBalance) {
  return savingsConversionsForBalance_(member, availableBalance)[0] || null;
}

function savingsConversionsForBalance_(member, availableBalance) {
  const currentYear = new Date().getFullYear();
  const unpaid = chronologicalUnpaidItems_(member, currentYear, paymentCoverageIndex_());
  const grouped = coverageByYear_(unpaid);
  const fundingIndex = membershipFundingIndex_();
  let remaining = Number(availableBalance) || 0;
  const conversions = [];
  Object.keys(grouped).map(Number).sort((a, b) => a - b).forEach(year => {
    if (remaining < 0.0001) return;
    const items = grouped[year].map(month => ({ year, month }));
    const amount = remainingDueForYear_(member, year, fundingIndex).amountDue;
    if (amount > 0 && remaining + 0.0001 >= amount) {
      conversions.push({ year, items, amount });
      remaining = Number((remaining - amount).toFixed(2));
    }
  });
  return conversions;
}

function savingsConversionPreview_(member, availableBalance) {
  const currentYear = new Date().getFullYear();
  const unpaid = chronologicalUnpaidItems_(member, currentYear, paymentCoverageIndex_());
  const grouped = coverageByYear_(unpaid);
  const fundingIndex = membershipFundingIndex_();
  const unpaidDetails = Object.keys(grouped).map(Number).sort((a, b) => a - b).map(year => {
    return { year, amountNeeded: remainingDueForYear_(member, year, fundingIndex).amountDue, months: grouped[year] };
  });
  const conversions = savingsConversionsForBalance_(member, availableBalance).map(item => ({
    year: item.year,
    amount: item.amount
  }));
  const totalConverted = conversions.reduce((sum, item) => sum + item.amount, 0);
  const remainingSavings = Number(((Number(availableBalance) || 0) - totalConverted).toFixed(2));
  const convertedYears = {};
  conversions.forEach(item => convertedYears[item.year] = true);
  const remainingUnpaidYears = unpaidDetails.filter(item => !convertedYears[item.year]).map(item => item.year);
  const oldest = unpaidDetails[0] || null;
  return {
    savingsBalance: Number(Number(availableBalance || 0).toFixed(2)),
    oldestUnpaidYear: oldest ? oldest.year : "",
    amountNeeded: oldest ? oldest.amountNeeded : 0,
    yearsThatCanBePaidNow: conversions,
    totalAutoConvert: Number(totalConverted.toFixed(2)),
    remainingSavings,
    remainingUnpaidYears,
    nextUnpaidYear: remainingUnpaidYears.length ? remainingUnpaidYears[0] : "",
    nextAmountNeeded: remainingUnpaidYears.length ? (unpaidDetails.find(item => item.year === remainingUnpaidYears[0]) || {}).amountNeeded || 0 : 0
  };
}

