'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Prize } from '@/lib/types';
import { Rocket, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfetti } from '@/hooks/useConfetti';

interface PrizeRequestFormProps {
  prizes: Prize[];
  currency: 'star-credits' | 'earth-points';
  currentBalance: number;
  classId: string;
}

export default function PrizeRequestForm({ prizes, currency, currentBalance, classId }: Readonly<PrizeRequestFormProps>) {
  const [selectedPrize, setSelectedPrize] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customAmount, setCustomAmount] = useState<number>(2);
  const { shootingStars } = useConfetti();

  const availablePrizes = prizes.filter(
    (p) => p.available && (!p.classId || p.classId === classId)
  );
  const selectedPrizeData = availablePrizes.find(p => p.id === selectedPrize);
  const isCrowdfunded = selectedPrizeData?.cost === 0;
  const effectiveCost = isCrowdfunded ? customAmount : (selectedPrizeData?.cost || 0);
  const canAfford = selectedPrizeData ? currentBalance >= effectiveCost : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPrize || !selectedPrizeData) {
      toast.error('Please select a prize');
      return;
    }

    if (isCrowdfunded && customAmount < 2) {
      toast.error('Minimum contribution is 2');
      return;
    }

    if (!canAfford) {
      toast.error('Insufficient balance for this prize');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/prize-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prizeId: selectedPrize,
          classId,
          customAmount: isCrowdfunded ? customAmount : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit prize request');
      }

      shootingStars();
      toast.success('Prize request submitted! 🚀', {
        duration: 5000,
        icon: '🎉',
      });

      // Reset form
      setSelectedPrize('');
      setCustomAmount(2);

      // Refresh to show new request and updated balance
      window.location.reload();
    } catch (error: any) {
      console.error('Prize request error:', error);
      toast.error(error.message || 'Failed to submit prize request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPrizesByCategory = (category: Prize['category']) => {
    return availablePrizes.filter(p => p.category === category);
  };

  const renderPrizeName = (prize: Prize) => {
    const isCrowdfundedPrize = prize.cost === 0;

    return (
      <div>
        <div className="font-medium flex items-center gap-2">
          {prize.name}
          {isCrowdfundedPrize && (
            <span className="text-xs bg-aurora-500/20 text-aurora-400 px-2 py-0.5 rounded-full">
              Crowdfunded
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400">{prize.description}</div>
      </div>
    );
  };

  const renderPrizeCost = (prize: Prize) => {
    const isCrowdfundedPrize = prize.cost === 0;
    const isSelected = selectedPrize === prize.id;

    if (isCrowdfundedPrize && isSelected) {
      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCustomAmount(prev => Math.max(2, prev - 1));
            }}
            className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white font-bold transition-colors"
          >
            −
          </button>
          <div className="text-center min-w-[80px]">
            <div className="font-semibold text-aurora-400">
              {customAmount} {currency === 'star-credits' ? '⭐' : '🌍'}
            </div>
            {customAmount >= currentBalance && (
              <div className="text-xs text-orange-400">Max</div>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCustomAmount(prev => Math.min(currentBalance, prev + 1));
            }}
            disabled={customAmount >= currentBalance}
            className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      );
    }

    if (isCrowdfundedPrize) {
      return (
        <div className="text-center">
          <div className="text-aurora-400 font-semibold text-sm">
            You choose
          </div>
          <div className="text-xs text-gray-400">
            (min 2 {currency === 'star-credits' ? '⭐' : '🌍'})
          </div>
        </div>
      );
    }

    return (
      <div className={`font-semibold ${
        currentBalance >= prize.cost ? 'text-aurora-400' : 'text-gray-500'
      }`}>
        {prize.cost} {currency === 'star-credits' ? '⭐' : '🌍'}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-strong rounded-2xl p-6 shadow-starlight"
    >
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Rocket className="w-6 h-6 text-starlight-400" />
        Request a Prize
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Prize Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">Select Prize</label>

          {/* Astronomy Prizes */}
          {getPrizesByCategory('astronomy').length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <span>🔭</span> Astronomy
              </h3>
              <div className="space-y-2">
                {getPrizesByCategory('astronomy').map(prize => (
                  <motion.button
                    key={prize.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPrize(prize.id)}
                    className={`w-full glass hover:glass-strong p-4 rounded-xl text-left transition-all ${
                      selectedPrize === prize.id ? 'ring-2 ring-cosmic-500 bg-cosmic-500/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{prize.icon}</span>
                        {renderPrizeName(prize)}
                      </div>
                      <div className="text-right">
                        {renderPrizeCost(prize)}
                        {prize.cost > 0 && currentBalance < prize.cost && (
                          <div className="text-xs text-orange-400">Insufficient funds</div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Earth Science Prizes */}
          {getPrizesByCategory('earth-science').length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <span>🌍</span> Earth Science
              </h3>
              <div className="space-y-2">
                {getPrizesByCategory('earth-science').map(prize => (
                  <motion.button
                    key={prize.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPrize(prize.id)}
                    className={`w-full glass hover:glass-strong p-4 rounded-xl text-left transition-all ${
                      selectedPrize === prize.id ? 'ring-2 ring-aurora-500 bg-aurora-500/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{prize.icon}</span>
                        {renderPrizeName(prize)}
                      </div>
                      <div className="text-right">
                        {renderPrizeCost(prize)}
                        {prize.cost > 0 && currentBalance < prize.cost && (
                          <div className="text-xs text-orange-400">Insufficient funds</div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* General Prizes */}
          {getPrizesByCategory('general').length > 0 && (
            <div>
              <h3 className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <span>🎁</span> General
              </h3>
              <div className="space-y-2">
                {getPrizesByCategory('general').map(prize => (
                  <motion.button
                    key={prize.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPrize(prize.id)}
                    className={`w-full glass hover:glass-strong p-4 rounded-xl text-left transition-all ${
                      selectedPrize === prize.id ? 'ring-2 ring-starlight-500 bg-starlight-500/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{prize.icon}</span>
                        {renderPrizeName(prize)}
                      </div>
                      <div className="text-right">
                        {renderPrizeCost(prize)}
                        {prize.cost > 0 && currentBalance < prize.cost && (
                          <div className="text-xs text-orange-400">Insufficient funds</div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={!selectedPrize || !canAfford || isSubmitting}
          whileHover={{ scale: selectedPrize && canAfford ? 1.02 : 1 }}
          whileTap={{ scale: selectedPrize && canAfford ? 0.98 : 1 }}
          className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            selectedPrize && canAfford && !isSubmitting
              ? 'bg-gradient-cosmic text-white shadow-cosmic hover:shadow-lg'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Submitting Request...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Prize Request
            </>
          )}
        </motion.button>

        {selectedPrizeData && !canAfford && !isCrowdfunded && (
          <p className="text-sm text-orange-400 text-center">
            You need {effectiveCost - currentBalance} more {currency === 'star-credits' ? '⭐' : '🌍'} to request this prize
          </p>
        )}
      </form>
    </motion.div>
  );
}
