'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface Habit {
  id: string;
  title: string;
  completed_dates: string[];
  created_at: string;
}

function getLocalDateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function HabitsPage() {
  const [user, setUser] = useState<any>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'by_date'>('cards');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [newTitle, setNewTitle] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accentColor, setAccentColor] = useState('purple');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setHabits(data);
      setLoading(false);

      const match = document.cookie.match(new RegExp('(^| )lifeos_accent=([^;]+)'));
      if (match) setAccentColor(match[2]);
    }
    loadData();
  }, [router, supabase]);

  const accentStyles: Record<string, { text: string; bg: string; border: string; solid: string }> = {
    purple: { text: 'text-purple-400', bg: 'bg-purple-950/60', border: 'border-purple-900/50', solid: 'bg-purple-600 hover:bg-purple-500' },
    blue: { text: 'text-blue-400', bg: 'bg-blue-950/60', border: 'border-blue-900/50', solid: 'bg-blue-600 hover:bg-blue-500' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-900/50', solid: 'bg-emerald-600 hover:bg-emerald-500' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-950/60', border: 'border-rose-900/50', solid: 'bg-rose-600 hover:bg-rose-500' },
  };

  const accent = accentStyles[accentColor] || accentStyles.purple;

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;

    const { data, error } = await supabase
      .from('habits')
      .insert({ user_id: user.id, title: newTitle.trim(), completed_dates: [] })
      .select()
      .single();

    if (data && !error) {
      setHabits([data, ...habits]);
      setNewTitle('');
      setShowAddModal(false);
    }
  };

  const toggleDate = async (habitId: string, dateStr: string, currentDates: string[]) => {
    let updated = [...currentDates];
    if (updated.includes(dateStr)) {
      updated = updated.filter(d => d !== dateStr);
    } else {
      updated.push(dateStr);
    }

    const { error } = await supabase
      .from('habits')
      .update({ completed_dates: updated })
      .eq('id', habitId);

    if (!error) {
      setHabits(habits.map(h => h.id === habitId ? { ...h, completed_dates: updated } : h));
    }
  };

  const deleteHabit = async (habitId: string) => {
    const { error } = await supabase.from('habits').delete().eq('id', habitId);
    if (!error) {
      setHabits(habits.filter(h => h.id !== habitId));
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-400 text-sm">Loading habits...</div>;
  }

  // Metrics calculations
  const todayStr = getLocalDateString(new Date());
  const totalHabits = habits.length;
  const completedTodayCount = habits.filter(h => (h.completed_dates || []).includes(todayStr)).length;
  const todayPct = totalHabits > 0 ? Math.round((completedTodayCount / totalHabits) * 100) : 0;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return getLocalDateString(d);
  });
  let weekTotalPossible = totalHabits * 7;
  let weekCompleted = 0;
  habits.forEach(h => {
    last7Days.forEach(d => {
      if ((h.completed_dates || []).includes(d)) weekCompleted++;
    });
  });
  const weekPct = weekTotalPossible > 0 ? Math.round((weekCompleted / weekTotalPossible) * 100) : 0;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  let monthTotalPossible = totalHabits * daysInMonth;
  let monthCompleted = 0;
  habits.forEach(h => {
    const wins = (h.completed_dates || []).filter(d => d.startsWith(monthPrefix)).length;
    monthCompleted += wins;
  });
  const monthPct = monthTotalPossible > 0 ? Math.round((monthCompleted / monthTotalPossible) * 100) : 0;

  const yearPrefix = `${year}`;
  let yearCompleted = 0;
  habits.forEach(h => {
    const wins = (h.completed_dates || []).filter(d => d.startsWith(yearPrefix)).length;
    yearCompleted += wins;
  });
  const yearTotalPossible = totalHabits * 365;
  const yearPct = yearTotalPossible > 0 ? Math.round((yearCompleted / yearTotalPossible) * 100) : 0;

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return getLocalDateString(d);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-800/60 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Habits</h1>
          <p className="text-gray-400 text-sm mt-1">Build streaks and stay consistent.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-[#111726] border border-gray-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === 'cards' ? `${accent.solid} text-white` : 'text-gray-400 hover:text-white'}`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('by_date')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === 'by_date' ? `${accent.solid} text-white` : 'text-gray-400 hover:text-white'}`}
            >
              By date
            </button>
          </div>

          {/* Time Range Pills */}
          <div className="hidden sm:flex bg-[#111726] border border-gray-800 rounded-xl p-1 text-xs font-medium text-gray-400">
            <button onClick={() => setTimeRange('week')} className={`px-3 py-1.5 rounded-lg transition-colors ${timeRange === 'week' ? 'bg-gray-800 text-white' : 'hover:text-white'}`}>Week</button>
            <button onClick={() => setTimeRange('month')} className={`px-3 py-1.5 rounded-lg transition-colors ${timeRange === 'month' ? 'bg-gray-800 text-white' : 'hover:text-white'}`}>Month</button>
            <button onClick={() => setTimeRange('year')} className={`px-3 py-1.5 rounded-lg transition-colors ${timeRange === 'year' ? 'bg-gray-800 text-white' : 'hover:text-white'}`}>Year</button>
          </div>

          {/* New Habit Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className={`${accent.solid} text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2`}
          >
            <span>+</span> New habit
          </button>
        </div>
      </div>

      {/* Add Habit Modal / Inline Form */}
      {showAddModal && (
        <div className="atmospheric-card p-6 rounded-2xl border border-gray-700/80 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white">Create New Habit</h3>
            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white text-xs">✕</button>
          </div>
          <form onSubmit={handleAddHabit} className="flex gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Habit title (e.g., Morning Run, Read 20 pages)..."
              required
              autoFocus
              className="flex-1 bg-black/40 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <button type="submit" className={`${accent.solid} text-white text-xs font-medium px-5 py-2.5 rounded-xl cursor-pointer`}>
              Save Habit
            </button>
          </form>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="atmospheric-card p-5 rounded-2xl space-y-3">
          <div className="text-xs font-medium uppercase tracking-wider text-gray-400">TODAY</div>
          <div className="text-3xl font-semibold tracking-tight text-white">{todayPct}%</div>
          <div className="w-full bg-gray-800/80 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full ${accent.solid}`} style={{ width: `${todayPct}%` }} />
          </div>
        </div>

        <div className="atmospheric-card p-5 rounded-2xl space-y-3">
          <div className="text-xs font-medium uppercase tracking-wider text-gray-400">THIS WEEK</div>
          <div className="text-3xl font-semibold tracking-tight text-white">{weekPct}%</div>
          <div className="w-full bg-gray-800/80 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full ${accent.solid}`} style={{ width: `${weekPct}%` }} />
          </div>
        </div>

        <div className="atmospheric-card p-5 rounded-2xl space-y-3">
          <div className="text-xs font-medium uppercase tracking-wider text-gray-400">THIS MONTH</div>
          <div className="text-3xl font-semibold tracking-tight text-white">{monthPct}%</div>
          <div className="w-full bg-gray-800/80 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full ${accent.solid}`} style={{ width: `${monthPct}%` }} />
          </div>
        </div>

        <div className="atmospheric-card p-5 rounded-2xl space-y-3">
          <div className="text-xs font-medium uppercase tracking-wider text-gray-400">THIS YEAR</div>
          <div className="text-3xl font-semibold tracking-tight text-white">{yearPct}%</div>
          <div className="w-full bg-gray-800/80 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full ${accent.solid}`} style={{ width: `${yearPct}%` }} />
          </div>
        </div>
      </div>

      {/* CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {habits.map(habit => {
            const completedDates = habit.completed_dates || [];
            
            let streak = 0;
            let checkDate = new Date();
            const todayStr = getLocalDateString(checkDate);
            if (!completedDates.includes(todayStr)) {
              const yest = new Date();
              yest.setDate(checkDate.getDate() - 1);
              if (completedDates.includes(getLocalDateString(yest))) {
                checkDate = yest;
              }
            }
            while (true) {
              const dStr = getLocalDateString(checkDate);
              if (completedDates.includes(dStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
              } else {
                break;
              }
            }

            const last30Wins = last30Days.filter(d => completedDates.includes(d)).length;
            const last30Pct = Math.round((last30Wins / 30) * 100);
            const isTodayDone = completedDates.includes(todayStr);

            return (
              <div key={habit.id} className="atmospheric-card p-6 rounded-2xl space-y-6 flex flex-col justify-between">
                
                {/* Card Top: Title & Actions */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg text-white">{habit.title}</h3>
                    <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">Daily Routine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="text-gray-500 hover:text-rose-400 text-xs p-1.5 rounded-lg border border-gray-800 hover:border-rose-900/40 transition-colors cursor-pointer"
                      title="Delete habit"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Stats & Today's Check Button */}
                <div className="flex justify-between items-center bg-black/30 border border-gray-800/60 p-4 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full border-2 border-gray-800 flex items-center justify-center text-xs font-bold ${accent.text}`}>
                      {last30Pct}%
                    </div>
                    <div className="space-y-0.5 font-mono text-xs">
                      <div className="text-white font-semibold">🔥 {streak} day streak</div>
                      <div className="text-gray-400">{last30Pct}% last 30 days</div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleDate(habit.id, todayStr, completedDates)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all cursor-pointer border ${
                      isTodayDone 
                        ? `${accent.solid} text-white border-transparent scale-105 shadow-lg` 
                        : 'bg-black/50 text-gray-500 border-gray-800 hover:border-gray-600'
                    }`}
                    title={isTodayDone ? 'Completed today! Click to undo.' : 'Mark complete for today'}
                  >
                    {isTodayDone ? '✓' : '·'}
                  </button>
                </div>

                {/* Heatmap Contribution Squares (Last 30 days) */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-mono text-gray-500 tracking-wider">30-Day Heatmap Matrix</div>
                  <div className="grid grid-cols-10 gap-1.5 bg-black/40 p-3 rounded-xl border border-gray-800/80">
                    {last30Days.map(dateStr => {
                      const done = completedDates.includes(dateStr);
                      return (
                        <button
                          key={dateStr}
                          onClick={() => toggleDate(habit.id, dateStr, completedDates)}
                          title={`${dateStr}: ${done ? 'Completed' : 'Missed'}`}
                          className={`aspect-square rounded-md transition-all cursor-pointer border ${
                            done 
                              ? `${accent.solid} border-transparent` 
                              : 'bg-gray-900/80 border-gray-800 hover:border-gray-700'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* BY DATE VIEW */}
      {viewMode === 'by_date' && (
        <div className="atmospheric-card rounded-2xl overflow-hidden border border-gray-800">
          <div className="p-4 border-b border-gray-800 bg-black/40 text-xs font-mono text-gray-400 uppercase tracking-wider">
            Habit Audit Matrix (Last 7 Days)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs font-mono text-gray-400">
                  <th className="p-4">Habit</th>
                  {last7Days.map(d => (
                    <th key={d} className="p-4 text-center">{d.slice(5)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {habits.map(habit => (
                  <tr key={habit.id} className="hover:bg-white/[0.01]">
                    <td className="p-4 font-medium text-white">{habit.title}</td>
                    {last7Days.map(d => {
                      const done = (habit.completed_dates || []).includes(d);
                      return (
                        <td key={d} className="p-4 text-center">
                          <button
                            onClick={() => toggleDate(habit.id, d, habit.completed_dates || [])}
                            className={`w-7 h-7 rounded-md font-mono text-xs inline-flex items-center justify-center border transition-all cursor-pointer ${
                              done ? `${accent.solid} text-white border-transparent` : 'bg-black/40 text-gray-600 border-gray-800'
                            }`}
                          >
                            {done ? '✓' : '·'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {habits.length === 0 && (
        <div className="atmospheric-card rounded-2xl py-20 text-center text-xs text-gray-500 space-y-2">
          <p>No habits configured yet.</p>
          <button onClick={() => setShowAddModal(true)} className={`${accent.text} underline cursor-pointer`}>
            Create your first habit
          </button>
        </div>
      )}

    </div>
  );
}