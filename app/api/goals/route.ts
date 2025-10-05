import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGoals, createGoal } from '@/lib/services/goals';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const available = searchParams.get('available');
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');

    const filters: any = {};
    if (available !== null) filters.available = available === 'true';
    if (classId) filters.classId = classId;
    if (teacherId) filters.teacherId = teacherId;

    const goals = await getGoals(filters);
    return NextResponse.json({ goals }, { status: 200 });
  } catch (e: any) {
    console.error('Goals GET error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can create goals' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, points, available, classIds } = body;
    if (!title || !points || points <= 0) {
      return NextResponse.json({ error: 'Title and positive points required' }, { status: 400 });
    }

    const goal = await createGoal(user.id, { title, description, points, available, classIds });
    if (!goal) return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (e: any) {
    console.error('Goals POST error:', e);
    return NextResponse.json({ error: e.message || 'Failed to create goal' }, { status: 500 });
  }
}
