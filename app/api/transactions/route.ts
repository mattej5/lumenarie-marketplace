import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTransaction, getTransactionsByUser, getTransactionsByAccount } from '@/lib/services/transactions';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can create transactions' }, { status: 403 });
    }

    const body = await request.json();
    const { accountId, type, amount, reason, notes } = body;

    // Validate input
    if (!accountId || !type || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    const validTypes = ['deposit', 'withdrawal', 'prize-redemption', 'adjustment'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    // Create transaction
    const transactionId = await createTransaction(
      accountId,
      type,
      amount,
      reason,
      notes
    );

    return NextResponse.json({
      success: true,
      transactionId
    }, { status: 201 });

  } catch (error: any) {
    console.error('Transaction creation error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to create transaction'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit');

    let transactions;

    if (accountId) {
      transactions = await getTransactionsByAccount(
        accountId,
        limit ? parseInt(limit) : undefined
      );
    } else if (userId) {
      transactions = await getTransactionsByUser(
        userId,
        limit ? parseInt(limit) : undefined
      );
    } else {
      // Default to current user's transactions
      transactions = await getTransactionsByUser(
        user.id,
        limit ? parseInt(limit) : undefined
      );
    }

    return NextResponse.json({ transactions }, { status: 200 });

  } catch (error: any) {
    console.error('Transaction fetch error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch transactions'
    }, { status: 500 });
  }
}
