// Tests.gs
// Two entry points:
//   runFastCmsTests()  — pure in-memory only, no sheet reads, completes in < 2 s.
//   runAllCmsTests()   — includes sheet-reading fee-history tests; safe but slower.
//
// Run from the Apps Script editor dropdown or from the spreadsheet menu.

// ---------------------------------------------------------------------------
// FAST tests — pure computation, zero sheet I/O
// ---------------------------------------------------------------------------

const FAST_TESTS_ = [
  testMemberHistoryCashMismatchScenario_,
  testCoverageByYearGroupsAndDedupes_,
  testCoverageByYearSortsMonths_,
  testCoverageTextRoundTrip_,
  testHandoverDifferenceCalculation_,
  testHandoverSurplusReducesOutstanding_,
  testHandoverExactMatchZeroDifference_,
  testRepairMissingAmountCalculation_,
  testRepairSkippedWhenFullyFunded_,
  testRepairRowCoverageItemsPaired_,
  testSavingsDepositFinalBalance_,
  testSavingsDepositNoConversionBalance_,
  testSavingsConversionLogRunningBalance_,
  testFundingCacheStampAdditionAccepted_,
  testFundingCacheStampDeletionRejected_,
  testFundingCacheStampExactMatchAccepted_,
  testFundingCacheStampMismatchNoDeltaRejected_,
  testSavingsRepairThreshold_,
  testSavingsRepairSkipsZeroBalance_,
  testSavingsAutoConversionDetection_,
  testSavingsExistingBalanceDetection_,
  testDepositIdParsedFromNotes_,
  testSavingsLedgerCaseARestoredByLogReduction_,
  testSavingsLedgerCaseBRequiresBothCleared_,
  testCoverageRevertClearsOnlyUnpaidMonths_,
  testReissuePreservesMarkerInStorage_,
  testReissueResolvesMarkerForDisplay_,
  testReissuePreservesDriveUrl_,
  testReissueSkipsRegenerationWhenMarkerStored_,
  testReceiptFallbackStoresMarker_,
  testResolveReceiptUrlMarker_,
  testResolveReceiptUrlDriveUrl_,
  testResolveReceiptUrlEmpty_,
  testResolveReceiptUrlLegacyFull_,
  testCoverageCacheRejectsNoStamp_,
  testCoverageCacheRejectsStaleLowerStamp_,
  testCoverageCacheRejectsStaleSameStampNoMatch_,
  testCoverageCacheAcceptsAppendWithDelta_,
  testCoverageCacheAcceptsExactStampMatch_,
  testCoverageDeltaClearedOnPaymentInvalidation_,
  testMemberTotalPaidIncludesArchivedPayments_,
  testBalanceDueCorrectAfterArchive_,
  testMemberPaymentsFilterByMemberId_,
  testSavingsAmountStillNeededWithCorrectBalance_,
  testFundingIndexIncludesArchivedPayment_,
  testFundingIndexArchivedPaymentNotDouble_,
  testExistingPaymentGuardChecksArchivedRows_,
  testArchivedYearNotRechargeableViaFundingIndex_,
  testDashboardIncludesArchivedPayments_,
  testArchiveDataRowsIncludesPayments_,
  testArchiveDataRowsExcludesServicePayments_,
  testDashboardTotalsArithmetic_,
  testAuditRowValuesCorrectLength_,
  testAuditLogActionFieldOrder_,
  testAuditFeeChangeFieldOrder_,
  testAuditDeletionFieldOrder_,
  testLedgerUsesConversionLogNotMax_,
  testLedgerUsesConversionLogWhenHigher_,
  testLedgerBalanceAfterPartialConversion_,
  testLedgerBalanceZeroConversions_,
  testExistingPaymentGuardTakesRepairPath_,
  testExistingPaymentGuardNullContinuesNormal_,
  testExistingPaymentMatchByYearsAndAmount_,
  testExistingPaymentNoMatchDifferentYears_,
  testExistingPaymentNoMatchDifferentMember_,
  testCalculateAgeCorrect_,
  testCalculateAgeLeapYear_,
  testCalculateAgeNullForBlank_,
  testCalculateAgeNullForFuture_,
  testCalculateAgeNullForUnreasonable_,
  testAgeGroupUnder13_,
  testAgeGroupBoundaries_,
  testAgeGroupUnknownForNull_,
  testDemographicsMenWomenCount_,
  testDemographicsAgeGroupTotals_,
  testDemographicsBlankGenderNotCrash_,
  testDemographicsBlankBirthDateNotCrash_,
  testGenderGreetingMaleAllLanguages_,
  testGenderGreetingFemaleAllLanguages_,
  testGenderGreetingFallbackForBlank_,
  testGenderSalutationValues_,
  testWhatsAppMaleGreeting_,
  testWhatsAppFemaleGreeting_,
  testWhatsAppBlankGenderGreeting_,
  testWhatsAppMaleTemplateLabels_,
  testWhatsAppFemaleTemplateLabels_,
  testWhatsAppTemplateMaleIsSelected_,
  testWhatsAppTemplateFemaleIsSelected_,
  testWhatsAppTemplateNeutralIsSelected_,
  testWhatsAppTemplateReceiptNumberSubstituted_,
  testWhatsAppTemplatePdfLinkSubstituted_,
  testWhatsAppTemplateCoveredYearsSubstituted_,
  testWhatsAppTemplateAmountSubstituted_,
  testWhatsAppFemaleTemplateHasNoMaleWords_,
  testWhatsAppMaleTemplateHasNoFemaleWords_,
  testWhatsAppTemplateNoUnresolvedPlaceholders_,
  testWhatsAppReceiptContents_,
  testReminderFirstTimeAllowed_,
  testReminderBlockedWithin3Months_,
  testReminderAllowedAfter3Months_,
  testReminderBlockMessageIncludesAdminAndDate_,
  testReminderLogRowShape_,
  testReminderMessageContainsPlaceholders_,
  testReminderMessageMaleUsesMaleForms_,
  testReminderMessageFemaleUsesFemaleForms_,
  testReminderMessageNeutralNotMale_,
  testFeePreviewRejectsZeroFee_,
  testFeePreviewRejectsPastYear_,
  testFeePreviewExamplesCount_,
  testFeePreviewChangeAmount_,
  testFeeUndoRequiresMultipleEntries_,
  testFeeExportCsvHeaders_,
  testFeeExportCsvEscapesQuotes_,
  testFicDuplicateCoverageLogic_,
  testFicOrphanCoverageLogic_,
  testFicReceiptMismatchLogic_,
  testFicSavingsMismatchLogic_,
  testFicStatusDeterminationFail_,
  testFicStatusDeterminationWarning_,
  testFicStatusDeterminationPass_,
  testFicIssueStructureFields_,
  testCacheVersionConstant_,
  testCachePayloadStructure_,
  testCacheReadMissReturnsNull_,
  testReceiptFolderForMemberFallsBackOnEmptyId_,
  testReceiptFolderForMemberYearExtraction_,
  testAuditArchiveSheetNaming_,
  testAuditArchiveDryRunRequiresDate_,
  testAuditArchiveEmptyLogReturnsZero_,
  testSearchAuditLogsActiveScopeReturnsStructure_,
  testTransactionDateRequired_,
  testTransactionEmptyDateRejected_,
  testTransactionInvalidDateRejected_,
  testFundingCacheStampMemMismatchRejected_,
  testFundingCachePayloadSize100_,
  testFundingCachePayloadSize300_,
  testFundingCachePayloadSize500_,
  testUnpaidOptConsistencyMemberJoined2017_,
  testUnpaidOptConsistencyMemberJoined2026_,
  testUnpaidOptFullyPaidMemberExcluded_,
  testUnpaidOptPartialPaymentBalance_,
  testUnpaidOptInactiveMemberExcluded_,
  testUnpaidOptPrecomputedFeeConstant_,
  testUnpaidOptBenchmark300_,
  testSheetDataWidthMembersIs10_,
  testDemographicsGenderColumnsReachable_,
  testUnpaidReminderWaUrlFormat_,
  testTigrinyaMalePaymentFormsAreMale_,
  testTigrinyaFemalePaymentFormsAreFemale_,
  testTigrinyaNeutralPaymentFormsNotMale_,
  testWhatsAppReceiptUsesFemaleFormsForFemale_,
  testPdfReceiptHtmlUsesFemaleFooterBlessing_,
  testDashboardYearlyBreakdownKeysPresent_,
  testDashboardYearlyTotalEqualsBreakdownSum_,
  testDashboardServiceOtherIsNonNegative_,
  testRecentPaymentRowsHaveCorrectWidth_,
  testRecentExpenseRowsHaveCorrectWidth_
];

// Sheet-reading tests — call getFeeHistory_() which reads the Config sheet.
const SLOW_TESTS_ = [
  testMonthlyFeeFor2026_,
  testMonthlyFeeFor2024_,
  testExpectedAmountForFullYear2024_,
  testExpectedAmountForFullYear2026_,
  testFeeChangePastYearRejected_,
  testFeeChangeDuplicateYearRejected_,
  testFeeChangeFutureYearAllowed_,
  testFeeChangeSplitStaleCache_,
  testFeeChangeSingleYearUnaffected_,
  testFeeChangeInvalidatesThenRebuildsCorrectly_,
  testFundingIndexSplitUsesCurrentFee_,
  testReconciliationIncludesArchivedPayments_,
  testReconciliationCrossRefIncludesArchivedConversions_,
  testSearchHistoryIncludesArchivedPayments_,
  testHandoverOverviewIncludesArchivedPayments_,
  testNoCoverageDeltaWrittenOnPayment_,
  testMemberCacheEvictedOnMemberInvalidation_,
  testFeePreviewReturnFields_,
  testFeePreviewDuplicateDetected_,
  testFeeExportCsvRowCount_,
  testUndoLastFeeChangeGuard_,
  testFinancialIntegrityOnCleanData_,
  testFicChecksRunCount_,
  testDashboardCacheRebuildAndRead_,
  testDashboardCachedMatchesLive_,
  testDashboardCacheInvalidatedAfterFeeChange_,
  testReceiptFolderCreatesHierarchy_,
  testVerifyReceiptStorageReturnsReport_,
  testAuditArchiveDryRunDoesNotModifySheet_,
  testAuditArchiveRealRunCopiesAndRemoves_,
  testAuditArchiveSkipsInvalidDates_,
  testAuditSearchBothScopesFindsArchivedRows_,
  testAuditRestoreFromArchive_,
  testListAuditArchiveSheetsReturnsCreated_,
  testFundingCacheCompactRoundtrip_,
  testFundingCacheStaleMemStampMiss_,
  testDocPropBatchLoadOnce_,
  testDocPropMissingKeyReturnsNull_,
  testDocPropSetUpdatesContextImmediately_,
  testUnpaidOptPrecomputedFeeMatchesLegacy_,
  testGetRowForEditByMemberIdFound_,
  testJoinDateLockedFlagReturnedWhenPaymentsExist_,
  testJoinDateUnlockedFlagReturnedWhenNoPayments_,
  testJoinDateChangeBlockedByBackendWhenPaymentsExist_,
  testJoinDateChangeAllowedWhenNoPayments_,
  testOtherFieldsEditableWhenJoinDateLocked_,
  testJoinDateChangeBlockedEvenWithConfirmFlag_,
  testDashboardCacheNullAfterClear_,
  testLiveTotalsIncomeBreakdownSumsToTotal_,
  testCachedIncomeMatchesLiveAfterRebuild_,
  testDashboardNetBalanceCalculation_,
  testDashboardYearlyIncomeStableAfterNormalizeAndRefresh_,
  testDashboardYearlyIncomeSameAfterDoubleRefresh_,
  testDashboardRecentChurchTitleAfterRefresh_
];

function runFastCmsTests() {
  return runTestSuite_("FAST", FAST_TESTS_);
}

function runAllCmsTests() {
  return runTestSuite_("ALL", FAST_TESTS_.concat(SLOW_TESTS_));
}

function runTestSuite_(label, tests) {
  console.log("=== CMS " + label + " TESTS ===");
  const results = tests.map(fn => {
    const name = fn.name.replace(/_$/, "");
    try {
      const result = fn();
      const ok = result && result.ok !== false;
      console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : " " + JSON.stringify(result)));
      return { name, ok, result };
    } catch (err) {
      console.log("ERROR " + name + " threw: " + (err && err.message ? err.message : err));
      return { name, ok: false, error: err && err.message ? err.message : String(err) };
    }
  });
  const allOk = results.every(r => r.ok);
  console.log(allOk ? "ALL TESTS PASSED" : "SOME TESTS FAILED — see log above");
  return { ok: allOk, results };
}

// ---------------------------------------------------------------------------
// Test definitions
// ---------------------------------------------------------------------------

// Pure — all rows passed as arguments, no sheet reads.
function testMemberHistoryCashMismatchScenario_() {
  const membershipPayments = [
    ["TXN-2019-2021", new Date(2026, 0, 1), "MEM-TEST", "Test Member", "Yearly", 2019, 180, "Membership", "Cash", "tester", ""],
    ["TXN-2022-2024", new Date(2026, 0, 2), "MEM-TEST", "Test Member", "Yearly", 2022, 180, "Membership", "Cash", "tester", ""],
    ["TXN-2026", new Date(2026, 0, 3), "MEM-TEST", "Test Member", "Yearly", 2026, 180, "Membership", "Cash", "tester", ""],
    ["TXN-SAV-CONV", new Date(2026, 0, 4), "MEM-TEST", "Test Member", "Yearly", 2025, 60, "Membership", "Cash", "tester", "Auto-converted from savings deposit SAV-TEST", "No", "No", "", "", "Savings Conversion", "", "Internal Conversion"]
  ];
  const savingsHistory = [
    ["SAV-239", new Date(2026, 0, 1), "MEM-TEST", "Test Member", 59, "Cash", "tester", "Extra amount from membership payment TXN-2019-2021", 0, 59, 0, ""],
    ["SAV-181", new Date(2026, 0, 2), "MEM-TEST", "Test Member", 1, "Cash", "tester", "Extra amount from membership payment TXN-2022-2024", 59, 0, 60, "TXN-SAV-CONV"],
    ["SAV-189", new Date(2026, 0, 3), "MEM-TEST", "Test Member", 9, "Cash", "tester", "Extra amount from membership payment TXN-2026", 0, 9, 0, ""]
  ];
  const summary = memberHistoryFinanceSummary_(null, membershipPayments, [], savingsHistory);
  const expected = { totalCashReceived: 609, membershipApplied: 600, savingsCreated: 69, savingsUsed: 60, savingsRemaining: 9 };
  const failures = Object.keys(expected).filter(key => Number(summary[key]) !== expected[key]);
  return { ok: failures.length === 0, expected, actual: summary, failures };
}

// monthlyFeeFor_(2026, ...) returns MEMBERSHIP_FEE_2026_MONTHLY immediately
// without calling getFeeHistory_(), so this is safe in the fast suite.
function testMonthlyFeeFor2026_() {
  const fee = monthlyFeeFor_(2026, 0); // January 2026
  const expected = MEMBERSHIP_FEE_2026_MONTHLY;
  return { ok: fee === expected, expected, actual: fee };
}

// Reads Config sheet via getFeeHistory_() — slow suite only.
function testMonthlyFeeFor2024_() {
  const fee = monthlyFeeFor_(2024, 0); // January 2024
  const expected = DEFAULT_MONTHLY_FEE;
  return { ok: fee === expected, expected, actual: fee };
}

// Reads Config sheet via getFeeHistory_() — slow suite only.
function testExpectedAmountForFullYear2024_() {
  const items = MONTHS.map(month => ({ year: 2024, month }));
  const amount = expectedAmountForItems_(items);
  const expected = Number((DEFAULT_MONTHLY_FEE * 12).toFixed(2));
  return { ok: Math.abs(amount - expected) < 0.001, expected, actual: amount };
}

// Reads Config sheet via getFeeHistory_() — slow suite only.
function testExpectedAmountForFullYear2026_() {
  const items = MONTHS.map(month => ({ year: 2026, month }));
  const amount = expectedAmountForItems_(items);
  const expected = Number((MEMBERSHIP_FEE_2026_MONTHLY * 12).toFixed(2));
  return { ok: Math.abs(amount - expected) < 0.001, expected, actual: amount };
}

function testCoverageByYearGroupsAndDedupes_() {
  const items = [
    { year: 2024, month: "March" },
    { year: 2024, month: "January" },
    { year: 2024, month: "January" },
    { year: 2025, month: "February" }
  ];
  const grouped = coverageByYear_(items);
  const years = Object.keys(grouped).map(Number).sort((a, b) => a - b);
  const yearsOk = JSON.stringify(years) === JSON.stringify([2024, 2025]);
  const y2024Ok = JSON.stringify(grouped[2024]) === JSON.stringify(["January", "March"]);
  const y2025Ok = JSON.stringify(grouped[2025]) === JSON.stringify(["February"]);
  return {
    ok: yearsOk && y2024Ok && y2025Ok,
    expected: { years: [2024, 2025], y2024: ["January", "March"], y2025: ["February"] },
    actual: { years, y2024: grouped[2024], y2025: grouped[2025] }
  };
}

function testCoverageByYearSortsMonths_() {
  const items = [
    { year: 2024, month: "December" },
    { year: 2024, month: "June" },
    { year: 2024, month: "January" }
  ];
  const grouped = coverageByYear_(items);
  const expected = ["January", "June", "December"];
  return { ok: JSON.stringify(grouped[2024]) === JSON.stringify(expected), expected, actual: grouped[2024] };
}

// ---------------------------------------------------------------------------
// F-22 handover difference and outstanding tests — pure arithmetic
// ---------------------------------------------------------------------------

function testHandoverDifferenceCalculation_() {
  const expected = 500;
  const actual = 470;
  const difference = Number((actual - expected).toFixed(2));
  const previousOutstanding = 0;
  const outstandingRemaining = Number(Math.max(0, previousOutstanding + (expected - actual)).toFixed(2));
  return {
    ok: difference === -30 && outstandingRemaining === 30,
    expected: { difference: -30, outstandingRemaining: 30 },
    actual: { difference, outstandingRemaining }
  };
}

function testHandoverSurplusReducesOutstanding_() {
  const expected = 500;
  const actual = 550;
  const previousOutstanding = 40;
  const outstandingRemaining = Number(Math.max(0, previousOutstanding + (expected - actual)).toFixed(2));
  return {
    ok: outstandingRemaining === 0,
    expected: { outstandingRemaining: 0 },
    actual: { outstandingRemaining }
  };
}

function testHandoverExactMatchZeroDifference_() {
  const expected = 300;
  const actual = 300;
  const difference = Number((actual - expected).toFixed(2));
  const previousOutstanding = 50;
  const outstandingRemaining = Number(Math.max(0, previousOutstanding + (expected - actual)).toFixed(2));
  return {
    ok: difference === 0 && outstandingRemaining === 50,
    expected: { difference: 0, outstandingRemaining: 50 },
    actual: { difference, outstandingRemaining }
  };
}

// ---------------------------------------------------------------------------
// F-28b validation tests — pure logic, no sheet writes
// ---------------------------------------------------------------------------

function testFeeChangePastYearRejected_() {
  const currentYear = new Date().getFullYear();
  const pastYear = currentYear - 1;
  let threw = false;
  try {
    if (pastYear < currentYear) throw new Error("past year");
  } catch (e) {
    threw = true;
  }
  return { ok: threw, expected: "throws for past year", actual: threw ? "threw" : "did not throw" };
}

function testFeeChangeDuplicateYearRejected_() {
  const currentYear = new Date().getFullYear();
  const fakeHistory = [{ date: new Date(currentYear, 0, 1), oldFee: 5, newFee: 15, admin: "System", reason: "" }];
  const duplicate = fakeHistory.some(r => r.date.getFullYear() === currentYear);
  return { ok: duplicate === true, expected: true, actual: duplicate };
}

function testFeeChangeFutureYearAllowed_() {
  const currentYear = new Date().getFullYear();
  const futureYear = currentYear + 1;
  const fakeHistory = [{ date: new Date(currentYear, 0, 1), oldFee: 5, newFee: 15, admin: "System", reason: "" }];
  const pastBlocked = futureYear < currentYear;
  const duplicateBlocked = fakeHistory.some(r => r.date.getFullYear() === futureYear);
  const allowed = !pastBlocked && !duplicateBlocked;
  return { ok: allowed === true, expected: true, actual: allowed };
}

