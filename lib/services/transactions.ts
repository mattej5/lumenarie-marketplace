import { createClient } from '@/lib/supabase/server';
import { Transaction } from '@/lib/types';

/**
 * Transaction Service
 * Handles all transaction-related database operations
 */

export async function createTransaction(
  accountId: string,
  type: 'deposit' | 'withdrawal' | 'prize-redemption' | 'adjustment',
  amount: number,
  reason?: string,
  notes?: string
): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  // Call the database function that handles transaction creation and balance update
  const { data, error } = await supabase
    .rpc('create_transaction', {
      p_account_id: accountId,
      p_type: type,
      p_amount: amount,
      p_reason: reason || null,
      p_notes: notes || null,
    });

  if (error) {
    console.error('Error creating transaction:', error);
    throw new Error(error.message);
  }

  return data as string; // Returns transaction ID
}

export async function getTransactionsByAccount(
  accountId: string,
  limit?: number
): Promise<Transaction[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data.map(tx => ({
    id: tx.id,
    accountId: tx.account_id,
    userId: tx.user_id,
    type: tx.type as Transaction['type'],
    amount: tx.amount,
    balanceBefore: tx.balance_before,
    balanceAfter: tx.balance_after,
    reason: tx.reason,
    notes: tx.notes,
    createdBy: tx.created_by,
    createdAt: new Date(tx.created_at),
  }));
}

export async function getTransactionsByUser(
  userId: string,
  limit?: number
): Promise<Transaction[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data.map(tx => ({
    id: tx.id,
    accountId: tx.account_id,
    userId: tx.user_id,
    type: tx.type as Transaction['type'],
    amount: tx.amount,
    balanceBefore: tx.balance_before,
    balanceAfter: tx.balance_after,
    reason: tx.reason,
    notes: tx.notes,
    createdBy: tx.created_by,
    createdAt: new Date(tx.created_at),
  }));
}

export async function getRecentTransactions(
  limit: number = 10,
  classId?: string
): Promise<Transaction[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  let query = supabase
    .from('transactions')
    .select('*, account:accounts!transactions_account_id_fkey(class_id)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (classId) {
    query = query.eq('account.class_id', classId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }

  return data.map(tx => ({
    id: tx.id,
    accountId: tx.account_id,
    userId: tx.user_id,
    type: tx.type as Transaction['type'],
    amount: tx.amount,
    balanceBefore: tx.balance_before,
    balanceAfter: tx.balance_after,
    reason: tx.reason,
    notes: tx.notes,
    createdBy: tx.created_by,
    createdAt: new Date(tx.created_at),
  }));
}

export async function getTransactionById(transactionId: string): Promise<Transaction | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }

  return {
    id: data.id,
    accountId: data.account_id,
    userId: data.user_id,
    type: data.type as Transaction['type'],
    amount: data.amount,
    balanceBefore: data.balance_before,
    balanceAfter: data.balance_after,
    reason: data.reason,
    notes: data.notes,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at),
  };
}

export async function getTransactionsByClass(
  classId: string,
  limit?: number
): Promise<Transaction[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  let query = supabase
    .from('transactions')
    .select('*, account:accounts!transactions_account_id_fkey(class_id)')
    .eq('account.class_id', classId)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching class transactions:', error);
    return [];
  }

  return data.map(tx => ({
    id: tx.id,
    accountId: tx.account_id,
    userId: tx.user_id,
    type: tx.type as Transaction['type'],
    amount: tx.amount,
    balanceBefore: tx.balance_before,
    balanceAfter: tx.balance_after,
    reason: tx.reason,
    notes: tx.notes,
    createdBy: tx.created_by,
    createdAt: new Date(tx.created_at),
  }));
}
