'use client';

import { motion } from 'framer-motion';
import { PrizeRequest } from '@/lib/types';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface PendingRequestsProps {
  requests: PrizeRequest[];
  currency: 'star-credits' | 'earth-points';
}

export default function PendingRequests({ requests, currency }: PendingRequestsProps) {
  const getStatusIcon = (status: PrizeRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-starlight-400 animate-pulse" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-aurora-400" />;
      case 'denied':
        return <XCircle className="w-5 h-5 text-earth-sunset" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: PrizeRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-starlight-500/20 text-starlight-300';
      case 'approved':
        return 'bg-aurora-500/20 text-aurora-300';
      case 'denied':
        return 'bg-earth-sunset/20 text-orange-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (requests.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-strong rounded-2xl p-6 text-center"
      >
        <div className="text-4xl mb-2">📦</div>
        <p className="text-gray-400">No prize requests yet</p>
        <p className="text-sm text-gray-500 mt-1">Submit a request to see it here</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-strong rounded-2xl p-6"
    >
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span>🎁</span> Your Prize Requests
      </h2>

      <div className="space-y-3">
        {requests.map((request, index) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass hover:glass-strong rounded-xl p-4 transition-all card-hover"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">{getStatusIcon(request.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium">{request.prizeName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-400 mb-1">
                    Cost: {request.prizeCost} {currency === 'star-credits' ? '⭐' : '🌍'}
                  </div>

                  {request.reason && (
                    <p className="text-sm text-gray-400 italic mb-2">
                      "{request.reason}"
                    </p>
                  )}

                  {request.reviewNotes && (
                    <div className="text-sm glass rounded-lg p-2 mt-2">
                      <span className="text-gray-400">Teacher's note: </span>
                      <span className="text-gray-300">{request.reviewNotes}</span>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    Requested {formatDate(request.requestedAt)}
                    {request.reviewedAt && ` • Reviewed ${formatDate(request.reviewedAt)}`}
                  </p>
                </div>
              </div>

              {request.status === 'pending' && (
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="text-2xl"
                >
                  🪐
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
