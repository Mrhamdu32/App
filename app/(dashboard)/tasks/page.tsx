import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch tasks for the current user
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Server Action: Create Task
  async function addTask(formData: FormData) {
    'use server';
    const title = formData.get('title')?.toString();
    const priority = formData.get('priority')?.toString() || 'medium';
    
    if (!title || title.trim() === '') return;

    const supabaseClient = await createClient();
    const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
    if (!currentUser) return;

    await supabaseClient.from('tasks').insert({
      user_id: currentUser.id,
      title: title.trim(),
      priority,
      completed: false,
    });

    revalidatePath('/tasks');
  }

  // Server Action: Toggle Task Completion
  async function toggleTask(taskId: string, currentStatus: boolean) {
    'use server';
    const supabaseClient = await createClient();
    await supabaseClient
      .from('tasks')
      .update({ completed: !currentStatus })
      .eq('id', taskId);

    revalidatePath('/tasks');
  }

  // Server Action: Delete Task
  async function deleteTask(taskId: string) {
    'use server';
    const supabaseClient = await createClient();
    await supabaseClient
      .from('tasks')
      .delete()
      .eq('id', taskId);

    revalidatePath('/tasks');
  }

  const priorityColors: Record<string, string> = {
    high: 'text-rose-400 border-rose-500/20 bg-rose-500/10',
    medium: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
    low: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="atmospheric-card p-6 rounded-2xl flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Task Queue</h1>
          <p className="text-xs text-gray-400 mt-1">Manage, prioritize, and execute your operational backlog.</p>
        </div>
        <div className="text-xs font-mono text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
          {tasks?.filter(t => !t.completed).length || 0} Pending
        </div>
      </div>

      {/* Add Task Form */}
      <form action={addTask} className="atmospheric-card p-4 rounded-xl flex gap-3 items-center">
        <input 
          type="text" 
          name="title" 
          placeholder="What needs to be executed next..." 
          required
          className="flex-1 bg-black/40 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
        />
        <select 
          name="priority" 
          defaultValue="medium"
          className="bg-black/40 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-purple-500/50 transition-colors"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button 
          type="submit"
          className="bg-gradient-to-r from-purple-500 to-blue-600 text-white font-medium text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity shrink-0"
        >
          Add Task
        </button>
      </form>

      {/* Task List */}
      <div className="space-y-3">
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            Failed to load tasks. Verify your Supabase table schema.
          </div>
        )}

        {tasks?.length === 0 && (
          <div className="atmospheric-card p-12 rounded-xl text-center space-y-2">
            <span className="text-2xl">📝</span>
            <p className="text-sm text-gray-400">Your task queue is completely clear.</p>
          </div>
        )}

        {tasks?.map((task) => (
          <div 
            key={task.id} 
            className={`atmospheric-card p-4 rounded-xl flex items-center justify-between gap-4 transition-all ${task.completed ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <form action={toggleTask.bind(null, task.id, task.completed)}>
                <button 
                  type="submit" 
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${task.completed ? 'bg-purple-600 border-purple-500 text-white' : 'border-gray-700 hover:border-gray-500 bg-black/20'}`}
                >
                  {task.completed && <span className="text-xs">✓</span>}
                </button>
              </form>
              <span className={`text-sm text-white truncate ${task.completed ? 'line-through text-gray-500' : ''}`}>
                {task.title}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border ${priorityColors[task.priority] || priorityColors.medium}`}>
                {task.priority}
              </span>

              <form action={deleteTask.bind(null, task.id)}>
                <button 
                  type="submit" 
                  className="text-gray-500 hover:text-rose-400 text-xs px-2 py-1 transition-colors"
                  title="Delete task"
                >
                  ✕
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}