'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Target, Send, Loader2 } from 'lucide-react';
import { useConfetti } from '@/hooks/useConfetti';

type Goal = {
  id: string;
  title: string;
  helper?: string;
};

export default function GoalsSelector({ classId }: Readonly<{ classId: string }>) {
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { quickCelebrate } = useConfetti();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [todaySubmissions, setTodaySubmissions] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);

  const loadData = async () => {
    try {
      // Load goals
      const goalsRes = await fetch(`/api/goals?available=true`);
      if (goalsRes.ok) {
        const data = await goalsRes.json();
        const items = (data.goals || []).map((g: any) => ({ id: g.id, title: g.title }));
        setGoals(items);
      } else {
        // fallback to defaults
        setGoals([
          { id: 'hw', title: 'Completed homework on time' },
          { id: 'help', title: 'Helped a classmate learn a concept' },
          { id: 'participate', title: 'Participated in class discussion' },
          { id: 'cleanup', title: 'Cleaned up lab/work area' },
          { id: 'improve', title: 'Improved quiz or assignment score' },
        ]);
      }

      // Load today's submissions
      const submissionsRes = await fetch(`/api/goal-submissions?classId=${classId}`);
      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        const today = new Date().toDateString();
        const todaySubs = (data.submissions || []).filter((s: any) => {
          const subDate = new Date(s.createdAt).toDateString();
          return subDate === today && s.status === 'pending';
        });

        if (todaySubs.length > 0) {
          setTodaySubmissions(todaySubs);
          setEditMode(true);
          // Pre-populate the form with today's submissions
          const selectedIds = todaySubs.map((s: any) => s.goalId);
          const notesMap = todaySubs.reduce((acc: any, s: any) => {
            acc[s.goalId] = s.description;
            return acc;
          }, {});
          setSelected(selectedIds);
          setNotes(notesMap);
        } else {
          // No submissions today, reset form
          setTodaySubmissions([]);
          setEditMode(false);
          setSelected([]);
          setNotes({});
        }
      }
    } catch (err) {
      console.error('Error loading goals:', err);
      setGoals([
        { id: 'hw', title: 'Completed homework on time' },
        { id: 'help', title: 'Helped a classmate learn a concept' },
        { id: 'participate', title: 'Participated in class discussion' },
        { id: 'cleanup', title: 'Cleaned up lab/work area' },
        { id: 'improve', title: 'Improved quiz or assignment score' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load available goals and today's submissions
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (mounted) await loadData();
    };
    load();
    return () => { mounted = false; };
  }, [classId]);

  const canSelectMore = selected.length < 3;
  const isValid = useMemo(() => {
    if (selected.length === 0 || selected.length > 3) return false;
    return selected.every((id) => (notes[id] || '').trim().length > 0);
  }, [selected, notes]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // limit to 3
      return [...prev, id];
    });
  };

  const submit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      if (editMode) {
        // Update existing submissions
        const deleteIds = todaySubmissions.filter(s => !selected.includes(s.goalId)).map(s => s.id);
        const updateIds = todaySubmissions.filter(s => selected.includes(s.goalId)).map(s => s.goalId);
        const newIds = selected.filter(id => !updateIds.includes(id));

        // Delete removed submissions
        for (const id of deleteIds) {
          await fetch(`/api/goal-submissions/${id}`, { method: 'DELETE' });
        }

        // Update existing submissions
        for (const sub of todaySubmissions) {
          if (selected.includes(sub.goalId)) {
            await fetch(`/api/goal-submissions/${sub.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ description: notes[sub.goalId] }),
            });
          }
        }

        // Create new submissions
        if (newIds.length > 0) {
          const payload = {
            submissions: newIds.map((id) => ({ goalId: id, description: notes[id], classId })),
          };
          await fetch('/api/goal-submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
      } else {
        // Create new submissions
        const payload = {
          submissions: selected.map((id) => ({ goalId: id, description: notes[id], classId })),
        };
        console.log('Submitting goals:', payload);
        const res = await fetch('/api/goal-submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        console.log('Response:', { status: res.status, data });
        if (!res.ok) {
          alert(`Failed to submit: ${data.error || 'Unknown error'}`);
          throw new Error(data.error || 'Failed to submit goals');
        }
      }

      quickCelebrate();
      // Reload data to show updated submissions
      await loadData();
    } catch (err) {
      console.error('Goal submission error:', err);
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-6 h-6 text-aurora-400" />
        <h2 className="text-xl font-semibold text-white">Daily Goals</h2>
        {editMode && (
          <span className="ml-auto text-xs px-2 py-1 bg-aurora-500/20 text-aurora-300 rounded-full">
            Editing Today&apos;s Submission
          </span>
        )}
      </div>

      <p className="text-sm text-gray-300 mb-4">
        {editMode
          ? "You can edit your goals from today. Changes will be saved when you submit."
          : "Select 1-3 goals you achieved today and describe what you did to earn your lumenaries."
        }
      </p>

      <div className="space-y-3">
        {(loading ? [] : goals).map((g) => {
          const checked = selected.includes(g.id);
          const disabled = !checked && !canSelectMore;
          return (
            <div key={g.id} className={`rounded-xl border ${checked ? 'border-aurora-400 bg-aurora-500/10' : 'border-gray-700 bg-gray-800/30'} p-4`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4"
                  checked={checked}
                  onChange={() => toggle(g.id)}
                  disabled={disabled}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{g.title}</span>
                    {checked && <CheckCircle2 className="w-4 h-4 text-aurora-400" />}
                  </div>
                  {g.helper && <p className="text-xs text-gray-400 mt-1">{g.helper}</p>}
                </div>
              </label>

              {checked && (
                <div className="mt-3">
                  <label className="block text-xs text-gray-300 mb-1">Describe what you did</label>
                  <textarea
                    rows={3}
                    value={notes[g.id] || ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [g.id]: e.target.value }))}
                    placeholder="Add a brief description..."
                    className="w-full rounded-lg px-3 py-2 bg-gray-900/60 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-aurora-400/30"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-300">
          {selected.length === 0 ? 'Select at least 1 goal' : `${selected.length} goal${selected.length === 1 ? '' : 's'} selected`}
        </span>
        <button
          onClick={submit}
          disabled={!isValid || submitting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-cosmic text-white disabled:opacity-50 transition-all"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Goals
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
