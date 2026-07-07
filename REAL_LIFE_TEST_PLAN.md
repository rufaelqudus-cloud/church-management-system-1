# Church Management System Real-Life Test Plan

## Purpose

This test plan verifies the Church Management System in realistic church-office use. It covers yearly membership payments, all sidebar tabs, Google Sheet data integrity, receipts, expenses, reports, audit logging, role permissions, and error handling.

The system passes only when the acceptance criteria at the end of this document are met.

## Test Data Setup

Before testing, create a controlled test dataset. Do not use real member data for automated stress testing.

### Required Minimum Data

- At least 300 members.
- Registration dates distributed from 2017 through today.
- Payment statuses:
  - No payments.
  - Fully paid.
  - Partially paid.
  - Overpaid attempt.
- Phone number types:
  - Valid WhatsApp number.
  - Invalid phone number.
  - Missing phone number.
- Users:
  - Super Admin.
  - Treasurer.
  - Secretary.
  - Viewer / Auditor.
  - At least one normal active admin.

### Member Data Distribution

Use this minimum distribution:

| Group | Count | Registration Years | Payment Status |
| --- | ---: | --- | --- |
| No payments | 75 | 2017-today | No payment records |
| Fully paid | 75 | 2017-today | Paid through current year |
| Partially paid | 75 | 2017-today | Missing one or more years |
| Edge cases | 75 | Mixed | Invalid/missing phone, duplicate attempts, special names |

### Payment Rule Baseline

The membership rule is yearly:

- A member owes from the registration year.
- The registration year is always a full payable year.
- No member is charged before their registration year.
- One membership year equals 12 months x EUR 5 = EUR 60 by default.
- Payments must start from the oldest unpaid year.
- Paying the same year twice must be prevented or handled explicitly as non-membership credit.
- Negative and zero payments must be rejected.

## Automated Test Requirement

Run at least 500 automated tests total.

Coverage must include:

- Payment yearly rule.
- Add member.
- Edit member.
- Members list.
- Member details.
- Payment history.
- Receipts.
- Expenses.
- Reports.
- Tools.
- Settings.
- Audit Log.
- Role permissions.
- UI navigation.
- Error handling.
- Mobile responsiveness, if supported.

Suggested minimum split:

| Area | Minimum Tests |
| --- | ---: |
| Yearly payment rule and balances | 90 |
| Add/edit members | 70 |
| Members list/details/search | 45 |
| Payments and receipts | 90 |
| Payment history | 25 |
| Expenses | 40 |
| Reports/dashboard/unpaid members | 45 |
| Tools/settings/admin users | 35 |
| Audit Log | 30 |
| Role permissions/security | 45 |
| UI navigation/mobile/error handling | 35 |
| Total | 550 |

The target is 550 so the run still satisfies the 500-test requirement if a small number are skipped for environment reasons.

## Sidebar Tabs And Workflows

### 1. Add Member Tab

Test:

- Add valid member.
- Add member with missing required fields.
- Add duplicate Member ID, if manual entry/import is supported.
- Add duplicate phone number.
- Add invalid phone number.
- Add member with registration date in the past.
- Add member with registration date today.
- Add member with future registration date.
- Add member with special characters in name.
- Add member with very long name.
- Add member with optional fields empty.

Expected:

- Valid members are saved correctly.
- Member ID is generated or validated correctly.
- Registration year is saved correctly.
- Invalid data shows clear error messages.
- Duplicate records are prevented or clearly warned.
- New member appears in the member search/list.
- Audit Log records member creation.

### 2. Members List / Member Search

Test:

- Search by name.
- Search by Member ID.
- Search by phone number.
- Filter active/inactive members if available.
- Sort by name if available.
- Sort by registration date if available.
- Open member details through the payment/member lookup workflow.
- Pagination or performance with 300+ members.
- Empty search result.

Expected:

- Search returns the correct member.
- List loads quickly with 300+ members.
- No duplicate rows appear.
- Empty results are clear.
- Member details open correctly where supported.

