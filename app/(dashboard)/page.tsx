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
    <div className="max-w-6xl mx-auto space-y-10 pb-12">
      {/* Page Header */}
      <div className="flex justify-between items-end border-b border-gray-800/60 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Command Center</h1>
          <p className="text-gray-400 text-sm mt-1">Operational metrics and system overview.</p>
        </div>
        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">
          SYSTEM ONLINE // {user.email}
        </div>
      </div>

      {/* Top Metric Strip (Clean Border Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-gray-800/80 rounded-2xl divide-y sm:divide-y-0 sm:divide-x divide-gray-800/80 bg-[#0e131f]/40 backdrop-blur-sm overflow-hidden">
        
        <div className="p-6 space-y-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Net Balance</span>
          <div className={`text-3xl font-semibold tracking-tight ${netBalance >= 0 ? accent.text : 'text-rose-400'}`}>
            ₹{netBalance.toLocaleString()}
          </div>
          <div>
            <Link href="/finance" className={`text-xs font-medium ${accent.text} hover:underline inline-flex items-center gap-1`}>
              Finance ledger <span className="text-[10px]">→</span>
            </Link>
          </div>
        </div>

        <div className="p-6 space-y-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Pending Tasks</span>
          <div className="text-3xl font-semibold tracking-tight text-white">{pendingTasks}</div>
          <div>
            <Link href="/tasks" className={`text-xs font-medium ${accent.text} hover:underline inline-flex items-center gap-1`}>
              Task queue <span className="text-[10px]">→</span>
            </Link>
          </div>
        </div>

        <div className="p-6 space-y-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Active Projects</span>
          <div className={`text-3xl font-semibold tracking-tight ${accent.text}`}>{activeProjectsCount}</div>
          <div>
            <Link href="/projects" className={`text-xs font-medium ${accent.text} hover:underline inline-flex items-center gap-1`}>
              Initiatives <span className="text-[10px]">→</span>
            </Link>
          </div>
        </div>

        <div className="p-6 space-y-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Reading Focus</span>
          <div className="text-3xl font-semibold tracking-tight text-white">{currentReadingBooks.length} <span className="text-sm font-normal text-gray-500">active</span></div>
          <div>
            <Link href="/reading" className={`text-xs font-medium ${accent.text} hover:underline inline-flex items-center gap-1`}>
              Library <span className="text-[10px]">→</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Main Grid Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Active Projects Widget */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Recent Projects</h2>
            <Link href="/projects" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">View all</Link>
          </div>
          
          <div className="border border-gray-800/80 rounded-xl bg-[#0e131f]/40 divide-y divide-gray-800/60 overflow-hidden">
            {projects?.map(project => (
              <div key={project.id} className="p-5 flex justify-between items-center hover:bg-white/[0.02] transition-colors">
                <div className="space-y-1 pr-4">
                  <h4 className="font-medium text-sm text-white">{project.title}</h4>
                  <p className="text-xs text-gray-400 line-clamp-1">{project.description || 'No description provided'}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider whitespace-nowrap border ${
                  project.status === 'completed' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40' :
                  project.status === 'in_progress' ? `${accent.bg} ${accent.text}${accent.border}` :
                  'bg-gray-800/40 text-gray-400 border-gray-700/40'
                }`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
            ))}
            {(!projects || projects.length === 0) && (
              <p className="text-xs text-gray-500 py-12 text-center">No projects found.</p>
            )}
          </div>
        </div>

        {/* Current Reading Widget */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Reading Focus</h2>
            <Link href="/reading" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">Library</Link>
          </div>

          <div className="border border-gray-800/80 rounded-xl bg-[#0e131f]/40 divide-y divide-gray-800/60 overflow-hidden">
            {currentReadingBooks.map(book => {
              const percentage = book.total_pages > 0 
                ? Math.min(100, Math.round((book.pages_read / book.total_pages) * 100)) 
                : 0;
              return (
                <div key={book.id} className="p-5 flex justify-between items-center hover:bg-white/[0.02] transition-colors">
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm text-white">{book.title}</h4>
                    <p className={`text-xs font-medium ${accent.text}`}>by {book.author}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400">{percentage}%</span>
                    <div className={`w-9 h-9 rounded-full border-2 border-gray-800 ${accent.ring} flex items-center justify-center text-[10px] font-bold ${accent.text}`}>
                      {percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
            {currentReadingBooks.length === 0 && (
              <p className="text-xs text-gray-500 py-12 text-center">No books currently being read.</p>
            )}
          </div>
        </div>

      </div>

      {/* Quick Notes Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Recent Notes</h2>
          <Link href="/notes" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">Open Notebook</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {notes?.map(note => (
            <div key={note.id} className="border border-gray-800/80 rounded-xl bg-[#0e131f]/40 p-5 space-y-2 hover:border-gray-700/80 transition-colors">
              <h4 className="font-medium text-sm text-white">{note.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{note.content}</p>
            </div>
          ))}
          {(!notes || notes.length === 0) && (
            <div className="col-span-full border border-dashed border-gray-800 rounded-xl py-12 text-center text-xs text-gray-500">
              No notes captured yet.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}