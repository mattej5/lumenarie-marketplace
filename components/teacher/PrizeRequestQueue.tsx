'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PrizeRequest } from '@/lib/types';
import { CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfetti } from '@/hooks/useConfetti';

interface PrizeRequestQueueProps {
  requests: PrizeRequest[];
}

export default function PrizeRequestQueue({ requests }: PrizeRequestQueueProps) {
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { celebrate } = useConfetti();

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const recentlyReviewed = requests
    .filter(r => r.status !== 'pending')
    .sort((a, b) => {
      const dateA = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
      const dateB = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  const handleApprove = async (request: PrizeRequest) => {
    setProcessingId(request.id);

    try {
      const response = await fetch(`/api/prize-requests/${request.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewNotes: reviewNotes[request.id] || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve request');
      }

      celebrate();
      toast.success(`Approved ${request.prizeName} for ${request.studentName}! 🎉`, {
        duration: 5000,
      });

      setReviewNotes(prev => {
        const { [request.id]: _, ...rest } = prev;
        return rest;
      });

      // Refresh to show updated data
      window.location.reload();
    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error(error.message || 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (request: PrizeRequest) => {
    if (!reviewNotes[request.id]?.trim()) {
      toast.error('Please provide a reason for denying this request');
      return;
    }

    setProcessingId(request.id);

    try {
      const response = await fetch(`/api/prize-requests/${request.id}/deny`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewNotes: reviewNotes[request.id].trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deny request');
      }

      toast.success(`Denied request for ${request.studentName}`, {
        icon: 'ℹ️',
      });

      setReviewNotes(prev => {
        const { [request.id]: _, ...rest } = prev;
        return rest;
      });

      // Refresh to show updated data
      window.location.reload();
    } catch (error: any) {
      console.error('Denial error:', error);
      toast.error(error.message || 'Failed to deny request');
    } finally {
      setProcessingId(null);
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

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <div className="glass-strong rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-starlight-400" />
            Pending Prizes
          </h2>
          <span className="glass px-3 py-1 rounded-full text-sm font-medium">
            {pendingRequests.length} pending
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-gray-400">All caught up!</p>
            <p className="text-sm text-gray-500 mt-1">No pending prize requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass hover:glass-strong rounded-xl p-5 transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{request.studentName.split(' ')[0].includes('Luna') ? '🌙' : '⭐'}</span>
                      <div>
                        <h3 className="font-semibold">{request.studentName}</h3>
                        <p className="text-sm text-gray-400">
                          Requested {formatDate(request.requestedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="glass rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{request.prizeName}</span>
                        <span className="text-aurora-400 font-semibold">
                          {request.prizeCost} ⭐
                        </span>
                      </div>
                      {request.reason && (
                        <p className="text-sm text-gray-400 italic mt-2">
                          "{request.reason}"
                        </p>
                      )}
                    </div>

                    {/* Review Notes Input */}
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                      <textarea
                        value={reviewNotes[request.id] || ''}
                        onChange={(e) => setReviewNotes(prev => ({
                          ...prev,
                          [request.id]: e.target.value,
                        }))}
                        placeholder="Add a note to the student (optional for approval, required for denial)..."
                        rows={2}
                        className="w-full pl-10 pr-4 py-2 glass-strong rounded-lg bg-transparent border border-gray-600 focus:border-cosmic-500 focus:ring-2 focus:ring-cosmic-500/20 outline-none transition-all resize-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDeny(request)}
                    disabled={processingId === request.id}
                    className="flex-1 glass hover:glass-strong py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all hover:bg-earth-sunset/10"
                  >
                    <XCircle className="w-4 h-4" />
                    Deny
                  </button>
                  <button
                    onClick={() => handleApprove(request)}
                    disabled={processingId === request.id}
                    className="flex-1 bg-aurora-500 hover:bg-aurora-600 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all text-white shadow-aurora"
                  >
                    {processingId === request.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recently Reviewed */}
      {recentlyReviewed.length > 0 && (
        <div className="glass-strong rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>📋</span> Recently Reviewed
          </h3>

          <div className="space-y-3">
            {recentlyReviewed.map((request) => (
              <div
                key={request.id}
                className="glass rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{request.studentName}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-sm text-gray-400">{request.prizeName}</span>
                    </div>
                    {request.reviewNotes && (
                      <p className="text-xs text-gray-500 italic">
                        Note: {request.reviewNotes}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {request.reviewedAt && formatDate(request.reviewedAt)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    request.status === 'approved'
                      ? 'bg-aurora-500/20 text-aurora-300'
                      : 'bg-earth-sunset/20 text-orange-300'
                  }`}>
                    {request.status === 'approved' ? '✓ Approved' : '✗ Denied'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
