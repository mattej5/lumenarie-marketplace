import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    // Check submission exists
    const { data: existing } = await supabase
      .from('goal_submissions')
      .select('id, student_id, class_id, status, created_at')
      .eq('id', id)
      .single();
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    const updates: any = {};

    if (profile?.role === 'teacher') {
      // Teachers can review submissions
      const { data: clazz } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('id', existing.class_id)
        .single();
      if (!clazz || clazz.teacher_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      updates.reviewed_by = user.id;
      updates.reviewed_at = new Date().toISOString();
      if (body.status) {
        if (!['pending','approved','denied'].includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        updates.status = body.status;

        // If approving, add points to student's balance
        if (body.status === 'approved' && existing.status === 'pending') {
          // Get the full submission details to get points
          const { data: submission } = await supabase
            .from('goal_submissions')
            .select('points, student_id, class_id, goal:goals(title)')
            .eq('id', id)
            .single();

          if (submission) {
            // Get student's account
            const { data: account } = await supabase
              .from('accounts')
              .select('id')
              .eq('user_id', submission.student_id)
              .eq('class_id', submission.class_id)
              .single();

            if (account) {
              // Add points to balance
              const { error: txError } = await supabase.rpc('create_transaction', {
                p_account_id: account.id,
                p_type: 'deposit',
                p_amount: submission.points,
                p_reason: `Goal completed: ${(submission.goal as any)?.title || 'Unknown'}`,
                p_notes: `Goal submission approved`,
              });

              if (txError) {
                console.error('Error creating transaction:', txError);
                return NextResponse.json({ error: 'Failed to add points to balance' }, { status: 500 });
              }
            }
          }
        }
      }
      if (body.points !== undefined) {
        const n = Number(body.points); if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: 'Invalid points' }, { status: 400 });
        updates.points = n;
      }
    } else if (profile?.role === 'student') {
      // Students can edit their own pending submissions from today
      if (existing.student_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (existing.status !== 'pending') return NextResponse.json({ error: 'Cannot edit reviewed submissions' }, { status: 403 });

      const today = new Date().toDateString();
      const submissionDate = new Date(existing.created_at).toDateString();
      if (submissionDate !== today) return NextResponse.json({ error: 'Can only edit today\'s submissions' }, { status: 403 });

      if (body.description !== undefined) {
        updates.description = String(body.description);
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('goal_submissions')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    if (error || !data) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

    return NextResponse.json({ submission: data }, { status: 200 });
  } catch (e: any) {
    console.error('Goal submission PATCH error:', e);
    return NextResponse.json({ error: e.message || 'Failed to update submission' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    // Check submission exists
    const { data: existing } = await supabase
      .from('goal_submissions')
      .select('id, student_id, class_id, status, created_at')
      .eq('id', id)
      .single();
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (profile?.role === 'teacher') {
      // Teachers can delete submissions in their classes
      const { data: clazz } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('id', existing.class_id)
        .single();
      if (!clazz || clazz.teacher_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    } else if (profile?.role === 'student') {
      // Students can delete their own pending submissions from today
      if (existing.student_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (existing.status !== 'pending') return NextResponse.json({ error: 'Cannot delete reviewed submissions' }, { status: 403 });

      const today = new Date().toDateString();
      const submissionDate = new Date(existing.created_at).toDateString();
      if (submissionDate !== today) return NextResponse.json({ error: 'Can only delete today\'s submissions' }, { status: 403 });
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('goal_submissions')
      .delete()
      .eq('id', id);
    if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    console.error('Goal submission DELETE error:', e);
    return NextResponse.json({ error: e.message || 'Failed to delete submission' }, { status: 500 });
  }
}
