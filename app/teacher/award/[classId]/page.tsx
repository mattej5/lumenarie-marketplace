import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfileById } from '@/lib/services/profiles';
import { getClassById } from '@/lib/services/classes';
import { getAllAccounts } from '@/lib/services/accounts';
import { shouldUseMockAuth } from '@/lib/utils/env';
import { mockUsers, mockClasses, mockAccounts } from '@/lib/mockData';
import AwardStudentSelection from './AwardStudentSelection';

export default async function AwardClassStudentsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const useMock = shouldUseMockAuth();

  if (useMock) {
    const teacher = mockUsers.find(u => u.role === 'teacher');
    if (!teacher) {
      return <div>Mock teacher not found.</div>;
    }

    const classItem = mockClasses.find(c => c.id === classId);
    if (!classItem) {
      return <div>Class not found.</div>;
    }

    const students = mockUsers.filter(u => u.role === 'student');
    const accounts = mockAccounts.filter(a => a.classId === classId);

    return (
      <AwardStudentSelection
        user={teacher}
        classItem={classItem}
        students={students}
        accounts={accounts}
      />
    );
  }

  const supabase = await createClient();

  if (!supabase) {
    return <div>Error: Server configuration issue</div>;
  }

  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  const user = await getProfileById(authUser.id);

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'teacher') {
    redirect('/dashboard');
  }

  const classItem = await getClassById(classId);

  if (!classItem) {
    redirect('/teacher/award');
  }

  // Verify the class belongs to this teacher
  if (classItem.teacherId !== user.id) {
    redirect('/teacher/award');
  }

  // Get all accounts for this class
  const allAccounts = await getAllAccounts();
  const accounts = allAccounts.filter(a => a.classId === classId);

  // Get unique student IDs from accounts
  const studentIds = [...new Set(accounts.map(a => a.userId))];

  // Fetch student profiles
  const { data: studentsData } = await supabase
    .from('profiles')
    .select('id, email, name, role, avatar, created_at')
    .in('id', studentIds)
    .eq('role', 'student');

  type ProfileRow = {
    id: string;
    email: string;
    name: string | null;
    role: string;
    avatar: string | null;
    created_at: string;
  };

  const students = ((studentsData || []) as unknown as ProfileRow[]).map(s => ({
    id: s.id,
    email: s.email,
    name: s.name || '',
    role: 'student' as const,
    avatar: s.avatar || undefined,
    createdAt: new Date(s.created_at),
  }));

  return (
    <AwardStudentSelection
      user={user}
      classItem={classItem}
      students={students}
      accounts={accounts}
    />
  );
}
