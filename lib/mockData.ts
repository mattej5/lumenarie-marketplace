import { User, Account, Transaction, Prize, PrizeRequest, DashboardStats } from './types';
import type { Class, ClassMembership } from './types';

// Mock Users (Students and Teacher)
export const mockUsers: User[] = [
  // Teacher
  {
    id: 'teacher-1',
    email: 'teacher@lumenarie.edu',
    name: 'Dr. Nova Sterling',
    role: 'teacher',
    avatar: '🌟',
    createdAt: new Date('2024-08-01'),
  },
  // Students with astronomy-themed names
  {
    id: 'student-1',
    email: 'luna.eclipse@student.edu',
    name: 'Luna Eclipse',
    role: 'student',
    avatar: '🌙',
    createdAt: new Date('2024-09-01'),
  },
  {
    id: 'student-2',
    email: 'orion.star@student.edu',
    name: 'Orion Starfield',
    role: 'student',
    avatar: '⭐',
    createdAt: new Date('2024-09-01'),
  },
  {
    id: 'student-3',
    email: 'nova.bright@student.edu',
    name: 'Nova Brightwell',
    role: 'student',
    avatar: '✨',
    createdAt: new Date('2024-09-01'),
  },
  {
    id: 'student-4',
    email: 'sol.sunshine@student.edu',
    name: 'Sol Sunshine',
    role: 'student',
    avatar: '☀️',
    createdAt: new Date('2024-09-01'),
  },
  {
    id: 'student-5',
    email: 'terra.earth@student.edu',
    name: 'Terra Earthwell',
    role: 'student',
    avatar: '🌍',
    createdAt: new Date('2024-09-01'),
  },
  {
    id: 'student-6',
    email: 'cosmo.galaxy@student.edu',
    name: 'Cosmo Galaxy',
    role: 'student',
    avatar: '🌌',
    createdAt: new Date('2024-09-01'),
  },
  {
    id: 'student-7',
    email: 'stella.comet@student.edu',
    name: 'Stella Comet',
    role: 'student',
    avatar: '☄️',
    createdAt: new Date('2024-09-01'),
  },
  {
    id: 'student-8',
    email: 'meteor.swift@student.edu',
    name: 'Meteor Swift',
    role: 'student',
    avatar: '💫',
    createdAt: new Date('2024-09-01'),
  },
  {
    id: 'student-9',
    email: 'aurora.lights@student.edu',
    name: 'Aurora Lights',
    role: 'student',
    avatar: '🌈',
    createdAt: new Date('2024-09-01'),
  },
  {
    id: 'student-10',
    email: 'atlas.mountain@student.edu',
    name: 'Atlas Mountainpeak',
    role: 'student',
    avatar: '🏔️',
    createdAt: new Date('2024-09-01'),
  },
  {
    id: 'student-11',
    email: 'celeste.sky@student.edu',
    name: 'Celeste Skywalker',
    role: 'student',
    avatar: '🌠',
    createdAt: new Date('2024-09-01'),
  },
  {
    id: 'student-12',
    email: 'astro.nebula@student.edu',
    name: 'Astro Nebula',
    role: 'student',
    avatar: '🌫️',
    createdAt: new Date('2024-09-01'),
  },
  {
    id: 'student-13',
    email: 'river.flow@student.edu',
    name: 'River Flowstone',
    role: 'student',
    avatar: '🌊',
    createdAt: new Date('2024-09-01'),
  },
  {
    id: 'student-14',
    email: 'phoenix.rise@student.edu',
    name: 'Phoenix Risewell',
    role: 'student',
    avatar: '🔥',
    createdAt: new Date('2024-09-01'),
  },
  {
    id: 'student-15',
    email: 'sirius.bright@student.edu',
    name: 'Sirius Brightstar',
    role: 'student',
    avatar: '🌟',
    createdAt: new Date('2024-09-01'),
  },
];

