'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Account } from '@/lib/types';
import { getCurrencySymbol } from '@/lib/currency';

interface BalanceCardProps {
  account: Account;
}

export default function BalanceCard({ account }: Readonly<BalanceCardProps>) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardHeight, setCardHeight] = useState<number>(0);
  const [iconSize, setIconSize] = useState<number>(24);

  useEffect(() => {
    const controls = animate(count, account.balance, {
      duration: 1.5,
      ease: 'easeOut',
    });
    return controls.stop;
  }, [account.balance, count]);

  // Observe card height (basis for maximum icon size)
  useEffect(() => {
    if (!cardRef.current) return;
    const el = cardRef.current;
    const update = () => setCardHeight(el.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Icon size = (balance * 2)% of container height
  useEffect(() => {
    const percent = Math.max(0, Math.min(account.balance * 5, 100));
    const maxSize = Math.max(24, cardHeight);
    const px = Math.max(16, Math.round((percent / 100) * maxSize));
    setIconSize(px);
  }, [account.balance, cardHeight]);

  const symbol = getCurrencySymbol(account.currency);
  const currencyName = account.currency === 'star-credits' ? 'Star Credits' : 'Earth Points';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="relative overflow-hidden glass-strong rounded-3xl p-8 shadow-cosmic"
      ref={cardRef}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-cosmic opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-cosmic-500/10 via-transparent to-aurora-500/10 animate-pulse-slow" />

      {/* Emoji quantity visualization */}
      {/* We render up to a reasonable max and summarize the rest */}
      {(() => {
        const icon = account.currency === 'star-credits' ? '⭐' : '🌍';
        const MAX = 200; // cap for performance/clarity
        const visible = Math.max(0, Math.min(account.balance, MAX));
        const remaining = Math.max(0, account.balance - visible);
        return (
          <div className="absolute top-4 right-4 max-w-[60%] text-right">
            <div className="flex flex-wrap gap-1 justify-end" aria-label={`${account.balance} ${currencyName}`}>
              {Array.from({ length: visible }).map((_, i) => (
                <span key={i} className="text-xl leading-none select-none">{icon}</span>
              ))}
              {remaining > 0 && (
                <span className="ml-2 text-xs text-gray-300 align-middle">+{remaining}</span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{symbol}</span>
          <h3 className="text-lg font-medium text-gray-300">Account Balance</h3>
        </div>

        <motion.div className="flex items-baseline gap-2 mb-1">
          <motion.span className="text-6xl font-bold text-white">
            {rounded}
          </motion.span>
        </motion.div>

        <p className="text-sm text-gray-400">{currencyName}</p>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-6 h-1 bg-gradient-to-r from-cosmic-500 via-aurora-500 to-starlight-500 rounded-full"
        />

        <p className="text-xs text-gray-500 mt-3">
          Last updated: {new Date(account.lastUpdated).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
}
