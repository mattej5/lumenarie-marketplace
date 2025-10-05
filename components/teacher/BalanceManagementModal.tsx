'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Save } from 'lucide-react';
import { User, Account } from '@/lib/types';
import { formatCurrencyShort } from '@/lib/currency';
import toast from 'react-hot-toast';

interface BalanceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: User | null;
  account: Account | null;
}

export default function BalanceManagementModal({
  isOpen,
  onClose,
  student,
  account,
}: BalanceManagementModalProps) {
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!student || !account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (transactionType === 'withdrawal' && numAmount > account.balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: account.id,
          type: transactionType,
          amount: numAmount,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create transaction');
      }

      const verb = transactionType === 'deposit' ? 'added to' : 'deducted from';
      toast.success(
        `${numAmount} ${account.currency === 'star-credits' ? '⭐' : '🌍'} ${verb} ${student.name}'s account!`,
        { duration: 5000 }
      );

      // Reset form
      setAmount('');
      setReason('');
      onClose();

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error: any) {
      console.error('Transaction error:', error);
      toast.error(error.message || 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-strong rounded-2xl p-6 w-full max-w-md shadow-cosmic"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Manage Balance</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {student.name} • Current: {formatCurrencyShort(account.balance, account.currency)}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="glass hover:glass-strong rounded-lg p-2 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Transaction Type Toggle */}
                <div>
                  <label className="block text-sm font-medium mb-3">Transaction Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTransactionType('deposit')}
                      className={`py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                        transactionType === 'deposit'
                          ? 'bg-gradient-cosmic text-white shadow-cosmic'
                          : 'glass hover:glass-strong'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      Deposit
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransactionType('withdrawal')}
                      className={`py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                        transactionType === 'withdrawal'
                          ? 'bg-gradient-cosmic text-white shadow-cosmic'
                          : 'glass hover:glass-strong'
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                      Withdrawal
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium mb-2">
                    Amount {account.currency === 'star-credits' ? '⭐' : '🌍'}
                  </label>
                  <input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount..."
                    min="1"
                    className="w-full glass-strong rounded-xl px-4 py-3 bg-transparent border border-gray-600 focus:border-cosmic-500 focus:ring-2 focus:ring-cosmic-500/20 outline-none transition-all text-lg"
                    required
                  />
                  {transactionType === 'withdrawal' && amount && parseInt(amount) > account.balance && (
                    <p className="text-xs text-orange-400 mt-1">
                      Amount exceeds current balance
                    </p>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium mb-2">
                    Reason
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why are you making this transaction?"
                    rows={3}
                    className="w-full glass-strong rounded-xl px-4 py-3 bg-transparent border border-gray-600 focus:border-cosmic-500 focus:ring-2 focus:ring-cosmic-500/20 outline-none transition-all resize-none"
                    required
                  />
                </div>

                {/* Preview */}
                {amount && parseInt(amount) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">New Balance:</span>
                      <span className="font-bold text-lg">
                        {transactionType === 'deposit'
                          ? account.balance + parseInt(amount)
                          : account.balance - parseInt(amount)}
                        {' '}
                        {account.currency === 'star-credits' ? '⭐' : '🌍'}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 glass hover:glass-strong py-3 rounded-xl font-medium transition-all"
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
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
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
