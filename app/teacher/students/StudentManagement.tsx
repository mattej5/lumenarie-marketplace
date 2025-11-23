'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { Class, StudentWithClasses } from '@/lib/services/classes';
import { ChevronLeft, Users, Mail, Calendar, Plus, X, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface Props {
  user: User;
  classes: Class[];
  students: StudentWithClasses[];
}

export default function StudentManagement({ user: _user, classes, students }: Props) {
  const [selectedStudent, setSelectedStudent] = useState<StudentWithClasses | User | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [unassignedStudents, setUnassignedStudents] = useState<User[]>([]);
  const [fetchingUnassigned, setFetchingUnassigned] = useState(false);

  const handleAssignToClass = async () => {
    if (!selectedStudent || !selectedClass) return;

    setLoading(true);
    try {
      const response = await fetch('/api/classes/assign-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          classId: selectedClass,
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to assign student to class');
      }
    } catch (error) {
      console.error('Error assigning student:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
      setIsAssigning(false);
      setSelectedClass('');
    }
  };

  const handleRemoveFromClass = async (studentId: string, classId: string) => {
    if (!confirm('Are you sure you want to remove this student from the class?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/classes/remove-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          classId,
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to remove student from class');
      }
    } catch (error) {
      console.error('Error removing student:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getSubjectBadgeColor = (subject: Class['subject']) => {
    switch (subject) {
      case 'astronomy':
        return 'bg-purple-100 text-purple-800';
      case 'earth-science':
        return 'bg-green-100 text-green-800';
      case 'both':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailableClassesForStudent = (student: StudentWithClasses | User) => {
    if ('classes' in student) {
      const enrolledClassIds = student.classes.map(c => c.id);
      return classes.filter(c => !enrolledClassIds.includes(c.id));
    }
    return classes; // For unassigned students, all classes are available
  };

  useEffect(() => {
    const fetchUnassignedStudents = async () => {
      if (!showUnassigned) return;

      setFetchingUnassigned(true);
      try {
        const response = await fetch('/api/students/unassigned');
        const data = await response.json();
        if (response.ok) {
          setUnassignedStudents(data.students || []);
        }
      } catch (error) {
        console.error('Error fetching unassigned students:', error);
      } finally {
        setFetchingUnassigned(false);
      }
    };

    fetchUnassignedStudents();
  }, [showUnassigned]);

  const displayStudents = showUnassigned ? unassignedStudents : students;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/teacher" className="text-gray-600 hover:text-gray-900">
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
                <p className="text-gray-600 mt-1">Manage your students and class assignments</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-indigo-600" />
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toggle Button */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setShowUnassigned(false)}
            className={`px-4 py-2 rounded-md transition-colors ${
              !showUnassigned
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            My Students ({students.length})
          </button>
          <button
            onClick={() => setShowUnassigned(true)}
            className={`px-4 py-2 rounded-md transition-colors ${
              showUnassigned
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            disabled={fetchingUnassigned}
          >
            <UserPlus className="h-4 w-4 inline mr-2" />
            Unassigned Students {fetchingUnassigned ? '(Loading...)' : `(${unassignedStudents.length})`}
          </button>
        </div>

        {(showUnassigned ? unassignedStudents : students).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No students yet</h3>
            <p className="text-gray-600">Students will appear here once they join your classes.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classes
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {student.avatar ? (
                            <img className="h-10 w-10 rounded-full" src={student.avatar} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-700 font-semibold text-lg">
                                {student.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-4 w-4 mr-2" />
                        {student.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {'classes' in student && student.classes.map((cls) => (
                          <div key={cls.id} className="flex items-center gap-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubjectBadgeColor(cls.subject)}`}>
                              {cls.name}
                            </span>
                            <button
                              onClick={() => handleRemoveFromClass(student.id, cls.id)}
                              className="text-red-600 hover:text-red-800"
                              disabled={loading}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {!('classes' in student) || getAvailableClassesForStudent(student).length > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsAssigning(true);
                            }}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add to class
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(student.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign to Class Modal */}
      {isAssigning && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assign {selectedStudent.name} to Class
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
              >
                <option value="" className="text-gray-500">Choose a class...</option>
                {getAvailableClassesForStudent(selectedStudent).map((cls) => (
                  <option key={cls.id} value={cls.id} className="text-gray-900">
                    {cls.name} ({cls.subject})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAssigning(false);
                  setSelectedClass('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignToClass}
                disabled={!selectedClass || loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && !isAssigning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                {selectedStudent.avatar ? (
                  <img className="h-16 w-16 rounded-full" src={selectedStudent.avatar} alt="" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-700 font-bold text-2xl">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h3>
                  <p className="text-gray-600">{selectedStudent.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Enrolled Classes</h4>
                {!('classes' in selectedStudent) || selectedStudent.classes.length === 0 ? (
                  <p className="text-gray-500 text-sm">Not enrolled in any classes</p>
                ) : (
                  <div className="space-y-2">
                    {selectedStudent.classes.map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{cls.name}</p>
                          <p className="text-sm text-gray-600">Joined {cls.joinedAt.toLocaleDateString()}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubjectBadgeColor(cls.subject)}`}>
                          {cls.subject}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Member since:</span> {new Date(selectedStudent.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
