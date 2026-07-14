# Plan & Product Update — Wolayita Sodo Alignment

## Source Files
- `Accounts.csv` — CBS export of 557+ real customer accounts for Wolayita Sodo
- `WSodo Plan FY 26 - 27.xlsx` — Branch operational target plan for FY 2026-2027

## What the Client's Plan Actually Tracks

The plan has 12 product-level categories, each with **dual targets** (deposit amount + account count), broken into **monthly increments** (July through June):

| # | Product Category | Annual Deposit Target | Annual Account Target |
|---|---|---|---|
| 1 | Loan Saving Deposit | 40,500,000 ETB | — |
| 2 | Michu Current Saving | 60,750,000 ETB | 13,994 |
| 3 | Gihon Regular Saving | 28,350,000 ETB | 9,125 |
| 4 | Mothers Saving | 16,200,000 ETB | 1,788 |
| 5 | Young Womens Saving | 16,200,000 ETB | 4,020 |
| 6 | Elders Saving | 12,150,000 ETB | 2,939 |
| 7 | Children Saving | 8,100,000 ETB | 4,355 |
| 8 | Fixed Time Deposit | 64,800,000 ETB | 20 |
| 9 | Premium Saving Deposit | 101,250,000 ETB | 9,025 |
| 10 | Special Saving | 16,200,000 ETB | — |
| 11 | Segment Deposit | 12,150,000 ETB | 120 |
| 12 | Wadiah IFB Deposit | 28,350,000 ETB | 967 |

**Total Deposit Target: 405,000,000 ETB**
**Total Account Target: 45,398**

Additional categories tracked:
- Conventional Loans: 324,000,000 ETB
- IFB Financing: 15,000,000 ETB
- NPL Ratio: 0% (target)

## Changes Required

### 1. Add New Product Category Enum

New `ProductCategory` enum with 12 values matching client's plan:

```
Loan_Saving_Deposit
Michu_Current_Saving
Gihon_Regular_Saving
Mothers_Saving
Young_Womens_Saving
Elders_Saving
Children_Saving
Fixed_Time_Deposit
Premium_Saving_Deposit
Special_Saving
Segment_Deposit
Wadiah_IFB_Deposit
```

### 2. Expand KpiCategory Enum

Add product-based KPI categories to match the client's real categories:

```
Loan_Saving_Deposit       -> "Loan Saving Deposit"
Michu_Current_Saving      -> "Michu Current Saving"
Gihon_Regular_Saving      -> "Gihon Regular Saving"
Mothers_Saving            -> "Mothers Saving"
Young_Womens_Saving       -> "Young Womens Saving"
Elders_Saving             -> "Elders Saving"
Children_Saving           -> "Children Saving"
Fixed_Time_Deposit        -> "Fixed Time Deposit"
Premium_Saving_Deposit    -> "Premium Saving Deposit"
Special_Saving            -> "Special Saving"
Segment_Deposit           -> "Segment Deposit"
Wadiah_IFB_Deposit        -> "Wadiah IFB Deposit"
```

### 3. Update Plan Model

Add fields to `Plan` model:
- `product_category ProductCategory?` (new field, alongside existing `kpi_category`)
- `target_count Float @default(0)` (account/number target)
- `monthly_plan Json?` (monthly breakdown — array of 12 months with amount + count targets)

Add fields to `StaffPlan` model:
- `target_count Float @default(0)`
- `monthly_plan Json?`

### 4. Add Missing CBS Product Types

These product types exist in Accounts.csv but are missing from our system:

| Product | Maps To |
|---|---|
| Premium Saving Deposit | Premium_Saving_Deposit |
| Fixed Time Deposit | Fixed_Time_Deposit |
| Wadiah Saving Account | Wadiah_IFB_Deposit |
| Segment Account | Segment_Deposit |
| School | Children_Saving (or new) |

### 5. Update Frontend Product Lists

Update `FALLBACK_PRODUCTS` in `TaskEntryForm.tsx` and static lists in `PlanCascade.tsx`, `ProductMapping.tsx`, `KPIFramework.tsx` to include all product categories.

### 6. Update PlanCascade UI

Redesign PlanCascade to show:
- Product-type targets (per product row with amount + count inputs)
- Monthly breakdown (July→June inline or collapsible)
- Annual totals auto-calculated

### 7. Update PlansOverview

Show per-product breakdown with actual vs target for both amount and count.

### 8. Seed Real Data

- Seed Wolayita Sodo branch with plan targets from XLSX
- Import account mappings from Accounts.csv (557+ accounts)
- Create staff users from Accounts.csv staff references

### 9. Product KPI Mappings

Map all CBS product names to KPI categories:

| CBS Product Name | KPI Category | Product Category |
|---|---|---|
| LOAN SAVING RESERVE ACCOUNT | Deposit Mobilization | Loan_Saving_Deposit |
| Michu Current Account | Deposit Mobilization | Michu_Current_Saving |
| GIHON REGULAR SAVING | Deposit Mobilization | Gihon_Regular_Saving |
| MOTHERS SAVING ACCOUNT | Deposit Mobilization | Mothers_Saving |
| YOUNG WOMEN SAVING | Deposit Mobilization | Young_Womens_Saving |
| ELDERS SAVING ACCOUNT | Deposit Mobilization | Elders_Saving |
| CHILDREN SAVING ACCOUNT | Deposit Mobilization | Children_Saving |
| FIXED TIME DEPOSIT | Deposit Mobilization | Fixed_Time_Deposit |
| Premium Saving | Deposit Mobilization | Premium_Saving_Deposit |
| SPECIAL SAVING ACCOUNT | Deposit Mobilization | Special_Saving |
| Segment Account | Deposit Mobilization | Segment_Deposit |
| WADIAH SAVING ACCOUNT | Deposit Mobilization | Wadiah_IFB_Deposit |
| REPAYMENT ACCOUNT | Internal Operations | (loan repayment) |
| School | Deposit Mobilization | (education savings) |

## Migration Plan

### Phase 1: Schema
- Add `ProductCategory` and expand `KpiCategory` enums
- Add `product_category`, `target_count`, `monthly_plan` to Plan model
- Run Prisma migration

### Phase 2: Backend
- Update plan controller for product targets
- Add seed script for Wolayita Sodo plan data
- Add seed script for account imports from CSV

### Phase 3: Frontend
- Update PlanCascade for per-product targets
- Update PlansOverview for dual metrics
- Update all product lists

### Phase 4: Deploy
- Run migration on production
- Run seed scripts
- Rebuild and deploy frontend
