import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export default async function DashboardOverview() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { count: totalTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id);

  const { count: completedTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
    .eq('status', 'completed');

  const pendingCount = (totalTasks || 0) - (completedTasks || 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Greeting Banner */}
      <div className="bg-gradient-to-r from-[#141a29] to-[#18122b] border border-gray-800 p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-sm text-purple-400 font-medium">Thu 1 Oct</span>
          <h1 className="text-3xl font-bold mt-1">Good morning, Hamdu 👋</h1>
          <p className="text-gray-400 text-sm mt-1">Here&apos;s how your day is shaping up.</p>
        </div>
        <div className="bg-black/40 border border-gray-800 px-6 py-4 rounded-xl flex items-center gap-4">
          <div className="relative w-12 h-12 flex items-center justify-center font-bold text-sm text-purple-400">
            <div className="absolute inset-0 rounded-full border-4 border-gray-800 border-t-purple-500"></div>
            17%
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Productivity</div>
            <div className="text-sm font-bold">Today&apos;s score</div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111726] border border-gray-800 p-6 rounded-xl">
          <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">Tasks Done Today</div>
          <div className="text-3xl font-bold">{completedTasks || 0}</div>
          <div className="text-xs text-gray-500 mt-1">{pendingCount} remaining</div>
        </div>
        <div className="bg-[#111726] border border-gray-800 p-6 rounded-xl">
          <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">Habits Streak</div>
          <div className="text-3xl font-bold">2/6</div>
          <div className="text-xs text-gray-500 mt-1">Keep the streak</div>
        </div>
        <div className="bg-[#111726] border border-gray-800 p-6 rounded-xl">
          <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">Active Goals</div>
          <div className="text-3xl font-bold">0</div>
          <div className="text-xs text-gray-500 mt-1">0 achieved</div>
        </div>
        <div className="bg-[#111726] border border-gray-800 p-6 rounded-xl">
          <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">Projects</div>
          <div className="text-3xl font-bold">1</div>
          <div className="text-xs text-gray-500 mt-1">Life OS active</div>
        </div>
      </div>

      {/* Quick Action / Motivation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111726] border border-gray-800 p-6 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Quick Navigation</h2>
            <Link href="/tasks" className="text-xs text-purple-400 hover:underline">Manage Tasks &rarr;</Link>
          </div>
          <p className="text-sm text-gray-400 mb-4">Your task engine is active with server-side URL filtering and Supabase RLS security.</p>
          <Link href="/tasks" className="inline-block bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
            Open Task Manager
          </Link>
        </div>

        <div className="bg-gradient-to-br from-[#1c1229] to-[#111726] border border-purple-900/30 p-6 rounded-xl flex flex-col justify-between">
          <p className="text-sm italic text-gray-300">
            &ldquo;Discipline is choosing between what you want now and what you want most.&rdquo;
          </p>
          <span className="text-xs text-purple-400 font-semibold mt-4">— Abraham Lincoln</span>
        </div>
      </div>
    </div>
  );
}