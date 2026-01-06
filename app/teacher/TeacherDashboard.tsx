'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import StudentOverviewGrid from '@/components/teacher/StudentOverviewGrid';
import BalanceManagementModal from '@/components/teacher/BalanceManagementModal';
import PrizeRequestQueue from '@/components/teacher/PrizeRequestQueue';
import { User, Account, PrizeRequest, GoalSubmission } from '@/lib/types';
import { Class } from '@/lib/services/classes';

interface TeacherDashboardProps {
  user: User;
  students: User[];
  accounts: Account[];
  prizeRequests: PrizeRequest[];
  goalSubmissions: GoalSubmission[];
  classes: Class[];
}

export default function TeacherDashboard({
  user,
  students,
  accounts,
  prizeRequests,
  goalSubmissions,
  classes,
}: Readonly<TeacherDashboardProps>) {
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  const filteredAccounts = useMemo(() => (
    selectedClassId === 'all'
      ? accounts
      : accounts.filter(acc => acc.classId === selectedClassId)
  ), [accounts, selectedClassId]);

  const filteredPrizeRequests = useMemo(() => (
    selectedClassId === 'all'
      ? prizeRequests
      : prizeRequests.filter(request => request.classId === selectedClassId)
  ), [prizeRequests, selectedClassId]);

  const handleSelectStudent = (studentId: string) => {
    const student = students.find(u => u.id === studentId);
    if (student) {
      setSelectedStudent(student);
      setIsModalOpen(true);
    }
  };

  const selectedAccount = selectedStudent
    ? accounts.find(a => a.userId === selectedStudent.id)
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full mx-auto mb-8"
      >
        <div className="glass-strong rounded-2xl p-4 md:p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-cosmic flex items-center justify-center text-2xl overflow-hidden">
              {user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/')) ? (
                <Image src={user.avatar} alt={user.name} width={48} height={48} className="w-full h-full object-cover" />
              ) : (
                <span>{user.avatar || 'dYOY'}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user.name}!</h1>
              <p className="text-sm text-gray-400">Teacher Dashboard</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Students */}
        <div className="lg:col-span-2">
          <StudentOverviewGrid
            students={students}
            accounts={accounts}
            classes={classes}
            selectedClassId={selectedClassId}
            onChangeClass={setSelectedClassId}
            onSelectStudent={handleSelectStudent}
          />
        </div>

        {/* Right Column - Prize Requests */}
        <div>
          <PrizeRequestQueue requests={filteredPrizeRequests} />
        </div>
      </div>

      {/* Balance Management Modal */}
      <BalanceManagementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        account={selectedAccount || null}
      />

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full mx-auto mt-12 text-center text-gray-500 text-sm"
      >
        <p>Lumenarie Bank System ??? Astronomy & Earth Science</p>
      </motion.footer>
    </div>
  );
}


