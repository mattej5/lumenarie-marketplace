import { createClient } from '@/lib/supabase/server';
import { DashboardStats } from '@/lib/types';

/**
 * Statistics Service
 * Handles all statistics-related database operations
 */

export async function getDashboardStats(
  teacherId: string,
  classId?: string
): Promise<DashboardStats> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  // Get total students count (unique students)
  let totalStudents = 0;

  if (classId) {
    // Count students in specific class
    const { count } = await supabase
      .from('class_memberships')
      .select('student_id', { count: 'exact', head: true })
      .eq('class_id', classId);

    totalStudents = count || 0;
  } else {
    // Count unique students across all teacher's classes
    const { data: classesData } = await supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', teacherId);

    const classIds = classesData?.map(c => c.id) || [];

    if (classIds.length === 0) {
      // No classes, return zeros
      return {
        totalStudents: 0,
        totalFunds: 0,
        averageBalance: 0,
        pendingRequests: 0,
        approvedToday: 0,
        totalTransactions: 0,
      };
    }

    const { data: memberships } = await supabase
      .from('class_memberships')
      .select('student_id')
      .in('class_id', classIds);

    // Count unique students
    const uniqueStudentIds = new Set(memberships?.map(m => m.student_id) || []);
    totalStudents = uniqueStudentIds.size;
  }

  // Get total funds and average balance
  let accountsQuery = supabase
    .from('accounts')
    .select('balance')
    .eq('class.teacher_id', teacherId);

  if (classId) {
    accountsQuery = accountsQuery.eq('class_id', classId);
  }

  const { data: accounts } = await accountsQuery;

  const totalFunds = accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0;
  const averageBalance = accounts && accounts.length > 0
    ? Math.floor(totalFunds / accounts.length)
    : 0;

  // Get pending requests count
  let pendingQuery = supabase
    .from('prize_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (classId) {
    pendingQuery = pendingQuery.eq('class_id', classId);
  }

  const { count: pendingRequests } = await pendingQuery;

  // Get approved today count
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let approvedTodayQuery = supabase
    .from('prize_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved')
    .gte('reviewed_at', today.toISOString());

  if (classId) {
    approvedTodayQuery = approvedTodayQuery.eq('class_id', classId);
  }

  const { count: approvedToday } = await approvedTodayQuery;

  // Get total transactions count
  let transactionsQuery = supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true });

  if (classId) {
    transactionsQuery = transactionsQuery.eq('account.class_id', classId);
  }

  const { count: totalTransactions } = await transactionsQuery;

  return {
    totalStudents: totalStudents || 0,
    totalFunds,
    averageBalance,
    pendingRequests: pendingRequests || 0,
    approvedToday: approvedToday || 0,
    totalTransactions: totalTransactions || 0,
  };
}

export async function getStudentStats(studentId: string, classId?: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  // Get student account
  let accountQuery = supabase
    .from('accounts')
    .select('balance, currency')
    .eq('user_id', studentId);

  if (classId) {
    accountQuery = accountQuery.eq('class_id', classId);
  }

  const { data: account } = await accountQuery.single();

  // Get total earned (all deposits)
  let depositsQuery = supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', studentId)
    .eq('type', 'deposit');

  if (classId) {
    depositsQuery = depositsQuery.eq('account.class_id', classId);
  }

  const { data: deposits } = await depositsQuery;
  const totalEarned = deposits?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

  // Get total spent (prize redemptions)
  let spentQuery = supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', studentId)
    .eq('type', 'prize-redemption');

  if (classId) {
    spentQuery = spentQuery.eq('account.class_id', classId);
  }

  const { data: spent } = await spentQuery;
  const totalSpent = spent?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

  // Get pending requests count
  let pendingQuery = supabase
    .from('prize_requests')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('status', 'pending');

  if (classId) {
    pendingQuery = pendingQuery.eq('class_id', classId);
  }

  const { count: pendingRequests } = await pendingQuery;

  return {
    currentBalance: account?.balance || 0,
    currency: account?.currency || 'star-credits',
    totalEarned,
    totalSpent,
    pendingRequests: pendingRequests || 0,
  };
}

export async function getClassStats(classId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  // Get student count
  const { count: studentCount } = await supabase
    .from('class_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', classId);

  // Get total class funds
  const { data: accounts } = await supabase
    .from('accounts')
    .select('balance')
    .eq('class_id', classId);

  const totalFunds = accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0;
  const averageBalance = accounts && accounts.length > 0
    ? Math.floor(totalFunds / accounts.length)
    : 0;

  // Get transaction count
  const { count: transactionCount } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('account.class_id', classId);

  // Get pending prize requests
  const { count: pendingRequests } = await supabase
    .from('prize_requests')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', classId)
    .eq('status', 'pending');

  return {
    studentCount: studentCount || 0,
    totalFunds,
    averageBalance,
    transactionCount: transactionCount || 0,
    pendingRequests: pendingRequests || 0,
  };
}

export async function getTeacherOverview(teacherId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  // Get class count
  const { count: classCount } = await supabase
    .from('classes')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', teacherId);

  // Get total students across all classes
  const { count: totalStudents } = await supabase
    .from('class_memberships')
    .select('student_id', { count: 'exact', head: true })
    .eq('class.teacher_id', teacherId);

  // Get total pending requests
  const { count: pendingRequests } = await supabase
    .from('prize_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .eq('class.teacher_id', teacherId);

  // Get recent activity (last 24 hours)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const { count: recentTransactions } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', teacherId)
    .gte('created_at', yesterday.toISOString());

  return {
    classCount: classCount || 0,
    totalStudents: totalStudents || 0,
    pendingRequests: pendingRequests || 0,
    recentTransactions: recentTransactions || 0,
  };
}
