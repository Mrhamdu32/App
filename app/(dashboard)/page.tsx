import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAccentClasses } from '@/utils/accent';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const accent = await getAccentClasses();

  // Fetch data concurrently across all modules
  const [
    { data: tasks },
    { data: habits },
    { data: goals },
    { data: books },
    { data: notes },
    { data: transactions },
    { data: projects }
  ] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', user.id),
    supabase.from('habits').select('*').eq('user_id', user.id),
    supabase.from('goals').select('*').eq('user_id', user.id),
    supabase.from('books').select('*').eq('user_id', user.id),
    supabase.from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('transactions').select('*').eq('user_id', user.id),
    supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
  ]);

  // Compute metrics
  const pendingTasks = tasks?.filter(t => !t.completed)?.length || 0;
  
  let totalIncome = 0;
  let totalExpense = 0;
  transactions?.forEach(tx => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') totalIncome += amt;
    else totalExpense += amt;
  });
  const netBalance = totalIncome - totalExpense;

  const activeProjectsCount = projects?.filter(p => p.status !== 'completed')?.length || 0;
  const currentReadingBooks = books?.filter(b => b.status === 'reading') || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="border-b border-gray-800/60 pb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Command Center</h1>
        <p className="text-gray-400 text-sm font-normal mt-1">Real-time overview of your productivity, finances, and active initiatives.</p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111726]/80 backdrop-blur-sm border border-gray-800/80 p-5 rounded-xl space-y-2">
          <span className="text-[11px] font-medium tracking-widest uppercase text-gray-400/90 block">Net Balance</span>
          <div className={`text-3xl font-semibold tracking-tight ${netBalance >= 0 ? accent.text : 'text-red-400'}`}>
            ₹{netBalance.toLocaleString()}
          </div>
          <Link href="/finance" className={`text-xs font-medium ${accent.text} hover:underline inline-flex items-center gap-1 pt-1`}>
            View Finance <span className="text-[10px]">→</span>
          </Link>
        </div>

        <div className="bg-[#111726]/80 backdrop-blur-sm border border-gray-800/80 p-5 rounded-xl space-y-2">
          <span className="text-[11px] font-medium tracking-widest uppercase text-gray-400/90 block">Pending Tasks</span>
          <div className="text-3xl font-semibold tracking-tight text-white">{pendingTasks}</div>
          <Link href="/tasks" className={`text-xs font-medium ${accent.text} hover:underline inline-flex items-center gap-1 pt-1`}>
            View Tasks <span className="text-[10px]">→</span>
          </Link>
        </div>

        <div className="bg-[#111726]/80 backdrop-blur-sm border border-gray-800/80 p-5 rounded-xl space-y-2">
          <span className="text-[11px] font-medium tracking-widest uppercase text-gray-400/90 block">Active Projects</span>
          <div className={`text-3xl font-semibold tracking-tight ${accent.text}`}>{activeProjectsCount}</div>
          <Link href="/projects" className={`text-xs font-medium ${accent.text} hover:underline inline-flex items-center gap-1 pt-1`}>
            View Projects <span className="text-[10px]">→</span>
          </Link>
        </div>

        <div className="bg-[#111726]/80 backdrop-blur-sm border border-gray-800/80 p-5 rounded-xl space-y-2">
          <span className="text-[11px] font-medium tracking-widest uppercase text-gray-400/90 block">Currently Reading</span>
          <div className="text-3xl font-semibold tracking-tight text-white">{currentReadingBooks.length} <span className="text-sm font-normal text-gray-400">Books</span></div>
          <Link href="/reading" className={`text-xs font-medium ${accent.text} hover:underline inline-flex items-center gap-1 pt-1`}>
            View Library <span className="text-[10px]">→</span>
          </Link>
        </div>
      </div>

      {/* Main Grid Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects Widget */}
        <div className="bg-[#111726]/80 backdrop-blur-sm border border-gray-800/80 p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-300">Recent Projects</h2>
            <Link href="/projects" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">See all</Link>
          </div>
          <div className="space-y-3">
            {projects?.map(project => (
              <div key={project.id} className="bg-black/30 border border-gray-800/60 p-4 rounded-lg flex justify-between items-center">
                <div className="space-y-0.5">
                  <h4 className="font-medium text-sm text-white">{project.title}</h4>
                  <p className="text-xs text-gray-400 line-clamp-1">{project.description || 'No description provided'}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider border ${
                  project.status === 'completed' ? 'bg-green-950/60 text-green-400 border-green-900/50' :
                  project.status === 'in_progress' ? `${accent.bg} ${accent.text}${accent.border}` :
                  'bg-gray-800/80 text-gray-300 border-gray-700/80'
                }`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
            ))}
            {(!projects || projects.length === 0) && (
              <p className="text-xs text-gray-500 py-6 text-center">No projects found.</p>
            )}
          </div>
        </div>

        {/* Current Reading Widget */}
        <div className="bg-[#111726]/80 backdrop-blur-sm border border-gray-800/80 p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-300">Reading Focus</h2>
            <Link href="/reading" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">Library</Link>
          </div>
          <div className="space-y-3">
            {currentReadingBooks.map(book => {
              const percentage = book.total_pages > 0 
                ? Math.min(100, Math.round((book.pages_read / book.total_pages) * 100)) 
                : 0;
              return (
                <div key={book.id} className="bg-black/30 border border-gray-800/60 p-4 rounded-lg flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h4 className="font-medium text-sm text-white">{book.title}</h4>
                    <p className={`text-xs font-medium ${accent.text}`}>by {book.author}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400">{percentage}%</span>
                    <div className={`w-10 h-10 rounded-full border-2 border-gray-800 ${accent.ring} flex items-center justify-center text-[10px] font-bold ${accent.text}`}>
                      {percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
            {currentReadingBooks.length === 0 && (
              <p className="text-xs text-gray-500 py-6 text-center">No books currently being read.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Notes Widget */}
      <div className="bg-[#111726]/80 backdrop-blur-sm border border-gray-800/80 p-6 rounded-xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-300">Recent Notes</h2>
          <Link href="/notes" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">Open Notebook</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {notes?.map(note => (
            <div key={note.id} className="bg-black/30 border border-gray-800/60 p-4 rounded-lg space-y-1.5">
              <h4 className="font-medium text-sm text-white">{note.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{note.content}</p>
            </div>
          ))}
          {(!notes || notes.length === 0) && (
            <div className="col-span-full py-6 text-center text-xs text-gray-500">No notes captured yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}