import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfileById } from '@/lib/services/profiles';
import { getClassesByTeacher, getStudentsWithClassesByTeacher } from '@/lib/services/classes';
import StudentManagement from './StudentManagement';

export default async function StudentManagementPage() {
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

  // Fetch data in parallel
  const [classes, studentsWithClasses] = await Promise.all([
    getClassesByTeacher(user.id),
    getStudentsWithClassesByTeacher(user.id),
  ]);

  return (
    <StudentManagement
      user={user}
      classes={classes}
      students={studentsWithClasses}
    />
  );
}
