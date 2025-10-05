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

export default function PrizeRequestForm({ prizes, currency, currentBalance, classId }: PrizeRequestFormProps) {
  const [selectedPrize, setSelectedPrize] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { shootingStars } = useConfetti();

  const availablePrizes = prizes.filter(p => p.available);
  const selectedPrizeData = availablePrizes.find(p => p.id === selectedPrize);
  const canAfford = selectedPrizeData ? currentBalance >= selectedPrizeData.cost : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPrize || !selectedPrizeData) {
      toast.error('Please select a prize');
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
                        <div>
                          <div className="font-medium">{prize.name}</div>
                          <div className="text-xs text-gray-400">{prize.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          currentBalance >= prize.cost ? 'text-aurora-400' : 'text-gray-500'
                        }`}>
                          {prize.cost} {currency === 'star-credits' ? '⭐' : '🌍'}
                        </div>
                        {currentBalance < prize.cost && (
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
                        <div>
                          <div className="font-medium">{prize.name}</div>
                          <div className="text-xs text-gray-400">{prize.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          currentBalance >= prize.cost ? 'text-aurora-400' : 'text-gray-500'
                        }`}>
                          {prize.cost} {currency === 'star-credits' ? '⭐' : '🌍'}
                        </div>
                        {currentBalance < prize.cost && (
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
                        <div>
                          <div className="font-medium">{prize.name}</div>
                          <div className="text-xs text-gray-400">{prize.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          currentBalance >= prize.cost ? 'text-aurora-400' : 'text-gray-500'
                        }`}>
                          {prize.cost} {currency === 'star-credits' ? '⭐' : '🌍'}
                        </div>
                        {currentBalance < prize.cost && (
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

        {selectedPrizeData && !canAfford && (
          <p className="text-sm text-orange-400 text-center">
            You need {selectedPrizeData.cost - currentBalance} more {currency === 'star-credits' ? '⭐' : '🌍'} to request this prize
          </p>
        )}
      </form>
    </motion.div>
  );
}
