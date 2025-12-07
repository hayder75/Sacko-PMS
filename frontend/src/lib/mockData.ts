// Mock Data for SAKO PMS

export type UserRole = 
  | 'admin'
  | 'areaManager'
  | 'areaManager'
  | 'branchManager'
  | 'lineManager'
  | 'subTeamLeader'
  | 'staff';

export type Rating = 'Outstanding' | 'Very Good' | 'Good' | 'Needs Support' | 'Unsatisfactory';

export interface Staff {
  id: string;
  name: string;
  role: string;
  branch: string;
  region?: string;
  mappedAccounts: number;
  kpi: {
    deposit: { target: number; actual: number; percent: number };
    digital: { target: number; actual: number; percent: number };
    loan?: { target: number; actual: number; percent: number };
    customerBase?: { target: number; actual: number; percent: number };
    memberRegistration?: { target: number; actual: number; percent: number };
  };
  behavioralScore: number;
  finalScore: number;
  rating: Rating;
  rank?: number;
  teamSize?: number;
}

export interface Branch {
  id: string;
  name: string;
  region: string;
  depositTarget: number;
  achievement: number;
  percent: number;
  digitalPercent?: number;
  loanPercent?: number;
  teamSize?: number;
  status?: 'Good' | 'Warning' | 'Critical';
}

export interface Task {
  id: string;
  type: string;
  accountNumber: string;
  amount?: number;
  status: 'Approved' | 'Pending' | 'Rejected';
  submittedBy: string;
  submittedAt: string;
  remarks?: string;
  mappingStatus?: 'Mapped to You' | 'Mapped to Another Staff' | 'Unmapped';
}

export interface Account {
  id: string;
  accountNumber: string;
  customerName: string;
  type: string;
  balance: number;
  mappedTo?: string;
  status: 'Mapped' | 'Unmapped';
}

// Mock Staff Data
export const mockStaff: Staff[] = [
  {
    id: 'EMP057',
    name: 'Genet Ayele',
    role: 'MSO II',
    branch: 'Hawassa Main',
    region: 'South',
    mappedAccounts: 320,
    kpi: {
      deposit: { target: 1000000, actual: 850000, percent: 85 },
      digital: { target: 80, actual: 74, percent: 92 },
      customerBase: { target: 100, actual: 88, percent: 88 },
      memberRegistration: { target: 50, actual: 28, percent: 55 },
    },
    behavioralScore: 12.8,
    finalScore: 84.3,
    rating: 'Very Good',
    rank: 2,
    teamSize: 12,
  },
  {
    id: 'EMP058',
    name: 'Tadesse Bekele',
    role: 'MSO I',
    branch: 'Hawassa Main',
    region: 'South',
    mappedAccounts: 280,
    kpi: {
      deposit: { target: 800000, actual: 720000, percent: 90 },
      digital: { target: 70, actual: 65, percent: 93 },
      customerBase: { target: 90, actual: 85, percent: 94 },
      memberRegistration: { target: 45, actual: 30, percent: 67 },
    },
    behavioralScore: 13.2,
    finalScore: 88.5,
    rating: 'Very Good',
    rank: 1,
    teamSize: 12,
  },
];

// Mock Branch Data
export const mockBranches: Branch[] = [
  {
    id: 'BR011',
    name: 'Hawassa Main',
    region: 'South',
    depositTarget: 10000000,
    achievement: 8500000,
    percent: 85,
    digitalPercent: 82,
    loanPercent: 75,
    teamSize: 12,
    status: 'Good',
  },
  {
    id: 'BR012',
    name: 'Addis Ababa North',
    region: 'Addis North',
    depositTarget: 15000000,
    achievement: 12000000,
    percent: 80,
    digitalPercent: 88,
    loanPercent: 70,
    teamSize: 18,
    status: 'Good',
  },
  {
    id: 'BR013',
    name: 'Dire Dawa',
    region: 'East',
    depositTarget: 8000000,
    achievement: 4500000,
    percent: 56,
    digitalPercent: 60,
    loanPercent: 55,
    teamSize: 10,
    status: 'Warning',
  },
];

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: 'T001',
    type: 'Deposit Mobilization',
    accountNumber: 'ACC123456',
    amount: 50000,
    status: 'Pending',
    submittedBy: 'Genet Ayele',
    submittedAt: '2024-12-05T10:30:00',
    remarks: 'New customer deposit',
    mappingStatus: 'Mapped to You',
  },
  {
    id: 'T002',
    type: 'Digital Activation',
    accountNumber: 'ACC789012',
    status: 'Approved',
    submittedBy: 'Tadesse Bekele',
    submittedAt: '2024-12-05T09:15:00',
    mappingStatus: 'Mapped to You',
  },
];

// Mock Accounts
export const mockAccounts: Account[] = [
  {
    id: 'ACC001',
    accountNumber: 'ACC123456',
    customerName: 'Alemayehu Tesfaye',
    type: 'Savings',
    balance: 125000,
    mappedTo: 'Genet Ayele',
    status: 'Mapped',
  },
  {
    id: 'ACC002',
    accountNumber: 'ACC789012',
    customerName: 'Meron Bekele',
    type: 'Current',
    balance: 45000,
    mappedTo: 'Tadesse Bekele',
    status: 'Mapped',
  },
  {
    id: 'ACC003',
    accountNumber: 'ACC345678',
    customerName: 'Yonas Haile',
    type: 'Savings',
    balance: 89000,
    status: 'Unmapped',
  },
];

// HQ Dashboard Data
export const hqData = {
  totalBranches: 142,
  totalStaff: 1842,
  avgPlanAchievement: 78,
  cbsValidationRate: 96,
};

// Activity Feed
export const activityFeed = [
  { id: 1, message: 'Branch Hawassa Main – CBS validation completed', time: '2 hours ago' },
  { id: 2, message: 'areaManager Addis North approved BM score for Genet A.', time: '4 hours ago' },
  { id: 3, message: '12 unmapped accounts detected in Dire Dawa', time: '6 hours ago' },
];