### 3. Member Details / Balance Lookup

Test:

- View member profile.
- View balance due.
- View paid-until year.
- View unpaid years.
- View payment history.
- View receipts, if available from the member/payment history flow.
- View member status.
- View WhatsApp phone number.

Expected:

- Balance matches the yearly payment rule.
- Paid Until shows the correct year.
- Unpaid years start from registration year.
- No year before registration year appears.
- Receipts and history match saved payment records.

### 4. Edit Member Tab

Test:

- Edit name.
- Edit phone number.
- Edit registration date.
- Edit status.
- Save changes.
- Cancel changes, if supported.
- Try invalid edits.
- Try duplicate phone number.
- Try changing registration date after payments exist.

Expected:

- Valid edits are saved.
- Invalid edits are blocked.
- Changes appear immediately in member details/search.
- Changing registration date after payments exist is blocked or requires clear confirmation.
- Audit Log records old value and new value.

### 5. Payments Tab

Test yearly payments only:

- Select member by name.
- Select member by Member ID.
- Select member by phone.
- Enter one-year payment.
- Enter multi-year payment.
- Enter overpayment attempt.
- Enter partial yearly amount.
- Try payment before registration year.
- Try duplicate payment for the same year.
- Try skipping older unpaid years.
- Try negative payment.
- Try zero payment.
- Save payment.
- Generate receipt.
- Open WhatsApp receipt link when possible.
- Test missing/invalid phone receipt flow.

Expected:

- System uses yearly payments only.
- No monthly checkbox UI appears.
- Covered period shows years, not months.
- Balance decreases correctly.
- Paid Until updates correctly.
- Duplicate year payment is rejected or handled as credit outside membership.
- Payment before registration year is rejected.
- Skipping old unpaid years is rejected.
- Negative and zero payments are rejected.
- Receipt PDF is generated.
- WhatsApp link opens or fails gracefully with a manual option.
- Audit Log records payment creation.

### 6. Payment History / History Tab

Test:

- View/search all payments.
- Filter/search by member.
- Filter/search by date.
- Filter/search by year.
- Search by transaction ID.
- Empty result.

Expected:

- Filters/search work correctly.
- Payment history matches saved payments.
- Payment Type shows Yearly for membership payments.
- Year is shown clearly.

### 7. Receipts

Test:

- Receipt list loads where available.
- Search receipt by member.
- Search receipt by transaction ID.
- Open PDF receipt.
- Re-send or reopen WhatsApp receipt link if available.
- Failed receipt generation.
- Missing receipt link.
- Receipt status columns.

Expected:

- Receipt Generated shows Yes/No.
- Receipt Sent shows Yes/No.
- Receipt Sent Date is saved when sending is recorded.
- Receipt Link opens the correct PDF.
- Failed receipts show clear status.
- Receipt fields match transaction fields.

### 8. Expenses Tab

Test:

- Add expense.
- Verify Recorded By auto-fills from logged-in admin.
- Edit expense.
- Delete expense if supported.
- Expense category.
- Expense date.
- Amount validation.
- Negative amount.
- Zero amount.
- Receipt/attachment upload if available.

Expected:

- Valid expense is saved.
- Recorded By is automatic and read-only.
- Invalid amount is rejected.
- Expense totals update dashboard/reports.
- Audit Log records create/edit/delete actions where supported.

### 9. Reports / Dashboard / Unpaid Members

Test:

- Membership balance report.
- Paid members report.
- Unpaid members by year.
- Yearly income report.
- Expenses report.
- Net balance report.
- Export PDF/Excel if available.
- Report date/year filters.
- Dashboard selected year.

Expected:

- Reports match payment and expense data.
- No member is charged before registration year.
- Yearly membership income is calculated correctly.
- Unpaid Members sheet shows years, not months.
- Dashboard shows yearly unpaid members.
- Export files open correctly, where supported.

### 10. Tools / Settings

Test:

