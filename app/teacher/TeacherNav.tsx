'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Award, GraduationCap, BookOpen, Target, ClipboardList, Users, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
  { href: '/teacher', label: 'Home', Icon: Home },
  { href: '/teacher/classes', label: 'Classes', Icon: GraduationCap },
  { href: '/teacher/prizes', label: 'Prizes', Icon: Award },
  { href: '/teacher/students', label: 'Students', Icon: Users },
  { href: '/teacher/award', label: 'Award a Class', Icon: BookOpen },
  { href: '/teacher/goals', label: 'Goals', Icon: Target },
  { href: '/teacher/goals/review', label: 'Submissions', Icon: ClipboardList },
];

export default function TeacherNav() {
  const { signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('[TeacherNav] signOut failed', e);
    } finally {
      router.push('/login');
    }
  };

  const linkClasses = (href: string) => {
    const isActive = pathname.startsWith(href);
    return [
      'flex items-center gap-3 glass hover:glass-strong px-4 py-2 rounded-lg transition-all justify-start',
      isActive ? 'ring-2 ring-cosmic-400' : '',
    ].join(' ');
  };

  return (
    <div className="glass-strong rounded-2xl p-3 md:p-4 sticky top-6">
      <div className="hidden lg:flex flex-col gap-2">
        {navLinks.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={linkClasses(href)}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </Link>
        ))}
        <div className="pt-2 mt-2 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 glass hover:glass-strong px-4 py-2 rounded-lg transition-all justify-start"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 lg:hidden">
        {navLinks.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 glass hover:glass-strong px-4 py-2 rounded-lg transition-all justify-center"
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm">{label}</span>
          </Link>
        ))}
      </div>
      <div className="lg:hidden mt-2">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 glass hover:glass-strong px-4 py-2 rounded-lg transition-all justify-center"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
