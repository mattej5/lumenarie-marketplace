'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Filter, Search, CheckSquare, Gift, Square } from 'lucide-react';
import { User, Account } from '@/lib/types';
import { Class } from '@/lib/services/classes';
import BulkAwardModal from './BulkAwardModal';

interface StudentOverviewGridProps {
  students: User[];
  accounts: Account[];
  classes: Class[];
  selectedClassId: string;
  onChangeClass: (classId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export default function StudentOverviewGrid({
  students,
  accounts,
  classes,
  selectedClassId,
  onChangeClass,
  onSelectStudent,
}: StudentOverviewGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const filteredStudents = useMemo(() => {
    const byClass = selectedClassId === 'all'
      ? students
      : students.filter(student => {
          const account = accounts.find(a => a.userId === student.id);
          return account?.classId === selectedClassId;
        });

    const query = searchTerm.trim().toLowerCase();
    if (!query) return byClass;

    return byClass.filter(student =>
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query)
    );
  }, [accounts, searchTerm, selectedClassId, students]);

  const getAccountForStudent = useCallback((studentId: string) => {
    return accounts.find(a => {
      if (a.userId !== studentId) return false;
      if (selectedClassId === 'all') return true;
      return a.classId === selectedClassId;
    });
  }, [accounts, selectedClassId]);

  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      const accountA = getAccountForStudent(a.id);
      const accountB = getAccountForStudent(b.id);
      if (!accountA || !accountB) return 0;
      return accountB.balance - accountA.balance;
    });
  }, [filteredStudents, getAccountForStudent]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const belongsToStudent = filteredStudents.some(student => student.id === acc.userId);
      const matchesClass = selectedClassId === 'all' || acc.classId === selectedClassId;
      return belongsToStudent && matchesClass;
    });
  }, [accounts, filteredStudents, selectedClassId]);

  const totalBalance = filteredAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const averageBalance = filteredAccounts.length > 0
    ? Math.floor(totalBalance / filteredAccounts.length)
    : 0;

  useEffect(() => {
    setSelectedStudentIds((prev) =>
      prev.filter((id) => filteredStudents.some((student) => student.id === id))
    );
  }, [filteredStudents]);

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllVisible = () => {
    setSelectedStudentIds(
      filteredStudents
        .filter((student) => getAccountForStudent(student.id))
        .map((student) => student.id)
    );
  };

  const clearSelection = () => setSelectedStudentIds([]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cosmic-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-cosmic-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Funds</p>
              <p className="text-xl font-bold">{totalBalance.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-aurora-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-aurora-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Average Balance</p>
              <p className="text-xl font-bold">{averageBalance.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-strong rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm text-gray-400">Total Students</p>
              <p className="text-xl font-bold">{filteredStudents.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Student Grid */}
      <div className="glass-strong rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Your Students
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students"
                className="glass pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cosmic-500 bg-gray-900/50 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedClassId}
                onChange={(e) => onChangeClass(e.target.value)}
                className="glass px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cosmic-500 bg-gray-900/50 text-white [&>option]:text-gray-900 [&>option]:bg-white"
              >
                <option value="all">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.subject})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllVisible}
                className="glass px-3 py-2 rounded-lg text-sm hover:glass-strong transition-all"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="glass px-3 py-2 rounded-lg text-sm hover:glass-strong transition-all"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(true)}
                disabled={selectedStudentIds.length === 0}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all glass ${
                  selectedStudentIds.length === 0
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:glass-strong'
                }`}
              >
                <Gift className="w-4 h-4" />
                Award selected ({selectedStudentIds.length})
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedStudents.map((student, index) => {
            const account = getAccountForStudent(student.id);
            if (!account) return null;

            const isAboveAverage = account.balance > averageBalance;
            const isSelected = selectedStudentIds.includes(student.id);

            return (
              <motion.button
                key={student.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectStudent(student.id)}
                className={`relative glass hover:glass-strong rounded-lg p-4 text-left transition-all card-hover ${
                  isSelected ? 'ring-2 ring-cosmic-400' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStudentSelection(student.id);
                  }}
                  className="absolute top-3 right-3 glass hover:glass-strong rounded-md p-1.5"
                  aria-label={isSelected ? 'Deselect student' : 'Select student'}
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-cosmic-300" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base break-words whitespace-normal leading-5">
                          {student.name}
                        </h3>
                        <p className="text-xs text-gray-400 truncate">
                          {student.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300 font-semibold">Balance</span>
                    {isAboveAverage ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-white" style={{ color: '#ffffff' }}>
                      {account?.balance ?? 0}
                    </span>
                    <span className="text-xl">
                      {account.currency === 'star-credits' ? 'SC' : 'EP'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    {isAboveAverage ? '+' : ''}
                    {(account.balance - averageBalance).toLocaleString()} vs avg
                  </span>
                  <span className="text-gray-500">Click to manage</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <BulkAwardModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedStudentIds={selectedStudentIds}
        students={students}
        accounts={accounts}
        classes={classes}
        selectedClassId={selectedClassId}
      />
    </div>
  );
}

