import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfileById } from '@/lib/services/profiles';
import ReviewQueue from './ReviewQueue';

export default async function GoalReviewPage() {
  const supabase = await createClient();
  if (!supabase) return <div>Error: Server configuration issue</div>;

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect('/login');
  const user = await getProfileById(authUser.id);
  if (!user) redirect('/login');
  if (user.role !== 'teacher') redirect('/dashboard');

  return <ReviewQueue />;
}

