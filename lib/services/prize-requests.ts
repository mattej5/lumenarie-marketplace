import { createClient } from '@/lib/supabase/server';
import { PrizeRequest } from '@/lib/types';

/**
 * Prize Request Service
 * Handles all prize request-related database operations
 */

export async function createPrizeRequest(
  studentId: string,
  prizeId: string,
  classId: string,
  reason?: string,
  customAmount?: number
): Promise<PrizeRequest | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  // Get prize details
  const { data: prize } = await supabase
    .from('prizes')
    .select('name, cost')
    .eq('id', prizeId)
    .single();

  if (!prize) {
    throw new Error('Prize not found');
  }

  // Determine the effective cost
  const isCrowdfunded = prize.cost === 0;
  const effectiveCost = isCrowdfunded && customAmount !== undefined ? customAmount : prize.cost;

  // Validate custom amount for crowdfunded prizes
  if (isCrowdfunded && (customAmount === undefined || customAmount < 2)) {
    throw new Error('Crowdfunded prizes require a custom amount of at least 2');
  }

  // Get student's account
  const { data: account } = await supabase
    .from('accounts')
    .select('id, balance')
    .eq('user_id', studentId)
    .eq('class_id', classId)
    .single();

  if (!account) {
    throw new Error('Account not found');
  }

  // Check if student can afford the prize
  if (account.balance < effectiveCost) {
    throw new Error('Insufficient balance');
  }

  // Get student details
  const { data: student } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', studentId)
    .single();

  // Create the prize request
  const { data, error } = await supabase
    .from('prize_requests')
    .insert({
      student_id: studentId,
      prize_id: prizeId,
      class_id: classId,
      prize_cost: prize.cost,
      custom_amount: isCrowdfunded ? customAmount : null,
      reason,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating prize request:', error);
    return null;
  }

  // Immediately deduct the balance (use effective cost)
  const { error: txError } = await supabase.rpc('create_transaction', {
    p_account_id: account.id,
    p_type: 'prize-redemption',
    p_amount: effectiveCost,
    p_reason: `Prize request: ${prize.name}${isCrowdfunded ? ' (Crowdfunded)' : ''}`,
    p_notes: `Prize request ID: ${data.id}${isCrowdfunded ? ` - Custom amount: ${customAmount}` : ''}`,
  });

  if (txError) {
    console.error('Error creating transaction:', txError);
    // Rollback: delete the prize request
    await supabase.from('prize_requests').delete().eq('id', data.id);
    throw new Error('Failed to process transaction');
  }

  return {
    id: data.id,
    studentId: data.student_id,
    studentName: student?.name || '',
    prizeId: data.prize_id,
    prizeName: prize.name,
    prizeCost: data.prize_cost,
    customAmount: data.custom_amount,
    reason: data.reason,
    status: data.status as PrizeRequest['status'],
    classId: data.class_id,
    requestedAt: new Date(data.requested_at),
    reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
    reviewedBy: data.reviewed_by,
    reviewNotes: data.review_notes,
  };
}

export async function getPrizeRequests(filters?: {
  status?: PrizeRequest['status'];
  studentId?: string;
  classId?: string;
  prizeId?: string;
}): Promise<PrizeRequest[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  let query = supabase
    .from('prize_requests')
    .select(`
      *,
      student:profiles!prize_requests_student_id_fkey(name),
      prize:prizes!prize_requests_prize_id_fkey(name)
    `)
    .order('requested_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.studentId) {
    query = query.eq('student_id', filters.studentId);
  }

  if (filters?.classId) {
    query = query.eq('class_id', filters.classId);
  }

  if (filters?.prizeId) {
    query = query.eq('prize_id', filters.prizeId);
  }

  const { data, error} = await query;

  if (error) {
    console.error('Error fetching prize requests:', error);
    return [];
  }

  return data.map((req: any) => ({
    id: req.id,
    studentId: req.student_id,
    studentName: req.student?.name || '',
    prizeId: req.prize_id,
    prizeName: req.prize?.name || '',
    prizeCost: req.prize_cost,
    customAmount: req.custom_amount,
    reason: req.reason,
    status: req.status as PrizeRequest['status'],
    classId: req.class_id,
    requestedAt: new Date(req.requested_at),
    reviewedAt: req.reviewed_at ? new Date(req.reviewed_at) : undefined,
    reviewedBy: req.reviewed_by,
    reviewNotes: req.review_notes,
  }));
}

