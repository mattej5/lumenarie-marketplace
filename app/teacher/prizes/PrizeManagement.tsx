'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Plus, Award, X, Save, Trash2 } from 'lucide-react';
import { User, Prize } from '@/lib/types';
import type { Class } from '@/lib/services/classes';

interface Props {
  user: User;
  classes: Class[];
  prizes: Prize[];
}

type EditablePrize = Partial<Prize> & { id?: string };

const categories: Prize['category'][] = ['astronomy', 'earth-science', 'general'];

export default function PrizeManagement({ classes, prizes }: Readonly<Props>) {
  const [items, setItems] = useState<Prize[]>(prizes);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [form, setForm] = useState<EditablePrize | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isCrowdfunded = form?.cost === 0;
  const isCreateValid = !!(
    form &&
    (form.name || '').toString().trim().length > 0 &&
    (form.description || '').toString().trim().length > 0 &&
    (Number(form.cost) > 0 || form.cost === 0) &&
    (!!form.category && categories.includes(form.category as any))
  );

  const openCreate = () => {
    setMode('create');
    setCurrentId(null);
    setForm({
      name: '',
      description: '',
      cost: 1,
      category: 'general',
      icon: '🎁',
      available: true,
      classId: undefined,
    });
    setModalOpen(true);
  };

  const openEdit = (p: Prize) => {
    setMode('edit');
    setCurrentId(p.id);
    setForm({ ...p });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(null);
    setCurrentId(null);
  };

  const handleChange = (field: keyof EditablePrize, value: any) => {
    setForm((prev) => ({ ...(prev || {}), [field]: value }));
  };

  const submitCreate = async () => {
    if (!form || !form.name || !form.description || form.cost === undefined || !form.category) return;
    setSaving(true);
    try {
      const res = await fetch('/api/prizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          cost: Number(form.cost),
          category: form.category,
          icon: form.icon || undefined,
          classId: form.classId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create prize');
      setItems((prev) => [...prev, data.prize]);
      closeModal();
    } catch (e) {
      console.error('Create prize error', e);
      alert((e as any).message || 'Failed to create prize');
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    if (!form || !currentId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/prizes/${currentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          cost: form.cost !== undefined ? Number(form.cost) : undefined,
          category: form.category,
          icon: form.icon,
          available: form.available,
          classId: form.classId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update prize');
      setItems((prev) => prev.map((p) => (p.id === currentId ? data.prize : p)));
      closeModal();
    } catch (e) {
      console.error('Update prize error', e);
      alert((e as any).message || 'Failed to update prize');
    } finally {
      setSaving(false);
    }
  };

  const submitDelete = async () => {
    if (!currentId) return;
    if (!confirm('Delete this prize?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/prizes/${currentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete prize');
      setItems((prev) => prev.filter((p) => p.id !== currentId));
      closeModal();
    } catch (e) {
      console.error('Delete prize error', e);
      alert((e as any).message || 'Failed to delete prize');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/teacher" className="text-gray-600 hover:text-gray-900">
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-black flex items-center gap-2">
                  <Award className="h-7 w-7 text-indigo-600" /> Prize Management
                </h1>
                <p className="text-black mt-1">Create, edit, or remove the prizes you offer</p>
              </div>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md shadow hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> New Prize
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Available</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-black">
                    No prizes yet. Click "New Prize" to add one.
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => openEdit(p)}
                  >
                    <td className="px-6 py-3 font-medium text-black">{p.name}</td>
                    <td className="px-6 py-3 text-black">{p.cost === 0 ? 'Crowdfunded' : p.cost}</td>
                    <td className="px-6 py-3">
                      <span className="uppercase text-xs tracking-wide bg-gray-100 text-black px-2 py-1 rounded">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-black">{p.available ? 'Yes' : 'No'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-xl rounded-lg shadow-lg z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-xl font-semibold text-black">{mode === 'create' ? 'Create Prize' : 'Edit Prize'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-black">Name</label>
                <input
                  className="w-full border border-black rounded px-3 py-2 bg-white text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                  value={String(form?.name || '')}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Homework Pass"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-black">Description</label>
                <input
                  className="w-full border border-black rounded px-3 py-2 bg-white text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                  value={String(form?.description || '')}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Short description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-black">Cost</label>
                  <input
                    type="number"
                    min={1}
                    disabled={isCrowdfunded}
                    className="w-full border border-black rounded px-3 py-2 bg-white text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={isCrowdfunded ? '' : Number(form?.cost || 1)}
                    onChange={(e) => handleChange('cost', Number(e.target.value))}
                    placeholder={isCrowdfunded ? 'Crowdfunded' : ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-black">Category</label>
                  <select
                    className="w-full border border-black rounded px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                    value={String(form?.category || 'general')}
                    onChange={(e) => handleChange('category', e.target.value as Prize['category'])}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="inline-flex items-center gap-2 text-black cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCrowdfunded}
                    onChange={(e) => handleChange('cost', e.target.checked ? 0 : 1)}
                    className="cursor-pointer"
                  />
                  <span>Allow crowdfunding</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-black">Icon (emoji)</label>
                  <input
                    className="w-full border border-black rounded px-3 py-2 bg-white text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                    value={String(form?.icon || '')}
                    onChange={(e) => handleChange('icon', e.target.value)}
                    placeholder="🎁"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-black">Class</label>
                  <select
                    className="w-full border border-black rounded px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                    value={String(form?.classId || '')}
                    onChange={(e) => handleChange('classId', e.target.value || undefined)}
                  >
                    <option value="">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="inline-flex items-center gap-2 text-black">
                  <input
                    type="checkbox"
                    checked={!!form?.available}
                    onChange={(e) => handleChange('available', e.target.checked)}
                  />
                  <span>Available</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t">
              {mode === 'edit' ? (
                <button
                  onClick={submitDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              ) : (
                <span />
              )}

              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  className="inline-flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button
                  onClick={mode === 'create' ? submitCreate : submitEdit}
                  disabled={saving || (mode === 'create' && !isCreateValid)}
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? (mode === 'create' ? 'Creating...' : 'Saving...') : mode === 'create' ? 'Create' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
