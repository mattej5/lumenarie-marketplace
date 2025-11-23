import { createClient } from '@/lib/supabase/server';
import { GoalSubmission } from '@/lib/types';

export async function getGoalSubmissions(filters?: {
  studentId?: string;
  classId?: string;
  status?: 'pending' | 'approved' | 'denied';
}): Promise<GoalSubmission[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  let query = supabase
    .from('goal_submissions')
    .select(`
      *,
      student:profiles!goal_submissions_student_id_fkey(name),
      goal:goals!goal_submissions_goal_id_fkey(title)
    `)
    .order('created_at', { ascending: false });

  if (filters?.studentId) query = query.eq('student_id', filters.studentId);
  if (filters?.classId) query = query.eq('class_id', filters.classId);
  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching goal submissions:', error);
    return [];
  }

  return (data || []).map((s: any) => ({
    id: s.id,
    studentId: s.student_id,
    studentName: s.student?.name || undefined,
    goalId: s.goal_id,
    goalTitle: s.goal?.title || undefined,
    classId: s.class_id || undefined,
    teacherId: s.teacher_id || undefined,
    description: s.description,
    points: s.points,
    status: s.status,
    reviewedBy: s.reviewed_by,
    reviewedAt: s.reviewed_at ? new Date(s.reviewed_at) : undefined,
    createdAt: new Date(s.created_at),
    updatedAt: new Date(s.updated_at),
  }));
}

export async function createGoalSubmissions(
  studentId: string,
  items: Array<{ goalId: string; description: string; classId?: string; points?: number }>
): Promise<GoalSubmission[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const payload = items.map((i) => ({
    student_id: studentId,
    goal_id: i.goalId,
    class_id: i.classId || null,
    description: i.description,
    points: i.points ?? 0,
  }));

  const supabaseClient = supabase as any;

  const { data, error } = await supabaseClient
    .from('goal_submissions')
    .insert(payload)
    .select('*');

  if (error) {
    console.error('Error creating goal submissions:', error);
    return [];
  }

  return (data || []).map((s: any) => ({
    id: s.id,
    studentId: s.student_id,
    goalId: s.goal_id,
    classId: s.class_id || undefined,
    teacherId: s.teacher_id || undefined,
    description: s.description,
    points: s.points,
    status: s.status,
    reviewedBy: s.reviewed_by,
    reviewedAt: s.reviewed_at ? new Date(s.reviewed_at) : undefined,
    createdAt: new Date(s.created_at),
    updatedAt: new Date(s.updated_at),
  }));
}



