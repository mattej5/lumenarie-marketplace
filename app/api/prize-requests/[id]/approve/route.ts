import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { approvePrizeRequest } from '@/lib/services/prize-requests';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
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
      .single<{ role: string }>();

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can approve prize requests' }, { status: 403 });
    }

    const body = await request.json();
    const { reviewNotes } = body;

    // Approve prize request (this will also create transaction and deduct balance)
    await approvePrizeRequest(requestId, reviewNotes);

    return NextResponse.json({
      success: true,
      message: 'Prize request approved successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Prize request approval error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to approve prize request'
    }, { status: 500 });
  }
}