export const mockClasses: Class[] = [
  {
    id: 'class-1',
    teacherId: 'teacher-1',
    name: 'Cosmic Explorers',
    subject: 'astronomy',
    schoolYear: '2024-2025',
    colorTheme: '#7c3aed',
    active: true,
    createdAt: new Date('2024-08-15'),
    updatedAt: new Date('2024-08-15'),
  },
  {
    id: 'class-2',
    teacherId: 'teacher-1',
    name: 'Earth Guardians',
    subject: 'earth-science',
    schoolYear: '2024-2025',
    colorTheme: '#16a34a',
    active: true,
    createdAt: new Date('2024-08-16'),
    updatedAt: new Date('2024-08-16'),
  },
  {
    id: 'class-3',
    teacherId: 'teacher-1',
    name: 'Horizon Scholars',
    subject: 'both',
    schoolYear: '2024-2025',
    colorTheme: '#0ea5e9',
    active: true,
    createdAt: new Date('2024-08-17'),
    updatedAt: new Date('2024-08-17'),
  },
];

const studentPrimaryClass: Record<string, string> = {
  'student-1': 'class-1',
  'student-2': 'class-1',
  'student-3': 'class-1',
  'student-4': 'class-1',
  'student-5': 'class-2',
  'student-6': 'class-2',
  'student-7': 'class-1',
  'student-8': 'class-2',
  'student-9': 'class-2',
  'student-10': 'class-2',
  'student-11': 'class-3',
  'student-12': 'class-3',
  'student-13': 'class-2',
  'student-14': 'class-3',
  'student-15': 'class-3',
};

export const mockClassMemberships: ClassMembership[] = [
  { id: 'membership-1-1', classId: 'class-1', studentId: 'student-1', role: 'student', joinedAt: new Date('2024-09-02') },
  { id: 'membership-1-2', classId: 'class-1', studentId: 'student-2', role: 'student', joinedAt: new Date('2024-09-02') },
  { id: 'membership-1-3', classId: 'class-1', studentId: 'student-3', role: 'student', joinedAt: new Date('2024-09-02') },
  { id: 'membership-1-4', classId: 'class-1', studentId: 'student-4', role: 'student', joinedAt: new Date('2024-09-02') },
  { id: 'membership-1-7', classId: 'class-1', studentId: 'student-7', role: 'student', joinedAt: new Date('2024-09-03') },
  { id: 'membership-2-5', classId: 'class-2', studentId: 'student-5', role: 'student', joinedAt: new Date('2024-09-02') },
  { id: 'membership-2-6', classId: 'class-2', studentId: 'student-6', role: 'student', joinedAt: new Date('2024-09-02') },
  { id: 'membership-2-8', classId: 'class-2', studentId: 'student-8', role: 'student', joinedAt: new Date('2024-09-02') },
  { id: 'membership-2-9', classId: 'class-2', studentId: 'student-9', role: 'student', joinedAt: new Date('2024-09-04') },
  { id: 'membership-2-10', classId: 'class-2', studentId: 'student-10', role: 'student', joinedAt: new Date('2024-09-04') },
  { id: 'membership-2-13', classId: 'class-2', studentId: 'student-13', role: 'student', joinedAt: new Date('2024-09-05') },
  { id: 'membership-3-11', classId: 'class-3', studentId: 'student-11', role: 'student', joinedAt: new Date('2024-09-02') },
  { id: 'membership-3-12', classId: 'class-3', studentId: 'student-12', role: 'student', joinedAt: new Date('2024-09-02') },
  { id: 'membership-3-14', classId: 'class-3', studentId: 'student-14', role: 'student', joinedAt: new Date('2024-09-03') },
  { id: 'membership-3-15', classId: 'class-3', studentId: 'student-15', role: 'student', joinedAt: new Date('2024-09-03') },
  // A few multi-class examples
  { id: 'membership-1-11', classId: 'class-1', studentId: 'student-11', role: 'student', joinedAt: new Date('2024-09-06') },
  { id: 'membership-3-1', classId: 'class-3', studentId: 'student-1', role: 'student', joinedAt: new Date('2024-09-06') },
];

