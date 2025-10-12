'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import Image from 'next/image';
import BalanceCard from '@/components/student/BalanceCard';
import TransactionHistory from '@/components/student/TransactionHistory';
import PrizeRequestForm from '@/components/student/PrizeRequestForm';
import PendingRequests from '@/components/student/PendingRequests';
import GoalsSelector from '@/components/student/GoalsSelector';
import { User, Account, Transaction, Prize, PrizeRequest } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

interface StudentDashboardProps {
  user: User;
  account: Account;
  transactions: Transaction[];
  prizes: Prize[];
  prizeRequests: PrizeRequest[];
  classId: string;
  className: string;
}

export default function StudentDashboard({
  user,
  account,
  transactions,
  prizes,
  prizeRequests,
  classId,
  className,
}: Readonly<StudentDashboardProps>) {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('[StudentDashboard] signOut failed', e);
    } finally {
      router.push('/login');
    }
  };

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
            <div className="w-12 h-12 rounded-full bg-gradient-cosmic flex items-center justify-center text-2xl overflow-hidden">
              {user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/')) ? (
                <Image src={user.avatar} alt={user.name} width={48} height={48} className="w-full h-full object-cover" />
              ) : (
                <span>{user.avatar || '👤'}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome to {className}, {user.name}!</h1>
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
          <PrizeRequestForm
            prizes={prizes}
            currency={account.currency}
            currentBalance={account.balance}
            classId={classId}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <GoalsSelector classId={classId} />
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
