import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch quick metrics
  const { count: tasksCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('completed', false);

  const { count: projectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'in_progress');

  const { count: readingCount } = await supabase
    .from('reading')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'reading');

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      
      {/* Top Status Banner */}
      <div className="atmospheric-card p-6 rounded-2xl flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">System Operational</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Command Center</h1>
        </div>
        <div className="text-right font-mono text-xs text-gray-400">
          NODE: <span className="text-white">admin</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="atmospheric-card p-5 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs font-mono text-gray-400 uppercase tracking-wider">
            <span>Net Balance</span>
            <span>💳</span>
          </div>
          <div className="text-2xl font-semibold text-white">₹0</div>
          <Link href="/finance" className="text-xs text-purple-400 hover:underline block">
            View ledger →
          </Link>
        </div>

        <div className="atmospheric-card p-5 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs font-mono text-gray-400 uppercase tracking-wider">
            <span>Pending Tasks</span>
            <span>📝</span>
          </div>
          <div className="text-2xl font-semibold text-white">{tasksCount || 0}</div>
          <Link href="/tasks" className="text-xs text-purple-400 hover:underline block">
            Task queue →
          </Link>
        </div>

        <div className="atmospheric-card p-5 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs font-mono text-gray-400 uppercase tracking-wider">
            <span>Active Projects</span>
            <span>📁</span>
          </div>
          <div className="text-2xl font-semibold text-white">{projectsCount || 0}</div>
          <Link href="/projects" className="text-xs text-purple-400 hover:underline block">
            Initiatives →
          </Link>
        </div>

        <div className="atmospheric-card p-5 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs font-mono text-gray-400 uppercase tracking-wider">
            <span>Reading Focus</span>
            <span>📖</span>
          </div>
          <div className="text-2xl font-semibold text-white">{readingCount || 0} active</div>
          <Link href="/reading" className="text-xs text-purple-400 hover:underline block">
            Library →
          </Link>
        </div>

      </div>

    </div>
  );
}