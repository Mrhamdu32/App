import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 bg-[#0e131f] flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo / Brand */}
          <div className="h-16 flex items-center px-6 border-b border-gray-800">
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
              LifeOS
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 text-sm font-medium">
            <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-purple-600/10 text-purple-400 border border-purple-500/20 transition-colors">
              <span>📊</span> Dashboard
            </Link>
            <Link href="/tasks" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors">
              <span>📝</span> Tasks
            </Link>
            <Link href="/habits" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors">
              <span>🔥</span> Habits
            </Link>
            <Link href="/goals" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors">
              <span>🎯</span> Goals
            </Link>
            <Link href="/projects" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors">
              <span>📁</span> Projects
            </Link>
            <Link href="/notes" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors">
              <span>📓</span> Notes
            </Link>
            <Link href="/finance" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors">
              <span>💳</span> Finance
            </Link>
          </nav>
        </div>

        {/* Bottom User / Settings Section */}
        <div className="p-4 border-t border-gray-800">
          <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors text-sm font-medium">
            <span>⚙️</span> Settings
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-gray-800 bg-[#0e131f]/50 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Thu 1 Oct</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-xs">
              H
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}