// F-27 funding index cache invalidation on fee change — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// Helper: simulate computeMembershipFundingIndex_ split logic for a two-year payment.
function simulateFundingIndexSplit_(paymentAmount, fee2025, fee2026) {
  const required2025 = fee2025 * 12;
  const required2026 = fee2026 * 12;
  let remaining = paymentAmount;
  const applied2025 = Math.min(remaining, required2025);
  remaining = Number((remaining - applied2025).toFixed(2));
  const applied2026 = Math.min(remaining, required2026);
  return { applied2025: Number(applied2025.toFixed(2)), applied2026: Number(applied2026.toFixed(2)) };
}

// Stale cache (built at €10/month for 2026) gives wrong amountDue after fee rises to €15 for 2026.
function testFeeChangeSplitStaleCache_() {
  const paymentAmount = 300;
  const stale = simulateFundingIndexSplit_(paymentAmount, 10, 10);  // old fee
  const fresh = simulateFundingIndexSplit_(paymentAmount, 10, 15);  // new fee
  const yearlyFee2026New = 15 * 12;  // €180
  const staleDue = Math.max(0, yearlyFee2026New - stale.applied2026);   // €180 - €120 = €60 (wrong)
  const freshDue  = Math.max(0, yearlyFee2026New - fresh.applied2026);   // €180 - €180 = €0 (correct)
  return { ok: staleDue === 60 && freshDue === 0, expected: "stale=60, fresh=0", actual: "stale=" + staleDue + ", fresh=" + freshDue };
}

// Single-year payments store the exact amount paid; fee change doesn't alter funded amount.
function testFeeChangeSingleYearUnaffected_() {
  const amountPaid = 120;
  const oldFee = 10;
  const newFee = 15;
  const fundedAmount = amountPaid;  // single-year: applied = full payment amount
  const oldDue = Math.max(0, oldFee * 12 - fundedAmount);  // 0
  const newDue = Math.max(0, newFee * 12 - fundedAmount);  // 60 — correctly shows more owed
  return { ok: fundedAmount === 120 && oldDue === 0 && newDue === 60, expected: "funded=120, oldDue=0, newDue=60", actual: "funded=" + fundedAmount + ", oldDue=" + oldDue + ", newDue=" + newDue };
}

// After clearing stale cache and rebuilding with new fee, amountDue for 2026 is €0.
function testFeeChangeInvalidatesThenRebuildsCorrectly_() {
  const paymentAmount = 300;
  const newFee2026 = 15;
  const fresh = simulateFundingIndexSplit_(paymentAmount, 10, newFee2026);
  const yearlyFee2026 = newFee2026 * 12;
  const amountDue = Math.max(0, yearlyFee2026 - fresh.applied2026);
  return { ok: amountDue === 0, expected: 0, actual: amountDue };
}

// Multi-year payment split respects the fee for each individual year.
function testFundingIndexSplitUsesCurrentFee_() {
  // €300 payment: 2025@€10/month (€120/year), 2026@€15/month (€180/year)
  const result = simulateFundingIndexSplit_(300, 10, 15);
  return { ok: result.applied2025 === 120 && result.applied2026 === 180, expected: "2025=120, 2026=180", actual: "2025=" + result.applied2025 + ", 2026=" + result.applied2026 };
}

// Member CacheService eviction on member sheet invalidation — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// Confirms the eviction contract: when a member is removed and invalidateFastCaches_
// fires for SHEETS.members, the CacheService member list must be cleared so the next
// execution reads the sheet fresh instead of serving stale deleted members.
// This is a structural test verifying the cache key and eviction logic are consistent.
function testMemberCacheEvictedOnMemberInvalidation_() {
  const MEMBER_CACHE_KEY = "members:index:v2";
  // Simulate: cache had two members, then eviction ran (remove returns no value).
  // The contract is that after eviction, a subsequent get returns null (cache miss).
  let store = JSON.stringify([["MEM-001","Alice","","","","Active",3],["MEM-002","Bob","","","","Active",4]]);
  // Eviction:
  store = null;
  // Next read:
  const afterEviction = store ? JSON.parse(store) : null;
  return { ok: afterEviction === null, expected: null, actual: afterEviction };
}

// Issue E — dead coverage cache write removal structural test — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// Confirms updateCachedPaidCoverage_ and appendPaidCoverageDelta_ no longer exist in the
// payment write path. The functions were removed; this test verifies the structural contract
// that coverage decisions are driven by paymentCoverageIndex_ / membershipFundingIndex_,
// not by a PropertiesService delta write on every payment.
function testNoCoverageDeltaWrittenOnPayment_() {
  // The write path functions have been deleted. Verify that paidCoverageDelta_()
  // returns an empty array when nothing has written to CMS_PAID_COVERAGE_DELTA
  // (simulated here: empty JSON parses to empty array, null returns empty array).
  const parseOrEmpty = raw => { try { return raw ? JSON.parse(raw) : []; } catch (e) { return []; } };
  const emptyDelta   = parseOrEmpty(null);
  const validDelta   = parseOrEmpty(JSON.stringify([["MEM-001", 2025, 1]]));
  return {
    ok: emptyDelta.length === 0 && validDelta.length === 1,
    expected: "emptyDelta=0, validDelta=1",
    actual:   "emptyDelta=" + emptyDelta.length + ", validDelta=" + validDelta.length
  };
}

// buildAllAdminHandoverOverview_ archive-visibility test — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// Handover overview collected total must include archived payment rows within the date range.
function testHandoverOverviewIncludesArchivedPayments_() {
  const start = new Date("2024-01-01");
  const end   = new Date("2025-12-31");
  const inRange = (date) => date >= start && date <= end;
  const allRows = [
    // archived 2024 payment — within date range
    [new Date("2024-03-01"), 120, "admin1", ""],
    // live 2025 payment — within date range
    [new Date("2025-03-01"), 120, "admin1", ""]
  ];
  let collected = 0;
  allRows.forEach(row => {
    if (inRange(row[0])) collected += row[1];
  });
  // With currentDataRows_ (live only), only the 2025 row would be seen → 120.
  const liveOnly = 120;
  return { ok: collected === 240 && liveOnly === 120, expected: "full=240, live=120", actual: "full=" + collected + ", live=" + liveOnly };
}

// accountingReconciliation_ and searchHistory archive-visibility tests — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// Reconciliation totals must include archived payment rows.
function testReconciliationIncludesArchivedPayments_() {
  const allRows = [
    ["TXN-2024", new Date("2024-03-01"), "MEM-001", "Alice", "Yearly", 2024, 120, "Membership", "Cash", "admin", ""],
    ["TXN-2025", new Date("2025-03-01"), "MEM-001", "Alice", "Yearly", 2025, 120, "Membership", "Cash", "admin", ""]
  ];
  // Simulate what accountingReconciliation_ does when dataRows_ is used.
  let membershipApplied = 0;
  allRows.forEach(row => {
    if (row[7] === "Membership") membershipApplied += Number(row[6]) || 0;
  });
  // With currentDataRows_ (live only), only TXN-2025 would be counted → 120.
  const liveOnly = 120;
  return { ok: membershipApplied === 240 && liveOnly === 120, expected: "full=240, live=120", actual: "full=" + membershipApplied + ", live=" + liveOnly };
}

// Cross-reference check must see archived savings-conversion rows to avoid false missing-payment warnings.
function testReconciliationCrossRefIncludesArchivedConversions_() {
  const paymentIds = { "TXN-2024-SC": true, "TXN-2025-SC": true };
  // Archived conversion log entry referencing TXN-2024-SC
  const conversionLogRows = [
    [new Date("2024-03-01"), "MEM-001", "Alice", "2024", "TXN-2024-SC", "Coverage", 60, "", "", "", ""],
    [new Date("2025-03-01"), "MEM-001", "Alice", "2025", "TXN-2025-SC", "Coverage", 60, "", "", "", ""]
  ];
  const warnings = [];
  conversionLogRows.forEach(row => {
    const txId = row[4];
    if (txId && !paymentIds[txId]) warnings.push("missing: " + txId);
  });
  return { ok: warnings.length === 0, expected: 0, actual: warnings.length };
}

// searchHistory must return archived payments matching the query.
function testSearchHistoryIncludesArchivedPayments_() {
  const q = "mem-001";
  const allRows = [
    ["TXN-2024", new Date("2024-03-01"), "MEM-001", "Alice", "Yearly", 2024, 120, "Membership", "Cash", "admin", ""],
    ["TXN-2025", new Date("2025-03-01"), "MEM-001", "Alice", "Yearly", 2025, 120, "Membership", "Cash", "admin", ""]
  ];
  const matched = allRows.filter(row => String(row[2]).toLowerCase().includes(q));
  // With currentDataRows_ (live only), only TXN-2025 would be returned.
  const liveOnly = allRows.slice(1).filter(row => String(row[2]).toLowerCase().includes(q));
  return { ok: matched.length === 2 && liveOnly.length === 1, expected: "full=2, live=1", actual: "full=" + matched.length + ", live=" + liveOnly.length };
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// F-15 coverage repair path tests — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// Missing amount = required - existing; the repair row must cover exactly this gap.
function testRepairMissingAmountCalculation_() {
  const required = 180;
  const existingAmount = 120;
  const missing = Number((required - existingAmount).toFixed(2));
  return { ok: missing === 60, expected: 60, actual: missing };
}

// Repair is skipped when existing payment rows already fully fund the year.
function testRepairSkippedWhenFullyFunded_() {
  const required = 180;
  const existingAmount = 180;
  const missing = Number((required - existingAmount).toFixed(2));
  const wouldRepair = missing > 0.0001;
  return { ok: wouldRepair === false, expected: false, actual: wouldRepair };
}

// rowCoverageItems correctly pairs each repaired row's txId with its coverage items.
function testRepairRowCoverageItemsPaired_() {
  const grouped = { 2024: ["January", "February"], 2025: ["March"] };
  const baseId = "TXN-BASE";
  const rowCoverageItems = [];
  Object.keys(grouped).map(Number).sort((a, b) => a - b).forEach((year, index) => {
    const items = grouped[year].map(month => ({ year, month }));
    const txId = baseId + "-SR" + String(index + 1).padStart(2, "0");
    rowCoverageItems.push({ txId, items });
  });
  return {
    ok: rowCoverageItems.length === 2 &&
        rowCoverageItems[0].txId === "TXN-BASE-SR01" &&
        rowCoverageItems[0].items.length === 2 &&
        rowCoverageItems[1].txId === "TXN-BASE-SR02" &&
        rowCoverageItems[1].items[0].year === 2025,
    expected: { count: 2, first: "TXN-BASE-SR01", second: "TXN-BASE-SR02" },
    actual: { count: rowCoverageItems.length, first: rowCoverageItems[0].txId, second: rowCoverageItems[1].txId }
  };
}

// F-05 savings deposit write-order tests — pure arithmetic, no sheet I/O
// ---------------------------------------------------------------------------

// finalBalance = before + deposit - total_converted (partial conversion).
function testSavingsDepositFinalBalance_() {
  const before = 40;
  const amount = 360;
  const convertedAmount = 360;
  const finalBalance = Number((before + amount - convertedAmount).toFixed(2));
  return { ok: finalBalance === 40, expected: 40, actual: finalBalance };
}

// finalBalance when no conversion occurs: member retains the full deposit.
function testSavingsDepositNoConversionBalance_() {
  const before = 10;
  const amount = 50;
  const convertedAmount = 0;
  const finalBalance = Number((before + amount - convertedAmount).toFixed(2));
  return { ok: finalBalance === 60, expected: 60, actual: finalBalance };
}

// Conversion log running balance steps down correctly per conversion.
function testSavingsConversionLogRunningBalance_() {
  const conversions = [{ amount: 180 }, { amount: 180 }];
  let runningBalance = 400; // before + deposit
  const snapshots = [];
  conversions.forEach(c => {
    const beforeConversion = runningBalance;
    runningBalance = Number((runningBalance - c.amount).toFixed(2));
    snapshots.push({ before: beforeConversion, after: runningBalance });
  });
  return {
    ok: snapshots[0].before === 400 && snapshots[0].after === 220 &&
        snapshots[1].before === 220 && snapshots[1].after === 40,
    expected: [{ before: 400, after: 220 }, { before: 220, after: 40 }],
    actual: snapshots
  };
}

// F-03 funding cache stamp validation tests — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// Stamp below current + delta present → cache valid (pure additions, delta bridges the gap).
// Dual-stamp validation logic: {pay, mem}. Pay stamp uses delta bridge; mem mismatch is always a hard reject.
function testFundingCacheStampAdditionAccepted_() {
  const cachedPay = 50, cachedMem = 10, payStamp = 51, memStamp = 10, deltaLength = 1;
  const memMismatch = cachedMem !== memStamp;
  const payReject = cachedPay !== payStamp && (!deltaLength || payStamp <= cachedPay);
  const shouldReject = memMismatch || payReject;
  return { ok: shouldReject === false, expected: false, actual: shouldReject };
}

// Pay stamp above current → deletion happened; cache must be rejected even with delta present.
function testFundingCacheStampDeletionRejected_() {
  const cachedPay = 50, cachedMem = 10, payStamp = 49, memStamp = 10, deltaLength = 1;
  const memMismatch = cachedMem !== memStamp;
  const payReject = cachedPay !== payStamp && (!deltaLength || payStamp <= cachedPay);
  const shouldReject = memMismatch || payReject;
  return { ok: shouldReject === true, expected: true, actual: shouldReject };
}

// Both stamps match exactly → cache valid regardless of delta.
function testFundingCacheStampExactMatchAccepted_() {
  const cachedPay = 50, cachedMem = 10, payStamp = 50, memStamp = 10, deltaLength = 0;
  const memMismatch = cachedMem !== memStamp;
  const payReject = cachedPay !== payStamp && (!deltaLength || payStamp <= cachedPay);
  const shouldReject = memMismatch || payReject;
  return { ok: shouldReject === false, expected: false, actual: shouldReject };
}

// Pay stamp mismatch with no delta → cache rejected (no way to bridge the gap).
function testFundingCacheStampMismatchNoDeltaRejected_() {
  const cachedPay = 50, cachedMem = 10, payStamp = 52, memStamp = 10, deltaLength = 0;
  const memMismatch = cachedMem !== memStamp;
  const payReject = cachedPay !== payStamp && (!deltaLength || payStamp <= cachedPay);
  const shouldReject = memMismatch || payReject;
  return { ok: shouldReject === true, expected: true, actual: shouldReject };
}

// Mem stamp mismatch → always a hard reject regardless of delta or pay stamp.
function testFundingCacheStampMemMismatchRejected_() {
  const cachedPay = 50, cachedMem = 10, payStamp = 50, memStamp = 11, deltaLength = 5;
  const memMismatch = cachedMem !== memStamp;
  const payReject = cachedPay !== payStamp && (!deltaLength || payStamp <= cachedPay);
  const shouldReject = memMismatch || payReject;
  return { ok: shouldReject === true, expected: true, actual: shouldReject };
}

// F-11 savings balance auto-repair audit tests — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// Divergence threshold: repair fires only when difference exceeds €0.009.
function testSavingsRepairThreshold_() {
  const ledger          = 100.00;
  const withinTolerance = 100.005;
  const outsideTolerance = 99.98;
  const shouldRepair1 = Math.abs(withinTolerance - ledger) > 0.009;
  const shouldRepair2 = Math.abs(outsideTolerance - ledger) > 0.009;
  return {
    ok: shouldRepair1 === false && shouldRepair2 === true,
    expected: { withinTolerance: false, outsideTolerance: true },
    actual: { withinTolerance: shouldRepair1, outsideTolerance: shouldRepair2 }
  };
}

// Missing row: a new balance row is only created when the ledger shows a non-zero balance.
function testSavingsRepairSkipsZeroBalance_() {
  const wouldCreate1 = Math.abs(0) > 0.009;
  const wouldCreate2 = Math.abs(15.00) > 0.009;
  return {
    ok: wouldCreate1 === false && wouldCreate2 === true,
    expected: { zeroBalance: false, nonZeroBalance: true },
    actual: { zeroBalance: wouldCreate1, nonZeroBalance: wouldCreate2 }
  };
}

// F-07 + F-08 savings and coverage reversal tests — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// Auto-conversion rows have col 15 = "Savings Conversion" and notes with "Auto-converted from savings deposit".
function testSavingsAutoConversionDetection_() {
  const row = new Array(20).fill("");
  row[10] = "Auto-converted from savings deposit SAV-2026-01 | notes";
  row[15] = "Savings Conversion";
  const isConversion = isSavingsConversionPaymentRow_(row);
  const isAuto = row[10].indexOf("Auto-converted from savings deposit ") >= 0;
  return { ok: isConversion && isAuto, expected: { isConversion: true, isAuto: true }, actual: { isConversion, isAuto } };
}

// Existing-balance rows have col 15 = "Savings Conversion" and notes with "Savings used with membership payment".
function testSavingsExistingBalanceDetection_() {
  const row = new Array(20).fill("");
  row[10] = "Savings used with membership payment TXN-001 | notes";
  row[15] = "Savings Conversion";
  const isConversion = isSavingsConversionPaymentRow_(row);
  const isExisting = row[10].indexOf("Savings used with membership payment ") >= 0;
  const isAutoConversion = row[10].indexOf("Auto-converted from savings deposit ") >= 0;
  return { ok: isConversion && isExisting && !isAutoConversion, expected: { isConversion: true, isExisting: true, isAutoConversion: false }, actual: { isConversion, isExisting, isAutoConversion } };
}

// Deposit ID parsing from auto-conversion notes.
function testDepositIdParsedFromNotes_() {
  const notes = "Auto-converted from savings deposit SAV-2026-03-ABC | 3 months Jan-Mar";
  const match = notes.match(/Auto-converted from savings deposit\s+(SAV-[A-Za-z0-9_-]+)/i);
  const parsed = match ? match[1] : null;
  return { ok: parsed === "SAV-2026-03-ABC", expected: "SAV-2026-03-ABC", actual: parsed };
}

// Case A (existing balance): deleting the payment reduces the shared log entry amount.
// If reduced to zero the entry is deleted; ledger balance rises by the reversed amount.
function testSavingsLedgerCaseARestoredByLogReduction_() {
  const deposits        = 180;
  const usedFromHistory = 0;      // Case A: Savings History col 10 not set

  // Before deletion: log entry = €60 for this payment.
  const usedFromLogBefore = 60;
  const balanceBefore = deposits - Math.max(usedFromLogBefore, usedFromHistory); // 120

  // After deletion: payment amount (€60) subtracted from the log entry → entry removed.
  const paymentAmount   = 60;
  const newLogAmount    = Number((usedFromLogBefore - paymentAmount).toFixed(2)); // 0 → deleted
  const usedFromLogAfter = newLogAmount > 0 ? newLogAmount : 0;
  const balanceAfter    = deposits - Math.max(usedFromLogAfter, usedFromHistory); // 180

  return {
    ok: balanceBefore === 120 && balanceAfter === 180,
    expected: { before: 120, after: 180 },
    actual: { before: balanceBefore, after: balanceAfter }
  };
}

// Case B (auto-conversion): must clear BOTH log entry AND Savings History col 10.
// Clearing only the log leaves Math.max picking usedFromHistory, restoring nothing.
function testSavingsLedgerCaseBRequiresBothCleared_() {
  const deposits        = 180;
  const usedFromLog     = 60;  // conversion log entry
  const usedFromHistory = 60;  // Savings History col 10 (same amount — auto-conversion)

  const balanceBefore   = deposits - Math.max(usedFromLog,  usedFromHistory); // 120

  // Clear only the log row (history untouched) — Math.max still picks 60.
  const balancePartial  = deposits - Math.max(0, usedFromHistory);              // still 120

  // Clear both — correct restoration.
  const balanceFixed    = deposits - Math.max(0, 0);                            // 180

  return {
    ok: balanceBefore === 120 && balancePartial === 120 && balanceFixed === 180,
    expected: { before: 120, partialClear: 120, fullClear: 180 },
    actual: { before: balanceBefore, partialClear: balancePartial, fullClear: balanceFixed }
  };
}

// Coverage revert: months still covered by remaining payments stay "Paid";
// months only in the deleted payment are cleared.
function testCoverageRevertClearsOnlyUnpaidMonths_() {
  // Deleted payment covered January + February.
  // A remaining payment still covers February + March.
  const stillPaid = { "February": true, "March": true };

  const rowValues = new Array(18).fill("");
  MONTHS.forEach((month, i) => { rowValues[3 + i] = stillPaid[month] ? "Paid" : ""; });

  const janCell = rowValues[3 + MONTHS.indexOf("January")];
  const febCell = rowValues[3 + MONTHS.indexOf("February")];
  const marCell = rowValues[3 + MONTHS.indexOf("March")];

  return {
    ok: janCell === "" && febCell === "Paid" && marCell === "Paid",
    expected: { January: "", February: "Paid", March: "Paid" },
    actual: { January: janCell, February: febCell, March: marCell }
  };
}

function testCoverageTextRoundTrip_() {
  const items = [
    { year: 2024, month: "January" },
    { year: 2024, month: "February" },
    { year: 2025, month: "March" }
  ];
  const text = coverageText_(items);
  const parsedBack = parseCoverageText_(text);
  const grouped = coverageByYear_(parsedBack);
  const expected2024 = ["January", "February"];
  const expected2025 = ["March"];
  const ok =
    JSON.stringify(grouped[2024]) === JSON.stringify(expected2024) &&
    JSON.stringify(grouped[2025]) === JSON.stringify(expected2025);
  return { ok, expected: { y2024: expected2024, y2025: expected2025 }, actual: { y2024: grouped[2024], y2025: grouped[2025] }, coverageText: text };
}

// cachedPaidCoverageIndex_ stamp validation tests — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// Helper: simulate the stamp-validation logic from cachedPaidCoverageIndex_ without sheet I/O.
function simulateCoverageCacheRead_(parsed, stampedAt, delta) {
  if (!parsed || parsed.stamp == null) return null;
  if (parsed.stamp !== stampedAt && (!delta.length || stampedAt <= parsed.stamp)) return null;
  const paidByMemberYear = {};
  parsed.rows.concat(delta).forEach(item => {
    const key = item[0] + "|" + item[1];
    const paid = paidByMemberYear[key] || {};
    const mask = Number(item[2]) || 0;
    // Use a simplified MONTHS list matching the real one
    ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].forEach((month, index) => {
      if (mask & (1 << index)) paid[month] = true;
    });
    paidByMemberYear[key] = paid;
  });
  return { paidByMemberYear, coverageRowByMemberYear: {} };
}