// Mock Accounts
export const mockAccounts: Account[] = mockUsers
  .filter(u => u.role === 'student')
  .map((user, index) => {
    const classId = studentPrimaryClass[user.id];
    return {
      id: `account-${user.id}`,
      userId: user.id,
      classId,
      balance: Math.floor(Math.random() * 1000) + 100, // Random balance between 100-1100
      currency: index % 2 === 0 ? 'star-credits' : 'earth-points',
      lastUpdated: new Date(),
    };
  });

// Mock Prizes
export const mockPrizes: Prize[] = [
  {
    id: 'prize-1',
    name: 'Homework Pass',
    description: 'Skip one homework assignment',
    cost: 150,
    category: 'general',
    icon: '📝',
    available: true,
  },
  {
    id: 'prize-2',
    name: 'Front Row Seat',
    description: 'Sit in the front row for a week',
    cost: 100,
    category: 'general',
    icon: '🪑',
    available: true,
  },
  {
    id: 'prize-3',
    name: 'Galaxy Pencil Set',
    description: 'Cosmic-themed pencil collection',
    cost: 250,
    category: 'astronomy',
    icon: '✏️',
    available: true,
  },
  {
    id: 'prize-4',
    name: 'Planet Poster',
    description: 'Beautiful solar system poster',
    cost: 200,
    category: 'astronomy',
    icon: '🪐',
    available: true,
  },
  {
    id: 'prize-5',
    name: 'Rock Collection Kit',
    description: 'Earth science mineral samples',
    cost: 300,
    category: 'earth-science',
    icon: '💎',
    available: true,
  },
  {
    id: 'prize-6',
    name: 'Extra Credit Points',
    description: 'Add 5 points to any test',
    cost: 400,
    category: 'general',
    icon: '➕',
    available: true,
  },
  {
    id: 'prize-7',
    name: 'Telescope Time',
    description: 'Use the classroom telescope during lunch',
    cost: 350,
    category: 'astronomy',
    icon: '🔭',
    available: true,
  },
  {
    id: 'prize-8',
    name: 'Lunch with Teacher',
    description: 'Have lunch with Dr. Sterling',
    cost: 500,
    category: 'general',
    icon: '🍕',
    available: true,
  },
  {
    id: 'prize-9',
    name: 'Volcano Experiment',
    description: 'Lead a volcano demonstration',
    cost: 450,
    category: 'earth-science',
    icon: '🌋',
    available: true,
  },
  {
    id: 'prize-10',
    name: 'Music During Work',
    description: 'Listen to music during independent work',
    cost: 175,
    category: 'general',
    icon: '🎧',
    available: true,
  },
];

// Generate realistic transactions
const generateTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const now = Date.now();

  mockAccounts.forEach((account, accountIndex) => {
    let currentBalance = 50; // Starting balance
    const transactionCount = Math.floor(Math.random() * 15) + 5;

    for (let i = 0; i < transactionCount; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const type: Transaction['type'] =
        Math.random() > 0.75 ? 'withdrawal' :
        Math.random() > 0.6 ? 'deposit' :
        Math.random() > 0.5 ? 'prize-redemption' : 'adjustment';

      const amount = type === 'deposit'
        ? Math.floor(Math.random() * 150) + 25
        : Math.floor(Math.random() * 100) + 10;

      const balanceBefore = currentBalance;
      const balanceAfter = type === 'withdrawal' || type === 'prize-redemption'
        ? currentBalance - amount
        : currentBalance + amount;

      currentBalance = balanceAfter;

      const reasons = {
        deposit: [
          'Excellent participation in class',
          'Outstanding homework completion',
          'Helped a classmate',
          'Perfect attendance this week',
          'Great test score',
          'Positive attitude',
        ],
        withdrawal: [
          'Late homework',
          'Missing assignment',
        ],
        'prize-redemption': [
          'Requested prize redemption',
          'Prize: Stickers',
          'Prize: Homework Pass',
        ],
        adjustment: [
          'Balance correction',
          'Bonus for group project',
        ],
      };

      transactions.push({
        id: `transaction-${accountIndex}-${i}`,
        accountId: account.id,
        userId: account.userId,
        type,
        amount,
        balanceBefore,
        balanceAfter,
        reason: reasons[type][Math.floor(Math.random() * reasons[type].length)],
        createdBy: 'teacher-1',
        createdAt: new Date(now - daysAgo * 24 * 60 * 60 * 1000),
      });
    }
  });

  return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const mockTransactions = generateTransactions();

