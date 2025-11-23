import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfileById, getStudentsByTeacher } from '@/lib/services/profiles';
import { getAllAccounts } from '@/lib/services/accounts';
import { getPrizeRequests } from '@/lib/services/prize-requests';
import { getDashboardStats } from '@/lib/services/stats';
import { getClassesByTeacher, Class } from '@/lib/services/classes';
import { getGoalSubmissions } from '@/lib/services/goal-submissions';
import { shouldUseMockAuth } from '@/lib/utils/env';
import { mockUsers, mockAccounts, mockPrizeRequests, mockDashboardStats, mockClasses } from '@/lib/mockData';
import { GoalSubmission, PrizeRequest } from '@/lib/types';
import TeacherDashboard from './TeacherDashboard';

export default async function TeacherPage() {
  const useMock = shouldUseMockAuth();

  // In mock mode, skip Supabase entirely and use mock data to avoid redirect loops in dev.
  if (useMock) {
    const teacher = mockUsers.find(u => u.role === 'teacher');
    if (!teacher) {
      return <div>Mock teacher not found.</div>;
    }

    const students = mockUsers.filter(u => u.role === 'student');
    const accounts = mockAccounts;
    const prizeRequests: PrizeRequest[] = mockPrizeRequests ?? [];
    const goalSubmissions: GoalSubmission[] = [];
    const classes: Class[] = mockClasses;
    const stats = mockDashboardStats;

    return (
      <TeacherDashboard
        user={teacher}
        students={students}
        accounts={accounts}
        prizeRequests={prizeRequests}
        goalSubmissions={goalSubmissions}
        stats={stats}
        classes={classes}
      />
    );
  }

  const supabase = await createClient();

  if (!supabase) {
    return <div>Error: Server configuration issue</div>;
  }

  // Check authentication
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  // Get user profile
  const user = await getProfileById(authUser.id);

  if (!user) {
    redirect('/login');
  }

  // Check if user is a teacher
  if (user.role !== 'teacher') {
    redirect('/dashboard');
  }

  // Fetch all data in parallel for better performance
  const [students, accounts, prizeRequests, goalSubmissions, stats, classes] = await Promise.all([
    getStudentsByTeacher(user.id),
    getAllAccounts(),
    getPrizeRequests({ status: undefined }), // Get all requests for this teacher's students
    getGoalSubmissions({ status: 'pending' }), // Get pending goal submissions
    getDashboardStats(user.id),
    getClassesByTeacher(user.id),
  ]);

  return (
    <TeacherDashboard
      user={user}
      students={students}
      accounts={accounts}
      prizeRequests={prizeRequests}
      goalSubmissions={goalSubmissions}
      stats={stats}
      classes={classes}
    />
  );
}



