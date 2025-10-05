import { createClient } from '@/lib/supabase/server';
import { Prize } from '@/lib/types';

/**
 * Prize Service
 * Handles all prize-related database operations
 */

export async function getPrizes(filters?: {
  available?: boolean;
  category?: Prize['category'];
  classId?: string;
  teacherId?: string;
}): Promise<Prize[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  let query = supabase
    .from('prizes')
    .select('*')
    .order('cost', { ascending: true });

  if (filters?.available !== undefined) {
    query = query.eq('available', filters.available);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  // Note: Don't filter by classId here - RLS handles visibility
  // Students will see prizes from their class OR teacher-wide prizes
  // The RLS policy allows both class_id = classId AND class_id IS NULL

  if (filters?.teacherId) {
    query = query.eq('teacher_id', filters.teacherId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching prizes:', error);
    return [];
  }

  return data.map(prize => ({
    id: prize.id,
    name: prize.name,
    description: prize.description,
    cost: prize.cost,
    category: prize.category as Prize['category'],
    icon: prize.icon,
    available: prize.available,
    classId: prize.class_id,
    teacherId: prize.teacher_id,
  }));
}

export async function getPrizeById(prizeId: string): Promise<Prize | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('prizes')
    .select('*')
    .eq('id', prizeId)
    .single();

  if (error) {
    console.error('Error fetching prize:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    cost: data.cost,
    category: data.category as Prize['category'],
    icon: data.icon,
    available: data.available,
    classId: data.class_id,
    teacherId: data.teacher_id,
  };
}

export async function createPrize(
  teacherId: string,
  prize: {
    name: string;
    description: string;
    cost: number;
    category: Prize['category'];
    icon?: string;
    classId?: string;
  }
): Promise<Prize | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('prizes')
    .insert({
      teacher_id: teacherId,
      name: prize.name,
      description: prize.description,
      cost: prize.cost,
      category: prize.category,
      icon: prize.icon || null,
      class_id: prize.classId || null,
      available: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating prize:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    cost: data.cost,
    category: data.category as Prize['category'],
    icon: data.icon,
    available: data.available,
    classId: data.class_id,
    teacherId: data.teacher_id,
  };
}

export async function updatePrize(
  prizeId: string,
  updates: {
    name?: string;
    description?: string;
    cost?: number;
    category?: Prize['category'];
    icon?: string;
    available?: boolean;
  }
): Promise<Prize | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('prizes')
    .update(updates)
    .eq('id', prizeId)
    .select()
    .single();

  if (error) {
    console.error('Error updating prize:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    cost: data.cost,
    category: data.category as Prize['category'],
    icon: data.icon,
    available: data.available,
    classId: data.class_id,
    teacherId: data.teacher_id,
  };
}

export async function deletePrize(prizeId: string): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { error } = await supabase
    .from('prizes')
    .delete()
    .eq('id', prizeId);

  if (error) {
    console.error('Error deleting prize:', error);
    return false;
  }

  return true;
}

export async function togglePrizeAvailability(prizeId: string): Promise<Prize | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  // Get current availability
  const { data: currentPrize } = await supabase
    .from('prizes')
    .select('available')
    .eq('id', prizeId)
    .single();

  if (!currentPrize) return null;

  // Toggle availability
  const { data, error } = await supabase
    .from('prizes')
    .update({ available: !currentPrize.available })
    .eq('id', prizeId)
    .select()
    .single();

  if (error) {
    console.error('Error toggling prize availability:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    cost: data.cost,
    category: data.category as Prize['category'],
    icon: data.icon,
    available: data.available,
    classId: data.class_id,
    teacherId: data.teacher_id,
  };
}
