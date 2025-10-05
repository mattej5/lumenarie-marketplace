import { createClient } from '@/lib/supabase/server';
import { Goal } from '@/lib/types';

export async function getGoals(filters?: {
  available?: boolean;
  classId?: string;
  teacherId?: string;
}): Promise<Goal[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  let query = supabase.from('goals').select('*').order('points', { ascending: false });

  if (filters?.available !== undefined) query = query.eq('available', filters.available);
  if (filters?.teacherId) query = query.eq('teacher_id', filters.teacherId);

  // If filtering by class, do a two-step query via goal_classes
  let goalIdsForClass: string[] | null = null;
  if (filters?.classId) {
    const { data: mapRows, error: mapErr } = await supabase
      .from('goal_classes')
      .select('goal_id')
      .eq('class_id', filters.classId);
    if (mapErr) {
      console.error('Error fetching goal_classes:', mapErr);
      return [];
    }
    goalIdsForClass = (mapRows || []).map((r: any) => r.goal_id);
    if (goalIdsForClass.length === 0) return [];
    query = query.in('id', goalIdsForClass);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }

  // Fetch class mappings for these goals
  const ids = (data || []).map((g: any) => g.id);
  const classIdsByGoal = new Map<string, string[]>();
  if (ids.length > 0) {
    const { data: mapRows2 } = await supabase
      .from('goal_classes')
      .select('goal_id, class_id')
      .in('goal_id', ids);
    (mapRows2 || []).forEach((r: any) => {
      const arr = classIdsByGoal.get(r.goal_id) || [];
      arr.push(r.class_id);
      classIdsByGoal.set(r.goal_id, arr);
    });
  }

  return (data || []).map((g: any) => ({
    id: g.id,
    title: g.title,
    description: g.description || undefined,
    points: g.points,
    available: g.available,
    classIds: classIdsByGoal.get(g.id) || [],
    teacherId: g.teacher_id || undefined,
    createdAt: g.created_at ? new Date(g.created_at) : undefined,
    updatedAt: g.updated_at ? new Date(g.updated_at) : undefined,
  }));
}

export async function createGoal(teacherId: string, goal: {
  title: string;
  description?: string;
  points: number;
  available?: boolean;
  classIds?: string[];
}): Promise<Goal | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('goals')
    .insert({
      teacher_id: teacherId,
      title: goal.title,
      description: goal.description || null,
      points: goal.points,
      available: goal.available ?? true,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating goal:', error);
    return null;
  }

  // Insert goal_class mappings
  const classIds = goal.classIds || [];
  if (classIds.length > 0) {
    const rows = classIds.map((cid) => ({ goal_id: data.id, class_id: cid }));
    const { error: mapErr } = await supabase.from('goal_classes').insert(rows);
    if (mapErr) {
      console.error('Error creating goal_classes:', mapErr);
    }
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description || undefined,
    points: data.points,
    available: data.available,
    classIds: classIds,
    teacherId: data.teacher_id || undefined,
    createdAt: data.created_at ? new Date(data.created_at) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
  };
}
