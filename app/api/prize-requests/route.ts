import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPrizeRequest, getPrizeRequests } from '@/lib/services/prize-requests';

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

    const body = await request.json();
    const { prizeId, classId, reason } = body;

    // Validate input
    if (!prizeId || !classId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create prize request
    const prizeRequest = await createPrizeRequest(
      user.id,
      prizeId,
      classId,
      reason
    );

    if (!prizeRequest) {
      return NextResponse.json({ error: 'Failed to create prize request' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      prizeRequest
    }, { status: 201 });

  } catch (error: any) {
    console.error('Prize request creation error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to create prize request'
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
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');

    const filters: any = {};
    if (status) filters.status = status;
    if (studentId) filters.studentId = studentId;
    if (classId) filters.classId = classId;

    const prizeRequests = await getPrizeRequests(filters);

    return NextResponse.json({ prizeRequests }, { status: 200 });

  } catch (error: any) {
    console.error('Prize requests fetch error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch prize requests'
    }, { status: 500 });
  }
}
