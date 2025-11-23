import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: string }>();
    if (!profile || profile.role !== 'teacher') return NextResponse.json({ error: 'Only teachers can update goals' }, { status: 403 });

    const { data: existing } = await supabase.from('goals').select('id, teacher_id').eq('id', id).single<{ id: string; teacher_id: string }>();
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.teacher_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const updates: any = {};
    if (body.title !== undefined) updates.title = String(body.title);
    if (body.description !== undefined) updates.description = body.description || null;
    if (body.points !== undefined) {
      const n = Number(body.points); if (!Number.isFinite(n) || n <= 0) return NextResponse.json({ error: 'Points must be positive' }, { status: 400 });
      updates.points = n;
    }
    if (body.available !== undefined) updates.available = !!body.available;
    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });

    const { data, error } = await supabase.from('goals').update(updates as never).eq('id', id).select('*').single<{ id: string; title: string; description: string | null; points: number; available: boolean; teacher_id: string | null; created_at: string; updated_at: string }>();
    if (error || !data) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

    // Update class mappings if provided
    if (Array.isArray(body.classIds)) {
      const classIds: string[] = body.classIds.filter((x: any) => typeof x === 'string');
      // Replace mappings
      await supabase.from('goal_classes').delete().eq('goal_id', id);
      if (classIds.length > 0) {
        const rows = classIds.map((cid) => ({ goal_id: id, class_id: cid }));
        await supabase.from('goal_classes').insert(rows as never[]);
      }
    }

    // Fetch class mappings for response
    const { data: maps } = await supabase
      .from('goal_classes')
      .select('class_id')
      .eq('goal_id', id);

    return NextResponse.json({ goal: {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      points: data.points,
      available: data.available,
      classIds: (maps || []).map((r: any) => r.class_id),
      teacherId: data.teacher_id || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } }, { status: 200 });
  } catch (e: any) {
    console.error('Goal PATCH error:', e);
    return NextResponse.json({ error: e.message || 'Failed to update goal' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: existing } = await supabase.from('goals').select('id, teacher_id').eq('id', id).single<{ id: string; teacher_id: string }>();
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.teacher_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    console.error('Goal DELETE error:', e);
    return NextResponse.json({ error: e.message || 'Failed to delete goal' }, { status: 500 });
  }
}


