import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfileById } from '@/lib/services/profiles';
import { getClassesByTeacher } from '@/lib/services/classes';
import { getGoals } from '@/lib/services/goals';
import GoalManagement from './GoalManagement';

export default async function GoalManagementPage() {
  const supabase = await createClient();
  if (!supabase) return <div>Error: Server configuration issue</div>;

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect('/login');

  const user = await getProfileById(authUser.id);
  if (!user) redirect('/login');
  if (user.role !== 'teacher') redirect('/dashboard');

  const [classes, goals] = await Promise.all([
    getClassesByTeacher(user.id),
    getGoals(),
  ]);

  return (
    <GoalManagement user={user} classes={classes} goals={goals} />
  );
}
