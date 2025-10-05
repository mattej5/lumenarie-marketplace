'use client';

import { motion } from 'framer-motion';
import { Transaction } from '@/lib/types';
import { ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';
import { formatCurrencyShort } from '@/lib/currency';

interface TransactionHistoryProps {
  transactions: Transaction[];
  currency: 'star-credits' | 'earth-points';
}

export default function TransactionHistory({ transactions, currency }: TransactionHistoryProps) {
  const getIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpCircle className="w-5 h-5 text-aurora-400" />;
      case 'withdrawal':
      case 'prize-redemption':
        return <ArrowDownCircle className="w-5 h-5 text-earth-sunset" />;
      case 'adjustment':
        return <RefreshCw className="w-5 h-5 text-starlight-400" />;
      default:
        return <RefreshCw className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'prize-redemption':
        return 'Prize Redemption';
      case 'adjustment':
        return 'Adjustment';
      default:
        return type;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-strong rounded-2xl p-6 shadow-aurora"
    >
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span>📜</span> Transaction History
      </h2>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🌟</p>
            <p>No transactions yet</p>
          </div>
        ) : (
          transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass hover:glass-strong rounded-xl p-4 transition-all card-hover"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{getIcon(transaction.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{getTypeLabel(transaction.type)}</span>
                      {transaction.type === 'deposit' && (
                        <span className="text-xs bg-aurora-500/20 text-aurora-300 px-2 py-0.5 rounded-full">
                          +{formatCurrencyShort(transaction.amount, currency)}
                        </span>
                      )}
                      {(transaction.type === 'withdrawal' || transaction.type === 'prize-redemption') && (
                        <span className="text-xs bg-earth-sunset/20 text-orange-300 px-2 py-0.5 rounded-full">
                          -{formatCurrencyShort(transaction.amount, currency)}
                        </span>
                      )}
                    </div>
                    {transaction.reason && (
                      <p className="text-sm text-gray-400 truncate">{transaction.reason}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-semibold ${
                    transaction.type === 'deposit' ? 'text-aurora-400' : 'text-gray-300'
                  }`}>
                    {transaction.type === 'deposit' ? '+' : '-'}
                    {transaction.amount}
                  </div>
                  <div className="text-xs text-gray-500">
                    Balance: {transaction.balanceAfter}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
