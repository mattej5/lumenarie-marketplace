import { createClient } from '@/lib/supabase/server';

/**
 * Class Service
 * Handles all class and class membership-related database operations
 */

export interface Class {
  id: string;
  teacherId: string;
  name: string;
  subject: 'astronomy' | 'earth-science' | 'both';
  createdAt: Date;
}

export interface ClassMembership {
  id: string;
  classId: string;
  studentId: string;
  joinedAt: Date;
}

export async function getClassesByTeacher(teacherId: string): Promise<Class[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching classes:', error);
    return [];
  }

  const classes = (data ?? []) as any[];

  return classes.map((cls) => ({
    id: cls.id,
    teacherId: cls.teacher_id,
    name: cls.name,
    subject: cls.subject as Class['subject'],
    createdAt: new Date(cls.created_at),
  }));
}

export async function getClassById(classId: string): Promise<Class | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single<{ id: string; teacher_id: string; name: string; subject: string; created_at: string }>();

  if (error) {
    console.error('Error fetching class:', error);
    return null;
  }

  return {
    id: data.id,
    teacherId: data.teacher_id,
    name: data.name,
    subject: data.subject as Class['subject'],
    createdAt: new Date(data.created_at),
  };
}

export async function createClass(
  teacherId: string,
  name: string,
  subject: 'astronomy' | 'earth-science' | 'both'
): Promise<Class | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('classes')
    .insert({
      teacher_id: teacherId,
      name,
      subject,
    } as never)
    .select()
    .single<{ id: string; teacher_id: string; name: string; subject: string; created_at: string }>();

  if (error) {
    console.error('Error creating class:', error);
    return null;
  }

  return {
    id: data.id,
    teacherId: data.teacher_id,
    name: data.name,
    subject: data.subject as Class['subject'],
    createdAt: new Date(data.created_at),
  };
}

export async function getClassMemberships(classId: string): Promise<ClassMembership[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('class_memberships')
    .select('*')
    .eq('class_id', classId)
    .order('joined_at', { ascending: false });

  if (error) {
    console.error('Error fetching class memberships:', error);
    return [];
  }

  const memberships = (data ?? []) as any[];

  return memberships.map((membership) => ({
    id: membership.id,
    classId: membership.class_id,
    studentId: membership.student_id,
    joinedAt: new Date(membership.joined_at),
  }));
}

export async function addStudentToClass(
  studentId: string,
  classId: string
): Promise<ClassMembership | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('class_memberships')
    .insert({
      student_id: studentId,
      class_id: classId,
    } as never)
    .select()
    .single<{ id: string; class_id: string; student_id: string; joined_at: string }>();

  if (error) {
    console.error('Error adding student to class:', error);
    return null;
  }

  return {
    id: data.id,
    classId: data.class_id,
    studentId: data.student_id,
    joinedAt: new Date(data.joined_at),
  };
}

export async function removeStudentFromClass(
  studentId: string,
  classId: string
): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { error } = await supabase
    .from('class_memberships')
    .delete()
    .eq('student_id', studentId)
    .eq('class_id', classId);

  if (error) {
    console.error('Error removing student from class:', error);
    return false;
  }

  return true;
}

export async function getStudentClasses(studentId: string): Promise<Class[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('class_memberships')
    .select(`
      class:classes!class_memberships_class_id_fkey (
        id,
        teacher_id,
        name,
        subject,
        created_at
      )
    `)
    .eq('student_id', studentId);

  if (error) {
    console.error('Error fetching student classes:', error);
    return [];
  }

  return data
    .map((item: any) => item.class)
    .filter((cls: any) => cls !== null)
    .map((cls: any) => ({
      id: cls.id,
      teacherId: cls.teacher_id,
      name: cls.name,
      subject: cls.subject as Class['subject'],
      createdAt: new Date(cls.created_at),
    }));
}

export async function getClassStudentCount(classId: string): Promise<number> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { count, error } = await supabase
    .from('class_memberships')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId);

  if (error) {
    console.error('Error fetching student count:', error);
    return 0;
  }

  return count || 0;
}

export interface StudentWithClasses {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  classes: {
    id: string;
    name: string;
    subject: 'astronomy' | 'earth-science' | 'both';
    joinedAt: Date;
  }[];
}

export async function getStudentsWithClassesByTeacher(teacherId: string): Promise<StudentWithClasses[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client not configured');

  // Get all classes for this teacher
  const { data: classRows, error: classError } = await supabase
    .from('classes')
    .select('id, name, subject')
    .eq('teacher_id', teacherId);

  if (classError) {
    console.error('Error fetching teacher classes:', classError);
    return [];
  }

  const classes = Array.isArray(classRows) ? classRows as unknown as { id: string; name: string; subject: Class['subject'] }[] : [];

  const classIds = classes.map(c => c.id);

  if (classIds.length === 0) {
    return [];
  }

  // Get all students in these classes with their membership info
  const { data, error } = await supabase
    .from('class_memberships')
    .select(`
      joined_at,
      class_id,
      student:profiles!class_memberships_student_id_fkey (
        id,
        email,
        name,
        avatar,
        created_at
      )
    `)
    .in('class_id', classIds);

  if (error) {
    console.error('Error fetching students with classes:', error);
    return [];
  }

  // Group students by id with their classes
  const studentMap = new Map<string, StudentWithClasses>();

  data.forEach((item: any) => {
    if (!item.student) return;

    const studentId = item.student.id;
    const classInfo = classes.find(c => c.id === item.class_id);

    if (!classInfo) return;

    if (!studentMap.has(studentId)) {
      studentMap.set(studentId, {
        id: item.student.id,
        email: item.student.email,
        name: item.student.name,
        avatar: item.student.avatar,
        createdAt: new Date(item.student.created_at),
        classes: [],
      });
    }

    const student = studentMap.get(studentId)!;
    student.classes.push({
      id: classInfo.id,
      name: classInfo.name,
      subject: classInfo.subject,
      joinedAt: new Date(item.joined_at),
    });
  });

  // Sort students by name
  return Array.from(studentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}


