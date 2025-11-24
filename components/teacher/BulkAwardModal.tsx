'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Users, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { User, Account } from '@/lib/types';
import { Class } from '@/lib/services/classes';
import { showSuccess } from '@/lib/ui/snackbar';

interface BulkAwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudentIds: string[];
  students: User[];
  accounts: Account[];
  classes: Class[];
  selectedClassId: string;
}

export default function BulkAwardModal({
  isOpen,
  onClose,
  selectedStudentIds,
  students,
  accounts,
  classes,
  selectedClassId,
}: BulkAwardModalProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [classId, setClassId] = useState<string>(selectedClassId === 'all' ? '' : selectedClassId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setClassId(selectedClassId === 'all' ? '' : selectedClassId);
  }, [selectedClassId]);

  const selectedStudents = useMemo(
    () => students.filter((student) => selectedStudentIds.includes(student.id)),
    [selectedStudentIds, students]
  );

  const hasMultiClassStudents = useMemo(() => {
    if (classId) return false;
    return selectedStudentIds.some((id) => accounts.filter((acc) => acc.userId === id).length > 1);
  }, [accounts, classId, selectedStudentIds]);

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

    if (hasMultiClassStudents) {
      toast.error('Select a class to disambiguate students in multiple classes');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          amount: numericAmount,
          reason: reason.trim(),
          classId: classId || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to award credits');
      }

      showSuccess(`Awarded ${numericAmount} to ${selectedStudentIds.length} students`);
      setAmount('');
      setReason('');
      onClose();
      window.location.reload();
    } catch (error: any) {
      console.error('Bulk award error:', error);
      toast.error(error.message || 'Failed to award credits');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-strong rounded-2xl p-6 w-full max-w-lg shadow-cosmic"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-aurora-300" />
                    <h2 className="text-xl font-bold">Award Credits</h2>
                  </div>
                  <p className="text-sm text-gray-400">
                    {selectedStudentIds.length} student{selectedStudentIds.length === 1 ? '' : 's'} selected
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="glass hover:glass-strong rounded-lg p-2 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-3 mb-4 text-sm text-gray-200">
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 text-cosmic-300" />
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {selectedStudents.map((student) => (
                      <div key={student.id} className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-gradient-cosmic text-xs flex items-center justify-center">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-gray-100">{student.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {selectedClassId === 'all' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Class (optional)</label>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="w-full glass-strong rounded-xl px-3 py-2 bg-transparent border border-gray-700 focus:border-cosmic-500 focus:ring-2 focus:ring-cosmic-500/30 outline-none text-sm"
                    >
                      <option value="" className="text-gray-900">Use each student&rsquo;s default account</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id} className="text-gray-900">
                          {cls.name} ({cls.subject})
                        </option>
                      ))}
                    </select>
                    {hasMultiClassStudents && (
                      <p className="text-xs text-orange-300 mt-1">
                        Some students have multiple classes. Choose a class to target their account.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full glass-strong rounded-xl px-4 py-3 bg-transparent border border-gray-600 focus:border-cosmic-500 focus:ring-2 focus:ring-cosmic-500/20 outline-none transition-all text-lg"
                    placeholder="Enter amount to award"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Reason</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full glass-strong rounded-xl px-4 py-3 bg-transparent border border-gray-600 focus:border-cosmic-500 focus:ring-2 focus:ring-cosmic-500/20 outline-none transition-all resize-none"
                    rows={3}
                    placeholder="Why are you awarding these credits?"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 glass hover:glass-strong py-3 rounded-xl font-medium transition-all"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                      isSubmitting
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-cosmic text-white shadow-cosmic hover:shadow-lg'
                    }`}
                  >
                    {isSubmitting ? 'Processing...' : 'Award Credits'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
