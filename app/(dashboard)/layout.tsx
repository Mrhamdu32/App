import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import '@/app/globals.css';

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

  const cookieStore = await cookies();
  const accent = cookieStore.get('lifeos_accent')?.value || 'purple';
  const bgTheme = cookieStore.get('lifeos_bg')?.value || 'midnight';

  const accentGradients: Record<string, string> = {
    purple: 'from-purple-400 to-blue-500',
    blue: 'from-blue-400 to-cyan-500',
    emerald: 'from-emerald-400 to-teal-500',
    rose: 'from-rose-400 to-orange-500',
  };

  const backgroundThemes: Record<string, { main: string; sidebar: string; card: string; border: string }> = {
    midnight: {
      main: 'bg-[#0b0f19]',
      sidebar: 'bg-[#0e131f]',
      card: 'bg-[#111726]/80',
      border: 'border-gray-800',
    },
    oled: {
      main: 'bg-black',
      sidebar: 'bg-[#050505]',
      card: 'bg-[#0a0a0a]',
      border: 'border-neutral-900',
    },
    slate: {
      main: 'bg-[#0f172a]',
      sidebar: 'bg-[#1e293b]/50',
      card: 'bg-[#1e293b]/80',
      border: 'border-slate-800',
    },
    espresso: {
      main: 'bg-[#12100e]',
      sidebar: 'bg-[#181512]',
      card: 'bg-[#1c1815]',
      border: 'border-[#2a2421]',
    },
  };

  const activeGradient = accentGradients[accent] || accentGradients.purple;
  const currentTheme = backgroundThemes[bgTheme] || backgroundThemes.midnight;

  return (
    <div className={`min-h-screen ${currentTheme.main} text-gray-200 flex`}>
      {/* Sidebar */}
      <div className={`w-64 ${currentTheme.sidebar} border-r ${currentTheme.border} flex flex-col min-h-screen`}>
        {/* Logo / Brand */}
        <div className={`h-16 flex items-center px-6 border-b ${currentTheme.border}`}>
          <span className={`text-xl font-bold bg-gradient-to-r ${activeGradient} bg-clip-text text-transparent`}>
            LifeOS
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 text-sm font-medium">
          <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
            <span>📊</span> Dashboard
          </Link>
          <Link href="/tasks" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
            <span>📝</span> Tasks
          </Link>
          <Link href="/habits" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
            <span>🔥</span> Habits
          </Link>
          <Link href="/goals" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
            <span>🎯</span> Goals
          </Link>
          <Link href="/reading" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
            <span>📖</span> Reading
          </Link>
          <Link href="/projects" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
            <span>📁</span> Projects
          </Link>
          <Link href="/notes" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
            <span>📓</span> Notes
          </Link>
          <Link href="/finance" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
            <span>💳</span> Finance
          </Link>
        </nav>

        {/* Settings at Bottom */}
        <div className={`p-4 border-t ${currentTheme.border}`}>
          <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors text-sm font-medium">
            <span>⚙</span> Settings
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className={`h-16 border-b ${currentTheme.border} ${currentTheme.sidebar}/50 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10`}>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-gray-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${activeGradient} flex items-center justify-center font-bold text-xs text-white`}>
              H
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}