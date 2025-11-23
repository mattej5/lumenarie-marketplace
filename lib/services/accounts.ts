import { createClient } from '@/lib/supabase/server';
import { Account } from '@/lib/types';

/**
 * Account Service
 * Handles all account-related database operations
 */

export async function getAccountByUserId(
  userId: string,
  classId?: string
): Promise<Account | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  let query = supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId);

  if (classId) {
    query = query.eq('class_id', classId);
  }

  const { data, error } = await query.single<{ id: string; user_id: string; class_id: string | null; balance: number; currency: string; last_updated: string }>();

  if (error) {
    console.error('Error fetching account:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    classId: data.class_id || undefined,
    balance: data.balance,
    currency: data.currency as 'star-credits' | 'earth-points',
    lastUpdated: new Date(data.last_updated),
  };
}

export async function getAccountsByClass(classId: string): Promise<Account[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('class_id', classId)
    .order('balance', { ascending: false });

  if (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }

  const accounts = (data ?? []) as any[];
  return accounts.map((account) => ({
    id: account.id,
    userId: account.user_id,
    classId: account.class_id || undefined,
    balance: account.balance,
    currency: account.currency as 'star-credits' | 'earth-points',
    lastUpdated: new Date(account.last_updated),
  }));
}

export async function getAccountsByUserId(userId: string): Promise<Account[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }

  const accounts = (data ?? []) as any[];
  return accounts.map((account) => ({
    id: account.id,
    userId: account.user_id,
    classId: account.class_id || undefined,
    balance: account.balance,
    currency: account.currency as 'star-credits' | 'earth-points',
    lastUpdated: new Date(account.last_updated),
  }));
}

export async function createAccountForStudent(
  userId: string,
  classId: string
): Promise<Account | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  // Get class subject to determine currency
  const { data: classData } = await supabase
    .from('classes')
    .select('subject')
    .eq('id', classId)
    .single<{ subject: string | null }>();

  const currency = classData?.subject === 'astronomy'
    ? 'star-credits'
    : classData?.subject === 'earth-science'
    ? 'earth-points'
    : 'star-credits';

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      user_id: userId,
      class_id: classId,
      balance: 0,
      currency,
    } as never)
    .select()
    .single<{ id: string; user_id: string; class_id: string; balance: number; currency: string; last_updated: string }>();

  if (error) {
    console.error('Error creating account:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    classId: data.class_id || undefined,
    balance: data.balance,
    currency: data.currency as 'star-credits' | 'earth-points',
    lastUpdated: new Date(data.last_updated),
  };
}

export async function getAccountBalance(accountId: string): Promise<number | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', accountId)
    .single<{ balance: number }>();

  if (error) {
    console.error('Error fetching balance:', error);
    return null;
  }

  return data.balance;
}

export async function getAllAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('balance', { ascending: false });

  if (error) {
    console.error('Error fetching all accounts:', error);
    return [];
  }

  const accounts = (data ?? []) as any[];
  return accounts.map((account) => ({
    id: account.id,
    userId: account.user_id,
    classId: account.class_id || undefined,
    balance: account.balance,
    currency: account.currency as 'star-credits' | 'earth-points',
    lastUpdated: new Date(account.last_updated),
  }));
}



