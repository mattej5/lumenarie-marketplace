import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { studentId, classId } = body;

    if (!studentId || !classId) {
      return NextResponse.json(
        { error: 'Missing studentId or classId' },
        { status: 400 }
      );
    }

    // Verify the class belongs to the authenticated teacher
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', classId)
      .single<{ teacher_id: string }>();

    if (classError || !classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    if (classData.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to remove students from this class' },
        { status: 403 }
      );
    }

    // Use the database function to remove student from class
    const { error } = await supabase
      .rpc('remove_student_from_class', {
        p_class_id: classId,
        p_student_id: studentId,
      } as any);

    if (error) {
      console.error('Error removing student from class:', error);
      return NextResponse.json(
        { error: 'Failed to remove student from class' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in remove-student route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


