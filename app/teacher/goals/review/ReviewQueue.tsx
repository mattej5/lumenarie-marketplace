'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Check, X, RefreshCw } from 'lucide-react';

type Submission = {
  id: string;
  studentName?: string;
  goalTitle?: string;
  description: string;
  points: number;
  status: 'pending' | 'approved' | 'denied';
  createdAt?: Date;
};

export default function ReviewQueue() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/goal-submissions?status=pending');
      const data = await res.json();
      if (res.ok) setItems(data.submissions || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: 'approved' | 'denied') => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/goal-submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) setItems((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/teacher" className="text-gray-600 hover:text-gray-900">
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-black">Goal Submissions</h1>
                <p className="text-black mt-1">Review and approve or deny pending submissions</p>
              </div>
            </div>
            <button onClick={load} className="inline-flex items-center gap-2 bg-white border px-3 py-2 rounded hover:bg-gray-50">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Goal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Points</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-black">Loading...</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-black">No pending submissions</td></tr>
              )}
              {!loading && items.length > 0 && items.map((s) => (
                <tr key={s.id}>
                  <td className="px-6 py-3 text-black font-medium">{s.studentName || 'Unknown'}</td>
                  <td className="px-6 py-3 text-black">{s.goalTitle || 'N/A'}</td>
                  <td className="px-6 py-3 text-black">{s.description}</td>
                  <td className="px-6 py-3 text-black">{s.points}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button disabled={updating === s.id} onClick={() => updateStatus(s.id, 'approved')} className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded hover:bg-green-100"><Check className="h-4 w-4"/> Approve</button>
                      <button disabled={updating === s.id} onClick={() => updateStatus(s.id, 'denied')} className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded hover:bg-red-100"><X className="h-4 w-4"/> Deny</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

