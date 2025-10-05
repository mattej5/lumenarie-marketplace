'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { User, Account } from '@/lib/types';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface StudentOverviewGridProps {
  students: User[];
  accounts: Account[];
  onSelectStudent: (studentId: string) => void;
}

export default function StudentOverviewGrid({ students, accounts, onSelectStudent }: StudentOverviewGridProps) {
  const getAccountForStudent = (studentId: string) => {
    return accounts.find(a => a.userId === studentId);
  };

  const sortedStudents = [...students].sort((a, b) => {
    const accountA = getAccountForStudent(a.id);
    const accountB = getAccountForStudent(b.id);
    if (!accountA || !accountB) return 0;
    return accountB.balance - accountA.balance;
  });

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const averageBalance = Math.floor(totalBalance / accounts.length);

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
            <div className="w-10 h-10 rounded-lg bg-starlight-500/20 flex items-center justify-center">
              <span className="text-xl">👥</span>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Students</p>
              <p className="text-xl font-bold">{students.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Student Grid */}
      <div className="glass-strong rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>👨‍🎓</span> Students
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedStudents.map((student, index) => {
            const account = getAccountForStudent(student.id);
            if (!account) return null;

            const isAboveAverage = account.balance > averageBalance;

            return (
              <motion.button
                key={student.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectStudent(student.id)}
                className="glass hover:glass-strong rounded-xl p-4 text-left transition-all card-hover"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-cosmic flex items-center justify-center text-2xl overflow-hidden">
                      {student.avatar && (student.avatar.startsWith('http') || student.avatar.startsWith('/')) ? (
                        <Image
                          src={student.avatar}
                          alt={student.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{student.avatar || '👤'}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{student.name}</h3>
                      <p className="text-xs text-gray-400 truncate max-w-[120px]">
                        {student.email}
                      </p>
                    </div>
                  </div>
                  {isAboveAverage ? (
                    <TrendingUp className="w-4 h-4 text-aurora-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>

                <div className="glass rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Current Balance</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-starlight-400 to-cosmic-400 bg-clip-text text-transparent">
                      {account.balance.toLocaleString()}
                    </span>
                    <span className="text-lg">
                      {account.currency === 'star-credits' ? '⭐' : '🌍'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {isAboveAverage ? '+' : ''}
                    {account.balance - averageBalance} vs avg
                  </span>
                  <span className={`px-2 py-1 rounded-full ${
                    isAboveAverage ? 'bg-aurora-500/20 text-aurora-300' : 'bg-gray-600/20 text-gray-400'
                  }`}>
                    Rank #{index + 1}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
