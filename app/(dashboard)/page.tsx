import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export default async function DashboardOverview() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().split('T')[0];

  // 1. Fetch Task Metrics
  const { count: totalTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: completedTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed');

  const pendingTasksCount = (totalTasks || 0) - (completedTasks || 0);

  // 2. Fetch Habit Metrics
  const { data: habits } = await supabase
    .from('habits')
    .select('id')
    .eq('user_id', user.id);

  const { data: habitLogs } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .eq('completed', true);

  const totalHabits = habits?.length || 0;
  const completedHabitsToday = habitLogs?.length || 0;

  // 3. Fetch Goal Metrics
  const { count: activeGoals } = await supabase
    .from('goals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'in_progress');

  const { count: achievedGoals } = await supabase
    .from('goals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'achieved');

  // 4. Compute Dynamic Productivity Score
  const totalPossibleItems = totalTasks || 1;
  const totalCompletedItems = completedTasks || 0;
  const productivityScore = Math.min(
    100,
    Math.round((totalCompletedItems / totalPossibleItems) * 100)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Greeting Banner */}
      <div className="bg-gradient-to-r from-[#141a29] to-[#18122b] border border-gray-800 p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-sm text-purple-400 font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <h1 className="text-3xl font-bold mt-1">Good day, Hamdu 👋</h1>
          <p className="text-gray-400 text-sm mt-1">Here&apos;s your live operational status.</p>
        </div>
        <div className="bg-black/40 border border-gray-800 px-6 py-4 rounded-xl flex items-center gap-4">
          <div className="relative w-12 h-12 flex items-center justify-center font-bold text-sm text-purple-400">
            <div className="absolute inset-0 rounded-full border-4 border-gray-800 border-t-purple-500"></div>
            {productivityScore}%
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
          <div className="text-xs text-gray-500 mt-1">{pendingTasksCount} remaining</div>
        </div>
        <div className="bg-[#111726] border border-gray-800 p-6 rounded-xl">
          <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">Habits Completed</div>
          <div className="text-3xl font-bold">{completedHabitsToday}/{totalHabits}</div>
          <div className="text-xs text-gray-500 mt-1">Daily tracking active</div>
        </div>
        <div className="bg-[#111726] border border-gray-800 p-6 rounded-xl">
          <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">Active Goals</div>
          <div className="text-3xl font-bold">{activeGoals || 0}</div>
          <div className="text-xs text-gray-500 mt-1">{achievedGoals || 0} achieved</div>
        </div>
        <div className="bg-[#111726] border border-gray-800 p-6 rounded-xl">
          <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">System Status</div>
          <div className="text-3xl font-bold text-green-400">Live</div>
          <div className="text-xs text-gray-500 mt-1">Supabase RLS Secured</div>
        </div>
      </div>

      {/* Quick Action / Navigation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111726] border border-gray-800 p-6 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Quick Navigation</h2>
            <Link href="/tasks" className="text-xs text-purple-400 hover:underline">Manage Tasks &rarr;</Link>
          </div>
          <p className="text-sm text-gray-400 mb-4">Your core modules—Tasks, Habits, and Goals—are fully synchronized with your database.</p>
          <div className="flex gap-3">
            <Link href="/tasks" className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
              Tasks
            </Link>
            <Link href="/habits" className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors border border-gray-700">
              Habits
            </Link>
            <Link href="/goals" className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors border border-gray-700">
              Goals
            </Link>
          </div>
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