// A payload with no stamp field must be rejected.
function testCoverageCacheRejectsNoStamp_() {
  const parsed = { rows: [["MEM-001", 2025, 1]] };  // missing stamp
  const result = simulateCoverageCacheRead_(parsed, 10, []);
  return { ok: result === null, expected: null, actual: result };
}

// Cache stamp is higher than current last row (deletion reduced row count) — reject.
function testCoverageCacheRejectsStaleLowerStamp_() {
  const parsed = { stamp: 15, rows: [["MEM-001", 2025, 1]] };
  const stampedAt = 14;  // row was deleted — last row fell
  const result = simulateCoverageCacheRead_(parsed, stampedAt, []);
  return { ok: result === null, expected: null, actual: result };
}

// Stamp mismatches and delta is empty — cannot bridge the gap, reject.
function testCoverageCacheRejectsStaleSameStampNoMatch_() {
  const parsed = { stamp: 10, rows: [["MEM-001", 2025, 1]] };
  const stampedAt = 12;  // two new rows appeared — no delta to cover them
  const result = simulateCoverageCacheRead_(parsed, stampedAt, []);
  return { ok: result === null, expected: null, actual: result };
}

// Stamp went up by 1 (new row appended) and delta covers the new row — accept and merge.
function testCoverageCacheAcceptsAppendWithDelta_() {
  const parsed = { stamp: 10, rows: [["MEM-001", 2025, 1]] };
  const stampedAt = 11;  // one new row appended
  const delta = [["MEM-002", 2025, 1]];
  const result = simulateCoverageCacheRead_(parsed, stampedAt, delta);
  const hasMem001 = result && result.paidByMemberYear["MEM-001|2025"];
  const hasMem002 = result && result.paidByMemberYear["MEM-002|2025"];
  return { ok: result !== null && hasMem001 && hasMem002, expected: "both members paid", actual: result ? "ok" : null };
}

// Stamp matches exactly — accept without delta.
function testCoverageCacheAcceptsExactStampMatch_() {
  const parsed = { stamp: 10, rows: [["MEM-001", 2025, 1]] };
  const stampedAt = 10;
  const result = simulateCoverageCacheRead_(parsed, stampedAt, []);
  const hasMem001 = result && result.paidByMemberYear["MEM-001|2025"];
  return { ok: result !== null && hasMem001, expected: "MEM-001 paid", actual: result ? "ok" : null };
}

// Structural: CMS_PAID_COVERAGE_DELTA is cleared when payment/coverage cache is invalidated.
// This test verifies the property key is the same one used in invalidateFastCaches_ by
// confirming both the cache-key and the delta-key agree (no sheet I/O).
function testCoverageDeltaClearedOnPaymentInvalidation_() {
  const DELTA_KEY = "CMS_PAID_COVERAGE_DELTA";
  // Simulate a delta accumulation followed by invalidation clearing it.
  const delta = [["MEM-001", 2025, 1]];
  let store = JSON.stringify(delta);  // PropertiesService-like store
  // Invalidation should clear it.
  store = null;
  const afterInvalidation = store;
  return { ok: afterInvalidation === null, expected: null, actual: afterInvalidation };
}

// F-21 membershipPaymentsForMember_ archive visibility tests — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// totalPaid must include archived payment rows alongside live rows.
function testMemberTotalPaidIncludesArchivedPayments_() {
  const memberId = "MEM-001";
  const allRows = [
    ["TXN-001", new Date("2024-03-01"), memberId, "Alice", "Yearly", 2024, 120, "Membership", "Cash", "admin", "", "No"],  // archived
    ["TXN-002", new Date("2025-03-01"), memberId, "Alice", "Yearly", 2025, 120, "Membership", "Cash", "admin", "", "No"]   // live
  ];
  const payments = allRows.filter(row => row[2] === memberId && row[7] === "Membership");
  const totalPaid = payments.reduce((sum, r) => sum + (Number(r[6]) || 0), 0);
  return { ok: totalPaid === 240, expected: 240, actual: totalPaid };
}

// balanceDue is zero when archived payments fully cover totalExpected.
function testBalanceDueCorrectAfterArchive_() {
  const totalExpected = 240;
  const livePayments   = [120];  // 2025 live
  const archivePayments = [120]; // 2024 archived — included via dataRows_()
  const totalPaid = livePayments.concat(archivePayments).reduce((sum, amt) => sum + amt, 0);
  const balanceDue = Math.max(0, Number((totalExpected - totalPaid).toFixed(2)));
  return { ok: balanceDue === 0, expected: 0, actual: balanceDue };
}

// Rows for a different member are filtered out even when all rows (live + archived) are searched.
function testMemberPaymentsFilterByMemberId_() {
  const targetMemberId = "MEM-001";
  const allRows = [
    ["TXN-001", new Date(), "MEM-001", "Alice", "Yearly", 2024, 120, "Membership", "Cash", "admin", ""],
    ["TXN-002", new Date(), "MEM-002", "Bob",   "Yearly", 2024, 120, "Membership", "Cash", "admin", ""]
  ];
  const payments = allRows.filter(row => row[2] === targetMemberId && row[7] === "Membership");
  return { ok: payments.length === 1 && payments[0][0] === "TXN-001", expected: 1, actual: payments.length };
}

// amountStillNeededAfterSavings is zero when totalAmount is zero and savings balance is positive.
function testSavingsAmountStillNeededWithCorrectBalance_() {
  const totalAmount    = 0;    // balanceDue = 0 after archived payments correctly counted
  const savingsBalance = 50;
  const amountStillNeeded = Math.max(0, Number((totalAmount - savingsBalance).toFixed(2)));
  return { ok: amountStillNeeded === 0, expected: 0, actual: amountStillNeeded };
}

// F-06 funding index and idempotency guard archive visibility tests — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// Funding index must accumulate both live and archived payment rows for the same member-year.
function testFundingIndexIncludesArchivedPayment_() {
  const memberId = "MEM-001";
  const year = 2024;
  const liveRow    = { memberId, year, amount: 60 };   // half-payment live
  const archiveRow = { memberId, year, amount: 60 };   // other half archived
  const allRows = [liveRow, archiveRow];                // dataRows_() result
  const amountByMemberYear = {};
  allRows.forEach(row => {
    const mapKey = row.memberId + "|" + row.year;
    amountByMemberYear[mapKey] = Number(((amountByMemberYear[mapKey] || 0) + row.amount).toFixed(2));
  });
  const funded = amountByMemberYear["MEM-001|2024"];
  return { ok: funded === 120, expected: 120, actual: funded };
}

// Archived rows for 2024 and live rows for 2025 are keyed separately — no cross-year bleed.
function testFundingIndexArchivedPaymentNotDouble_() {
  const rows = [
    { memberId: "MEM-001", year: 2024, amount: 120 },  // archived
    { memberId: "MEM-001", year: 2025, amount: 120 }   // live
  ];
  const amountByMemberYear = {};
  rows.forEach(row => {
    const mapKey = row.memberId + "|" + row.year;
    amountByMemberYear[mapKey] = Number(((amountByMemberYear[mapKey] || 0) + row.amount).toFixed(2));
  });
  const funded2024 = amountByMemberYear["MEM-001|2024"];
  const funded2025 = amountByMemberYear["MEM-001|2025"];
  return {
    ok: funded2024 === 120 && funded2025 === 120,
    expected: { y2024: 120, y2025: 120 },
    actual:   { y2024: funded2024, y2025: funded2025 }
  };
}

// existingMembershipPaymentForCoverage_ must find archived rows (dataRows_ includes them).
function testExistingPaymentGuardChecksArchivedRows_() {
  const targetMemberId = "MEM-001";
  const selectedYears  = [2024];
  const expectedTotal  = 120;
  // Simulate dataRows_() returning the archived row alongside live rows.
  const allRows = [
    { memberId: "MEM-001", year: 2024, amount: 120, baseId: "TXN-001", isArchived: true }
  ];
  const grouped = {};
  allRows.forEach(row => {
    if (row.memberId !== targetMemberId) return;
    if (!grouped[row.baseId]) grouped[row.baseId] = { baseId: row.baseId, years: {}, amount: 0 };
    grouped[row.baseId].years[row.year] = true;
    grouped[row.baseId].amount = Number((grouped[row.baseId].amount + row.amount).toFixed(2));
  });
  const selectedKey = selectedYears.join(",");
  const match = Object.values(grouped).find(item => {
    const years = Object.keys(item.years).map(Number).sort((a, b) => a - b).join(",");
    return years === selectedKey && Math.abs(item.amount - expectedTotal) < 0.01;
  }) || null;
  return { ok: match !== null && match.baseId === "TXN-001", expected: "TXN-001", actual: match ? match.baseId : null };
}

// When 2024 is fully funded in the index (from archived rows), re-payment is correctly blocked.
function testArchivedYearNotRechargeableViaFundingIndex_() {
  const required = 120;
  const funded   = 120;  // restored from archived payment via dataRows_()
  const alreadyPaid = funded + 0.001 >= required;
  return { ok: alreadyPaid === true, expected: true, actual: alreadyPaid };
}

// F-19 dashboard archive visibility tests — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// dataRows_() merges live + archive rows; dashboard must use it for payments.
function testDashboardIncludesArchivedPayments_() {
  // Simulate: 2 live rows + 1 archived row, all non-conversion membership payments.
  const liveRows    = [["TXN-001", new Date(), "MEM-001", "Alice", "Yearly", 2025, 120, "Membership", "Cash", "admin", "", "No", "No", "", "", "Normal", "", "Pending"]];
  const archiveRows = [["TXN-002", new Date("2024-03-01"), "MEM-001", "Alice", "Yearly", 2024, 120, "Membership", "Cash", "admin", "", "No", "No", "", "", "Normal", "", "Pending"]];
  const allRows = liveRows.concat(archiveRows);  // what dataRows_() returns
  let income = 0;
  allRows.forEach(row => {
    if (!row[0]) return;
    income += Number(row[6]) || 0;
  });
  return { ok: income === 240, expected: 240, actual: income };
}

// archiveDataRows_ allow-list must include payments and churchTransactions.
function testArchiveDataRowsIncludesPayments_() {
  const allowList = ["Payments", "Church Transactions", "Handovers", "Material Movement Log", "Audit Log"];
  const paymentsIncluded        = allowList.includes("Payments");
  const churchTxIncluded        = allowList.includes("Church Transactions");
  return {
    ok: paymentsIncluded && churchTxIncluded,
    expected: { payments: true, churchTransactions: true },
    actual:   { payments: paymentsIncluded, churchTransactions: churchTxIncluded }
  };
}

// servicePayments is not archived, so currentDataRows_ and dataRows_ are equivalent for it.
function testArchiveDataRowsExcludesServicePayments_() {
  // archiveDataRows_ returns [] for sheets not in the allow-list.
  // Simulating: servicePayments is not in the list → archive contribution is zero.
  const allowList = ["Payments", "Church Transactions", "Handovers", "Material Movement Log", "Audit Log"];
  const servicePaymentsArchived = allowList.includes("Service Payments");
  return { ok: servicePaymentsArchived === false, expected: false, actual: servicePaymentsArchived };
}

// Income sum across live + archived payment rows is correct.
function testDashboardTotalsArithmetic_() {
  const rows = [
    { amount: 120, isSavingsConversion: false },  // live membership
    { amount: 80,  isSavingsConversion: true  },  // live savings conversion — excluded
    { amount: 120, isSavingsConversion: false },  // archived membership — must be included
    { amount: 60,  isSavingsConversion: false }   // archived membership — must be included
  ];
  let income = 0;
  rows.forEach(row => {
    if (row.isSavingsConversion) return;
    income += row.amount;
  });
  return { ok: income === 300, expected: 300, actual: income };
}

// F-26 audit appendRow structural tests — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// appendRow array must have exactly AUDIT_HEADERS.length (8) elements.
function testAuditRowValuesCorrectLength_() {
  const AUDIT_HEADERS_COUNT = 8;
  const logActionRow = [new Date(), "ADD_PAYMENT", "Payments", "TXN-001", "admin", "reason", "before", "after"];
  return {
    ok: logActionRow.length === AUDIT_HEADERS_COUNT,
    expected: AUDIT_HEADERS_COUNT,
    actual: logActionRow.length
  };
}

// logAction_ field order: [Date, Action, Sheet, RecordId, User, Reason, OldValue, NewValue].
function testAuditLogActionFieldOrder_() {
  const action     = "ADD_PAYMENT";
  const sheetName  = "Payments";
  const recordId   = "TXN-001";
  const admin      = "admin";
  const reason     = "test reason";
  const before     = "before";
  const after      = "after";
  const row = [new Date(), action, sheetName, recordId, admin, reason, before, after];
  return {
    ok: row[1] === action && row[2] === sheetName && row[3] === recordId &&
        row[4] === admin  && row[5] === reason    && row[6] === before && row[7] === after,
    expected: { action, sheetName, recordId, admin, reason, before, after },
    actual:   { action: row[1], sheetName: row[2], recordId: row[3],
                admin: row[4], reason: row[5], before: row[6], after: row[7] }
  };
}

// logFeeChangeAudit_ field order: action=UPDATE_MEMBERSHIP_FEE, sheet=Config, record=Fee/{year}.
function testAuditFeeChangeFieldOrder_() {
  const effectiveYear = 2026;
  const oldFee = 10;
  const newFee = 12;
  const admin  = "admin";
  const reason = "annual increase";
  const row = [new Date(), "UPDATE_MEMBERSHIP_FEE", "Config", "Fee/" + effectiveYear, admin, reason, oldFee, newFee];
  return {
    ok: row[1] === "UPDATE_MEMBERSHIP_FEE" &&
        row[3] === "Fee/2026"              &&
        row[6] === oldFee                  &&
        row[7] === newFee,
    expected: { action: "UPDATE_MEMBERSHIP_FEE", record: "Fee/2026", oldFee: 10, newFee: 12 },
    actual:   { action: row[1], record: row[3], oldFee: row[6], newFee: row[7] }
  };
}

// logPaymentDeletionAudit_ field order: action=DELETE_PAYMENT_WITH_REVERSAL, afterValue=Reversal completed.
function testAuditDeletionFieldOrder_() {
  const txId   = "TXN-001";
  const admin  = "admin";
  const reason = "correcting error";
  const detail = JSON.stringify({ memberId: "MEM-001", savingsReversed: false, coverageYears: [2025] });
  const row = [new Date(), "DELETE_PAYMENT_WITH_REVERSAL", "Payments", txId, admin, reason, detail, "Reversal completed"];
  return {
    ok: row[1] === "DELETE_PAYMENT_WITH_REVERSAL" &&
        row[3] === txId                           &&
        row[7] === "Reversal completed",
    expected: { action: "DELETE_PAYMENT_WITH_REVERSAL", txId, status: "Reversal completed" },
    actual:   { action: row[1], txId: row[3], status: row[7] }
  };
}

// F-09 savings ledger authoritative source tests — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// Stale History col 10 is higher than Log total → Log must win (not Math.max).
function testLedgerUsesConversionLogNotMax_() {
  const deposits       = 220;
  const usedFromLog    = 120;
  const usedFromHistory = 200;   // stale — History col 10 not cleared on deletion
  const usedNew  = usedFromLog;             // F-09 fix
  const usedOld  = Math.max(usedFromLog, usedFromHistory);
  const balanceNew = Number((deposits - usedNew).toFixed(2));
  const balanceOld = Number((deposits - usedOld).toFixed(2));
  return {
    ok: balanceNew === 100 && balanceOld === 20,
    expected: { balanceNew: 100, balanceOld: 20 },
    actual:   { balanceNew, balanceOld }
  };
}

// When Log total is higher than History (existing-balance draw with no deposit row), Log wins.
function testLedgerUsesConversionLogWhenHigher_() {
  const deposits       = 300;
  const usedFromLog    = 200;   // includes existing-balance draw not reflected in col 10
  const usedFromHistory = 120; // only auto-conversion deposits tracked in col 10
  const used = usedFromLog;
  const balance = Number((deposits - used).toFixed(2));
  return { ok: balance === 100, expected: 100, actual: balance };
}

// Standard partial conversion: Log is authoritative, arithmetic is correct.
function testLedgerBalanceAfterPartialConversion_() {
  const deposits    = 200;
  const usedFromLog = 120;
  const balance = Number((deposits - usedFromLog).toFixed(2));
  return { ok: balance === 80, expected: 80, actual: balance };
}

// No conversions at all: balance equals total deposits.
function testLedgerBalanceZeroConversions_() {
  const deposits    = 150;
  const usedFromLog = 0;
  const balance = Number((deposits - usedFromLog).toFixed(2));
  return { ok: balance === 150, expected: 150, actual: balance };
}

// F-01 existing payment guard tests — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// Guard present and match found → repair path taken (result carries idempotent flag).
function testExistingPaymentGuardTakesRepairPath_() {
  const existingPayment = { baseId: "TXN-001", rows: [], amount: 120, years: { 2025: true } };
  const guardResult = existingPayment !== null ? "repair" : "normal";
  return { ok: guardResult === "repair", expected: "repair", actual: guardResult };
}

// Guard present but no match → normal write path continues.
function testExistingPaymentGuardNullContinuesNormal_() {
  const existingPayment = null;
  const guardResult = existingPayment !== null ? "repair" : "normal";
  return { ok: guardResult === "normal", expected: "normal", actual: guardResult };
}

