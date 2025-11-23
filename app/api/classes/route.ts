import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET all classes for the authenticated teacher
export async function GET() {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: classes, error } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching classes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch classes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ classes });
  } catch (error) {
    console.error('Error in GET /api/classes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create a new class
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, subject, school_year, color_theme, active } = body;

    if (!name || !subject) {
      return NextResponse.json(
        { error: 'Name and subject are required' },
        { status: 400 }
      );
    }

    const { data: newClass, error } = await supabase
      .from('classes')
      .insert({
        teacher_id: user.id,
        name,
        subject,
        school_year,
        color_theme,
        active: active ?? true,
      } as never)
      .select()
      .single();

    if (error) {
      console.error('Error creating class:', error);
      return NextResponse.json(
        { error: 'Failed to create class' },
        { status: 500 }
      );
    }

    return NextResponse.json({ class: newClass });
  } catch (error) {
    console.error('Error in POST /api/classes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update a class
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, subject, school_year, color_theme, active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      );
    }

    // Verify the class belongs to the authenticated teacher
    const { data: existingClass } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', id)
      .single<{ teacher_id: string }>();

    if (!existingClass || existingClass.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'Class not found or unauthorized' },
        { status: 404 }
      );
    }

    const { data: updatedClass, error } = await supabase
      .from('classes')
      .update({
        name,
        subject,
        school_year,
        color_theme,
        active,
      } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating class:', error);
      return NextResponse.json(
        { error: 'Failed to update class' },
        { status: 500 }
      );
    }

    return NextResponse.json({ class: updatedClass });
  } catch (error) {
    console.error('Error in PUT /api/classes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE a class
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      );
    }

    // Verify the class belongs to the authenticated teacher
    const { data: existingClass } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', id)
      .single<{ teacher_id: string }>();

    if (!existingClass || existingClass.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'Class not found or unauthorized' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting class:', error);
      return NextResponse.json(
        { error: 'Failed to delete class' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/classes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


