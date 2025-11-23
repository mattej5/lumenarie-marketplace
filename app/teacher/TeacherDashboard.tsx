'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, Users, TrendingUp, Award, GraduationCap, BookOpen, Target, ClipboardList } from 'lucide-react';
import { shouldUseMockAuth } from '@/lib/utils/env';
import Link from 'next/link';
import Image from 'next/image';
import StudentOverviewGrid from '@/components/teacher/StudentOverviewGrid';
import BalanceManagementModal from '@/components/teacher/BalanceManagementModal';
import PrizeRequestQueue from '@/components/teacher/PrizeRequestQueue';
import { User, Account, PrizeRequest, DashboardStats, GoalSubmission } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Class } from '@/lib/services/classes';

interface TeacherDashboardProps {
  user: User;
  students: User[];
  accounts: Account[];
  prizeRequests: PrizeRequest[];
  goalSubmissions: GoalSubmission[];
  stats: DashboardStats;
  classes: Class[];
}

export default function TeacherDashboard({
  user,
  students,
  accounts,
  prizeRequests,
  goalSubmissions,
  stats,
  classes,
}: Readonly<TeacherDashboardProps>) {
  const router = useRouter();
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [filteredStats, setFilteredStats] = useState<DashboardStats>(stats);
  const [_loadingStats, setLoadingStats] = useState(false);
  const { signOut } = useAuth();
  const useMockAuth = shouldUseMockAuth();

  const filteredAccounts = useMemo(() => (
    selectedClassId === 'all'
      ? accounts
      : accounts.filter(acc => acc.classId === selectedClassId)
  ), [accounts, selectedClassId]);

  const filteredStudents = useMemo(() => (
    selectedClassId === 'all'
      ? students
      : students.filter(student => filteredAccounts.some(acc => acc.userId === student.id))
  ), [filteredAccounts, selectedClassId, students]);

  const filteredPrizeRequests = useMemo(() => (
    selectedClassId === 'all'
      ? prizeRequests
      : prizeRequests.filter(request => request.classId === selectedClassId)
  ), [prizeRequests, selectedClassId]);

  const filteredGoalSubmissions = useMemo(() => (
    selectedClassId === 'all'
      ? goalSubmissions
      : goalSubmissions.filter(submission => submission.classId === selectedClassId)
  ), [goalSubmissions, selectedClassId]);



  const handleSignOut = async () => {
    // Call client-side signOut so AuthContext clears user immediately.
    try {
      await signOut();
    } catch (e) {
      console.error('[TeacherDashboard] signOut failed', e);
    } finally {
      router.push('/login');
    }
  };

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

  useEffect(() => {
    if (useMockAuth) {
      const totalFunds = filteredAccounts.reduce((sum, acc) => sum + acc.balance, 0);
      const averageBalance = filteredAccounts.length > 0
        ? Math.floor(totalFunds / filteredAccounts.length)
        : 0;

      setFilteredStats({
        totalStudents: filteredStudents.length,
        totalFunds,
        averageBalance,
        pendingRequests: filteredPrizeRequests.filter(r => r.status === 'pending').length,
        approvedToday: filteredPrizeRequests.filter(r => r.status === 'approved').length,
        totalTransactions: stats.totalTransactions,
      });
      return;
    }

    const fetchStats = async () => {
      if (selectedClassId === 'all') {
        setFilteredStats(stats);
        return;
      }

      setLoadingStats(true);
      try {
        const response = await fetch(`/api/stats?type=dashboard&classId=${selectedClassId}`);
        if (response.ok) {
          const data = await response.json();
          setFilteredStats(data.stats);
        }
      } catch (error) {
        console.error('Error fetching filtered stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [useMockAuth, selectedClassId, stats, filteredAccounts, filteredPrizeRequests, filteredStudents]);

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

            <div className="flex items-center gap-2">
              <Link
                href="/teacher/classes"
                className="flex items-center gap-2 glass hover:glass-strong px-4 py-2 rounded-lg transition-all"
              >
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline">Classes</span>
              </Link>
              <Link
                href="/teacher/prizes"
                className="flex items-center gap-2 glass hover:glass-strong px-4 py-2 rounded-lg transition-all"
              >
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Prizes</span>
              </Link>
              <Link
                href="/teacher/classes/create"
                className="flex items-center gap-2 glass hover:glass-strong px-4 py-2 rounded-lg transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Create Class</span>
              </Link>
              <Link
                href="/teacher/goals"
                className="flex items-center gap-2 glass hover:glass-strong px-4 py-2 rounded-lg transition-all"
              >
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Goals</span>
              </Link>
              <Link
                href="/teacher/goals/review"
                className="flex items-center gap-2 glass hover:glass-strong px-4 py-2 rounded-lg transition-all"
              >
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Submissions</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 glass hover:glass-strong px-4 py-2 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-cosmic-400" />
                <span className="text-xs text-gray-400">Students</span>
              </div>
              <p className="text-2xl font-bold">{filteredStats.totalStudents}</p>
            </div>

            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-aurora-400" />
                <span className="text-xs text-gray-400">Avg Balance</span>
              </div>
              <p className="text-2xl font-bold">{filteredStats.averageBalance}</p>
            </div>

            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-starlight-400" />
                <span className="text-xs text-gray-400">Prize Requests</span>
              </div>
              <p className="text-2xl font-bold">{filteredPrizeRequests.filter(r => r.status === 'pending').length}</p>
            </div>

            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-gray-400">Goal Submissions</span>
              </div>
              <p className="text-2xl font-bold">{filteredGoalSubmissions.length}</p>
            </div>

            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">dY'?</span>
                <span className="text-xs text-gray-400">Total Funds</span>
              </div>
              <p className="text-2xl font-bold">{filteredStats.totalFunds.toLocaleString()}</p>
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
        className="max-w-7xl mx-auto mt-12 text-center text-gray-500 text-sm"
      >
        <p>Lumenarie Bank System ??? Astronomy & Earth Science dYOY</p>
      </motion.footer>
    </div>
  );
}









