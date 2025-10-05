'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { LogOut, User } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import BalanceCard from '@/components/student/BalanceCard';
import TransactionHistory from '@/components/student/TransactionHistory';
import PrizeRequestForm from '@/components/student/PrizeRequestForm';
import PendingRequests from '@/components/student/PendingRequests';
import {
  getAccountByUserId,
  getTransactionsByUserId,
  getPrizeRequestsByStudentId,
  mockPrizes,
} from '@/lib/mockData';

export default function DashboardPage() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (user && user.role === 'teacher') {
      router.push('/teacher');
    }
  }, [user, isLoading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" variant="galaxy" />
      </div>
    );
  }

  const account = getAccountByUserId(user.id);
  const transactions = getTransactionsByUserId(user.id);
  const prizeRequests = getPrizeRequestsByStudentId(user.id);

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400">Account not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-8"
      >
        <div className="glass-strong rounded-2xl p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-cosmic flex items-center justify-center text-2xl">
              {user.avatar || '👤'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user.name}!</h1>
              <p className="text-sm text-gray-400">Student Dashboard</p>
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
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Balance and Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <BalanceCard account={account} />
          <TransactionHistory transactions={transactions.slice(0, 10)} currency={account.currency} />
        </div>

        {/* Right Column - Prize Requests */}
        <div className="space-y-6">
          <PrizeRequestForm
            prizes={mockPrizes}
            currency={account.currency}
            currentBalance={account.balance}
          />
          <PendingRequests requests={prizeRequests} currency={account.currency} />
        </div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="max-w-7xl mx-auto mt-12 text-center text-gray-500 text-sm"
      >
        <p>Keep up the great work! 🌟</p>
      </motion.footer>
    </div>
  );
}
