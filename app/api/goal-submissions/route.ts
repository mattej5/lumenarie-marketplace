import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGoalSubmissions, createGoalSubmissions } from '@/lib/services/goal-submissions';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId') || undefined;
    const status = searchParams.get('status') || undefined;

    // Students get only own by default; teachers can pass classId (RLS still applies)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const filters: any = {};
    if (profile?.role === 'student') filters.studentId = user.id;
    if (classId) filters.classId = classId;
    if (status) filters.status = status;

    const submissions = await getGoalSubmissions(filters);
    return NextResponse.json({ submissions }, { status: 200 });
  } catch (e: any) {
    console.error('Goal submissions GET error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch submissions' }, { status: 500 });
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

    if (!profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can submit goals' }, { status: 403 });
    }

    const body = await request.json();
    const items = Array.isArray(body?.submissions) ? body.submissions : [body];
    if (!items.length) return NextResponse.json({ error: 'No submissions provided' }, { status: 400 });

    // Validate each item
    for (const it of items) {
      if (!it?.goalId || !it?.description || String(it.description).trim().length === 0) {
        return NextResponse.json({ error: 'Each submission requires goalId and description' }, { status: 400 });
      }
    }

    const created = await createGoalSubmissions(user.id, items.map((i: any) => ({
      goalId: i.goalId,
      description: String(i.description),
      classId: i.classId,
      points: i.points,
    })));

    return NextResponse.json({ submissions: created }, { status: 201 });
  } catch (e: any) {
    console.error('Goal submissions POST error:', e);
    return NextResponse.json({ error: e.message || 'Failed to create submissions' }, { status: 500 });
  }
}

