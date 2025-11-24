import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type AccountRow = {
  id: string;
  user_id: string;
  class_id: string | null;
};

export async function POST(request: NextRequest) {
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
      .single<{ role: string }>();

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can award credits' }, { status: 403 });
    }

    const body = await request.json();
    const { studentIds, amount, reason, classId } = body as {
      studentIds: string[];
      amount: number;
      reason?: string;
      classId?: string;
    };

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'No students selected' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    const { data: accountsData, error: accountsError } = await supabase
      .from('accounts')
      .select('id, user_id, class_id')
      .in('user_id', studentIds);

    if (accountsError) {
      console.error('Error fetching accounts for bulk award:', accountsError);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    const accounts = (accountsData ?? []) as unknown as AccountRow[];

    const missingAccounts: string[] = [];
    const ambiguousStudents: string[] = [];
    const accountIds: string[] = [];

    studentIds.forEach((studentId) => {
      const matches = accounts.filter((acc) => {
        if (acc.user_id !== studentId) return false;
        if (classId) return acc.class_id === classId;
        return true;
      });

      if (matches.length === 0) {
        missingAccounts.push(studentId);
        return;
      }

      if (!classId && matches.length > 1) {
        ambiguousStudents.push(studentId);
        return;
      }

      accountIds.push(matches[0].id);
    });

    if (missingAccounts.length > 0) {
      return NextResponse.json({
        error: `No account found for students: ${missingAccounts.join(', ')}`,
      }, { status: 400 });
    }

    if (ambiguousStudents.length > 0) {
      return NextResponse.json({
        error: 'Select a class when students are in multiple classes',
        students: ambiguousStudents,
      }, { status: 400 });
    }

    const { error: bulkError } = await supabase.rpc('create_bulk_transactions', {
      p_account_ids: accountIds,
      p_amount: amount,
      p_reason: reason.trim(),
      p_notes: null,
    });

    if (bulkError) {
      console.error('Bulk award RPC error:', bulkError);
      return NextResponse.json({ error: bulkError.message || 'Failed to award credits' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      transactionCount: accountIds.length,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Bulk award error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to award credits',
    }, { status: 500 });
  }
}
