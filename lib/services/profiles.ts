import { createClient } from '@/lib/supabase/server';
import { User } from '@/lib/types';

/**
 * Profile Service
 * Handles all user profile-related database operations
 */

export async function getProfileById(userId: string): Promise<User | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role as 'student' | 'teacher',
    avatar: data.avatar,
    createdAt: new Date(data.created_at),
  };
}

export async function updateProfile(
  userId: string,
  updates: { name?: string; avatar?: string }
): Promise<User | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      name: updates.name,
      avatar: updates.avatar,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role as 'student' | 'teacher',
    avatar: data.avatar,
    createdAt: new Date(data.created_at),
  };
}

export async function getStudentsByTeacher(teacherId: string): Promise<User[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  // Get all students in classes taught by this teacher
  const { data, error } = await supabase
    .from('class_memberships')
    .select(`
      student:profiles!class_memberships_student_id_fkey (
        id,
        email,
        name,
        role,
        avatar,
        created_at
      ),
      class:classes!class_memberships_class_id_fkey (
        teacher_id
      )
    `)
    .eq('class.teacher_id', teacherId);

  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }

  // Extract and deduplicate students
  const students = data
    .map((item: any) => item.student)
    .filter((student: any) => student !== null)
    .map((student: any) => ({
      id: student.id,
      email: student.email,
      name: student.name,
      role: student.role as 'student' | 'teacher',
      avatar: student.avatar,
      createdAt: new Date(student.created_at),
    }));

  // Deduplicate by id
  const uniqueStudents = Array.from(
    new Map(students.map(s => [s.id, s])).values()
  );

  return uniqueStudents;
}

export async function getTeacherByStudent(studentId: string): Promise<User | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  // Get teacher from student's class
  const { data, error } = await supabase
    .from('class_memberships')
    .select(`
      class:classes!class_memberships_class_id_fkey (
        teacher:profiles!classes_teacher_id_fkey (
          id,
          email,
          name,
          role,
          avatar,
          created_at
        )
      )
    `)
    .eq('student_id', studentId)
    .limit(1)
    .single();

  if (error || !data) {
    console.error('Error fetching teacher:', error);
    return null;
  }

  const teacher = (data as any).class?.teacher;
  if (!teacher) return null;

  return {
    id: teacher.id,
    email: teacher.email,
    name: teacher.name,
    role: teacher.role as 'student' | 'teacher',
    avatar: teacher.avatar,
    createdAt: new Date(teacher.created_at),
  };
}

export async function getAllStudents(): Promise<User[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('name');

  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }

  return data.map(student => ({
    id: student.id,
    email: student.email,
    name: student.name,
    role: student.role as 'student' | 'teacher',
    avatar: student.avatar,
    createdAt: new Date(student.created_at),
  }));
}