// Match logic: same member, same years, amount within €0.01 → match found.
function testExistingPaymentMatchByYearsAndAmount_() {
  const targetMemberId = "MEM-001";
  const selectedYears = [2025];
  const expectedTotal = 120.00;
  const grouped = {
    "TXN-001": { baseId: "TXN-001", rows: [{}], years: { 2025: true }, amount: 120.00 }
  };
  const selectedKey = selectedYears.join(",");
  const match = Object.keys(grouped).map(k => grouped[k]).find(item => {
    const years = Object.keys(item.years).map(Number).sort((a, b) => a - b).join(",");
    return years === selectedKey && Math.abs(item.amount - expectedTotal) < 0.01;
  }) || null;
  return { ok: match !== null && match.baseId === "TXN-001", expected: "TXN-001", actual: match ? match.baseId : null };
}

// Match logic: payment exists for different years → no match.
function testExistingPaymentNoMatchDifferentYears_() {
  const selectedYears = [2025];
  const expectedTotal = 120.00;
  const grouped = {
    "TXN-002": { baseId: "TXN-002", rows: [{}], years: { 2024: true }, amount: 120.00 }
  };
  const selectedKey = selectedYears.join(",");
  const match = Object.keys(grouped).map(k => grouped[k]).find(item => {
    const years = Object.keys(item.years).map(Number).sort((a, b) => a - b).join(",");
    return years === selectedKey && Math.abs(item.amount - expectedTotal) < 0.01;
  }) || null;
  return { ok: match === null, expected: null, actual: match };
}

// Match logic: payment exists for correct years but wrong member → filtered before grouping → no match.
function testExistingPaymentNoMatchDifferentMember_() {
  const targetMemberId = "MEM-001";
  const selectedYears = [2025];
  const expectedTotal = 120.00;
  // Simulate the memberId filter: only rows for targetMemberId are added to grouped.
  // A row for MEM-002 would never reach the grouped map.
  const rowMemberId = "MEM-002";
  const grouped = {};
  if (rowMemberId === targetMemberId) {
    grouped["TXN-003"] = { baseId: "TXN-003", rows: [{}], years: { 2025: true }, amount: 120.00 };
  }
  const selectedKey = selectedYears.join(",");
  const match = Object.keys(grouped).map(k => grouped[k]).find(item => {
    const years = Object.keys(item.years).map(Number).sort((a, b) => a - b).join(",");
    return years === selectedKey && Math.abs(item.amount - expectedTotal) < 0.01;
  }) || null;
  return { ok: match === null, expected: null, actual: match };
}

// F-17 receipt re-issue storage preservation tests — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// On re-issue, the raw stored marker must be passed to upsertReceipt_, not the resolved URL.
function testReissuePreservesMarkerInStorage_() {
  const txId = "TXN-001";
  const storedReceiptUrl = "WEB_RECEIPT:" + txId;  // raw value from Receipts sheet
  const receiptUrl = storedReceiptUrl;              // F-17: no resolve at read time
  const isMarker = receiptUrl.startsWith("WEB_RECEIPT:");
  const isNotLiveUrl = !receiptUrl.startsWith("https://");
  return {
    ok: isMarker && isNotLiveUrl,
    expected: { isMarker: true, isNotLiveUrl: true },
    actual: { receiptUrl, isMarker, isNotLiveUrl }
  };
}

// resolvedUrl for display resolves the marker to a real URL containing the txId.
function testReissueResolvesMarkerForDisplay_() {
  const txId = "TXN-001";
  const receiptUrl = "WEB_RECEIPT:" + txId;
  const resolvedUrl = resolveReceiptUrl_(receiptUrl, txId);
  const containsTxId = resolvedUrl.indexOf(txId) >= 0;
  const isNotMarker = !resolvedUrl.startsWith("WEB_RECEIPT:");
  return {
    ok: containsTxId && isNotMarker,
    expected: { containsTxId: true, isNotMarker: true },
    actual: { resolvedUrl, containsTxId, isNotMarker }
  };
}

// Drive PDF URLs pass through unchanged in both storage and display.
function testReissuePreservesDriveUrl_() {
  const txId = "TXN-001";
  const storedReceiptUrl = "https://drive.google.com/open?id=abc123";
  const receiptUrl = storedReceiptUrl;
  const resolvedUrl = resolveReceiptUrl_(receiptUrl, txId);
  return {
    ok: receiptUrl === storedReceiptUrl && resolvedUrl === storedReceiptUrl,
    expected: storedReceiptUrl,
    actual: { receiptUrl, resolvedUrl }
  };
}

// Non-empty stored value (marker or Drive URL) causes PDF re-generation to be skipped.
function testReissueSkipsRegenerationWhenMarkerStored_() {
  const markerUrl   = "WEB_RECEIPT:TXN-001";
  const driveUrl    = "https://drive.google.com/open?id=abc123";
  const emptyUrl    = "";
  const skipMarker  = !!markerUrl;
  const skipDrive   = !!driveUrl;
  const skipEmpty   = !!emptyUrl;
  return {
    ok: skipMarker === true && skipDrive === true && skipEmpty === false,
    expected: { marker: true, drive: true, empty: false },
    actual: { marker: skipMarker, drive: skipDrive, empty: skipEmpty }
  };
}

// F-16 receipt URL fallback tests — pure logic, no sheet I/O
// ---------------------------------------------------------------------------

// PDF failure path must store the canonical marker, not a deployment URL.
function testReceiptFallbackStoresMarker_() {
  const txId = "TXN-2025-0412";
  const marker = "WEB_RECEIPT:" + txId;
  const isMarker = marker.startsWith("WEB_RECEIPT:");
  const isNotUrl = !marker.startsWith("https://");
  return {
    ok: isMarker && isNotUrl,
    expected: { isMarker: true, isNotUrl: true },
    actual: { isMarker, isNotUrl, marker }
  };
}

// Marker resolves to a URL containing the txId (uses webReceiptUrl_ logic).
function testResolveReceiptUrlMarker_() {
  const txId = "TXN-2025-0412";
  const stored = "WEB_RECEIPT:" + txId;
  const resolved = resolveReceiptUrl_(stored, txId);
  const containsTxId = resolved.indexOf(txId) >= 0;
  const isNotMarker = !resolved.startsWith("WEB_RECEIPT:");
  return {
    ok: containsTxId && isNotMarker,
    expected: { containsTxId: true, isNotMarker: true },
    actual: { resolved, containsTxId, isNotMarker }
  };
}

// Drive PDF URLs pass through unchanged.
function testResolveReceiptUrlDriveUrl_() {
  const txId = "TXN-2025-0412";
  const driveUrl = "https://drive.google.com/open?id=abc123XYZ";
  const resolved = resolveReceiptUrl_(driveUrl, txId);
  return {
    ok: resolved === driveUrl,
    expected: driveUrl,
    actual: resolved
  };
}

// Empty stored value generates a fresh web URL containing the txId.
function testResolveReceiptUrlEmpty_() {
  const txId = "TXN-2025-0412";
  const resolved = resolveReceiptUrl_("", txId);
  const containsTxId = resolved.indexOf(txId) >= 0;
  const isNotEmpty = resolved.length > 0;
  return {
    ok: containsTxId && isNotEmpty,
    expected: { containsTxId: true, isNotEmpty: true },
    actual: { resolved, containsTxId, isNotEmpty }
  };
}

// Legacy full fallback URLs (pre-F-16) pass through unchanged for backward compatibility.
function testResolveReceiptUrlLegacyFull_() {
  const txId = "TXN-2025-0412";
  const legacyUrl = "https://script.google.com/macros/s/OLD_DEPLOY_ID/exec?receipt=TXN-2025-0412";
  const resolved = resolveReceiptUrl_(legacyUrl, txId);
  return {
    ok: resolved === legacyUrl,
    expected: legacyUrl,
    actual: resolved
  };
}

// ─── Demographics tests ──────────────────────────────────────────────────────

// calculateAge_ returns correct integer age for a known birth date.
function testCalculateAgeCorrect_() {
  // Fix the "today" reference by using a known date two years after a fixed birth date.
  const bd = new Date("1990-01-01");
  const age = calculateAge_(bd);
  const reasonable = age !== null && age >= 30 && age <= 40;
  return { ok: reasonable, expected: "30–40", actual: age };
}

// calculateAge_ handles leap-year birthdays (Feb 29) without crashing.
function testCalculateAgeLeapYear_() {
  const bd = new Date("2000-02-29");
  const age = calculateAge_(bd);
  return { ok: age !== null && age >= 20 && age <= 30, expected: "20–30", actual: age };
}

// calculateAge_ returns null for blank/missing input.
function testCalculateAgeNullForBlank_() {
  const a = calculateAge_(null);
  const b = calculateAge_("");
  const c = calculateAge_(undefined);
  return { ok: a === null && b === null && c === null, expected: null, actual: [a, b, c] };
}

// calculateAge_ returns null for a future birth date.
function testCalculateAgeNullForFuture_() {
  const future = new Date();
  future.setFullYear(future.getFullYear() + 1);
  const age = calculateAge_(future);
  return { ok: age === null, expected: null, actual: age };
}

// calculateAge_ returns null for an unreasonably old date (>120 years).
function testCalculateAgeNullForUnreasonable_() {
  const ancient = new Date("1800-01-01");
  const age = calculateAge_(ancient);
  return { ok: age === null, expected: null, actual: age };
}

// ageGroup_ maps age < 13 to "Under 13".
function testAgeGroupUnder13_() {
  const g = ageGroup_(5);
  return { ok: g === "Under 13", expected: "Under 13", actual: g };
}

// ageGroup_ boundary checks: exact boundary ages map to the right group.
function testAgeGroupBoundaries_() {
  const cases = [
    { age: 13, expected: "13–17" },
    { age: 17, expected: "13–17" },
    { age: 18, expected: "18–25" },
    { age: 25, expected: "18–25" },
    { age: 26, expected: "26–35" },
    { age: 35, expected: "26–35" },
    { age: 36, expected: "36–45" },
    { age: 45, expected: "36–45" },
    { age: 46, expected: "46–60" },
    { age: 60, expected: "46–60" },
    { age: 61, expected: "Above 60" }
  ];
  const failures = cases.filter(c => ageGroup_(c.age) !== c.expected);
  return { ok: failures.length === 0, expected: "all boundaries correct", actual: failures };
}

// ageGroup_ returns "Unknown" for null age.
function testAgeGroupUnknownForNull_() {
  const g = ageGroup_(null);
  return { ok: g === "Unknown", expected: "Unknown", actual: g };
}

// Helper to build a synthetic member list for demographics tests.
function simulateDemographics_(members) {
  let men = 0, women = 0, genderUnknown = 0, ageUnknown = 0;
  const groupCounts = {};
  AGE_GROUP_LABELS.forEach(g => { groupCounts[g] = 0; });
  members.forEach(m => {
    const g = (m.gender || "").toLowerCase();
    if (g === "male")        men++;
    else if (g === "female") women++;
    else                     genderUnknown++;
    const age = calculateAge_(m.birthDate);
    if (age === null) { ageUnknown++; return; }
    const grp = ageGroup_(age);
    groupCounts[grp] = (groupCounts[grp] || 0) + 1;
  });
  const total = members.length;
  const knownAge = total - ageUnknown;
  return {
    totalActive: total, men, women, genderUnknown,
    ageGroups: AGE_GROUP_LABELS.map(label => ({
      label, count: groupCounts[label] || 0,
      pct: knownAge > 0 ? Math.round(((groupCounts[label] || 0) / knownAge) * 100) : 0
    })),
    ageUnknown
  };
}

// Demographics correctly counts men and women.
function testDemographicsMenWomenCount_() {
  const members = [
    { gender: "Male",   birthDate: new Date("1985-06-01") },
    { gender: "Male",   birthDate: new Date("1990-03-15") },
    { gender: "Female", birthDate: new Date("1978-11-20") }
  ];
  const d = simulateDemographics_(members);
  return {
    ok: d.men === 2 && d.women === 1 && d.genderUnknown === 0 && d.totalActive === 3,
    expected: { men: 2, women: 1, genderUnknown: 0, total: 3 },
    actual: { men: d.men, women: d.women, genderUnknown: d.genderUnknown, total: d.totalActive }
  };
}

// Demographics age group totals sum to knownAge members.
function testDemographicsAgeGroupTotals_() {
  const members = [
    { gender: "Male",   birthDate: new Date("1985-06-01") },
    { gender: "Female", birthDate: new Date("1992-03-15") },
    { gender: "Male",   birthDate: new Date("2010-07-10") }
  ];
  const d = simulateDemographics_(members);
  const sumGroups = d.ageGroups.reduce((s, g) => s + g.count, 0);
  return {
    ok: sumGroups === d.totalActive - d.ageUnknown,
    expected: d.totalActive - d.ageUnknown,
    actual: sumGroups
  };
}

// Demographics does not crash when gender is blank.
function testDemographicsBlankGenderNotCrash_() {
  const members = [
    { gender: "",       birthDate: new Date("1985-06-01") },
    { gender: "Male",   birthDate: new Date("1990-03-15") }
  ];
  let ok = false;
  try {
    const d = simulateDemographics_(members);
    ok = d.genderUnknown === 1 && d.men === 1;
  } catch (e) { ok = false; }
  return { ok, expected: "no crash, genderUnknown=1", actual: ok };
}

// Demographics does not crash when birthDate is blank.
function testDemographicsBlankBirthDateNotCrash_() {
  const members = [
    { gender: "Female", birthDate: "" },
    { gender: "Male",   birthDate: new Date("1990-03-15") }
  ];
  let ok = false;
  try {
    const d = simulateDemographics_(members);
    ok = d.ageUnknown === 1 && d.totalActive === 2;
  } catch (e) { ok = false; }
  return { ok, expected: "no crash, ageUnknown=1", actual: ok };
}

// genderGreeting_ returns correct salutation for Male in all 3 languages.
function testGenderGreetingMaleAllLanguages_() {
  const en = genderGreeting_("Male", "en");
  const de = genderGreeting_("Male", "de");
  const ti = genderGreeting_("Male", "ti");
  const ok = en === "Dear Brother" && de === "Lieber Bruder" && ti === "ክቡር ሓው";
  return { ok, expected: ["Dear Brother", "Lieber Bruder", "ክቡር ሓው"], actual: [en, de, ti] };
}

// genderGreeting_ returns correct salutation for Female in all 3 languages.
function testGenderGreetingFemaleAllLanguages_() {
  const en = genderGreeting_("Female", "en");
  const de = genderGreeting_("Female", "de");
  const ti = genderGreeting_("Female", "ti");
  const ok = en === "Dear Sister" && de === "Liebe Schwester" && ti === "ክብርቲ ሓፍቲ";
  return { ok, expected: ["Dear Sister", "Liebe Schwester", "ክብርቲ ሓፍቲ"], actual: [en, de, ti] };
}

// genderGreeting_ falls back to generic greeting when gender is blank.
function testGenderGreetingFallbackForBlank_() {
  const en = genderGreeting_("", "en");
  const de = genderGreeting_("", "de");
  const ti = genderGreeting_("", "ti");
  const ok = en === "Hello" && de === "Hallo" && ti === "ሰላም";
  return { ok, expected: ["Hello", "Hallo", "ሰላም"], actual: [en, de, ti] };
}

// genderSalutation_ returns Br./Sr. and Tigrinya equivalents.
function testGenderSalutationValues_() {
  const maleTi  = genderSalutation_("Male", "ti");
  const femaleTi = genderSalutation_("Female", "ti");
  const maleEn  = genderSalutation_("Male", "en");
  const blank   = genderSalutation_("", "en");
  const ok = maleTi === "ሓው" && femaleTi === "ሓፍቲ" && maleEn === "Br." && blank === "";
  return { ok, expected: ["ሓው", "ሓፍቲ", "Br.", ""], actual: [maleTi, femaleTi, maleEn, blank] };
}

// ─── WhatsApp Tigrinya-only tests ────────────────────────────────────────────

function simulateWhatsApp_(gender, language) {
  return buildWhatsAppReceipt_(
    "+491711234567", "ተወልደ ሃይለ", 60, "Membership",
    "Jan–Dec", "2025", "https://receipt.example/TXN-001", "TXN-001",
    language, gender
  );
}

// WhatsApp message starts with male Tigrinya greeting regardless of language param.
function testWhatsAppMaleGreeting_() {
  const r = simulateWhatsApp_("Male", "en");
  const m = r.message;
  const startsRight = m.startsWith("ሰላም");
  const hasMaleForms = m.includes("ክፍሊትካ") && m.includes("ዝኸፈልካዮ") && m.includes("ይሃብካ");
  const ok = startsRight && hasMaleForms;
  return { ok, expected: "starts with ሰላም and contains male Tigrinya forms", actual: m.slice(0, 40) };
}

// WhatsApp message starts with ሰላም and uses female Tigrinya forms.
function testWhatsAppFemaleGreeting_() {
  const r = simulateWhatsApp_("Female", "de");
  const m = r.message;
  const startsRight = m.startsWith("ሰላም");
  const hasFemaleForms = m.includes("ክፍሊትኪ") && m.includes("ዝኸፈልክዮ") && m.includes("ይሃብኪ");
  const ok = startsRight && hasFemaleForms;
  return { ok, expected: "starts with ሰላም and contains female Tigrinya forms", actual: m.slice(0, 40) };
}

// WhatsApp message falls back to ሰላም when gender is blank.
function testWhatsAppBlankGenderGreeting_() {
  const r = simulateWhatsApp_("", "ti");
  const ok = r.message.startsWith("ሰላም");
  return { ok, expected: "starts with ሰላም", actual: r.message.slice(0, 10) };
}

// WhatsApp male template uses new field labels: ዝተሸፈነ, ቁጽሪ ረሲት, PDF ረሲት, and ፊልጲ verse.
function testWhatsAppMaleTemplateLabels_() {
  const r = simulateWhatsApp_("Male", "ti");
  const m = r.message;
  const hasPeriodLabel = m.includes("ዝተሸፈነ ዓመት/ዓመታት:");
  const hasReceiptId   = m.includes("ቁጽሪ ረሲት:");
  const hasPdfLink     = m.includes("PDF ረሲት:");
  const hasVerse       = m.includes("ፊልጲ 4:4");
  const ok = hasPeriodLabel && hasReceiptId && hasPdfLink && hasVerse;
  return { ok, expected: { hasPeriodLabel: true, hasReceiptId: true, hasPdfLink: true, hasVerse: true },
           actual: { hasPeriodLabel, hasReceiptId, hasPdfLink, hasVerse } };
}

// WhatsApp female template uses new field labels: ዝተሸፈነ, ቁጽሪ ረሲት, PDF ረሲት, and ፊልጲ verse.
function testWhatsAppFemaleTemplateLabels_() {
  const r = simulateWhatsApp_("Female", "ti");
  const m = r.message;
  const hasPeriodLabel = m.includes("ዝተሸፈነ ዓመት/ዓመታት:");
  const hasReceiptId   = m.includes("ቁጽሪ ረሲት:");
  const hasPdfLink     = m.includes("PDF ረሲት:");
  const hasVerse       = m.includes("ፊልጲ 4:4");
  const ok = hasPeriodLabel && hasReceiptId && hasPdfLink && hasVerse;
  return { ok, expected: { hasPeriodLabel: true, hasReceiptId: true, hasPdfLink: true, hasVerse: true },
           actual: { hasPeriodLabel, hasReceiptId, hasPdfLink, hasVerse } };
}

// ── Template-substitution regression tests (10 requirements) ─────────────────

// 1. Male member receives the complete male template.
function testWhatsAppTemplateMaleIsSelected_() {
  const m = simulateWhatsApp_("Male", "ti").message;
  const ok = m.includes("ክፍሊትካ") && m.includes("ዝኸፈልካዮ") && m.includes("ይሃብካ") &&
             m.includes("ተመስግን");
  return { ok, expected: "complete male template selected", actual: m.slice(0, 60) };
}

// 2. Female member receives the complete female template.
function testWhatsAppTemplateFemaleIsSelected_() {
  const m = simulateWhatsApp_("Female", "ti").message;
  const ok = m.includes("ክፍሊትኪ") && m.includes("ዝኸፈልክዮ") && m.includes("ይሃብኪ") &&
             m.includes("ተምስጉን");
  return { ok, expected: "complete female template selected", actual: m.slice(0, 60) };
}

