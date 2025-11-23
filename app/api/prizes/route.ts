import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPrizes, createPrize } from '@/lib/services/prizes';

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
    const available = searchParams.get('available');
    const category = searchParams.get('category');
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');

    const filters: any = {};
    if (available !== null) filters.available = available === 'true';
    if (category) filters.category = category;
    if (classId) filters.classId = classId;
    if (teacherId) filters.teacherId = teacherId;

    const prizes = await getPrizes(filters);

    return NextResponse.json({ prizes }, { status: 200 });

  } catch (error: any) {
    console.error('Prizes fetch error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch prizes'
    }, { status: 500 });
  }
}

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
      .single<{ role: string }>();

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can create prizes' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, cost, category, icon, classId } = body;

    // Validate input
    if (!name || !description || !cost || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (cost <= 0) {
      return NextResponse.json({ error: 'Cost must be positive' }, { status: 400 });
    }

    const validCategories = ['general', 'astronomy', 'earth-science'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Create prize
    const prize = await createPrize(user.id, {
      name,
      description,
      cost,
      category,
      icon,
      classId
    });

    if (!prize) {
      return NextResponse.json({ error: 'Failed to create prize' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      prize
    }, { status: 201 });

  } catch (error: any) {
    console.error('Prize creation error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to create prize'
    }, { status: 500 });
  }
}