export async function approvePrizeRequest(
  requestId: string,
  reviewNotes?: string
): Promise<void> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  // Since balance was already deducted when request was created,
  // we just need to update the status to approved
  const { error } = await supabase
    .from('prize_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: (await supabase.auth.getUser()).data.user?.id,
      review_notes: reviewNotes || null,
    })
    .eq('id', requestId);

  if (error) {
    console.error('Error approving prize request:', error);
    throw new Error(error.message);
  }
}

export async function denyPrizeRequest(
  requestId: string,
  reviewNotes: string
): Promise<void> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  if (!reviewNotes?.trim()) {
    throw new Error('Review notes are required when denying a request');
  }

  // Get the prize request details
  const { data: request, error: fetchError } = await supabase
    .from('prize_requests')
    .select('student_id, class_id, prize_cost, custom_amount, prize:prizes(name)')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    throw new Error('Prize request not found');
  }

  // Get student's account
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', request.student_id)
    .eq('class_id', request.class_id)
    .single();

  if (!account) {
    throw new Error('Student account not found');
  }

  // Determine the refund amount (use custom_amount if it exists, otherwise prize_cost)
  const refundAmount = request.custom_amount || request.prize_cost;

  // Refund the amount back to the student
  const { error: txError } = await supabase.rpc('create_transaction', {
    p_account_id: account.id,
    p_type: 'deposit',
    p_amount: refundAmount,
    p_reason: `Prize request denied: ${(request.prize as any)?.name || 'Unknown'}`,
    p_notes: `Refund for denied request. Reason: ${reviewNotes}`,
  });

  if (txError) {
    console.error('Error refunding amount:', txError);
    throw new Error('Failed to refund amount');
  }

  // Update the request status to denied
  const { error } = await supabase
    .from('prize_requests')
    .update({
      status: 'denied',
      reviewed_at: new Date().toISOString(),
      reviewed_by: (await supabase.auth.getUser()).data.user?.id,
      review_notes: reviewNotes,
    })
    .eq('id', requestId);

  if (error) {
    console.error('Error denying prize request:', error);
    throw new Error(error.message);
  }
}

export async function getPendingRequests(classId?: string): Promise<PrizeRequest[]> {
  return getPrizeRequests({
    status: 'pending',
    classId,
  });
}

export async function getRequestById(requestId: string): Promise<PrizeRequest | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('prize_requests')
    .select(`
      *,
      student:profiles!prize_requests_student_id_fkey(name),
      prize:prizes!prize_requests_prize_id_fkey(name)
    `)
    .eq('id', requestId)
    .single();

  if (error) {
    console.error('Error fetching prize request:', error);
    return null;
  }

  return {
    id: data.id,
    studentId: data.student_id,
    studentName: (data as any).student?.name || '',
    prizeId: data.prize_id,
    prizeName: (data as any).prize?.name || '',
    prizeCost: data.prize_cost,
    customAmount: data.custom_amount,
    reason: data.reason,
    status: data.status as PrizeRequest['status'],
    classId: data.class_id,
    requestedAt: new Date(data.requested_at),
    reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
    reviewedBy: data.reviewed_by,
    reviewNotes: data.review_notes,
  };
}

export async function getRecentReviewedRequests(
  limit: number = 5,
  classId?: string
): Promise<PrizeRequest[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  let query = supabase
    .from('prize_requests')
    .select(`
      *,
      student:profiles!prize_requests_student_id_fkey(name),
      prize:prizes!prize_requests_prize_id_fkey(name)
    `)
    .in('status', ['approved', 'denied'])
    .not('reviewed_at', 'is', null)
    .order('reviewed_at', { ascending: false })
    .limit(limit);

  if (classId) {
    query = query.eq('class_id', classId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching reviewed requests:', error);
    return [];
  }

  return data.map((req: any) => ({
    id: req.id,
    studentId: req.student_id,
    studentName: req.student?.name || '',
    prizeId: req.prize_id,
    prizeName: req.prize?.name || '',
    prizeCost: req.prize_cost,
    customAmount: req.custom_amount,
    reason: req.reason,
    status: req.status as PrizeRequest['status'],
    classId: req.class_id,
    requestedAt: new Date(req.requested_at),
    reviewedAt: req.reviewed_at ? new Date(req.reviewed_at) : undefined,
    reviewedBy: req.reviewed_by,
    reviewNotes: req.review_notes,
  }));
}