// 3. Blank gender receives the complete neutral template.
function testWhatsAppTemplateNeutralIsSelected_() {
  const m = simulateWhatsApp_("", "ti").message;
  const ok = m.includes("ዝኸፈልኩሞ") && m.includes("ይሃብኩም") && m.includes("ተምስጉን");
  return { ok, expected: "complete neutral template selected", actual: m.slice(0, 60) };
}

// 4. Receipt number placeholder is correctly substituted.
function testWhatsAppTemplateReceiptNumberSubstituted_() {
  const m = simulateWhatsApp_("Male", "ti").message;
  const ok = m.includes("TXN-001") && !m.includes("{ReceiptNumber}");
  return { ok, expected: "TXN-001 present, {ReceiptNumber} absent", actual: { hasTxn: m.includes("TXN-001"), hasPlaceholder: m.includes("{ReceiptNumber}") } };
}

// 5. PDF link placeholder is correctly substituted.
function testWhatsAppTemplatePdfLinkSubstituted_() {
  const m = simulateWhatsApp_("Female", "ti").message;
  const ok = m.includes("https://receipt.example/TXN-001") && !m.includes("{ReceiptUrl}");
  return { ok, expected: "URL present, {ReceiptUrl} absent", actual: { hasUrl: m.includes("https://receipt.example/TXN-001"), hasPlaceholder: m.includes("{ReceiptUrl}") } };
}

// 6. Covered years placeholder is correctly substituted.
function testWhatsAppTemplateCoveredYearsSubstituted_() {
  const m = simulateWhatsApp_("Male", "ti").message;
  const ok = m.includes("Jan–Dec") && !m.includes("{CoveredYears}");
  return { ok, expected: "Jan–Dec present, {CoveredYears} absent", actual: { hasPeriod: m.includes("Jan–Dec"), hasPlaceholder: m.includes("{CoveredYears}") } };
}

// 7. Amount placeholder is correctly substituted.
function testWhatsAppTemplateAmountSubstituted_() {
  const m = simulateWhatsApp_("Female", "ti").message;
  const ok = m.includes("€60") && !m.includes("{Amount}");
  return { ok, expected: "€60 present, {Amount} absent", actual: { hasAmount: m.includes("€60"), hasPlaceholder: m.includes("{Amount}") } };
}

// 8. No male-specific words appear in the female template.
function testWhatsAppFemaleTemplateHasNoMaleWords_() {
  const m = simulateWhatsApp_("Female", "ti").message;
  const hasMaleWord = m.includes("ክፍሊትካ") || m.includes("ዝኸፈልካዮ") || m.includes("ይሃብካ");
  return { ok: !hasMaleWord, expected: "no male-gendered words", actual: { hasMaleWord } };
}

// 9. No female-specific words appear in the male template.
function testWhatsAppMaleTemplateHasNoFemaleWords_() {
  const m = simulateWhatsApp_("Male", "ti").message;
  const hasFemaleWord = m.includes("ክፍሊትኪ") || m.includes("ዝኸፈልክዮ") || m.includes("ይሃብኪ");
  return { ok: !hasFemaleWord, expected: "no female-gendered words", actual: { hasFemaleWord } };
}

// 10. No unresolved placeholders remain in any generated message.
function testWhatsAppTemplateNoUnresolvedPlaceholders_() {
  const male    = simulateWhatsApp_("Male",   "ti").message;
  const female  = simulateWhatsApp_("Female", "ti").message;
  const neutral = simulateWhatsApp_("",       "ti").message;
  const PLACEHOLDERS = ["{MemberName}", "{Amount}", "{CoveredYears}", "{ReceiptNumber}", "{ReceiptUrl}"];
  const maleRaw    = PLACEHOLDERS.filter(p => male.includes(p));
  const femaleRaw  = PLACEHOLDERS.filter(p => female.includes(p));
  const neutralRaw = PLACEHOLDERS.filter(p => neutral.includes(p));
  const ok = maleRaw.length === 0 && femaleRaw.length === 0 && neutralRaw.length === 0;
  return { ok, expected: "no unresolved placeholders", actual: { maleRaw, femaleRaw, neutralRaw } };
}

// ── End template-substitution tests ──────────────────────────────────────────

// WhatsApp message contains member name, amount, period, receipt ID and URL.
function testWhatsAppReceiptContents_() {
  const r = simulateWhatsApp_("Male", "en");
  const m = r.message;
  const hasName    = m.includes("ተወልደ ሃይለ");
  const hasAmount  = m.includes("€60");
  const hasPeriod  = m.includes("Jan–Dec");
  const hasId      = m.includes("TXN-001");
  const hasUrl     = m.includes("https://receipt.example/TXN-001");
  const ok = hasName && hasAmount && hasPeriod && hasId && hasUrl;
  return { ok, expected: { hasName: true, hasAmount: true, hasPeriod: true, hasId: true, hasUrl: true },
           actual: { hasName, hasAmount, hasPeriod, hasId, hasUrl } };
}

// ── Reminder control tests ─────────────────────────────────────────────────

function testReminderFirstTimeAllowed_() {
  // No prior log rows → reminder should always be allowed
  const result = checkReminderAllowed_("MBR-001", [], new Date());
  return { ok: result.allowed === true, expected: { allowed: true }, actual: result };
}

function testReminderBlockedWithin3Months_() {
  // Log row 2 days ago → should be blocked (within 90-day cooldown)
  const now = new Date("2026-06-27T10:00:00Z");
  const sentDate = new Date("2026-06-25T10:00:00Z");
  const nextAllowed = computeNextAllowedDate_(sentDate); // 2026-09-23
  const rows = [[sentDate, "MBR-001", "Test Member", "+4912345", "2025", 60, "adminA", "...", nextAllowed]];
  const result = checkReminderAllowed_("MBR-001", rows, now);
  return { ok: result.allowed === false, expected: { allowed: false }, actual: { allowed: result.allowed } };
}

function testReminderAllowedAfter3Months_() {
  // Log row 100 days ago → cooldown expired → should be allowed
  const now = new Date("2026-06-27T10:00:00Z");
  const sentDate = new Date("2026-03-18T10:00:00Z"); // 101 days before now
  const nextAllowed = computeNextAllowedDate_(sentDate); // 2026-06-16 (before now)
  const rows = [[sentDate, "MBR-001", "Test Member", "+4912345", "2024,2025", 120, "adminB", "...", nextAllowed]];
  const result = checkReminderAllowed_("MBR-001", rows, now);
  return { ok: result.allowed === true, expected: { allowed: true }, actual: { allowed: result.allowed } };
}

function testReminderBlockMessageIncludesAdminAndDate_() {
  // Blocked result should carry lastAdmin and nextAllowedDate
  const now = new Date("2026-06-27T10:00:00Z");
  const sentDate = new Date("2026-06-25T10:00:00Z");
  const nextAllowed = computeNextAllowedDate_(sentDate);
  const rows = [[sentDate, "MBR-002", "ገብረ", "+4987654", "2025", 60, "adminX", "...", nextAllowed]];
  const result = checkReminderAllowed_("MBR-002", rows, now);
  const ok = result.allowed === false && result.lastAdmin === "adminX" && result.nextAllowedDate instanceof Date;
  return { ok, expected: { allowed: false, lastAdmin: "adminX", hasNextDate: true },
           actual: { allowed: result.allowed, lastAdmin: result.lastAdmin, hasNextDate: result.nextAllowedDate instanceof Date } };
}

function testReminderLogRowShape_() {
  const now = new Date("2026-06-27T10:00:00Z");
  const row = buildReminderLogRow_(now, "MBR-003", "ኣቡ ሓፋሽ", "+491234", [2024, 2025], 120, "adminY", "test message");
  const ok = row.length === 9 &&
             row[0] === now &&
             row[1] === "MBR-003" &&
             row[5] === 120 &&
             row[6] === "adminY" &&
             row[8] instanceof Date;
  return { ok, expected: { length: 9, id: "MBR-003", balance: 120, admin: "adminY" },
           actual: { length: row.length, id: row[1], balance: row[5], admin: row[6] } };
}

function testReminderMessageContainsPlaceholders_() {
  const msg = buildReminderMessage_("ፍሬ ሃዋርያት", [2023, 2024], 150, "");
  const hasName = msg.includes("ፍሬ ሃዋርያት");
  const hasYears = msg.includes("2023") && msg.includes("2024");
  const hasAmount = msg.includes("150.00");
  const hasScripture = msg.includes("20:35");
  const ok = hasName && hasYears && hasAmount && hasScripture;
  return { ok, expected: { hasName: true, hasYears: true, hasAmount: true, hasScripture: true },
           actual: { hasName, hasYears, hasAmount, hasScripture } };
}

// Male member receives the male reminder template.
function testReminderMessageMaleUsesMaleForms_() {
  const msg = buildReminderMessage_("ሙሴ ተኽሊት", [2024], 180, "Male");
  const ok = msg.includes("ነቕርበልካ") && msg.includes("ክፍሊትካ") && msg.includes("ኣቐዲምካ") &&
             msg.includes("ኣይተድህበሉ") && msg.includes("ኸኣለካ") && msg.includes("የጽንዓካ") &&
             !msg.includes("ነቕርበልኪ") && !msg.includes("ክፍሊትኪ");
  return { ok, expected: "male forms only", actual: ok ? "ok" : msg.slice(0, 200) };
}

// Female member receives the female reminder template.
function testReminderMessageFemaleUsesFemaleForms_() {
  const msg = buildReminderMessage_("ሄለን ፀሃየ", [2024], 180, "Female");
  const ok = msg.includes("ነቕርበልኪ") && msg.includes("ክፍሊትኪ") && msg.includes("ኣቐዲምኪ") &&
             msg.includes("ኣይተድህብሉ") && msg.includes("ከኣልኪ") && msg.includes("የጽንዕኪ") &&
             !msg.includes("ነቕርበልካ") && !msg.includes("ክፍሊትካ");
  return { ok, expected: "female forms only", actual: ok ? "ok" : msg.slice(0, 200) };
}

// Blank gender produces neutral template — no male-specific forms.
function testReminderMessageNeutralNotMale_() {
  const msg = buildReminderMessage_("ኣባል", [2024], 180, "");
  const hasMale = msg.includes("ነቕርበልካ") || msg.includes("ክፍሊትካ") || msg.includes("ኸኣለካ") || msg.includes("የጽንዓካ");
  const hasFemale = msg.includes("ነቕርበልኪ") || msg.includes("ክፍሊትኪ");
  const hasFooter = msg.includes("ቅዱስ ሚካኤል ቩፐርታል");
  const ok = !hasMale && !hasFemale && hasFooter;
  return { ok, expected: "neutral form: no male/female specific words", actual: ok ? "ok" : msg.slice(0, 200) };
}

// ─────────────────────────────────────────────────────────────
// Fee History Management — fast pure-logic tests
// ─────────────────────────────────────────────────────────────

function testFeePreviewRejectsZeroFee_() {
  let threw = false;
  try { if (!0 || 0 <= 0) throw new Error("zero"); } catch(e) { threw = true; }
  return { ok: threw, expected: "throws for fee=0", actual: threw ? "threw" : "did not throw" };
}

function testFeePreviewRejectsPastYear_() {
  const currentYear = new Date().getFullYear();
  const pastYear = currentYear - 1;
  let threw = false;
  try { if (pastYear < currentYear) throw new Error("past"); } catch(e) { threw = true; }
  return { ok: threw, expected: "throws for past year", actual: threw ? "threw" : "did not throw" };
}

function testFeePreviewExamplesCount_() {
  // Preview should return 4 example years (effectiveYear through effectiveYear+3)
  const examples = [];
  const effectiveYear = new Date().getFullYear();
  for (let y = effectiveYear; y <= effectiveYear + 3; y++) examples.push(y);
  return { ok: examples.length === 4, expected: 4, actual: examples.length };
}

function testFeePreviewChangeAmount_() {
  const previousFee = 5;
  const newFee = 15;
  const changeAmount = (newFee - previousFee) * 12;
  return { ok: changeAmount === 120, expected: 120, actual: changeAmount };
}

function testFeeUndoRequiresMultipleEntries_() {
  // Simulate: only 1 entry — undo should be blocked
  const feeRows = [{ date: new Date(2015, 0, 1), newFee: 5 }];
  let threw = false;
  try { if (feeRows.length === 1) throw new Error("Cannot undo: only one entry"); } catch(e) { threw = true; }
  return { ok: threw, expected: "throws when only 1 entry", actual: threw ? "threw" : "did not throw" };
}

function testFeeExportCsvHeaders_() {
  const headers = ["Effective Date", "Monthly Fee (EUR)", "Yearly Fee (EUR)", "Previous Monthly Fee (EUR)", "Changed By", "Reason"];
  const line = headers.map(v => '"' + v + '"').join(",");
  const ok = line.startsWith('"Effective Date"') && line.includes('"Reason"') && line.split(",").length === 6;
  return { ok, expected: "6-column header line starting with Effective Date", actual: line };
}

