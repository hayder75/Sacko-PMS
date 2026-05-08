# Test Files for SAKO PMS

## File Formats & Upload Locations

### 1. june_baseline.csv
**Purpose:** June 30 baseline balances for incremental growth
**Upload:** June Balance → Upload Baseline File
**Format:**
```
account_id,customer_name,june_balance,baseline_period,baseline_date,is_active
100001,Tadesse Bekele,1500,2025,2025-06-30,true
...
```

### 2. customer_mapping.csv
**Purpose:** Map customers to staff
**Upload:** Bulk Mapping Upload
**Format:**
```
Account Number,Customer Name,Balance,June Balance,Staff ID,Phone Number
100001,Tadesse Bekele,1800,1500,MSO001,+251911000001
...
```

### 3. branch_plan.csv
**Purpose:** Branch KPI targets
**Upload:** Plan Cascade → Upload Plan (Excel/CSV)
**Format (WITH SPACES):**
```
branch_code,kpi_category,period,target_value,target_type
ATOTE,Deposit Mobilization,2025-H2,1000000,incremental
ATOTE,Digital Channel Growth,2025-H2,50,incremental
```

### 4. cbs_daily.csv
**Purpose:** CBS bank file
**Upload:** CBS Upload

---

## Key Fix: Use WITH SPACES

| Should Use | Don't Use |
|-----------|-----------|
| `Deposit Mobilization` | `Deposit_Mobilization` |
| `Digital Channel Growth` | `Digital_Channel_Growth` |
| `Member Registration` | `Member_Registration` |
| `Customer Base` | `Customer_Base` |

---

## Staff IDs for ATOTE

| Name | Position | Employee ID | Email |
|------|----------|-------------|-------|
| Hanof | MSO | MSO001 | mso@atote.et |
| Hanof | Accountant | ACCT001 | acct@atote.et |
| Marie Antoinette | MSM | MSM001 | msm@atote.et |
| Abebe Mola | BM | BM001 | bm@atote.et |

---

## Upload Steps

1. **June Balance** → Upload `june_baseline.csv`
2. **Bulk Mapping Upload** → Upload `customer_mapping.csv`
3. **Plan Cascade** → Upload `branch_plan.csv`
   - This will auto-cascade to staff (MSO gets 65%, etc.)

---

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| HQ Admin | admin@sako.com | admin123 |
| Branch Manager | bm@atote.et | bm123 |
| Line Manager | msm@atote.et | msm123 |
| Accountant | acct@atote.et | acct123 |
| MSO | mso@atote.et | mso123 |