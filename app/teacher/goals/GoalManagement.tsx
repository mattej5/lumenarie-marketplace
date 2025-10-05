'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Plus, Target, Save, X, Trash2, Edit, Trash } from 'lucide-react';
import { User, Goal } from '@/lib/types';
import type { Class } from '@/lib/services/classes';

interface Props {
  user: User;
  classes: Class[];
  goals: Goal[];
}

type EditableGoal = Partial<Goal> & { id?: string };

export default function GoalManagement({ user, classes, goals }: Props) {
  const [items, setItems] = useState<Goal[]>(goals);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [form, setForm] = useState<EditableGoal | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setMode('create');
    setCurrentId(null);
    setForm({ title: '', description: '', points: 1, available: true, classIds: [] });
    setModalOpen(true);
  };

  const openEdit = (g: Goal) => {
    setMode('edit');
    setCurrentId(g.id);
    setForm({ ...g });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setForm(null); setCurrentId(null); };
  const handleChange = (field: keyof EditableGoal, value: any) => setForm((p) => ({ ...(p || {}), [field]: value }));

  const submitCreate = async () => {
    if (!form?.title || !form?.points || (form?.points || 0) <= 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          points: Number(form.points),
          available: form.available,
          classIds: Array.isArray(form.classIds) ? form.classIds : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create goal');
      setItems((prev) => [...prev, data.goal]);
      closeModal();
    } catch (e) {
      alert((e as any).message || 'Failed to create goal');
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    if (!form || !currentId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/goals/${currentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          points: form.points !== undefined ? Number(form.points) : undefined,
          available: form.available,
          classIds: Array.isArray(form.classIds) ? form.classIds : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update goal');
      setItems((prev) => prev.map((g) => (g.id === currentId ? data.goal : g)));
      closeModal();
    } catch (e) {
      alert((e as any).message || 'Failed to update goal');
    } finally {
      setSaving(false);
    }
  };

  const submitDelete = async () => {
    if (!currentId) return;
    if (!confirm('Delete this goal?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/goals/${currentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete goal');
      setItems((prev) => prev.filter((g) => g.id !== currentId));
      closeModal();
    } catch (e) {
      alert((e as any).message || 'Failed to delete goal');
    } finally {
      setDeleting(false);
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
                <h1 className="text-3xl font-bold text-black flex items-center gap-2">
                  <Target className="h-7 w-7 text-indigo-600" /> Goal Management
                </h1>
                <p className="text-black mt-1">Create, edit, or remove the goals you assign</p>
              </div>
            </div>
            <button onClick={openCreate} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md shadow hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> New Goal
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Available</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-black">No goals yet. Click "New Goal" to add one.</td>
                </tr>
              ) : (
                items.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-black">{g.title}</td>
                    <td className="px-6 py-3 text-black">{g.points}</td>
                    <td className="px-6 py-3 text-black">{(g.classIds && g.classIds.length > 0) ? g.classIds.map(cid => classes.find(c => c.id === cid)?.name || 'Class').join(', ') : 'All Classes'}</td>
                    <td className="px-6 py-3 text-black">{g.available ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(g); }}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 px-2 py-1"
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm('Delete this goal?')) return;
                            setDeleting(true);
                            try {
                              const res = await fetch(`/api/goals/${g.id}`, { method: 'DELETE' });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error || 'Failed to delete goal');
                              setItems((prev) => prev.filter((item) => item.id !== g.id));
                            } catch (err) {
                              alert((err as any).message || 'Failed to delete goal');
                            } finally {
                              setDeleting(false);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 px-2 py-1"
                        >
                          <Trash className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-xl rounded-lg shadow-lg z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-xl font-semibold text-black">{mode === 'create' ? 'Create Goal' : 'Edit Goal'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-black">Title</label>
                <input className="w-full border border-black rounded px-3 py-2 bg-white text-black focus:outline-none" value={form?.title || ''} onChange={(e) => handleChange('title', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-black">Description</label>
                <input className="w-full border border-black rounded px-3 py-2 bg-white text-black focus:outline-none" value={form?.description || ''} onChange={(e) => handleChange('description', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-black">Points</label>
                  <input type="number" min={1} className="w-full border border-black rounded px-3 py-2 bg-white text-black focus:outline-none" value={Number(form?.points || 1)} onChange={(e) => handleChange('points', Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-black">Classes (select multiple)</label>
                  <div className="max-h-40 overflow-auto border border-black rounded p-2">
                    {classes.map((cls) => {
                      const list = (form?.classIds as string[] | undefined) || [];
                      const checked = list.includes(cls.id);
                      return (
                        <label key={cls.id} className="flex items-center gap-2 py-1">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const arr = new Set(list);
                              if (e.target.checked) arr.add(cls.id); else arr.delete(cls.id);
                              handleChange('classIds', Array.from(arr));
                            }}
                          />
                          <span className="text-black">{cls.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-700 mt-1">Leave all unchecked to apply to all of your classes.</p>
                </div>
              </div>
              <div>
                <label className="inline-flex items-center gap-2 text-black">
                  <input type="checkbox" checked={!!form?.available} onChange={(e) => handleChange('available', e.target.checked)} />
                  <span>Available</span>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-t">
              {mode === 'edit' ? (
                <button onClick={submitDelete} disabled={deleting} className="inline-flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded hover:bg-red-100"><Trash2 className="h-4 w-4" /> Delete</button>
              ) : (<span />)}
              <div className="flex gap-2">
                <button onClick={closeModal} className="inline-flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"><X className="h-4 w-4" /> Cancel</button>
                <button onClick={mode === 'create' ? submitCreate : submitEdit} disabled={saving} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 disabled:opacity-50"><Save className="h-4 w-4" /> {mode === 'create' ? 'Create' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