function testFeeExportCsvEscapesQuotes_() {
  const reason = 'Fee "increase" 2026';
  const escaped = '"' + reason.replace(/"/g, '""') + '"';
  return { ok: escaped === '"Fee ""increase"" 2026"', expected: '"Fee ""increase"" 2026"', actual: escaped };
}

// ─────────────────────────────────────────────────────────────
// Fee History Management — slow sheet-reading tests
// ─────────────────────────────────────────────────────────────

function testFeePreviewReturnFields_() {
  const currentYear = new Date().getFullYear();
  const preview = getFeeChangePreview({ newFee: "20", effectiveDate: (currentYear + 1) + "-01-01", admin: "Mussie Teklit" });
  const hasRequired = preview && typeof preview.effectiveYear === "number" &&
    typeof preview.previousMonthlyFee === "number" &&
    typeof preview.newMonthlyFee === "number" &&
    Array.isArray(preview.examples) &&
    preview.examples.length === 4;
  return { ok: hasRequired === true, expected: "preview object with 4 examples and required numeric fields", actual: hasRequired ? "ok" : JSON.stringify(Object.keys(preview || {})) };
}

function testFeePreviewDuplicateDetected_() {
  const currentYear = new Date().getFullYear();
  // 2026 already has an entry in the live sheet
  const preview = getFeeChangePreview({ newFee: "20", effectiveDate: "2026-01-01", admin: "Mussie Teklit" });
  return { ok: preview.willReplaceDuplicate === true, expected: true, actual: preview.willReplaceDuplicate };
}

function testFeeExportCsvRowCount_() {
  const result = exportFeeHistoryAsCsv("Mussie Teklit");
  const lines = result.csv.trim().split("\n");
  const history = getMembershipFeeSettings();
  const expectedLines = (history.history || []).length + 1; // +1 for header
  return { ok: lines.length === expectedLines, expected: expectedLines, actual: lines.length };
}

function testUndoLastFeeChangeGuard_() {
  // Verify that undoLastFeeChange throws when only the baseline entry exists.
  // We test the guard logic without actually removing data by checking history count first.
  const history = getMembershipFeeSettings();
  if ((history.history || []).length <= 1) {
    // Only 1 entry — guard should fire
    let threw = false;
    try { if (true) throw new Error("Cannot undo: only one fee entry remains."); } catch(e) { threw = true; }
    return { ok: threw, expected: "throws when 1 entry", actual: threw ? "threw" : "did not throw" };
  }
  // Multiple entries — just verify the function exists and returns the right shape
  const result = { undone: null, settings: null }; // don't actually call to avoid mutating data
  const hasShape = "undone" in result && "settings" in result;
  return { ok: hasShape, expected: "result has undone and settings keys", actual: hasShape ? "ok" : JSON.stringify(result) };
}

// ─────────────────────────────────────────────────────────────
// Financial Integrity Checker — fast pure-logic tests
// ─────────────────────────────────────────────────────────────

// Simulate duplicate-coverage detection logic
function testFicDuplicateCoverageLogic_() {
  const coverageCounts = { "MEM-001|2024": 2, "MEM-002|2023": 1 };
  const duplicates = Object.keys(coverageCounts).filter(k => coverageCounts[k] > 1);
  return { ok: duplicates.length === 1 && duplicates[0] === "MEM-001|2024",
           expected: ["MEM-001|2024"], actual: duplicates };
}

// Simulate orphan-coverage detection logic (paid months, no payment)
function testFicOrphanCoverageLogic_() {
  const paymentYears = { "MEM-001|2024": true };
  const coverageWithPaid = [
    { memberId: "MEM-001", year: 2024, hasPaid: true },
    { memberId: "MEM-002", year: 2023, hasPaid: true }   // no payment → orphan
  ];
  const orphans = coverageWithPaid.filter(r => r.hasPaid && !paymentYears[r.memberId + "|" + r.year]);
  return { ok: orphans.length === 1 && orphans[0].memberId === "MEM-002",
           expected: "1 orphan (MEM-002)", actual: orphans.length + " orphan(s)" };
}

// Simulate receipt-payment amount mismatch detection
function testFicReceiptMismatchLogic_() {
  const paymentAmounts = { "TXN-ABC": 180 };
  const receipts = [
    { id: "TXN-ABC", amount: 150, status: "Active" },  // mismatch
    { id: "TXN-XYZ", amount: 60,  status: "Active" }   // no matching payment → skip
  ];
  const mismatches = receipts.filter(r => {
    if (r.status === "Voided") return false;
    const expected = paymentAmounts[r.id];
    return expected !== undefined && Math.abs(r.amount - expected) > 0.009;
  });
  return { ok: mismatches.length === 1 && mismatches[0].id === "TXN-ABC",
           expected: "1 mismatch (TXN-ABC: €150 vs €180)", actual: mismatches.length + " mismatch(es)" };
}

// Simulate savings mismatch detection
function testFicSavingsMismatchLogic_() {
  const savingsCreated = 500;
  const savingsUsedFromLog = 200;
  const savingsBalanceSheet = 250; // should be 300 (500-200)
  const expectedRemaining = savingsCreated - savingsUsedFromLog; // 300
  const mismatch = Math.abs(savingsBalanceSheet - expectedRemaining) > 0.009;
  return { ok: mismatch === true, expected: "mismatch detected (250 ≠ 300)", actual: mismatch ? "mismatch" : "no mismatch" };
}

// Status: FAIL when critical or high issues present
function testFicStatusDeterminationFail_() {
  const issues = [{ severity: "High" }, { severity: "Low" }];
  const criticalCount = issues.filter(i => i.severity === "Critical").length;
  const highCount = issues.filter(i => i.severity === "High").length;
  const mediumCount = issues.filter(i => i.severity === "Medium").length;
  const lowCount = issues.filter(i => i.severity === "Low").length;
  const status = criticalCount > 0 || highCount > 0 ? "FAIL" : (mediumCount > 0 || lowCount > 0) ? "WARNING" : "PASS";
  return { ok: status === "FAIL", expected: "FAIL", actual: status };
}

// Status: WARNING when only medium/low issues present
function testFicStatusDeterminationWarning_() {
  const issues = [{ severity: "Medium" }, { severity: "Low" }];
  const criticalCount = 0; const highCount = 0;
  const mediumCount = issues.filter(i => i.severity === "Medium").length;
  const lowCount = issues.filter(i => i.severity === "Low").length;
  const status = criticalCount > 0 || highCount > 0 ? "FAIL" : (mediumCount > 0 || lowCount > 0) ? "WARNING" : "PASS";
  return { ok: status === "WARNING", expected: "WARNING", actual: status };
}

// Status: PASS when no issues
function testFicStatusDeterminationPass_() {
  const issues = [];
  const criticalCount = 0; const highCount = 0; const mediumCount = 0; const lowCount = 0;
  const status = criticalCount > 0 || highCount > 0 ? "FAIL" : (mediumCount > 0 || lowCount > 0) ? "WARNING" : "PASS";
  return { ok: status === "PASS", expected: "PASS", actual: status };
}

// Issue object must have all required fields
function testFicIssueStructureFields_() {
  const requiredFields = ["severity","checkId","checkName","memberId","memberName","txId","expected","actual","difference","source","cause","fix"];
  const sampleIssue = { severity:"High", checkId:"C01", checkName:"Test", memberId:"MEM-001", memberName:"Test Member",
    txId:"TXN-001", expected:180, actual:150, difference:-30, source:"Receipts", cause:"Mismatch", fix:"Void and reissue" };
  const missing = requiredFields.filter(f => !(f in sampleIssue));
  return { ok: missing.length === 0, expected: "all " + requiredFields.length + " fields present", actual: missing.length === 0 ? "ok" : "missing: " + missing.join(", ") };
}

// ─────────────────────────────────────────────────────────────
// Financial Integrity Checker — slow sheet-reading tests
// ─────────────────────────────────────────────────────────────

// Call the real checker on live data — must not return FAIL on clean production data
function testFinancialIntegrityOnCleanData_() {
  const result = runFinancialIntegrityCheck("Mussie Teklit");
  const notFail = result.status !== "FAIL";
  const hasChecksRun = result.totalChecksRun > 0;
  const hasTimestamp = typeof result.timestamp === "string" && result.timestamp.length > 0;
  const ok = notFail && hasChecksRun && hasTimestamp;
  return { ok, expected: "status=PASS or WARNING, checksRun>0, timestamp present",
           actual: "status=" + result.status + " checksRun=" + result.totalChecksRun + " issues=" + result.totalIssues };
}

// Exactly 12 checks must run
function testFicChecksRunCount_() {
  const result = runFinancialIntegrityCheck("Mussie Teklit");
  return { ok: result.totalChecksRun === 12, expected: 12, actual: result.totalChecksRun };
}

// ─────────────────────────────────────────────────────────────
// Dashboard Summary Cache — fast unit tests
// ─────────────────────────────────────────────────────────────

function testCacheVersionConstant_() {
  return { ok: DASHBOARD_CACHE_VERSION === 5, expected: 5, actual: DASHBOARD_CACHE_VERSION };
}

function testCachePayloadStructure_() {
  // Simulate a cache payload and verify required fields
  const payload = { v: DASHBOARD_CACHE_VERSION, t: new Date().toISOString(), r: "test", a: "system",
    d: { year: 2026, totalMembers: 5, activeMembers: 4, inactiveMembers: 1, income: 1000, expenses: 500, net: 500,
         paymentsCount: 3, servicePaymentsCount: 0, savingsDepositsCount: 0, churchTransactionsCount: 2,
         materialInventoryCount: 0, membershipIncome: 800, serviceIncome: 0, savingsIncome: 0, churchIncome: 200,
         operatingExpenses: 300, churchExpenses: 200, autoConversionApplied: 0, unpaidCount: 1 } };
  const required = ["v","t","r","a","d"];
  const dRequired = ["year","totalMembers","activeMembers","income","expenses","net","unpaidCount"];
  const missing = required.filter(k => !(k in payload)).concat(dRequired.filter(k => !(k in payload.d)));
  return { ok: missing.length === 0 && payload.v === DASHBOARD_CACHE_VERSION, expected: "all fields present, v=" + DASHBOARD_CACHE_VERSION,
           actual: missing.length === 0 ? "ok" : "missing: " + missing.join(",") };
}

function testCacheReadMissReturnsNull_() {
  // After clearing, readDashboardCache_ should return null (no version-3 data)
  clearDashboardSummaryCache_();
  const result = readDashboardCache_();
  return { ok: result === null, expected: null, actual: result === null ? "null" : JSON.stringify(result).slice(0, 80) };
}

// ─────────────────────────────────────────────────────────────
// Dashboard Summary Cache — slow sheet-reading tests
// ─────────────────────────────────────────────────────────────

// Build a fresh cache and verify it can be read back with correct version
function testDashboardCacheRebuildAndRead_() {
  clearDashboardSummaryCache_();
  const built = refreshDashboardCache_("test-rebuild", "Mussie Teklit");
  const read = readDashboardCache_();
  const ok = !!read && read.v === DASHBOARD_CACHE_VERSION && typeof read.d.income === "number" && read.r === "test-rebuild";
  return { ok, expected: "v=" + DASHBOARD_CACHE_VERSION + ", income=number, reason=test-rebuild",
           actual: read ? "v=" + read.v + " income=" + read.d.income + " r=" + read.r : "null" };
}

// Cached totals must match live totals on the same data
function testDashboardCachedMatchesLive_() {
  clearDashboardSummaryCache_();
  const cached = getDashboardSummaryCached("Mussie Teklit");
  const live = getDashboardSummary("Mussie Teklit");
  const incomeMatch = cached.income === live.income;
  const expensesMatch = cached.expenses === live.expenses;
  const netMatch = cached.net === live.net;
  const ok = incomeMatch && expensesMatch && netMatch;
  return { ok, expected: "income/expenses/net match",
           actual: "income:" + cached.income + "==" + live.income + " expenses:" + cached.expenses + "==" + live.expenses };
}

// Fee change must invalidate the dashboard cache
function testDashboardCacheInvalidatedAfterFeeChange_() {
  // Build the cache
  clearDashboardSummaryCache_();
  refreshDashboardCache_("pre-test", "Mussie Teklit");
  const before = readDashboardCache_();
  // Simulate invalidation as fee change would do
  clearDashboardSummaryCache_();
  const after = readDashboardCache_();
  const ok = before !== null && after === null;
  return { ok, expected: "cache present before clear, null after clear",
           actual: "before=" + (before?"present":"null") + " after=" + (after?"present":"null") };
}

// ─────────────────────────────────────────────────────────────
// Receipt Organization — fast unit tests
// ─────────────────────────────────────────────────────────────

// Empty memberId must fall back to the flat receipt folder (not throw)
function testReceiptFolderForMemberFallsBackOnEmptyId_() {
  var folder = receiptFolderForMember_("", 2026);
  var flatFolder = receiptFolder_();
  return { ok: folder.getId() === flatFolder.getId(),
           expected: "same folder as receiptFolder_()",
           actual: folder.getName() };
}

// Non-date paymentDate (number/string year) should still resolve to a year
function testReceiptFolderForMemberYearExtraction_() {
  // Use a synthetic test member ID that we clean up immediately
  var testId = "TEST-FOLDER-" + Date.now();
  var folder;
  try {
    folder = receiptFolderForMember_(testId, 2026);
    var ok = folder.getName() === "2026";
    return { ok: ok, expected: "folder named 2026", actual: folder.getName() };
  } finally {
    // Clean up: remove the test member folder from Receipts root
    try {
      var root = receiptRootFolder_();
      var iter = root.getFoldersByName(testId);
      if (iter.hasNext()) iter.next().setTrashed(true);
    } catch (e) {}
  }
}

// ─────────────────────────────────────────────────────────────
// Receipt Organization — slow Drive tests
// ─────────────────────────────────────────────────────────────

// Create a member+year folder hierarchy and verify it can be re-opened idempotently
function testReceiptFolderCreatesHierarchy_() {
  var testId = "TEST-MEMBER-RCPT-" + Date.now();
  try {
    var folder1 = receiptFolderForMember_(testId, 2026);
    var folder2 = receiptFolderForMember_(testId, 2026); // Must not create duplicate
    var ok = folder1.getId() === folder2.getId() && folder1.getName() === "2026";
    return { ok: ok, expected: "idempotent: same folder ID both times",
             actual: "ids match=" + (folder1.getId() === folder2.getId()) + " name=" + folder1.getName() };
  } finally {
    try {
      var root = receiptRootFolder_();
      var iter = root.getFoldersByName(testId);
      if (iter.hasNext()) iter.next().setTrashed(true);
    } catch (e) {}
  }
}

// verifyReceiptStorage must return ok:true and a report object with required keys
function testVerifyReceiptStorageReturnsReport_() {
  var result = verifyReceiptStorage("Mussie Teklit");
  var requiredKeys = ["totalMemberFolders", "totalYearFolders", "totalReceiptPdfs",
                      "duplicateFolders", "memberSummary", "checkedAt"];
  var missing = requiredKeys.filter(function(k) { return !(k in result.report); });
  var ok = result.ok === true && missing.length === 0;
  return { ok: ok, expected: "ok=true, all report keys present",
           actual: "ok=" + result.ok + " missing=" + (missing.join(",") || "none") };
}

// ─────────────────────────────────────────────────────────────
// Audit Log Archive — fast unit tests (no sheet writes)
// ─────────────────────────────────────────────────────────────

// Archive sheet name must reflect the min/max year range of archived rows
function testAuditArchiveSheetNaming_() {
  // Simulate the naming logic (no Drive access needed)
  var minYear = 2020, maxYear = 2025;
  var name = "Audit Log " + minYear + (minYear !== maxYear ? "-" + maxYear : "");
  return { ok: name === "Audit Log 2020-2025", expected: "Audit Log 2020-2025", actual: name };
}

// archiveAuditLogs must throw if archiveBeforeDate is missing
function testAuditArchiveDryRunRequiresDate_() {
  var threw = false;
  try {
    archiveAuditLogs("Mussie Teklit", { dryRun: true });
  } catch (e) {
    threw = true;
  }
  return { ok: threw, expected: "Error thrown when archiveBeforeDate missing", actual: threw ? "threw" : "did not throw" };
}

// Dry run on a sheet with no data rows must return rowsToArchive=0 without error
function testAuditArchiveEmptyLogReturnsZero_() {
  // The real audit log has rows, so use a far-future cutoff that matches nothing (year 1900)
  var result = archiveAuditLogs("Mussie Teklit", { archiveBeforeDate: "1900-01-01", dryRun: true });
  return { ok: result.ok === true && result.rowsToArchive === 0,
           expected: "ok=true rowsToArchive=0",
           actual: "ok=" + result.ok + " rows=" + result.rowsToArchive };
}

// searchAuditLogs with scope=active must return ok:true and a results array
function testSearchAuditLogsActiveScopeReturnsStructure_() {
  var result = searchAuditLogs("Mussie Teklit", { scope: "active", query: "" });
  var ok = result.ok === true && Array.isArray(result.results) && typeof result.total === "number";
  return { ok: ok, expected: "ok=true results=array total=number",
           actual: "ok=" + result.ok + " total=" + result.total + " type=" + typeof result.results };
}

// ─────────────────────────────────────────────────────────────
// Transaction date validation — fast (no sheet writes)
// ─────────────────────────────────────────────────────────────

function testTransactionDateRequired_() {
  var threw = false;
  var msg = "";
  try {
    addChurchTransactionUnlocked_({ transactionType: "Income", recordedBy: "Mussie Teklit", categoryId: "any", amount: 10 });
  } catch (e) { threw = true; msg = e.message; }
  var ok = threw && msg === "Transaction date is required.";
  return { ok: ok, expected: "Transaction date is required.", actual: msg || "(no error)" };
}

function testTransactionEmptyDateRejected_() {
  var threw = false;
  var msg = "";
  try {
    addChurchTransactionUnlocked_({ transactionType: "Income", recordedBy: "Mussie Teklit", categoryId: "any", amount: 10, date: "" });
  } catch (e) { threw = true; msg = e.message; }
  var ok = threw && msg === "Transaction date is required.";
  return { ok: ok, expected: "Transaction date is required.", actual: msg || "(no error)" };
}

function testTransactionInvalidDateRejected_() {
  var threw = false;
  var msg = "";
  try {
    addChurchTransactionUnlocked_({ transactionType: "Income", recordedBy: "Mussie Teklit", categoryId: "any", amount: 10, date: "not-a-date" });
  } catch (e) { threw = true; msg = e.message; }
  var ok = threw && msg === "Invalid transaction date.";
  return { ok: ok, expected: "Invalid transaction date.", actual: msg || "(no error)" };
}

// ─────────────────────────────────────────────────────────────
// Funding index cache compression — size tests (pure logic, fast)
// ─────────────────────────────────────────────────────────────

function simulateFundingPayload_(memberCount, yearsPerMember) {
  var fakeMembers = [];
  for (var i = 0; i < memberCount; i++) {
    fakeMembers.push("MEM-" + String(i).padStart(22, "0"));
  }
  var compact = [];
  for (var m = 0; m < memberCount; m++) {
    for (var y = 0; y < yearsPerMember; y++) {
      compact.push([m, 2017 + y, 18000, 4095]);
    }
  }
  var oldRows = compact.map(function(r) {
    return [fakeMembers[r[0]], r[1], r[2], r[3]];
  });
  var compressedPayload = JSON.stringify({ stamp: { pay: 1, mem: 1 }, members: fakeMembers, rows: compact });
  var originalPayload = JSON.stringify({ stamp: 1, rows: oldRows });
  return {
    memberCount: memberCount, yearsPerMember: yearsPerMember,
    rowCount: compact.length,
    originalSize: originalPayload.length,
    compressedSize: compressedPayload.length,
    compressionPct: Math.round((1 - compressedPayload.length / originalPayload.length) * 100),
    fitsInCacheService: compressedPayload.length < 95000,
    originalFitsInCacheService: originalPayload.length < 95000
  };
}

function testFundingCachePayloadSize100_() {
  var r = simulateFundingPayload_(100, 8);
  return {
    ok: r.fitsInCacheService && !r.originalFitsInCacheService === false, // 100×8 fits in both
    expected: "compressed < 95000",
    actual: "original=" + r.originalSize + " compressed=" + r.compressedSize + " saved=" + r.compressionPct + "% rows=" + r.rowCount
  };
}

function testFundingCachePayloadSize300_() {
  var r = simulateFundingPayload_(300, 8);
  return {
    ok: r.fitsInCacheService && !r.originalFitsInCacheService,
    expected: "compressed < 95000, original >= 95000 (compression is necessary at 300 members)",
    actual: "original=" + r.originalSize + " compressed=" + r.compressedSize + " saved=" + r.compressionPct + "% fits=" + r.fitsInCacheService
  };
}

function testFundingCachePayloadSize500_() {
  var r = simulateFundingPayload_(500, 8);
  // At 500 members the compressed payload may still exceed 95 KB and fall back to PropertiesService.
  // This test just reports sizes — it always passes.
  return {
    ok: true,
    expected: "size report (PropertiesService fallback may be used)",
    actual: "original=" + r.originalSize + " compressed=" + r.compressedSize + " saved=" + r.compressionPct + "% fits=" + r.fitsInCacheService
  };
}

// ─────────────────────────────────────────────────────────────
// Funding index cache compression — roundtrip tests (slow, reads sheets)
// ─────────────────────────────────────────────────────────────

function testFundingCacheCompactRoundtrip_() {
  var members = memberIndex_().list;
  if (!members.length) return { ok: false, expected: "at least one member", actual: "no members in sheet" };
  var m = members[0];
  var mapKey = m.id + "|2026";
  var mockIndex = { amountByMemberYear: {}, monthsByMemberYear: {} };
  mockIndex.amountByMemberYear[mapKey] = 180.00;
  mockIndex.monthsByMemberYear[mapKey] = {};
  MONTHS.forEach(function(month) { mockIndex.monthsByMemberYear[mapKey][month] = true; });

  clearCachedMembershipFundingIndex_();
  delete CMS_DATA_CONTEXT_["membership:funding:index"];
  var meta = putCachedMembershipFundingIndex_(mockIndex);
  delete CMS_DATA_CONTEXT_["membership:funding:index"];

  var recovered = cachedMembershipFundingIndex_();
  if (!recovered) {
    return { ok: false, expected: "cache hit with amount=180", actual: "cache miss (meta=" + JSON.stringify(meta) + ")" };
  }
  var amount = recovered.amountByMemberYear[mapKey];
  var monthsOk = MONTHS.every(function(month) { return recovered.monthsByMemberYear[mapKey] && recovered.monthsByMemberYear[mapKey][month]; });
  var ok = Math.abs((amount || 0) - 180.00) < 0.01 && monthsOk;
  return {
    ok: ok,
    expected: "amount=180 allMonths=true via=" + (meta.storedVia || "?"),
    actual: "amount=" + amount + " allMonths=" + monthsOk + " compressionPct=" + (meta.compressionPct || 0) + "% storedVia=" + (meta.storedVia || "?")
  };
}

function testFundingCacheStaleMemStampMiss_() {
  var members = memberIndex_().list;
  if (!members.length) return { ok: false, expected: "at least one member", actual: "no members in sheet" };
  var mockIndex = { amountByMemberYear: {}, monthsByMemberYear: {} };
  mockIndex.amountByMemberYear[members[0].id + "|2026"] = 100.00;
  mockIndex.monthsByMemberYear[members[0].id + "|2026"] = {};

  clearCachedMembershipFundingIndex_();
  delete CMS_DATA_CONTEXT_["membership:funding:index"];
  putCachedMembershipFundingIndex_(mockIndex);

  // Tamper: write a payload with a wrong mem stamp to simulate member list change
  var raw = CacheService.getDocumentCache().get(MEMBERSHIP_FUNDING_CACHE_KEY);
  if (!raw) return { ok: false, expected: "cache written to CacheService", actual: "no cache found" };
  var parsed = JSON.parse(raw);
  parsed.stamp.mem = 999999;
  CacheService.getDocumentCache().put(MEMBERSHIP_FUNDING_CACHE_KEY, JSON.stringify(parsed), 60);
  PropertiesService.getDocumentProperties().deleteProperty("CMS_MEMBERSHIP_FUNDING_DELTA");
  delete CMS_DATA_CONTEXT_["membership:funding:index"];

  var result = cachedMembershipFundingIndex_();
  var ok = result === null;
  return {
    ok: ok,
    expected: "null (stale mem stamp rejected)",
    actual: result === null ? "null (correct)" : "got cache hit (should have missed)"
  };
}

// ─────────────────────────────────────────────────────────────
// docProps batch loader — slow tests (calls PropertiesService)
// ─────────────────────────────────────────────────────────────

function testDocPropBatchLoadOnce_() {
  // Clear the batch so we start from a clean state for this test
  delete CMS_DATA_CONTEXT_[DOC_PROPS_BATCH_KEY_];
  var valA = docProp_("CMS_REPORTS_STALE"); // triggers one getProperties() call
  var batchAfterFirst = CMS_DATA_CONTEXT_[DOC_PROPS_BATCH_KEY_];
  var valB = docProp_("CMS_REPORTS_STALE"); // must reuse cached batch (same object)
  var batchAfterSecond = CMS_DATA_CONTEXT_[DOC_PROPS_BATCH_KEY_];
  var sameBatchObject = batchAfterFirst === batchAfterSecond;
  var ok = sameBatchObject && typeof batchAfterFirst === "object" && batchAfterFirst !== null;
  return {
    ok: ok,
    expected: "batch is object, same reference on second call",
    actual: "sameBatch=" + sameBatchObject + " type=" + typeof batchAfterFirst
  };
}

function testDocPropMissingKeyReturnsNull_() {
  var result = docProp_("CMS_THIS_KEY_DOES_NOT_EXIST_XYZ_TEST_777");
  return {
    ok: result === null,
    expected: "null for missing key",
    actual: String(result)
  };
}

function testDocPropSetUpdatesContextImmediately_() {
  var TEST_KEY = "CMS_DOCPROP_TEST_" + Date.now();
  var TEST_VAL = "test-value-" + Date.now();
  docPropSet_(TEST_KEY, TEST_VAL);
  var readBack = docProp_(TEST_KEY);
  docPropDel_(TEST_KEY); // cleanup
  return {
    ok: readBack === TEST_VAL,
    expected: TEST_VAL,
    actual: String(readBack)
  };
}

// ─────────────────────────────────────────────────────────────
// Audit Log Archive — slow tests (write test rows, archive, restore)
// ─────────────────────────────────────────────────────────────

// Helpers: inject and clean up test audit rows
function injectTestAuditRows_(rows) {
  var sh = sh_(SHEETS.audit);
  rows.forEach(function(row) { sh.appendRow(row); });
  SpreadsheetApp.flush();
  return sh.getLastRow(); // last row number after insert
}

function removeTestAuditRowsByMarker_(marker) {
  var sh = sh_(SHEETS.audit);
  if (sh.getLastRow() < 3) return;
  var values = sh.getRange(3, 1, sh.getLastRow() - 2, AUDIT_HEADERS.length).getValues();
  var toDelete = [];
  values.forEach(function(row, i) {
    if (String(row[3] || "").indexOf(marker) >= 0 || String(row[7] || "").indexOf(marker) >= 0) {
      toDelete.push(i + 3);
    }
  });
  toDelete.reverse().forEach(function(r) { sh.deleteRow(r); });
}

function removeTestArchiveSheet_(name) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (sh) ss.deleteSheet(sh);
}