- Add admin.
- Reset admin.
- Disable admin if supported.
- Change membership fee.
- Fee effective date.
- Fee history.
- Invalid fee amount.
- Missing fee reason if required.
- Remove member.
- Merge member, if available.
- Protection lock/unlock tools.

Expected:

- Settings changes are role-protected.
- Membership fee history records old fee, new fee, date, admin, and reason.
- Historical balance calculations use the correct fee for the relevant year/month basis.
- Tools do not corrupt data.
- Audit Log records settings and admin changes.

### 11. Audit Log

Test that these actions are logged:

- Member created.
- Member edited.
- Payment created.
- Payment edited.
- Payment deleted.
- Expense created.
- Expense edited.
- Expense deleted.
- Receipt generated.
- Receipt sent or WhatsApp link generated.
- Fee changed.
- Admin/user changed.
- Unauthorized access attempt where supported.

Expected each audit entry includes:

- User.
- Role, if available.
- Action.
- Date/time.
- Entity affected.
- Old value.
- New value.
- Reason, if provided.

Audit Log should be read-only to normal sidebar users.

### 12. User Roles / Security

Test each role.

#### Super Admin

Expected:

- Full access to all tabs and actions.
- Can manage users/settings.
- Can manage payments, members, expenses, tools.

#### Treasurer

Expected:

- Can manage payments.
- Can add payment.
- Can view balances.
- Can generate receipts.
- Can view payment history.
- Can manage expenses if configured.
- Cannot change system settings unless explicitly allowed.
- Cannot manage admin users unless explicitly allowed.

#### Secretary

Expected:

- Can manage member records.
- Can view basic member/payment information as allowed.
- Cannot delete payment history unless explicitly allowed.
- Cannot change settings.

#### Viewer / Auditor

Expected:

- Read-only access.
- Cannot add/edit/delete members.
- Cannot add/edit/delete payments.
- Cannot add/edit/delete expenses.
- Can view reports/audit information if allowed.

## High-Risk Regression Tests

These tests must always pass before real use:

1. Member registered in 2017 cannot pay 2025 before 2017-2024 are paid.
2. Member registered in 2026 is not charged for 2025 or earlier.
3. Member registered June 2026 owes full 2026.
4. Same member cannot pay the same membership year twice.
5. Negative payment is rejected.
6. Zero payment is rejected.
7. Missing member phone does not crash receipt generation.
8. Invalid phone does not crash WhatsApp link generation.
9. Viewer cannot save payment.
10. Treasurer cannot change membership fee.
11. Expense Recorded By is the logged-in admin.
12. Audit Log records payment edit and delete.

## Required Final Test Report

After running tests, produce a report containing:

1. Total tests run.
2. Passed tests.
3. Failed tests.
4. Failed test names.
5. Error messages.
6. Screenshots/logs for failed UI tests.
7. Test data summary.
8. Final balances for at least 10 sample members.
9. Receipt generation examples.
10. WhatsApp receipt examples.
11. Expense examples.
12. Report examples.
13. Audit log examples.
14. Role permission results.
15. Recommendations for fixes.

## Sample Final Balance Table

The final report must include at least 10 sample members:

| Member ID | Name | Registration Year | Paid Years | Unpaid Years | Balance Due | Paid Until | Eligible |
| --- | --- | ---: | --- | --- | ---: | --- | --- |
| sample | sample | 2017 | 2017-2026 | None | EUR 0 | 2026 | Yes |

## Acceptance Criteria

The system passes only if:

- At least 300 members are created successfully.
- At least 500 automated tests run.
- All sidebar tabs are tested.
- Yearly membership payment rule works correctly.
- No member is charged before registration year.
- Same membership year cannot be paid twice.
- Negative payment is rejected.
- Zero payment is rejected.
- Receipts generate correctly.
- WhatsApp receipt sending works or fails gracefully.
- Payment history is accurate.
- Expenses are saved and reported correctly.
- Reports match real data.
- Tools do not corrupt data.
- Settings changes are audited.
- Audit Log records critical actions.
- Role permissions are enforced.
- UI remains simple and usable.

