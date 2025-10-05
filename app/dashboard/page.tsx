import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfileById } from '@/lib/services/profiles';
import { getAccountByUserId } from '@/lib/services/accounts';
import { getTransactionsByUser } from '@/lib/services/transactions';
import { getPrizes } from '@/lib/services/prizes';
import { getPrizeRequests } from '@/lib/services/prize-requests';
import { getStudentClasses } from '@/lib/services/classes';
import StudentDashboard from './StudentDashboard';
import NotEnrolled from './NotEnrolled';

export default async function DashboardPage() {
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

  // Check if user is a student
  if (user.role === 'teacher') {
    redirect('/teacher');
  }

  // Get student's classes
  const classes = await getStudentClasses(user.id);

  // For now, use the first class (in the future, we can let students select which class)
  const classId = classes[0]?.id;

  if (!classId) {
    return <NotEnrolled />;
  }

  // Fetch all data in parallel
  const [account, transactions, prizes, prizeRequests] = await Promise.all([
    getAccountByUserId(user.id, classId),
    getTransactionsByUser(user.id, 10),
    getPrizes({ available: true, classId }),
    getPrizeRequests({ studentId: user.id, classId }),
  ]);

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400">Account not found</p>
          <p className="text-sm text-gray-500 mt-2">Please contact your teacher.</p>
        </div>
      </div>
    );
  }

  return (
    <StudentDashboard
      user={user}
      account={account}
      transactions={transactions}
      prizes={prizes}
      prizeRequests={prizeRequests}
      classId={classId}
    />
  );
}