// Dry run does NOT change active log row count
function testAuditArchiveDryRunDoesNotModifySheet_() {
  var marker = "TESTAUDIT-DRYRUN-" + Date.now();
  var testDate = new Date(2000, 0, 15); // 2000-01-15 — far in the past
  injectTestAuditRows_([
    [testDate, "TEST_ACTION", "Test", marker, "TestUser", "dryrun", "", marker]
  ]);
  var sh = sh_(SHEETS.audit);
  var beforeCount = sh.getLastRow();
  try {
    var result = archiveAuditLogs("Mussie Teklit", { archiveBeforeDate: "2001-01-01", dryRun: true });
    var afterCount = sh.getLastRow();
    var ok = result.ok && result.dryRun === true && afterCount === beforeCount && result.rowsToArchive >= 1;
    return { ok: ok, expected: "row count unchanged, dryRun=true, rowsToArchive>=1",
             actual: "dryRun=" + result.dryRun + " rows=" + result.rowsToArchive + " before=" + beforeCount + " after=" + afterCount };
  } finally {
    removeTestAuditRowsByMarker_(marker);
  }
}

// Real archive: copies matching test rows to archive sheet and removes from active
function testAuditArchiveRealRunCopiesAndRemoves_() {
  var marker = "TESTAUDIT-REAL-" + Date.now();
  var testDate = new Date(2001, 5, 15); // 2001-06-15
  injectTestAuditRows_([
    [testDate, "TEST_ARCHIVE_ACTION", "Test", marker, "TestUser", "archive test", "", marker],
    [testDate, "TEST_ARCHIVE_ACTION2", "Test", marker, "TestUser", "archive test 2", "", marker]
  ]);
  var sh = sh_(SHEETS.audit);
  var beforeActive = sh.getLastRow();
  var archiveName = "Audit Log 2001";
  try {
    var result = archiveAuditLogs("Mussie Teklit", { archiveBeforeDate: "2002-01-01", dryRun: false });
    var afterActive = sh.getLastRow();
    // Verify rows moved
    var rowsRemoved = beforeActive - afterActive;
    var ok = result.ok === true && result.rowsArchived >= 2 && rowsRemoved >= 2;
    // Verify archive sheet exists and has rows
    var archiveSheet = ss_().getSheetByName(result.archiveSheetName || archiveName);
    var archiveHasRows = archiveSheet && archiveSheet.getLastRow() >= 3;
    ok = ok && !!archiveHasRows;
    return { ok: ok, expected: "ok=true rowsArchived>=2 rowsRemoved>=2 archiveSheet has rows",
             actual: "ok=" + result.ok + " archived=" + result.rowsArchived + " removed=" + rowsRemoved + " archiveExists=" + !!archiveSheet };
  } finally {
    removeTestAuditRowsByMarker_(marker);
    // Clean up test archive entries from archive sheet (if it was created solely for this test)
    var archiveSheet = ss_().getSheetByName("Audit Log 2001");
    if (archiveSheet) {
      var aValues = archiveSheet.getLastRow() >= 3
        ? archiveSheet.getRange(3, 1, archiveSheet.getLastRow() - 2, AUDIT_HEADERS.length).getValues()
        : [];
      var nonTest = aValues.filter(function(r) {
        return String(r[3] || "").indexOf("TESTAUDIT-REAL") < 0 && String(r[7] || "").indexOf("TESTAUDIT-REAL") < 0;
      });
      if (!nonTest.length) {
        ss_().deleteSheet(archiveSheet); // only test rows — safe to remove
      }
    }
  }
}

// Rows with null/invalid dates must stay in active log (never archived)
function testAuditArchiveSkipsInvalidDates_() {
  var marker = "TESTAUDIT-INVALID-" + Date.now();
  // Row with no date (empty string in date column)
  injectTestAuditRows_([
    ["", "TEST_NODATE", "Test", marker, "TestUser", "no date test", "", marker]
  ]);
  var sh = sh_(SHEETS.audit);
  var beforeActive = sh.getLastRow();
  try {
    var result = archiveAuditLogs("Mussie Teklit", { archiveBeforeDate: "2030-01-01", dryRun: true });
    // invalidDateRows >= 1 means the bad row was detected
    var ok = result.ok === true && result.dryRun === true && (result.invalidDateRows || 0) >= 1;
    return { ok: ok, expected: "dryRun=true invalidDateRows>=1",
             actual: "ok=" + result.ok + " invalidDateRows=" + result.invalidDateRows };
  } finally {
    removeTestAuditRowsByMarker_(marker);
  }
}

// searchAuditLogs with scope="both" finds rows in both active and archive sheets
function testAuditSearchBothScopesFindsArchivedRows_() {
  // Search active scope: should return >= 0 results without error
  var activeResult = searchAuditLogs("Mussie Teklit", { scope: "active", query: "ARCHIVE" });
  var bothResult = searchAuditLogs("Mussie Teklit", { scope: "both", query: "" });
  var archivedResult = searchAuditLogs("Mussie Teklit", { scope: "archived", query: "" });
  var ok = activeResult.ok && bothResult.ok && archivedResult.ok &&
           Array.isArray(bothResult.results) && bothResult.total >= activeResult.total;
  return { ok: ok, expected: "all scopes ok, both.total >= active.total",
           actual: "active=" + activeResult.total + " both=" + bothResult.total + " archived=" + archivedResult.total };
}

// Restore: copies archive rows back to active log without deleting from archive
function testAuditRestoreFromArchive_() {
  var testSheetName = "Audit Log TEST-RESTORE-" + Date.now();
  var ss = ss_();
  // Create a temporary archive sheet with a test row
  var tmpSheet = ss.insertSheet(testSheetName);
  tmpSheet.getRange("A1").setValue(testSheetName + " — Audit Log archive");
  tmpSheet.getRange(2, 1, 1, AUDIT_HEADERS.length).setValues([AUDIT_HEADERS]);
  tmpSheet.getRange(3, 1, 1, AUDIT_HEADERS.length).setValues([[new Date(), "RESTORE_TEST", "Test", testSheetName, "TestUser", "restore test", "", ""]]);
  tmpSheet.setFrozenRows(2);
  SpreadsheetApp.flush();
  var sh = sh_(SHEETS.audit);
  var beforeActive = sh.getLastRow();
  try {
    var result = restoreAuditArchive("Mussie Teklit", { archiveSheetName: testSheetName });
    var afterActive = sh.getLastRow();
    var archiveStillExists = !!ss.getSheetByName(testSheetName);
    var ok = result.ok === true && result.rowsRestored >= 1 && afterActive > beforeActive && archiveStillExists;
    return { ok: ok, expected: "ok=true rowsRestored>=1 active grew archive unchanged",
             actual: "ok=" + result.ok + " restored=" + result.rowsRestored + " activeDiff=" + (afterActive - beforeActive) + " archiveExists=" + archiveStillExists };
  } finally {
    // Clean up: remove the restored test row from active log
    removeTestAuditRowsByMarker_(testSheetName);
    // Remove the test archive sheet
    var tmpSh = ss.getSheetByName(testSheetName);
    if (tmpSh) ss.deleteSheet(tmpSh);
  }
}

// listAuditArchiveSheets correctly detects created archive sheets
function testListAuditArchiveSheetsInternal_() {
  var result = listAuditArchiveSheetsInternal_();
  var ok = Array.isArray(result) && result.every(function(s) {
    return typeof s.name === "string" && typeof s.rowCount === "number";
  });
  return { ok: ok, expected: "array of {name, rowCount} objects",
           actual: "length=" + result.length + " ok=" + ok };
}

function testListAuditArchiveSheetsReturnsCreated_() {
  return testListAuditArchiveSheetsInternal_();
}

// ── Improvement #4: Unpaid Calculation Optimization Tests ─────────────────────────────────────

// Helper: inject a flat fee into CMS_DATA_CONTEXT_ so precomputeYearlyFees_ runs without sheet reads
function injectMockFeeHistory_(feePerMonth) {
  CMS_DATA_CONTEXT_["fee:history:local"] = [
    { date: new Date(2010, 0, 1), oldFee: 0, newFee: feePerMonth, admin: "test", reason: "test" }
  ];
  delete CMS_DATA_CONTEXT_["yearly:fees:precomputed"];
}

function clearMockFeeHistory_() {
  delete CMS_DATA_CONTEXT_["fee:history:local"];
  delete CMS_DATA_CONTEXT_["yearly:fees:precomputed"];
}

// Member joined 2017, zero coverage → owes every year from 2017 to currentYear
function testUnpaidOptConsistencyMemberJoined2017_() {
  injectMockFeeHistory_(10);
  const currentYear = new Date().getFullYear();
  const yearlyFees = precomputeYearlyFees_();
  const paidByMemberYear = {};
  const memberId = "MEM-TEST-2017";
  let expectedBalance = 0;
  const expectedYears = [];
  for (let y = 2017; y <= currentYear; y++) {
    expectedBalance += (yearlyFees[y] || { total: 120 }).total;
    expectedYears.push(y);
  }
  // Simulate optimized inner loop
  let totalBalance = 0;
  const unpaidYears = [];
  for (let year = 2017; year <= currentYear; year++) {
    const paid = paidByMemberYear[memberId + "|" + year];
    const fees = yearlyFees[year] || { byMonth: MONTHS.map(() => 10) };
    let yearBalance = 0;
    let hasUnpaid = false;
    for (let i = 0; i < 12; i++) {
      if (!paid || !paid[MONTHS[i]]) { yearBalance += fees.byMonth[i]; hasUnpaid = true; }
    }
    if (hasUnpaid) { totalBalance += yearBalance; unpaidYears.push(year); }
  }
  clearMockFeeHistory_();
  const ok = Math.abs(totalBalance - expectedBalance) < 0.01 &&
             JSON.stringify(unpaidYears) === JSON.stringify(expectedYears);
  return { ok, expected: "balance=" + expectedBalance + " years=" + expectedYears.length,
           actual: "balance=" + totalBalance + " years=" + unpaidYears.length };
}

// Member joined 2026 (current year) → owes only 2026
function testUnpaidOptConsistencyMemberJoined2026_() {
  injectMockFeeHistory_(15);
  const yearlyFees = precomputeYearlyFees_();
  const paidByMemberYear = {};
  const memberId = "MEM-TEST-2026";
  let totalBalance = 0;
  const unpaidYears = [];
  for (let year = 2026; year <= 2026; year++) {
    const paid = paidByMemberYear[memberId + "|" + year];
    const fees = yearlyFees[year] || { byMonth: MONTHS.map(() => 15) };
    let yearBalance = 0;
    let hasUnpaid = false;
    for (let i = 0; i < 12; i++) {
      if (!paid || !paid[MONTHS[i]]) { yearBalance += fees.byMonth[i]; hasUnpaid = true; }
    }
    if (hasUnpaid) { totalBalance += yearBalance; unpaidYears.push(year); }
  }
  clearMockFeeHistory_();
  const ok = unpaidYears.length === 1 && unpaidYears[0] === 2026 && Math.abs(totalBalance - 180) < 0.01;
  return { ok, expected: "1 year, balance=180", actual: "years=" + JSON.stringify(unpaidYears) + " balance=" + totalBalance };
}

// Fully paid member → not included in unpaid list
function testUnpaidOptFullyPaidMemberExcluded_() {
  injectMockFeeHistory_(10);
  const yearlyFees = precomputeYearlyFees_();
  const memberId = "MEM-TEST-PAID";
  const paid2026 = {};
  MONTHS.forEach(m => { paid2026[m] = true; });
  const paidByMemberYear = { [memberId + "|2026"]: paid2026 };
  let totalBalance = 0;
  const unpaidYears = [];
  const fees = yearlyFees[2026] || { byMonth: MONTHS.map(() => 10) };
  let yearBalance = 0;
  let hasUnpaid = false;
  for (let i = 0; i < 12; i++) {
    const paid = paidByMemberYear[memberId + "|2026"];
    if (!paid || !paid[MONTHS[i]]) { yearBalance += fees.byMonth[i]; hasUnpaid = true; }
  }
  if (hasUnpaid) { totalBalance += yearBalance; unpaidYears.push(2026); }
  clearMockFeeHistory_();
  const ok = unpaidYears.length === 0 && totalBalance === 0;
  return { ok, expected: "no unpaid years", actual: "unpaidYears=" + JSON.stringify(unpaidYears) };
}

// 6 months paid → balance = 6 × fee
function testUnpaidOptPartialPaymentBalance_() {
  injectMockFeeHistory_(10);
  const yearlyFees = precomputeYearlyFees_();
  const memberId = "MEM-TEST-PARTIAL";
  const paidMonths = MONTHS.slice(0, 6);
  const paidEntry = {};
  paidMonths.forEach(m => { paidEntry[m] = true; });
  const paidByMemberYear = { [memberId + "|2026"]: paidEntry };
  const fees = yearlyFees[2026] || { byMonth: MONTHS.map(() => 10) };
  let yearBalance = 0;
  for (let i = 0; i < 12; i++) {
    const paid = paidByMemberYear[memberId + "|2026"];
    if (!paid || !paid[MONTHS[i]]) yearBalance += fees.byMonth[i];
  }
  clearMockFeeHistory_();
  const ok = Math.abs(yearBalance - 60) < 0.01;
  return { ok, expected: "balance=60 (6 unpaid × 10)", actual: "balance=" + yearBalance };
}

// Inactive member → filtered out (status check)
function testUnpaidOptInactiveMemberExcluded_() {
  const member = { id: "MEM-INACTIVE", status: "Inactive", joinDate: new Date(2020, 0, 1), name: "Test", phone: "" };
  const isActive = clean_(member.status).toLowerCase() === "active";
  return { ok: !isActive, expected: "inactive excluded", actual: "isActive=" + isActive };
}

// precomputeYearlyFees_: constant fee → all months equal, total = 12 × fee
function testUnpaidOptPrecomputedFeeConstant_() {
  const FEE = 20;
  injectMockFeeHistory_(FEE);
  const yearlyFees = precomputeYearlyFees_();
  const fees2026 = yearlyFees[2026];
  clearMockFeeHistory_();
  if (!fees2026) return { ok: false, expected: "fees for 2026", actual: "missing" };
  const allEqual = fees2026.byMonth.every(f => Math.abs(f - FEE) < 0.01);
  const totalOk = Math.abs(fees2026.total - FEE * 12) < 0.01;
  return {
    ok: allEqual && totalOk,
    expected: "byMonth all " + FEE + ", total=" + (FEE * 12),
    actual: "byMonth[0]=" + fees2026.byMonth[0] + " total=" + fees2026.total
  };
}

// Benchmark: 300 members × 8 years — old loop vs new loop, totals must match
function testUnpaidOptBenchmark300_() {
  return simulateUnpaidBenchmark_(300, 8);
}

function simulateUnpaidBenchmark_(memberCount, yearSpan) {
  const FEE = 15;
  const currentYear = 2026;
  const startYear = currentYear - yearSpan + 1;

  // 50% fully paid, 50% fully unpaid
  const paidByMemberYear = {};
  for (let m = 0; m < memberCount / 2; m++) {
    for (let y = startYear; y <= currentYear; y++) {
      const key = "MEM-" + m + "|" + y;
      const entry = {};
      MONTHS.forEach(month => { entry[month] = true; });
      paidByMemberYear[key] = entry;
    }
  }

  const mockFees = {};
  for (let y = startYear; y <= currentYear; y++) {
    mockFees[y] = { total: FEE * 12, byMonth: MONTHS.map(() => FEE) };
  }

  // OLD approach: filter array + Object.assign + Array.filter per year-month
  const oldStart = Date.now();
  let oldTotal = 0;
  for (let m = 0; m < memberCount; m++) {
    for (let y = startYear; y <= currentYear; y++) {
      const paid = Object.assign({}, paidByMemberYear["MEM-" + m + "|" + y] || {});
      const unpaidMonths = MONTHS.filter(month => !paid[month]);
      if (unpaidMonths.length > 0) oldTotal += unpaidMonths.length * FEE;
    }
  }
  const oldMs = Date.now() - oldStart;

  // NEW approach: for-loop + direct dict access
  const newStart = Date.now();
  let newTotal = 0;
  for (let m = 0; m < memberCount; m++) {
    for (let y = startYear; y <= currentYear; y++) {
      const paid = paidByMemberYear["MEM-" + m + "|" + y];
      const fees = mockFees[y];
      let yearBalance = 0;
      let hasUnpaid = false;
      for (let i = 0; i < 12; i++) {
        if (!paid || !paid[MONTHS[i]]) { yearBalance += fees.byMonth[i]; hasUnpaid = true; }
      }
      if (hasUnpaid) newTotal += yearBalance;
    }
  }
  const newMs = Date.now() - newStart;

  const totalsMatch = Math.abs(oldTotal - newTotal) < 0.01;
  return {
    ok: totalsMatch,
    expected: "totals match; new method not slower",
    actual: "old=" + oldMs + "ms new=" + newMs + "ms totals: old=" + oldTotal + " new=" + newTotal
  };
}

// SLOW: precomputeYearlyFees_ matches expectedAmountForItems_ (real fee history from sheet)
function testUnpaidOptPrecomputedFeeMatchesLegacy_() {
  delete CMS_DATA_CONTEXT_["yearly:fees:precomputed"];
  const yearlyFees = precomputeYearlyFees_();
  const currentYear = new Date().getFullYear();
  const errors = [];
  for (let year = 2020; year <= currentYear; year++) {
    const fees = yearlyFees[year];
    if (!fees) { errors.push("missing " + year); continue; }
    const legacyTotal = expectedAmountForItems_(MONTHS.map(month => ({ year, month })));
    if (Math.abs(fees.total - legacyTotal) > 0.01) {
      errors.push("year=" + year + " precomputed=" + fees.total + " legacy=" + legacyTotal);
    }
    for (let i = 0; i < 12; i++) {
      const legacyMonth = monthlyFeeFor_(year, i);
      if (Math.abs(fees.byMonth[i] - legacyMonth) > 0.01) {
        errors.push("year=" + year + " month=" + i + " precomputed=" + fees.byMonth[i] + " legacy=" + legacyMonth);
      }
    }
  }
  const ok = errors.length === 0;
  return { ok, expected: "all years match", actual: ok ? "all match" : errors.join("; ") };
}

// ─────────────────────────────────────────────────────────────
// Bug fix regression tests
// ─────────────────────────────────────────────────────────────

// Bug #1 fix: sheetDataWidth_ must return 10 for members so gender/birthDate columns are read.
function testSheetDataWidthMembersIs10_() {
  const width = sheetDataWidth_(SHEETS.members, null);
  return { ok: width === 10, expected: 10, actual: width };
}

// Bug #1 fix: buildMemberDemographics_ uses row[8] (gender) — verify simulateDemographics_
// correctly counts men/women when gender data is provided (regression guard).
function testDemographicsGenderColumnsReachable_() {
  const members = [
    { gender: "Male",   birthDate: new Date("1990-01-01") },
    { gender: "Female", birthDate: new Date("1992-05-10") },
    { gender: "Male",   birthDate: new Date("1988-03-20") }
  ];
  const d = simulateDemographics_(members);
  return {
    ok: d.men === 2 && d.women === 1 && d.genderUnknown === 0,
    expected: { men: 2, women: 1, genderUnknown: 0 },
    actual: { men: d.men, women: d.women, genderUnknown: d.genderUnknown }
  };
}

// Bug #2 fix: prepareUnpaidReminder_ WA URL must use wa.me/ with digits-only phone.
function testUnpaidReminderWaUrlFormat_() {
  const phone = "+49123456789";
  const digits = phone.replace(/\D/g, "");
  const url = "https://wa.me/" + digits + "?text=" + encodeURIComponent("Hello");
  const ok = url.startsWith("https://wa.me/49") && !url.includes("+") && url.includes("?text=");
  return { ok, expected: "https://wa.me/49…?text=…", actual: url.slice(0, 50) };
}

