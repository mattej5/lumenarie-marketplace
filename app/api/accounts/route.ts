import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAccountByUserId, getAccountsByClass, getAllAccounts } from '@/lib/services/accounts';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const classId = searchParams.get('classId');
    const all = searchParams.get('all');

    // Check if user is a teacher for certain queries
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string | null }>();

    if (all === 'true') {
      // Only teachers can get all accounts
      if (!profile || profile.role !== 'teacher') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const accounts = await getAllAccounts();
      return NextResponse.json({ accounts }, { status: 200 });
    }

    if (classId) {
      // Only teachers can get class accounts
      if (!profile || profile.role !== 'teacher') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const accounts = await getAccountsByClass(classId);
      return NextResponse.json({ accounts }, { status: 200 });
    }

    if (userId) {
      // Users can get their own account, teachers can get any account
      if (userId !== user.id && profile?.role !== 'teacher') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const account = await getAccountByUserId(userId, classId || undefined);
      return NextResponse.json({ account }, { status: 200 });
    }

    // Default: return current user's account
    const account = await getAccountByUserId(user.id);
    return NextResponse.json({ account }, { status: 200 });

  } catch (error: any) {
    console.error('Accounts fetch error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch accounts'
    }, { status: 500 });
  }
}

