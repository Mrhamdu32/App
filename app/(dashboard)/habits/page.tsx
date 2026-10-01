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

  // Generate all days for the current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const monthName = now.toLocaleString('en-US', { month: 'long' });
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
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
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-gray-800/60 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Habit Tracker</h1>
          <p className="text-gray-400 text-sm mt-1">Monthly performance matrix for {monthName} {year}.</p>
        </div>
      </div>

      {/* Add Habit Form */}
      <form action={addHabit} className="flex gap-3 max-w-2xl">
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

      {/* Habits List with Full Monthly Matrix */}
      <div className="space-y-6">
        {habits?.map(habit => {
          const completedDates: string[] = habit.completed_dates || [];
          const totalWins = completedDates.filter(d => d.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length;
          
          // Calculate active consecutive streak
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
            <div key={habit.id} className="atmospheric-card p-6 rounded-2xl space-y-4">
              
              {/* Habit Info & Stats */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="space-y-1">
                  <h3 className="font-medium text-base text-white">{habit.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
                    <span>Streak: <strong className={accent.text}>{streak} days</strong></span>
                    <span>{monthName} Wins: <strong className="text-white">{totalWins} / {daysInMonth}</strong></span>
                  </div>
                </div>

                {/* Delete Button */}
                <form action={deleteHabit}>
                  <input type="hidden" name="habitId" value={habit.id} />
                  <button 
                    type="submit" 
                    className="text-gray-500 hover:text-rose-400 text-xs px-2.5 py-1 rounded-lg border border-gray-800 hover:border-rose-900/50 transition-colors cursor-pointer"
                  >
                    Delete Habit
                  </button>
                </form>
              </div>

              {/* Monthly Matrix Grid (Scrollable or responsive grid) */}
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-1.5 min-w-max">
                  {monthDays.map((dateStr, index) => {
                    const isDone = completedDates.includes(dateStr);
                    const dayNum = index + 1;
                    const dObj = new Date(dateStr + 'T00:00:00');
                    const dayLabel = dObj.toLocaleDateString('en-US', { weekday: 'narrow' });
                    const isToday = dateStr === getLocalDateString(new Date());

                    return (
                      <form key={dateStr} action={async () => {
                        'use server';
                        await toggleHabitDate(habit.id, dateStr, completedDates);
                      }}>
                        <button 
                          type="submit"
                          title={`${dateStr}: ${isDone ? 'Completed' : 'Missed'}`}
                          className={`w-8 h-12 rounded-lg flex flex-col items-center justify-center text-[10px] font-mono border transition-all cursor-pointer ${
                            isDone 
                              ? `${accent.bg} ${accent.text}${accent.border} scale-105` 
                              : isToday 
                              ? 'bg-gray-800/60 text-white border-gray-600'
                              : 'bg-black/30 text-gray-500 border-gray-800/80 hover:border-gray-700'
                          }`}
                        >
                          <span className="opacity-60 text-[9px]">{dayLabel}</span>
                          <span className="font-bold text-xs">{dayNum}</span>
                          <span className="text-[9px]">{isDone ? '✓' : '·'}</span>
                        </button>
                      </form>
                    );
                  })}
                </div>
              </div>

            </div>
          );
        })}

        {(!habits || habits.length === 0) && (
          <div className="atmospheric-card rounded-2xl py-16 text-center text-xs text-gray-500 space-y-2">
            <p>No habits configured yet.</p>
            <p className="text-gray-600">Add a daily habit above to start tracking your monthly discipline.</p>
          </div>
        )}
      </div>
    </div>
  );
}