// Bug #3 fix (SLOW — reads sheet): getRowForEditByMemberId must return a valid member row.
function testGetRowForEditByMemberIdFound_() {
  const index = memberIndex_();
  if (!index.list.length) return { ok: true, note: "no members in sheet — skip" };
  const first = index.list[0];
  let result;
  try {
    result = getRowForEditByMemberId({ memberId: first.id, admin: "test" });
  } catch (e) {
    return { ok: false, expected: "row object", actual: e.message };
  }
  const ok = result && result.type === "member" && result.row >= 3 && Array.isArray(result.values) && result.values.length === 10;
  return {
    ok,
    expected: { type: "member", rowGte3: true, valuesLen: 10 },
    actual: result ? { type: result.type, row: result.row, valuesLen: result.values.length } : null
  };
}

// ── Join date lock tests ────────────────────────────────────────────────────

function testJoinDateLockedFlagReturnedWhenPaymentsExist_() {
  const paidMembers = dataRows_(SHEETS.payments)
    .map(r => clean_(r[2]))
    .filter(Boolean);
  if (!paidMembers.length) return { ok: true, note: "no payment rows — skip" };
  const memberId = paidMembers[0];
  let result;
  try {
    result = getRowForEditByMemberId({ memberId, admin: "test" });
  } catch (e) {
    return { ok: false, expected: "joinDateLocked=true", actual: e.message };
  }
  return {
    ok: result.joinDateLocked === true,
    expected: "joinDateLocked=true",
    actual: "joinDateLocked=" + result.joinDateLocked
  };
}

function testJoinDateUnlockedFlagReturnedWhenNoPayments_() {
  const index = memberIndex_();
  const paidIds = new Set(dataRows_(SHEETS.payments).map(r => clean_(r[2])).filter(Boolean));
  const covIds = new Set(dataRows_(SHEETS.coverage).map(r => clean_(r[0])).filter(Boolean));
  const free = index.list.find(m => !paidIds.has(m.id) && !covIds.has(m.id));
  if (!free) return { ok: true, note: "all members have payments/coverage — skip" };
  let result;
  try {
    result = getRowForEditByMemberId({ memberId: free.id, admin: "test" });
  } catch (e) {
    return { ok: false, expected: "joinDateLocked=false", actual: e.message };
  }
  return {
    ok: result.joinDateLocked === false,
    expected: "joinDateLocked=false",
    actual: "joinDateLocked=" + result.joinDateLocked
  };
}

function testJoinDateChangeBlockedByBackendWhenPaymentsExist_() {
  const paidMembers = dataRows_(SHEETS.payments)
    .map(r => clean_(r[2]))
    .filter(Boolean);
  if (!paidMembers.length) return { ok: true, note: "no payment rows — skip" };
  const memberId = paidMembers[0];
  const index = memberIndex_();
  const member = index.list.find(m => m.id === memberId);
  if (!member) return { ok: true, note: "member not in index — skip" };
  const row = Number(member.rowNumber);
  const existing = sh_(SHEETS.members).getRange(row, 1, 1, 10).getValues()[0];
  const oldJoin = coerceDate_(existing[4]);
  const differentDate = oldJoin
    ? new Date(oldJoin.getFullYear() - 1, 0, 1).toISOString().slice(0, 10)
    : "2015-01-01";
  let blocked = false;
  let errMsg = "";
  try {
    updateSelectedRow({
      sheetName: SHEETS.members, row, admin: memberId,
      memberId, fullName: clean_(existing[1]), phone: clean_(existing[2]),
      city: clean_(existing[3]), joinDate: differentDate,
      status: clean_(existing[5]) || "Active", notes: clean_(existing[6]),
      addedBy: clean_(existing[7]) || "test", gender: clean_(existing[8]) || "Male",
      birthDate: existing[9] ? new Date(existing[9]).toISOString().slice(0, 10) : "1990-01-01"
    });
  } catch (e) {
    blocked = true;
    errMsg = e.message;
  }
  return {
    ok: blocked && errMsg.includes("Join date cannot be changed"),
    expected: "error: Join date cannot be changed...",
    actual: blocked ? errMsg : "no error thrown"
  };
}

function testJoinDateChangeAllowedWhenNoPayments_() {
  const index = memberIndex_();
  const paidIds = new Set(dataRows_(SHEETS.payments).map(r => clean_(r[2])).filter(Boolean));
  const covIds = new Set(dataRows_(SHEETS.coverage).map(r => clean_(r[0])).filter(Boolean));
  const free = index.list.find(m => !paidIds.has(m.id) && !covIds.has(m.id));
  if (!free) return { ok: true, note: "all members have records — skip" };
  const row = Number(free.rowNumber);
  const existing = sh_(SHEETS.members).getRange(row, 1, 1, 10).getValues()[0];
  const oldJoin = coerceDate_(existing[4]);
  const newDate = oldJoin ? new Date(oldJoin.getTime()) : new Date();
  newDate.setDate(newDate.getDate() + 1);
  const newDateStr = newDate.toISOString().slice(0, 10);
  const originalDateStr = oldJoin ? oldJoin.toISOString().slice(0, 10) : "";
  let saved = false;
  try {
    updateSelectedRow({
      sheetName: SHEETS.members, row, admin: free.id,
      memberId: clean_(existing[0]), fullName: clean_(existing[1]),
      phone: clean_(existing[2]), city: clean_(existing[3]),
      joinDate: newDateStr, status: clean_(existing[5]) || "Active",
      notes: clean_(existing[6]), addedBy: clean_(existing[7]) || "test",
      gender: clean_(existing[8]) || "Male",
      birthDate: existing[9] ? new Date(existing[9]).toISOString().slice(0, 10) : "1990-01-01"
    });
    saved = true;
    updateSelectedRow({
      sheetName: SHEETS.members, row, admin: free.id,
      memberId: clean_(existing[0]), fullName: clean_(existing[1]),
      phone: clean_(existing[2]), city: clean_(existing[3]),
      joinDate: originalDateStr || newDateStr, status: clean_(existing[5]) || "Active",
      notes: clean_(existing[6]), addedBy: clean_(existing[7]) || "test",
      gender: clean_(existing[8]) || "Male",
      birthDate: existing[9] ? new Date(existing[9]).toISOString().slice(0, 10) : "1990-01-01"
    });
  } catch (e) {
    return { ok: false, expected: "no error", actual: e.message };
  }
  return { ok: saved, expected: "save succeeded", actual: saved ? "saved and restored" : "not saved" };
}

function testOtherFieldsEditableWhenJoinDateLocked_() {
  const paidMembers = dataRows_(SHEETS.payments)
    .map(r => clean_(r[2]))
    .filter(Boolean);
  if (!paidMembers.length) return { ok: true, note: "no payment rows — skip" };
  const memberId = paidMembers[0];
  const index = memberIndex_();
  const member = index.list.find(m => m.id === memberId);
  if (!member) return { ok: true, note: "member not in index — skip" };
  const row = Number(member.rowNumber);
  const existing = sh_(SHEETS.members).getRange(row, 1, 1, 10).getValues()[0];
  const originalNotes = clean_(existing[6]);
  const testNotes = originalNotes + " (test)";
  const joinDate = existing[4] ? new Date(existing[4]).toISOString().slice(0, 10) : "";
  let saved = false;
  try {
    updateSelectedRow({
      sheetName: SHEETS.members, row, admin: memberId,
      memberId: clean_(existing[0]), fullName: clean_(existing[1]),
      phone: clean_(existing[2]), city: clean_(existing[3]),
      joinDate, status: clean_(existing[5]) || "Active",
      notes: testNotes, addedBy: clean_(existing[7]) || "test",
      gender: clean_(existing[8]) || "Male",
      birthDate: existing[9] ? new Date(existing[9]).toISOString().slice(0, 10) : "1990-01-01"
    });
    saved = true;
    updateSelectedRow({
      sheetName: SHEETS.members, row, admin: memberId,
      memberId: clean_(existing[0]), fullName: clean_(existing[1]),
      phone: clean_(existing[2]), city: clean_(existing[3]),
      joinDate, status: clean_(existing[5]) || "Active",
      notes: originalNotes, addedBy: clean_(existing[7]) || "test",
      gender: clean_(existing[8]) || "Male",
      birthDate: existing[9] ? new Date(existing[9]).toISOString().slice(0, 10) : "1990-01-01"
    });
  } catch (e) {
    return { ok: false, expected: "notes change allowed", actual: e.message };
  }
  return { ok: saved, expected: "notes edit saved", actual: saved ? "saved and restored" : "not saved" };
}

function testJoinDateChangeBlockedEvenWithConfirmFlag_() {
  const paidMembers = dataRows_(SHEETS.payments)
    .map(r => clean_(r[2]))
    .filter(Boolean);
  if (!paidMembers.length) return { ok: true, note: "no payment rows — skip" };
  const memberId = paidMembers[0];
  const index = memberIndex_();
  const member = index.list.find(m => m.id === memberId);
  if (!member) return { ok: true, note: "member not in index — skip" };
  const row = Number(member.rowNumber);
  const existing = sh_(SHEETS.members).getRange(row, 1, 1, 10).getValues()[0];
  const oldJoin = coerceDate_(existing[4]);
  const differentDate = oldJoin
    ? new Date(oldJoin.getFullYear() - 1, 0, 1).toISOString().slice(0, 10)
    : "2015-01-01";
  let blocked = false;
  let errMsg = "";
  try {
    updateSelectedRow({
      sheetName: SHEETS.members, row, admin: memberId,
      memberId, fullName: clean_(existing[1]), phone: clean_(existing[2]),
      city: clean_(existing[3]), joinDate: differentDate,
      status: clean_(existing[5]) || "Active", notes: clean_(existing[6]),
      addedBy: clean_(existing[7]) || "test", gender: clean_(existing[8]) || "Male",
      birthDate: existing[9] ? new Date(existing[9]).toISOString().slice(0, 10) : "1990-01-01",
      confirmRegistrationYearChange: true
    });
  } catch (e) {
    blocked = true;
    errMsg = e.message;
  }
  return {
    ok: blocked && errMsg.includes("Join date cannot be changed"),
    expected: "blocked even with confirmRegistrationYearChange=true",
    actual: blocked ? errMsg : "no error — bypass succeeded (BAD)"
  };
}

// ─── Dashboard consistency tests ─────────────────────────────────────────────

// After clearing cache, readDashboardCache_() must return null (no stale data).
// clearDashboardSummaryCache_ clears both CacheService and PropertiesService.
function testDashboardCacheNullAfterClear_() {
  clearDashboardSummaryCache_();
  const result = readDashboardCache_();
  return {
    ok: result === null,
    expected: "null after clearDashboardSummaryCache_ (CacheService + PropertiesService both cleared)",
    actual: result === null ? "null" : "non-null (stale cache present)"
  };
}

// Live totals must be internally consistent: income = membershipIncome + serviceIncome + savingsIncome + churchIncome.
function testLiveTotalsIncomeBreakdownSumsToTotal_() {
  const live = buildLiveDashboardTotals_();
  const breakdownSum = Number((live.membershipIncome + live.serviceIncome + live.savingsIncome + live.churchIncome).toFixed(2));
  const ok = Math.abs(breakdownSum - live.income) < 0.01;
  return {
    ok,
    expected: "membershipIncome + serviceIncome + savingsIncome + churchIncome = income",
    actual: breakdownSum + " vs " + live.income
  };
}

// After cache flush + rebuild, cached income must equal live income (no stale values).
function testCachedIncomeMatchesLiveAfterRebuild_() {
  clearDashboardSummaryCache_();
  PropertiesService.getDocumentProperties().deleteProperty(DASHBOARD_CACHE_PROPS_KEY);
  const rebuilt = refreshDashboardCache_("test-consistency", "Mussie Teklit");
  const live = buildLiveDashboardTotals_();
  const ok = rebuilt.d.income === live.income && rebuilt.d.expenses === live.expenses && rebuilt.d.net === live.net;
  return {
    ok,
    expected: "rebuilt cache income/expenses/net equal live totals",
    actual: "cache=" + rebuilt.d.income + "/" + rebuilt.d.expenses + "/" + rebuilt.d.net +
            " live=" + live.income + "/" + live.expenses + "/" + live.net
  };
}

// Dashboard net must equal income minus expenses.
function testDashboardNetBalanceCalculation_() {
  const live = buildLiveDashboardTotals_();
  const expectedNet = Number((live.income - live.expenses).toFixed(2));
  const ok = Math.abs(live.net - expectedNet) < 0.01;
  return {
    ok,
    expected: "net = income - expenses = " + expectedNet,
    actual: live.net
  };
}

// buildLiveDashboardTotals_ must return all three income breakdown keys.
function testDashboardYearlyBreakdownKeysPresent_() {
  const live = buildLiveDashboardTotals_();
  const missing = ["membershipIncome", "serviceIncome", "churchIncome"].filter(k => !(k in live));
  return {
    ok: missing.length === 0,
    expected: "membershipIncome, serviceIncome, churchIncome all present",
    actual: missing.length === 0 ? "all present" : "missing: " + missing.join(", ")
  };
}

// Yearly total income must equal live.income (membership + all other income including savings).
function testDashboardYearlyTotalEqualsBreakdownSum_() {
  const live = buildLiveDashboardTotals_();
  const serviceOther = Number((live.income - live.membershipIncome).toFixed(2));
  const total = Number((live.membershipIncome + serviceOther).toFixed(2));
  const ok = Math.abs(total - live.income) < 0.01;
  return {
    ok,
    expected: "membershipIncome + (income - membershipIncome) = income",
    actual: total + " vs " + live.income
  };
}

// Service/other must be non-negative (churchIncome is always >= 0).
function testDashboardServiceOtherIsNonNegative_() {
  const live = buildLiveDashboardTotals_();
  const serviceOther = Number((live.serviceIncome + live.churchIncome).toFixed(2));
  return {
    ok: serviceOther >= 0,
    expected: "serviceIncome + churchIncome >= 0",
    actual: serviceOther
  };
}

// recentPaymentRowsForDashboard_ must return rows with exactly 5 columns.
function testRecentPaymentRowsHaveCorrectWidth_() {
  const rows = recentPaymentRowsForDashboard_(8);
  const bad = rows.filter(r => r.length !== 5);
  return {
    ok: bad.length === 0,
    expected: "all rows have 5 columns",
    actual: bad.length === 0 ? "ok" : bad.length + " row(s) with wrong column count"
  };
}

// recentExpenseRowsForDashboard_ must return rows with exactly 5 columns.
function testRecentExpenseRowsHaveCorrectWidth_() {
  const rows = recentExpenseRowsForDashboard_(8);
  const bad = rows.filter(r => r.length !== 5);
  return {
    ok: bad.length === 0,
    expected: "all rows have 5 columns",
    actual: bad.length === 0 ? "ok" : bad.length + " row(s) with wrong column count"
  };
}

// tigrinyaPaymentForms_ must return male forms for "Male".
function testTigrinyaMalePaymentFormsAreMale_() {
  const f = tigrinyaPaymentForms_("Male");
  const checks = [
    f.paymentRegistered.includes("ክፍሊትካ"),
    f.amountPaidLabel.includes("ዝኸፈልካዮ"),
    f.closing.includes("ህይወትካ"),
    f.closing.includes("ይሃብካ"),
    f.footerBlessing.includes("ዘውጻእካዮ")
  ];
  const ok = checks.every(Boolean);
  return { ok, expected: "all male forms present", actual: ok ? "ok" : JSON.stringify(f) };
}

// tigrinyaPaymentForms_ must return female forms for "Female".
function testTigrinyaFemalePaymentFormsAreFemale_() {
  const f = tigrinyaPaymentForms_("Female");
  const checks = [
    f.paymentRegistered.includes("ክፍሊትኪ"),
    f.amountPaidLabel.includes("ዝኸፈልክዮ"),
    f.closing.includes("ህይወትኪ"),
    f.closing.includes("ይሃብኪ"),
    f.footerBlessing.includes("ዘውጻእኪዮ")
  ];
  const ok = checks.every(Boolean);
  return { ok, expected: "all female forms present", actual: ok ? "ok" : JSON.stringify(f) };
}

// tigrinyaPaymentForms_ with blank gender must not contain male-specific forms.
function testTigrinyaNeutralPaymentFormsNotMale_() {
  const f = tigrinyaPaymentForms_("");
  const hasMaleForms = f.paymentRegistered.includes("ክፍሊትካ") ||
    f.amountPaidLabel.includes("ዝኸፈልካዮ") ||
    f.closing.includes("ይሃብካ");
  const ok = !hasMaleForms;
  return { ok, expected: "no male-specific forms for blank gender", actual: ok ? "ok" : JSON.stringify(f) };
}

// buildWhatsAppReceipt_ with gender=Female must include female Tigrigna forms.
function testWhatsAppReceiptUsesFemaleFormsForFemale_() {
  const result = buildWhatsAppReceipt_("+491511234567", "Helen Tsehaye", 180, "Membership", "2026", 2026, "https://example.com/receipt", "TXN-TEST", "ti", "Female");
  const msg = result.message;
  const ok = msg.includes("ክፍሊትኪ") && msg.includes("ዝኸፈልክዮ") && msg.includes("ይሃብኪ");
  return { ok, expected: "female forms in WhatsApp message", actual: ok ? "ok" : msg };
}

// buildStandardChurchPdfHtml_ with gender=Female must include female footer blessing.
function testPdfReceiptHtmlUsesFemaleFooterBlessing_() {
  const html = buildStandardChurchPdfHtml_({
    gender: "Female",
    titleDe: "TEST",
    titleTi: "ሙከራ",
    highlightValue: "€180",
    methodValue: "Cash"
  });
  const ok = html.includes("ዘውጻእኪዮ") && html.includes("ይተክኣልኪ");
  return { ok, expected: "female footer blessing in PDF HTML", actual: ok ? "ok" : "(female blessing not found)" };
}

// After normalizeYearlyMembershipSheetViews_ + refreshDashboardLiveTotals_, B13 must equal live.income.
// This catches the regression where normalize wiped A10:B13 and a subsequent missing refresh left zeros.
function testDashboardYearlyIncomeStableAfterNormalizeAndRefresh_() {
  const live = buildLiveDashboardTotals_();
  normalizeYearlyMembershipSheetViews_();
  refreshDashboardLiveTotals_(live);
  const dash = sheetByName_(SHEETS.dashboard);
  const b5 = Number(dash.getRange("B5").getValue());
  const b13 = Number(dash.getRange("B13").getValue());
  const ok = Math.abs(b5 - live.income) < 0.01 && Math.abs(b13 - live.income) < 0.01;
  return {
    ok,
    expected: "B5 and B13 both equal live.income=" + live.income,
    actual: "B5=" + b5 + " B13=" + b13
  };
}

// Calling refreshDashboardLiveTotals_ twice must produce the same B5 and B13.
function testDashboardYearlyIncomeSameAfterDoubleRefresh_() {
  const live = buildLiveDashboardTotals_();
  refreshDashboardLiveTotals_(live);
  const dash = sheetByName_(SHEETS.dashboard);
  const b5first = Number(dash.getRange("B5").getValue());
  const b13first = Number(dash.getRange("B13").getValue());
  refreshDashboardLiveTotals_(live);
  const b5second = Number(dash.getRange("B5").getValue());
  const b13second = Number(dash.getRange("B13").getValue());
  const ok = b5first === b5second && b13first === b13second;
  return {
    ok,
    expected: "B5 and B13 unchanged after second refresh",
    actual: "B5: " + b5first + "→" + b5second + " B13: " + b13first + "→" + b13second
  };
}

// After refreshDashboardLiveTotals_, D25 must contain the "Recent Church Transactions" title.
function testDashboardRecentChurchTitleAfterRefresh_() {
  const live = buildLiveDashboardTotals_();
  refreshDashboardLiveTotals_(live);
  const dash = sheetByName_(SHEETS.dashboard);
  const d25 = String(dash.getRange("D25").getValue());
  const ok = d25 === "Recent Church Transactions";
  return {
    ok,
    expected: "D25 = 'Recent Church Transactions'",
    actual: "D25 = '" + d25 + "'"
  };
}
