import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET all students not assigned to any class
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

    // First, get all student IDs that are in class_memberships
    const { data: enrolledStudents, error: enrolledError } = await supabase
      .from('class_memberships')
      .select('student_id');

    if (enrolledError) {
      console.error('Error fetching enrolled students:', enrolledError);
      return NextResponse.json(
        { error: 'Failed to fetch enrolled students' },
        { status: 500 }
      );
    }

    const enrolledStudentIds = new Set(((enrolledStudents ?? []) as any[]).map((m) => (m as any).student_id));

    // Get all students
    const { data: allStudents, error: studentsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('name');

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      );
    }

        // Filter out students who are enrolled in any class
    const studentsList = ((allStudents ?? []) as any[]);
    const unassignedStudents = studentsList.filter((student) => !enrolledStudentIds.has(student.id));

    const formattedStudents = unassignedStudents.map((student) => ({
      id: student.id,
      email: student.email,
      name: student.name,
      role: student.role,
      avatar: student.avatar,
      createdAt: student.created_at,
    }));

    return NextResponse.json({ students: formattedStudents });
  } catch (error) {
    console.error('Error in GET /api/students/unassigned:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



