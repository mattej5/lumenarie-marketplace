import TeacherNav from './TeacherNav';

export default function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen p-3 md:p-5">
      <div className="w-full mx-auto lg:flex lg:items-start lg:gap-6">
        <div className="lg:w-64 lg:shrink-0 mb-4 lg:mb-0">
          <TeacherNav />
        </div>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