// Mock Prize Requests
export const mockPrizeRequests: PrizeRequest[] = [
  {
    id: 'request-1',
    studentId: 'student-1',
    studentName: 'Luna Eclipse',
    prizeId: 'prize-3',
    prizeName: 'Galaxy Pencil Set',
    prizeCost: 250,
    classId: studentPrimaryClass['student-1'],
    reason: 'I really love astronomy and would use these every day!',
    status: 'pending',
    requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 'request-2',
    studentId: 'student-5',
    studentName: 'Terra Earthwell',
    prizeId: 'prize-5',
    prizeName: 'Rock Collection Kit',
    prizeCost: 300,
    classId: studentPrimaryClass['student-5'],
    reason: 'Want to study minerals at home',
    status: 'pending',
    requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    id: 'request-3',
    studentId: 'student-2',
    studentName: 'Orion Starfield',
    prizeId: 'prize-1',
    prizeName: 'Homework Pass',
    prizeCost: 150,
    classId: studentPrimaryClass['student-2'],
    status: 'approved',
    requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    reviewedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    reviewedBy: 'teacher-1',
    reviewNotes: 'Well earned!',
  },
  {
    id: 'request-4',
    studentId: 'student-7',
    studentName: 'Stella Comet',
    prizeId: 'prize-7',
    prizeName: 'Telescope Time',
    prizeCost: 350,
    classId: studentPrimaryClass['student-7'],
    reason: 'I want to observe Jupiter and its moons!',
    status: 'pending',
    requestedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
  {
    id: 'request-5',
    studentId: 'student-11',
    studentName: 'Celeste Skywalker',
    prizeId: 'prize-6',
    prizeName: 'Extra Credit Points',
    prizeCost: 400,
    classId: studentPrimaryClass['student-11'],
    status: 'denied',
    requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    reviewedAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000),
    reviewedBy: 'teacher-1',
    reviewNotes: 'Your current grade is already excellent. Let\'s save credits for smaller rewards.',
  },
];

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  totalStudents: mockUsers.filter(u => u.role === 'student').length,
  totalFunds: mockAccounts.reduce((sum, acc) => sum + acc.balance, 0),
  averageBalance: Math.floor(mockAccounts.reduce((sum, acc) => sum + acc.balance, 0) / mockAccounts.length),
  pendingRequests: mockPrizeRequests.filter(r => r.status === 'pending').length,
  approvedToday: mockPrizeRequests.filter(r =>
    r.status === 'approved' &&
    r.reviewedAt &&
    r.reviewedAt.getTime() > Date.now() - 24 * 60 * 60 * 1000
  ).length,
  totalTransactions: mockTransactions.length,
};

// Helper functions
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(u => u.id === id);
};

export const getAccountByUserId = (userId: string): Account | undefined => {
  return mockAccounts.find(a => a.userId === userId);
};

export const getTransactionsByUserId = (userId: string): Transaction[] => {
  const account = getAccountByUserId(userId);
  if (!account) return [];
  return mockTransactions.filter(t => t.accountId === account.id);
};

export const getPrizeRequestsByStudentId = (studentId: string): PrizeRequest[] => {
  return mockPrizeRequests.filter(r => r.studentId === studentId);
};

export const getPrizeById = (id: string): Prize | undefined => {
  return mockPrizes.find(p => p.id === id);
};





