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

  const prizeRows = (data ?? []) as unknown as Array<{
    id: string;
    name: string;
    description: string;
    cost: number;
    category: string;
    icon: string | null;
    available: boolean;
    class_id: string | null;
    teacher_id: string | null;
  }>;

  return prizeRows.map(prize => ({
    id: prize.id,
    name: prize.name,
    description: prize.description,
    cost: prize.cost,
    category: prize.category as Prize['category'],
    icon: prize.icon ?? '',
    available: prize.available,
    classId: prize.class_id ?? undefined,
    teacherId: prize.teacher_id ?? undefined,
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

  const prizeData = data as unknown as {
    id: string;
    name: string;
    description: string;
    cost: number;
    category: string;
    icon: string | null;
    available: boolean;
    class_id: string | null;
    teacher_id: string | null;
  };

  return {
    id: prizeData.id,
    name: prizeData.name,
    description: prizeData.description,
    cost: prizeData.cost,
    category: prizeData.category as Prize['category'],
    icon: prizeData.icon ?? '',
    available: prizeData.available,
    classId: prizeData.class_id ?? undefined,
    teacherId: prizeData.teacher_id ?? undefined,
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

  const createdPrize = data as unknown as {
    id: string;
    name: string;
    description: string;
    cost: number;
    category: string;
    icon: string | null;
    available: boolean;
    class_id: string | null;
    teacher_id: string | null;
  };

  return {
    id: createdPrize.id,
    name: createdPrize.name,
    description: createdPrize.description,
    cost: createdPrize.cost,
    category: createdPrize.category as Prize['category'],
    icon: createdPrize.icon ?? '',
    available: createdPrize.available,
    classId: createdPrize.class_id ?? undefined,
    teacherId: createdPrize.teacher_id ?? undefined,
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

  const updatedPrize = data as unknown as {
    id: string;
    name: string;
    description: string;
    cost: number;
    category: string;
    icon: string | null;
    available: boolean;
    class_id: string | null;
    teacher_id: string | null;
  };

  return {
    id: updatedPrize.id,
    name: updatedPrize.name,
    description: updatedPrize.description,
    cost: updatedPrize.cost,
    category: updatedPrize.category as Prize['category'],
    icon: updatedPrize.icon ?? '',
    available: updatedPrize.available,
    classId: updatedPrize.class_id ?? undefined,
    teacherId: updatedPrize.teacher_id ?? undefined,
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

  const currentPrizeData = currentPrize as unknown as { available: boolean };

  // Toggle availability
  const { data, error } = await supabase
    .from('prizes')
    .update({ available: !currentPrizeData.available })
    .eq('id', prizeId)
    .select()
    .single();

  if (error) {
    console.error('Error toggling prize availability:', error);
    return null;
  }

  const toggledPrize = data as unknown as {
    id: string;
    name: string;
    description: string;
    cost: number;
    category: string;
    icon: string | null;
    available: boolean;
    class_id: string | null;
    teacher_id: string | null;
  };

  return {
    id: toggledPrize.id,
    name: toggledPrize.name,
    description: toggledPrize.description,
    cost: toggledPrize.cost,
    category: toggledPrize.category as Prize['category'],
    icon: toggledPrize.icon ?? '',
    available: toggledPrize.available,
    classId: toggledPrize.class_id ?? undefined,
    teacherId: toggledPrize.teacher_id ?? undefined,
  };
}
