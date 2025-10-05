"use client";

import { LogOut } from 'lucide-react';
import { signOut } from '@/app/actions/auth';

export default function NotEnrolled() {
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('[NotEnrolled] signOut failed', e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <p className="text-xl text-gray-300">You are not enrolled in any classes yet.</p>
        <p className="text-sm text-gray-500">Please contact your teacher to be added to a class.</p>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 glass hover:glass-strong px-4 py-2 rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
