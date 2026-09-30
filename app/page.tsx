import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { SubmitButton } from './components/SubmitButton';
import Link from 'next/link';

export default async function Home({ 
  searchParams 
}: { 
  searchParams: { status?: string, time?: string } 
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // 1. Start the query: Only fetch this user's data
  let query = supabase.from('tasks').select('*').eq('user_id', user.id);

  // 2. Apply Status Filter from URL
  if (searchParams.status === 'completed') {
    query = query.eq('status', 'completed');
  } else if (searchParams.status === 'pending') {
    query = query.eq('status', 'todo');
  }

  // 3. Apply Time Horizon Filter from URL
  const today = new Date().toISOString().split('T')[0]; // Grabs YYYY-MM-DD
  if (searchParams.time === 'today') {
    query = query.eq('due_date', today);
  } else if (searchParams.time === 'upcoming') {
    query = query.gt('due_date', today);
  } else if (searchParams.time === 'someday') {
    query = query.is('due_date', null);
  }

  // 4. Finalize sorting and execute
  query = query.order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false });
  const { data: tasks } = await query;

  // Helper to build bookmarkable URL query strings without dropping existing filters
  const buildQuery = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (searchParams.status) params.set('status', searchParams.status);
    if (searchParams.time) params.set('time', searchParams.time);
    
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    const queryString = params.toString();
    return queryString ? `/?${queryString}` : '/';
  };

  async function addTask(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const priority = formData.get('priority') as string;
    const dueDate = formData.get('due_date') as string;
    
    if (!title) return;
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase.from('tasks').insert([{ 
      title,
      priority,
      due_date: dueDate || null,
      user_id: user.id
    }]);
    
    if (error) console.error("Insert error:", error);
    revalidatePath('/');
  }

  async function deleteTask(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;
    
    const supabase = await createClient();
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) console.error("Delete error:", error);
    revalidatePath('/');
  }

  async function toggleStatus(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const currentStatus = formData.get('currentStatus') as string;
    if (!id) return;
    
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    const supabase = await createClient();
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
    if (error) console.error("Update error:", error);
    revalidatePath('/');
  }

  async function logout() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <main className="max-w-3xl mx-auto p-8 text-white min-h-screen bg-black">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Life OS</h1>
        <form action={logout}>
          <button type="submit" className="text-sm text-gray-400 hover:text-white transition-colors">
            Log Out
          </button>
        </form>
      </div>
      
      {/* Input Form */}
      <form action={addTask} className="flex flex-col sm:flex-row gap-4 mb-8 bg-gray-900 p-4 rounded-lg border border-gray-800">
        <input 
          type="text" 
          name="title" 
          placeholder="What needs to be done?" 
          required
          className="flex-1 bg-black border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          autoComplete="off"
        />
        <select 
          name="priority" 
          defaultValue="medium"
          className="bg-black border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
        <input 
          type="date" 
          name="due_date"
          className="bg-black border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer [color-scheme:dark]"
        />
        <SubmitButton 
          defaultText="Add Task" 
          loadingText="Adding..." 
          baseClass="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-semibold transition-colors"
        />
      </form>

      {/* URL-Based Filters */}
      <div className="flex flex-col sm:flex-row gap-6 mb-6 p-4 bg-gray-900 rounded-lg border border-gray-800 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 mr-2 font-semibold uppercase tracking-wider text-xs">Status</span>
          <Link href={buildQuery('status', 'all')} className={`px-3 py-1.5 rounded transition-colors ${!searchParams.status || searchParams.status === 'all' ? 'bg-blue-900 text-blue-200' : 'text-gray-400 hover:bg-gray-800'}`}>All</Link>
          <Link href={buildQuery('status', 'pending')} className={`px-3 py-1.5 rounded transition-colors ${searchParams.status === 'pending' ? 'bg-blue-900 text-blue-200' : 'text-gray-400 hover:bg-gray-800'}`}>Pending</Link>
          <Link href={buildQuery('status', 'completed')} className={`px-3 py-1.5 rounded transition-colors ${searchParams.status === 'completed' ? 'bg-blue-900 text-blue-200' : 'text-gray-400 hover:bg-gray-800'}`}>Completed</Link>
        </div>
        
        <div className="hidden sm:block w-px bg-gray-700"></div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-500 mr-2 font-semibold uppercase tracking-wider text-xs">Time</span>
          <Link href={buildQuery('time', 'all')} className={`px-3 py-1.5 rounded transition-colors ${!searchParams.time || searchParams.time === 'all' ? 'bg-blue-900 text-blue-200' : 'text-gray-400 hover:bg-gray-800'}`}>All</Link>
          <Link href={buildQuery('time', 'today')} className={`px-3 py-1.5 rounded transition-colors ${searchParams.time === 'today' ? 'bg-blue-900 text-blue-200' : 'text-gray-400 hover:bg-gray-800'}`}>Today</Link>
          <Link href={buildQuery('time', 'upcoming')} className={`px-3 py-1.5 rounded transition-colors ${searchParams.time === 'upcoming' ? 'bg-blue-900 text-blue-200' : 'text-gray-400 hover:bg-gray-800'}`}>Upcoming</Link>
          <Link href={buildQuery('time', 'someday')} className={`px-3 py-1.5 rounded transition-colors ${searchParams.time === 'someday' ? 'bg-blue-900 text-blue-200' : 'text-gray-400 hover:bg-gray-800'}`}>Someday</Link>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks?.map((task) => (
          <div key={task.id} className="bg-gray-800 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between border border-gray-700 gap-4">
            <div className="flex flex-col">
              <span className={`text-lg ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-white'}`}>
                {task.title}
              </span>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className={`px-2 py-0.5 rounded font-medium border ${
                  task.priority === 'high' ? 'bg-red-950 text-red-400 border-red-900' : 
                  task.priority === 'low' ? 'bg-gray-900 text-gray-400 border-gray-700' : 
                  'bg-yellow-950 text-yellow-400 border-yellow-900'
                }`}>
                  {task.priority ? task.priority.toUpperCase() : 'MEDIUM'}
                </span>
                {task.due_date && (
                  <span className="text-blue-300 flex items-center gap-1">
                    📅 {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <form action={toggleStatus}>
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="currentStatus" value={task.status || 'todo'} />
                <SubmitButton 
                  defaultText={task.status === 'completed' ? 'Undo' : 'Complete'} 
                  loadingText="Wait..." 
                  baseClass="text-green-400 hover:text-green-300 text-sm font-semibold px-4 py-2 bg-green-950 rounded border border-green-900 transition-colors w-24"
                />
              </form>
              
              <form action={deleteTask}>
                <input type="hidden" name="id" value={task.id} />
                <SubmitButton 
                  defaultText="Delete" 
                  loadingText="Wait..." 
                  baseClass="text-red-400 hover:text-red-300 text-sm font-semibold px-4 py-2 bg-red-950 rounded border border-red-900 transition-colors w-20"
                />
              </form>
            </div>
          </div>
        ))}
        {tasks?.length === 0 && (
          <p className="text-gray-500 text-center py-8 border border-dashed border-gray-700 rounded-lg">
            No tasks match your current filters.
          </p>
        )}
      </div>
    </main>
  );
}