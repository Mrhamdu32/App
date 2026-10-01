import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { SubmitButton } from '../../components/SubmitButton';

export default async function HabitsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const today = new Date().toISOString().split('T')[0];

  // 1. Fetch habits for this user
  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // 2. Fetch today's logs for these habits
  const { data: logs } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today);

  // Map logs into a quick lookup dictionary: { [habit_id]: boolean }
  const completedTodayMap: Record<string, boolean> = {};
  logs?.forEach((log) => {
    completedTodayMap[log.habit_id] = log.completed;
  });

  async function addHabit(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    if (!title) return;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('habits').insert([{
      title,
      user_id: user.id
    }]);

    if (error) console.error("Habit insert error:", error);
    revalidatePath('/habits');
    revalidatePath('/');
  }

  async function deleteHabit(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;

    const supabase = await createClient();
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (error) console.error("Habit delete error:", error);
    revalidatePath('/habits');
    revalidatePath('/');
  }

  async function toggleHabit(formData: FormData) {
    'use server';
    const habitId = formData.get('habitId') as string;
    const currentState = formData.get('currentState') === 'true';
    if (!habitId) return;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const todayStr = new Date().toISOString().split('T')[0];

    // Upsert the log for today
    const { error } = await supabase.from('habit_logs').upsert({
      habit_id: habitId,
      user_id: user.id,
      date: todayStr,
      completed: !currentState
    }, {
      onConflict: 'habit_id,date'
    });

    if (error) console.error("Habit log error:", error);
    revalidatePath('/habits');
    revalidatePath('/');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Habit Tracker</h1>
        <p className="text-gray-400 text-sm mt-1">Build daily consistency. Mark your wins for today.</p>
      </div>

      {/* Add Habit Form */}
      <form action={addHabit} className="flex flex-col sm:flex-row gap-4 bg-[#111726] p-4 rounded-xl border border-gray-800">
        <input 
          type="text" 
          name="title" 
          placeholder="New daily habit (e.g., Read 10 pages)..." 
          required
          className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm"
          autoComplete="off"
        />
        <SubmitButton 
          defaultText="Add Habit" 
          loadingText="Adding..." 
          baseClass="bg-purple-600 hover:bg-purple-700 px-6 py-2.5 rounded-lg font-semibold transition-colors text-sm"
        />
      </form>

      {/* Habits List */}
      <div className="space-y-3">
        {habits?.map((habit) => {
          const isDone = completedTodayMap[habit.id] || false;
          return (
            <div key={habit.id} className="bg-[#111726] p-4 rounded-xl flex items-center justify-between border border-gray-800 gap-4">
              <span className={`text-base font-medium ${isDone ? 'line-through text-gray-500' : 'text-white'}`}>
                {habit.title}
              </span>

              <div className="flex items-center gap-3">
                <form action={toggleHabit}>
                  <input type="hidden" name="habitId" value={habit.id} />
                  <input type="hidden" name="currentState" value={String(isDone)} />
                  <SubmitButton 
                    defaultText={isDone ? 'Completed ✓' : 'Mark Done'} 
                    loadingText="Saving..." 
                    baseClass={`text-xs font-semibold px-4 py-2 rounded-lg border transition-colors w-28 ${
                      isDone 
                        ? 'bg-green-950/40 text-green-400 border-green-900/40 hover:bg-green-900/40' 
                        : 'bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800'
                    }`}
                  />
                </form>

                <form action={deleteHabit}>
                  <input type="hidden" name="id" value={habit.id} />
                  <SubmitButton 
                    defaultText="Delete" 
                    loadingText="..." 
                    baseClass="text-red-400 hover:text-red-300 text-xs font-semibold px-3 py-2 bg-red-950/40 rounded-lg border border-red-900/40 transition-colors"
                  />
                </form>
              </div>
            </div>
          );
        })}

        {habits?.length === 0 && (
          <p className="text-gray-500 text-center py-12 border border-dashed border-gray-800 rounded-xl bg-[#111726]/50">
            No habits created yet. Add your first daily routine above.
          </p>
        )}
      </div>
    </div>
  );
}