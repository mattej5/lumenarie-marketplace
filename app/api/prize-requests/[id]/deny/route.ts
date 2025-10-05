import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { denyPrizeRequest } from '@/lib/services/prize-requests';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: 'Only teachers can deny prize requests' }, { status: 403 });
    }

    const body = await request.json();
    const { reviewNotes } = body;

    if (!reviewNotes?.trim()) {
      return NextResponse.json({ error: 'Review notes are required' }, { status: 400 });
    }

    const requestId = params.id;

    // Deny prize request
    await denyPrizeRequest(requestId, reviewNotes);

    return NextResponse.json({
      success: true,
      message: 'Prize request denied'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Prize request denial error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to deny prize request'
    }, { status: 500 });
  }
}
