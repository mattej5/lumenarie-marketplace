'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { LogOut, Users, TrendingUp, Award } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StudentOverviewGrid from '@/components/teacher/StudentOverviewGrid';
import BalanceManagementModal from '@/components/teacher/BalanceManagementModal';
import PrizeRequestQueue from '@/components/teacher/PrizeRequestQueue';
import {
  mockUsers,
  mockAccounts,
  mockPrizeRequests,
  mockDashboardStats,
  getAccountByUserId,
} from '@/lib/mockData';
import { User } from '@/lib/types';

export default function TeacherPage() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (user && user.role !== 'teacher') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleSelectStudent = (studentId: string) => {
    const student = mockUsers.find(u => u.id === studentId);
    if (student) {
      setSelectedStudent(student);
      setIsModalOpen(true);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" variant="galaxy" />
      </div>
    );
  }

  const students = mockUsers.filter(u => u.role === 'student');
  const selectedAccount = selectedStudent ? getAccountByUserId(selectedStudent.id) : null;

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-8"
      >
        <div className="glass-strong rounded-2xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-cosmic flex items-center justify-center text-2xl">
                {user.avatar || '🌟'}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome, {user.name}!</h1>
                <p className="text-sm text-gray-400">Teacher Dashboard</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 glass hover:glass-strong px-4 py-2 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-cosmic-400" />
                <span className="text-xs text-gray-400">Students</span>
              </div>
              <p className="text-2xl font-bold">{mockDashboardStats.totalStudents}</p>
            </div>

            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-aurora-400" />
                <span className="text-xs text-gray-400">Avg Balance</span>
              </div>
              <p className="text-2xl font-bold">{mockDashboardStats.averageBalance}</p>
            </div>

            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-starlight-400" />
                <span className="text-xs text-gray-400">Pending</span>
              </div>
              <p className="text-2xl font-bold">{mockDashboardStats.pendingRequests}</p>
            </div>

            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">💰</span>
                <span className="text-xs text-gray-400">Total Funds</span>
              </div>
              <p className="text-2xl font-bold">{mockDashboardStats.totalFunds.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Students */}
        <div className="lg:col-span-2">
          <StudentOverviewGrid
            students={students}
            accounts={mockAccounts}
            onSelectStudent={handleSelectStudent}
          />
        </div>

        {/* Right Column - Prize Requests */}
        <div>
          <PrizeRequestQueue requests={mockPrizeRequests} />
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
        account={selectedAccount}
      />

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="max-w-7xl mx-auto mt-12 text-center text-gray-500 text-sm"
      >
        <p>Lumenarie Bank System • Astronomy & Earth Science 🌟</p>
      </motion.footer>
    </div>
  );
}
