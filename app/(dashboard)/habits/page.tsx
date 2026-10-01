import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getAccentClasses } from '@/utils/accent';
import { revalidatePath } from 'next/cache';

// Helper to get local YYYY-MM-DD without UTC shift bugs
function getLocalDateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default async function HabitsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const accent = await getAccentClasses();

  // Fetch habits
  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Generate last 7 days using local date helper
  const today = new Date();
  const pastDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    return getLocalDateString(d);
  });

  // Server actions
  async function addHabit(formData: FormData) {
    'use server';
    const title = formData.get('title')?.toString();
    if (!title) return;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('habits').insert({
      user_id: user.id,
      title,
      completed_dates: []
    });

    revalidatePath('/habits');
  }

  async function toggleHabitDate(habitId: string, dateStr: string, currentDates: string[] = []) {
    'use server';
    const supabase = await createClient();
    
    let updatedDates = [...(currentDates || [])];
    if (updatedDates.includes(dateStr)) {
      updatedDates = updatedDates.filter(d => d !== dateStr);
    } else {
      updatedDates.push(dateStr);
    }

    await supabase
      .from('habits')
      .update({ completed_dates: updatedDates })
      .eq('id', habitId);

    revalidatePath('/habits');
  }

  async function deleteHabit(formData: FormData) {
    'use server';
    const habitId = formData.get('habitId')?.toString();
    if (!habitId) return;

    const supabase = await createClient();
    await supabase.from('habits').delete().eq('id', habitId);
    revalidatePath('/habits');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-gray-800/60 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Habit Tracker</h1>
          <p className="text-gray-400 text-sm mt-1">Build daily consistency and review your 7-day historical matrix.</p>
        </div>
      </div>

      {/* Add Habit Form */}
      <form action={addHabit} className="flex gap-3">
        <input 
          type="text" 
          name="title" 
          placeholder="New daily habit (e.g., Bodyweight training)..." 
          required
          className="flex-1 bg-[#111726] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
        <button 
          type="submit" 
          className={`${accent.button} text-white font-medium text-xs px-6 py-3 rounded-xl transition-colors cursor-pointer whitespace-nowrap`}
        >
          Add Habit
        </button>
      </form>

      {/* Habits List with 7-Day History Matrix */}
      <div className="space-y-4">
        {habits?.map(habit => {
          const completedDates: string[] = habit.completed_dates || [];
          const totalWins = completedDates.length;
          
          // Calculate active consecutive streak ending today or yesterday
          let streak = 0;
          let checkDate = new Date();
          const todayStr = getLocalDateString(checkDate);

          if (!completedDates.includes(todayStr)) {
            const yesterday = new Date();
            yesterday.setDate(checkDate.getDate() - 1);
            if (completedDates.includes(getLocalDateString(yesterday))) {
              checkDate = yesterday;
            }
          }

          while (true) {
            const dateStr = getLocalDateString(checkDate);
            if (completedDates.includes(dateStr)) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }

          return (
            <div key={habit.id} className="atmospheric-card p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              
              {/* Habit Info, Streak & Total Wins */}
              <div className="space-y-1">
                <h3 className="font-medium text-sm text-white">{habit.title}</h3>
                <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
                  <span>Streak: <strong className={accent.text}>{streak} days</strong></span>
                  <span>Total Wins: <strong className="text-white">{totalWins}</strong></span>
                </div>
              </div>

              {/* 7-Day History Matrix Grid */}
              <div className="flex items-center gap-2">
                {pastDays.map(dateStr => {
                  const isDone = completedDates.includes(dateStr);
                  const dayLabel = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'narrow' });
                  
                  return (
                    <form key={dateStr} action={async () => {
                      'use server';
                      await toggleHabitDate(habit.id, dateStr, completedDates);
                    }}>
                      <button 
                        type="submit"
                        title={`${dateStr}: ${isDone ? 'Completed' : 'Missed'}`}
                        className={`w-9 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-mono border transition-all cursor-pointer ${
                          isDone 
                            ? `${accent.bg} ${accent.text}${accent.border} scale-105` 
                            : 'bg-black/30 text-gray-500 border-gray-800/80 hover:border-gray-700'
                        }`}
                      >
                        <span className="opacity-70">{dayLabel}</span>
                        <span className="font-bold">{isDone ? '✓' : '·'}</span>
                      </button>
                    </form>
                  );
                })}

                {/* Delete Button */}
                <form action={deleteHabit} className="ml-3 pl-3 border-l border-gray-800">
                  <input type="hidden" name="habitId" value={habit.id} />
                  <button 
                    type="submit" 
                    className="text-gray-600 hover:text-rose-400 text-xs px-2 py-1 transition-colors cursor-pointer"
                    title="Delete habit"
                  >
                    ✕
                  </button>
                </form>
              </div>

            </div>
          );
        })}

        {(!habits || habits.length === 0) && (
          <div className="atmospheric-card rounded-2xl py-16 text-center text-xs text-gray-500 space-y-2">
            <p>No habits configured yet.</p>
            <p className="text-gray-600">Add a daily habit above to start building consistency.</p>
          </div>
        )}
      </div>
    </div>
  );
}