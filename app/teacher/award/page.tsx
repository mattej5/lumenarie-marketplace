import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfileById } from '@/lib/services/profiles';
import { getClassesByTeacher } from '@/lib/services/classes';
import { shouldUseMockAuth } from '@/lib/utils/env';
import { mockUsers, mockClasses } from '@/lib/mockData';
import AwardClassSelection from './AwardClassSelection';

export default async function AwardClassPage() {
  const useMock = shouldUseMockAuth();

  if (useMock) {
    const teacher = mockUsers.find(u => u.role === 'teacher');
    if (!teacher) {
      return <div>Mock teacher not found.</div>;
    }

    return <AwardClassSelection user={teacher} classes={mockClasses} />;
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

  const classes = await getClassesByTeacher(user.id);

  return <AwardClassSelection user={user} classes={classes} />;
}
