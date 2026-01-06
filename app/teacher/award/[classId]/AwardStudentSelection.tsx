'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, DollarSign, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { User, Account } from '@/lib/types';
import { Class } from '@/lib/services/classes';
import { showSuccess } from '@/lib/ui/snackbar';
import Image from 'next/image';

interface Props {
  user: User;
  classItem: Class;
  students: User[];
  accounts: Account[];
}

export default function AwardStudentSelection({
  user,
  classItem,
  students,
  accounts,
}: Props) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set(students.map(s => s.id))
  );
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleStudent = (studentId: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudentIds(newSet);
  };

  const toggleAll = () => {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map(s => s.id)));
    }
  };

  const studentsWithBalances = useMemo(() => {
    return students.map(student => {
      const account = accounts.find(a => a.userId === student.id);
      return {
        ...student,
        balance: account?.balance ?? 0,
      };
    });
  }, [students, accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = parseInt(amount, 10);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    if (selectedStudentIds.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudentIds),
          amount: numericAmount,
          reason: reason.trim(),
          classId: classItem.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to award credits');
      }

      showSuccess(
        `Successfully awarded ${numericAmount} credits to ${selectedStudentIds.size} student${
          selectedStudentIds.size === 1 ? '' : 's'
        }`
      );
      setAmount('');
      setReason('');

      // Refresh the page to show updated balances
      window.location.reload();
    } catch (error: any) {
      console.error('Bulk award error:', error);
      toast.error(error.message || 'Failed to award credits');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto mb-8"
      >
        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/teacher/award"
              className="glass hover:glass-strong p-2 rounded-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{classItem.name}</h1>
              <p className="text-sm text-gray-400 mt-1 capitalize">
                {classItem.subject.replace('-', ' ')} • Award Credits to Students
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Students Table */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-strong rounded-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-cosmic-300" />
                  <h2 className="text-xl font-semibold">
                    Students ({students.length})
                  </h2>
                </div>
                <button
                  onClick={toggleAll}
                  className="text-sm text-cosmic-300 hover:text-cosmic-200 font-medium transition-colors"
                >
                  {selectedStudentIds.size === students.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {selectedStudentIds.size} of {students.length} selected
              </p>
            </div>

            {students.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400">No students in this class yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/40">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Select
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Current Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {studentsWithBalances.map((student, index) => {
                      const isSelected = selectedStudentIds.has(student.id);
                      return (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`transition-colors ${
                            isSelected ? 'bg-cosmic-900/20' : 'hover:bg-gray-900/20'
                          }`}
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleStudent(student.id)}
                              className="w-5 h-5 rounded border-gray-600 bg-transparent checked:bg-cosmic-500 focus:ring-2 focus:ring-cosmic-500 focus:ring-offset-0 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-cosmic flex items-center justify-center text-sm overflow-hidden">
                                {student.avatar &&
                                (student.avatar.startsWith('http') ||
                                  student.avatar.startsWith('/')) ? (
                                  <Image
                                    src={student.avatar}
                                    alt={student.name}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>
                                    {student.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{student.name}</div>
                                <div className="text-sm text-gray-400">
                                  {student.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-lg font-semibold text-cosmic-300">
                              <DollarSign className="w-4 h-4" />
                              {student.balance.toLocaleString()}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column - Award Form */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-strong rounded-2xl p-6 sticky top-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-aurora-300" />
              <h2 className="text-xl font-bold">Award Credits</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount per Student
                </label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full glass-strong rounded-xl px-4 py-3 bg-transparent border border-gray-600 focus:border-cosmic-500 focus:ring-2 focus:ring-cosmic-500/20 outline-none transition-all text-lg"
                  placeholder="Enter amount"
                  required
                  disabled={selectedStudentIds.size === 0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full glass-strong rounded-xl px-4 py-3 bg-transparent border border-gray-600 focus:border-cosmic-500 focus:ring-2 focus:ring-cosmic-500/20 outline-none transition-all resize-none"
                  rows={4}
                  placeholder="Why are you awarding these credits?"
                  required
                  disabled={selectedStudentIds.size === 0}
                />
              </div>

              <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Selected Students:</span>
                  <span className="font-semibold">{selectedStudentIds.size}</span>
                </div>
                {amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total to Award:</span>
                    <span className="font-semibold text-cosmic-300">
                      ${(parseInt(amount, 10) || 0) * selectedStudentIds.size}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || selectedStudentIds.size === 0}
                className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                  isSubmitting || selectedStudentIds.size === 0
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-cosmic text-white shadow-cosmic hover:shadow-lg'
                }`}
              >
                {isSubmitting ? (
                  'Processing...'
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Award Credits
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
