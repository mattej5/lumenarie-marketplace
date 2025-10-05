import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDashboardStats, getStudentStats } from '@/lib/services/stats';

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
    const type = searchParams.get('type') || 'dashboard';
    const classId = searchParams.get('classId');

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (type === 'dashboard' && profile.role === 'teacher') {
      const stats = await getDashboardStats(
        user.id,
        classId || undefined
      );
      return NextResponse.json({ stats }, { status: 200 });
    }

    if (type === 'student') {
      const stats = await getStudentStats(
        user.id,
        classId || undefined
      );
      return NextResponse.json({ stats }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid stats type' }, { status: 400 });

  } catch (error: any) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch stats'
    }, { status: 500 });
  }
}
