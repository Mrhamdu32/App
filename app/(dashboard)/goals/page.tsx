import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { SubmitButton } from '../../components/SubmitButton';

export default async function GoalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch user goals
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  async function addGoal(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const targetDate = formData.get('target_date') as string;
    if (!title) return;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('goals').insert([{
      title,
      target_date: targetDate || null,
      status: 'in_progress',
      user_id: user.id
    }]);

    if (error) console.error("Goal insert error:", error);
    revalidatePath('/goals');
    revalidatePath('/');
  }

  async function deleteGoal(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;

    const supabase = await createClient();
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) console.error("Goal delete error:", error);
    revalidatePath('/goals');
    revalidatePath('/');
  }

  async function toggleGoalStatus(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const currentStatus = formData.get('currentStatus') as string;
    if (!id) return;

    const newStatus = currentStatus === 'achieved' ? 'in_progress' : 'achieved';
    const supabase = await createClient();
    const { error } = await supabase.from('goals').update({ status: newStatus }).eq('id', id);
    if (error) console.error("Goal update error:", error);
    revalidatePath('/goals');
    revalidatePath('/');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Goals & Milestones</h1>
        <p className="text-gray-400 text-sm mt-1">Set long-term targets and track your execution.</p>
      </div>

      {/* Add Goal Form */}
      <form action={addGoal} className="flex flex-col sm:flex-row gap-4 bg-[#111726] p-4 rounded-xl border border-gray-800">
        <input 
          type="text" 
          name="title" 
          placeholder="What milestone are you aiming for?" 
          required
          className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm"
          autoComplete="off"
        />
        <input 
          type="date" 
          name="target_date"
          className="bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 cursor-pointer [color-scheme:dark] text-sm"
        />
        <SubmitButton 
          defaultText="Add Goal" 
          loadingText="Adding..." 
          baseClass="bg-purple-600 hover:bg-purple-700 px-6 py-2.5 rounded-lg font-semibold transition-colors text-sm"
        />
      </form>

      {/* Goals List */}
      <div className="space-y-3">
        {goals?.map((goal) => {
          const isAchieved = goal.status === 'achieved';
          return (
            <div key={goal.id} className="bg-[#111726] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between border border-gray-800 gap-4">
              <div className="flex flex-col">
                <span className={`text-base font-medium ${isAchieved ? 'line-through text-gray-500' : 'text-white'}`}>
                  {goal.title}
                </span>
                {goal.target_date && (
                  <span className="text-xs text-purple-300 mt-1">
                    🎯 Target: {new Date(goal.target_date).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <form action={toggleGoalStatus}>
                  <input type="hidden" name="id" value={goal.id} />
                  <input type="hidden" name="currentStatus" value={goal.status} />
                  <SubmitButton 
                    defaultText={isAchieved ? 'Achieved ✓' : 'Mark Achieved'} 
                    loadingText="Saving..." 
                    baseClass={`text-xs font-semibold px-4 py-2 rounded-lg border transition-colors w-32 ${
                      isAchieved 
                        ? 'bg-green-950/40 text-green-400 border-green-900/40 hover:bg-green-900/40' 
                        : 'bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800'
                    }`}
                  />
                </form>

                <form action={deleteGoal}>
                  <input type="hidden" name="id" value={goal.id} />
                  <SubmitButton 
                    defaultText="Delete" 
                    loadingText="Wait..." 
                    baseClass="text-red-400 hover:text-red-300 text-xs font-semibold px-3 py-2 bg-red-950/40 rounded-lg border border-red-900/40 transition-colors"
                  />
                </form>
              </div>
            </div>
          );
        })}

        {goals?.length === 0 && (
          <p className="text-gray-500 text-center py-12 border border-dashed border-gray-800 rounded-xl bg-[#111726]/50">
            No active goals set. Define your target above.
          </p>
        )}
      </div>
    </div>
  );
}