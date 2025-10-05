export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  classId?: string; // Optional for backwards compatibility with mock data
  balance: number;
  currency: 'star-credits' | 'earth-points';
  lastUpdated: Date;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'prize-redemption' | 'adjustment';

export interface Transaction {
  id: string;
  accountId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason?: string;
  notes?: string;
  createdBy: string; // teacher user ID
  createdAt: Date;
}

export interface Prize {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: 'astronomy' | 'earth-science' | 'general';
  icon: string;
  available: boolean;
  imageUrl?: string;
  classId?: string; // Optional - null means shared across all teacher's classes
  teacherId?: string; // Owner of the prize
}

export type PrizeRequestStatus = 'pending' | 'approved' | 'denied' | 'fulfilled';

export interface PrizeRequest {
  id: string;
  studentId: string;
  studentName: string;
  prizeId: string;
  prizeName: string;
  prizeCost: number;
  customAmount?: number; // if different from prize cost
  reason?: string;
  status: PrizeRequestStatus;
  classId?: string; // Optional for backwards compatibility
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // teacher user ID
  reviewNotes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

export interface DashboardStats {
  totalStudents: number;
  totalFunds: number;
  averageBalance: number;
  pendingRequests: number;
  approvedToday: number;
  totalTransactions: number;
}

export type ClassSubject = 'astronomy' | 'earth-science' | 'both';

export interface Class {
  id: string;
  teacherId: string;
  name: string;
  subject: ClassSubject;
  schoolYear?: string;
  colorTheme?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ClassMembershipRole = 'student' | 'co-teacher';

export interface ClassMembership {
  id: string;
  classId: string;
  studentId: string;
  role: ClassMembershipRole;
  joinedAt: Date;
}

// Goals
export interface Goal {
  id: string;
  title: string;
  description?: string;
  points: number;
  available: boolean;
  classIds?: string[];
  teacherId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type GoalSubmissionStatus = 'pending' | 'approved' | 'denied';

export interface GoalSubmission {
  id: string;
  studentId: string;
  studentName?: string;
  goalId: string;
  goalTitle?: string;
  classId?: string;
  teacherId?: string;
  description: string;
  points: number;
  status: GoalSubmissionStatus;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
