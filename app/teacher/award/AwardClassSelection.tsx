'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { Class } from '@/lib/services/classes';

interface Props {
  user: User;
  classes: Class[];
}

export default function AwardClassSelection({ user, classes }: Props) {
  const router = useRouter();

  const handleClassSelect = (classId: string) => {
    router.push(`/teacher/award/${classId}`);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto mb-8"
      >
        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/teacher" className="glass hover:glass-strong p-2 rounded-lg transition-all">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Award a Class</h1>
              <p className="text-sm text-gray-400 mt-1">
                Select a class to award credits to all students
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Classes Grid */}
      <div className="max-w-4xl mx-auto">
        {classes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-2xl p-12 text-center"
          >
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">No Classes Found</h2>
            <p className="text-gray-400 mb-6">
              You need to create a class before you can award credits.
            </p>
            <Link
              href="/teacher/classes"
              className="inline-flex items-center gap-2 bg-gradient-cosmic px-6 py-3 rounded-xl font-medium shadow-cosmic hover:shadow-lg transition-all"
            >
              Go to Class Management
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((classItem, index) => (
              <motion.button
                key={classItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleClassSelect(classItem.id)}
                className="glass-strong hover:glass rounded-2xl p-6 text-left transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1 group-hover:text-cosmic-300 transition-colors">
                      {classItem.name}
                    </h3>
                    <p className="text-sm text-gray-400 capitalize">
                      {classItem.subject.replace('-', ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-cosmic-300 text-sm font-medium">
                  <Users className="w-4 h-4" />
                  <span>Select this class</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
