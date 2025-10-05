import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfileById } from '@/lib/services/profiles';
import { getClassesByTeacher } from '@/lib/services/classes';
import { getPrizes } from '@/lib/services/prizes';
import PrizeManagement from './PrizeManagement';

export default async function PrizeManagementPage() {
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

  // Fetch classes and prizes for this teacher
  const [classes, prizes] = await Promise.all([
    getClassesByTeacher(user.id),
    getPrizes({ teacherId: user.id }),
  ]);

  return (
    <PrizeManagement
      user={user}
      classes={classes}
      prizes={prizes}
    />
  );
}

