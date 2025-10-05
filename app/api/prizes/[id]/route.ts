import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user is a teacher and owns the prize
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can update prizes' }, { status: 403 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('prizes')
      .select('id, teacher_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 });
    }

    if (existing.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, cost, category, icon, available, classId } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = String(name);
    if (description !== undefined) updates.description = String(description);
    if (cost !== undefined) {
      const num = Number(cost);
      if (!Number.isFinite(num) || num <= 0) {
        return NextResponse.json({ error: 'Cost must be a positive number' }, { status: 400 });
      }
      updates.cost = num;
    }
    if (category !== undefined) {
      const validCategories = ['general', 'astronomy', 'earth-science'];
      if (!validCategories.includes(category)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
      updates.category = category;
    }
    if (icon !== undefined) updates.icon = icon || null;
    if (available !== undefined) updates.available = !!available;
    if (classId !== undefined) updates.class_id = classId || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('prizes')
      .update(updates)
      .eq('id', params.id)
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to update prize' }, { status: 500 });
    }

    return NextResponse.json({
      prize: {
        id: data.id,
        name: data.name,
        description: data.description,
        cost: data.cost,
        category: data.category,
        icon: data.icon,
        available: data.available,
        classId: data.class_id,
        teacherId: data.teacher_id,
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Prize update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update prize' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can delete prizes' }, { status: 403 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('prizes')
      .select('id, teacher_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 });
    }

    if (existing.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('prizes')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete prize' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Prize delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete prize' }, { status: 500 });
  }
}

