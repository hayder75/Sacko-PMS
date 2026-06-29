# Ghion SACCOS — PMS Migration Plan & Tracker

## Branch
`Ghion-Saccos` (created from `main` at commit `664b56f`)

## Goal
Rebrand and restructure the PMS system from SAKO's org model to Ghion SACCOS's org model:
- New organizational structure (CEO → Area Manager → Branch Manager → Supervisors → Officers)
- New KPI framework (9 categories matching client's cascading matrix)
- New performance rating scale (% of target based)
- New positions/roles matching client's SACCOS structure
- Keep core features: account mapping, CBS validation, daily tasks, performance scores

---

## What Stays (Core Features)
- Account mapping → staff assignment
- CBS validation & discrepancy resolution
- Daily task entry + multi-level approval
- Performance score calculation
- Behavioral evaluations (simplified)
- June balance baselines
- Bulk mapping upload (Excel)
- Audit trail

---

## Phase 1: Database Schema Changes

### Status: ✅ Complete

#### Tasks
- [ ] Rewrite `UserRole` enum → `admin`, `areaManager`, `branchManager`, `supervisor`, `staff`
- [ ] Rewrite `Position` enum → `CEO`, `Area_Manager`, `Branch_Manager`, `Operation_Supervisor`, `Customer_Service_Officer_I`, `Customer_Service_Officer_II`, `Customer_Relationship_Supervisor`, `Sales_Marketing_Officer_I`, `Customer_Relationship_Officer_I`, `Internal_Auditor`
- [ ] Rewrite `KpiCategory` enum → `Account_Productivity`, `Deposit_Mobilization`, `New_Member_Registration`, `New_Account_Opening`, `Share_Capital_Growth`, `Mobile_Banking_Users`, `Merchant_POS_Growth`, `Billers_Recruitment`, `Internal_Operations`
- [ ] Rewrite `TaskType` enum → match new KPI categories
- [ ] Rewrite `PerformanceRating` enum → %-of-target based: Outstanding (120%+), Exceeds_Expectations (100-119%), Meets_Expectations (90-99%), Needs_Improvement (80-89%), Unsatisfactory (<80%)
- [ ] Remove `Region` model (table + all relations)
- [ ] Remove `Team` model
- [ ] Remove `SubTeam` model
- [ ] Remove `EvaluationApproval` model
- [ ] Remove `PlanShareConfig` model
- [ ] Update `User` model:
  - Remove `regionId`, `sub_team`, `region`, `area` relations
  - Add `supervisorId` (self-reference for reporting line)
  - Remove old relation references (managedRegions, managedAreas, managedTeams, ledSubTeams, subTeamMemberships)
- [ ] Update `Branch` model: remove `regionId`, remove `teams`/`subTeams` relations
- [ ] Update `AccountMapping` model: add `isProductive` Boolean, `lastActivityDate`
- [ ] Update `PerformanceScore` model: new rating logic
- [ ] Run `npx prisma migrate dev`
- [ ] Update seed script for Ghion SACCOS structure

#### Details
- All enum changes are additive + removal — old enum values replaced entirely
- `supervisorId` on User model creates a simple reporting tree (no more teams/subteams)
- `PlanShareConfig` replaced by cascading matrix percentages hardcoded per KPI per position
- `EvaluationApproval` chain simplified: supervisor → BM only

---

## Phase 2: Backend Middleware & Auth Changes

### Status: ✅ Complete

#### Tasks
- [ ] Update `rbac.js`: remove `isRegionalDirector`, `isLineManager`, `isSubTeamLeader`; add `isSupervisor`; update `isBranchManager`, `isAreaManager`, `canApprove`, `canApproveByPosition`
- [ ] Update `roleMapper.ts` (frontend): map new positions to new system roles
- [ ] Update `authController.js`: handle new roles on login
- [ ] Update `authRoutes.js`: remove old role references
- [ ] Update `userController.js` / `userRoutes.js`: remove region/team references, add supervisor assignment

---

## Phase 3: Backend Routes & Controllers

### Status: ⏳ Not Started

#### Tasks
- [ ] Remove all `/api/regions/*` routes
- [ ] Remove all `/api/teams/*` routes
- [ ] Remove `GET /api/dashboard/regional`
- [ ] Update `GET /api/dashboard/ceo` (was HQ) — new KPIs, no region map
- [ ] Update `GET /api/dashboard/area` — remove region refs
- [ ] Update `GET /api/dashboard/branch` — show supervisors instead of MSM/MSO
- [ ] Update `GET /api/dashboard/staff` — 9 KPI categories + account productivity
- [ ] Add `GET /api/supervisor/dashboard` — team overview, member KPIs, pending approvals
- [ ] Add `GET /api/account-productivity/stats` — track productive vs non-productive
- [ ] Add `GET /api/internal-ops/stats` — transactions, SMS, complaints
- [ ] Update `POST /api/performance/calculate` — new %-of-target formula
- [ ] Update all controllers referencing old KPI/task enums
- [ ] Update task approval logic for new chain (supervisor → BM)

---

## Phase 4: Frontend — Core Structure

### Status: ⏳ Not Started

#### Tasks
- [ ] Update `App.tsx`: new role routing, add SupervisorDashboard, remove old routes
- [ ] Update `Login.tsx`: new positions in dropdown
- [ ] Update `Sidebar.tsx`: new nav links, new branding "GHION SACCOS PMS"
- [ ] Update `TopNav.tsx`: role display
- [ ] Create `pages/SupervisorDashboard.tsx`: team overview, approvals, behavioral input
- [ ] Rename `HQDashboard.tsx` → `CEODashboard.tsx`
- [ ] Remove `RegionalDirectorDashboard.tsx`
- [ ] Remove `HierarchyManagement.tsx`
- [ ] Remove `TeamManagement.tsx`, `TeamPerformance.tsx`, `TeamTasks.tsx`

---

## Phase 5: Frontend — Dashboards & Pages

### Status: ⏳ Not Started

#### Tasks
- [ ] Update `BranchManagerDashboard.tsx`: supervisors view, 9 KPIs, account productivity
- [ ] Update `AreaManagerDashboard.tsx`: remove region refs, new KPIs
- [ ] Update `StaffDashboard.tsx`: 9 KPIs, account productivity section, productive badge
- [ ] Update `CEODashboard.tsx`: new KPIs, branch comparison, digital channel breakdown
- [ ] Update `MappedAccounts.tsx`: add Productivity Status column
- [ ] Update `TaskEntryForm.tsx`: 11 new task types
- [ ] Update `Tasks.tsx`: simplified approval flow display
- [ ] Update `PlanCascade.tsx`: 9 KPIs, new cascading matrix
- [ ] Update `PlansOverview.tsx`: new KPI names
- [ ] Update `BehavioralEvaluation.tsx`: supervisor→staff flow
- [ ] Update `BehavioralInput.tsx`: supervisor role
- [ ] Update `BulkMappingUpload.tsx`: keep as-is
- [ ] Update `CBSValidation.tsx`: keep as-is
- [ ] Update `ProductMapping.tsx`: new KPI categories

---

## Phase 6: Seed Data

### Status: ⏳ Not Started

#### Tasks
- [ ] Create `seedGhionSaccos.js`: full org with new positions, 9 KPIs, cascaded plans
- [ ] Create 30-50 account mappings with productivity statuses
- [ ] Create sample daily tasks with new task types
- [ ] Create sample behavioral evaluations

---

## Phase 7: Build, Migrate, Deploy

### Status: ⏳ Not Started

#### Tasks
- [ ] Run Prisma migrate
- [ ] Run seed
- [ ] Build frontend
- [ ] Deploy to server
- [ ] Test all dashboards

---

## Daily Change Log

### 2026-06-29
- Created branch `Ghion-Saccos` from `main`
- Created this migration plan document
- Started Phase 1: Rewrote Prisma schema — updated all enums (UserRole, Position, KpiCategory, TaskType, PerformanceRating), removed models (Region, Team, SubTeam, EvaluationApproval, PlanShareConfig), updated User model (removed regionId/sub_team, added supervisorId), added isProductive to AccountMapping, removed regionId from Area/Branch
- Generated migration SQL with data migration steps (old→new enum value mapping, table drops)
- Ran migration on server via `prisma migrate deploy`
- Phase 2: Updated rbac.js (removed old role checkers, added isSupervisor, updated hierarchies), updated roleNormalizer.js (new position→role mapping), updated frontend roleMapper.ts (new role types)
- Next: Phase 3 — Backend Routes & Controllers
