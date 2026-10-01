import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { SubmitButton } from '../../components/SubmitButton';

export default async function NotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch user notes
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  async function addNote(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    if (!title || !content) return;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('notes').insert([{
      title,
      content,
      user_id: user.id
    }]);

    if (error) console.error("Note insert error:", error);
    revalidatePath('/notes');
  }

  async function deleteNote(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;

    const supabase = await createClient();
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) console.error("Note delete error:", error);
    revalidatePath('/notes');
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Quick Notes & Thoughts</h1>
        <p className="text-gray-400 text-sm mt-1">Capture ideas, snippets, and fast references.</p>
      </div>

      {/* Add Note Form */}
      <form action={addNote} className="bg-[#111726] p-6 rounded-xl border border-gray-800 space-y-4">
        <h2 className="text-lg font-semibold">Create New Note</h2>
        <input 
          type="text" 
          name="title" 
          placeholder="Note title..." 
          required
          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
          autoComplete="off"
        />
        <textarea 
          name="content" 
          placeholder="Write your note content here..." 
          rows={3}
          required
          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
        ></textarea>
        <SubmitButton 
          defaultText="Save Note" 
          loadingText="Saving..." 
          baseClass="bg-purple-600 hover:bg-purple-700 px-6 py-2.5 rounded-lg font-semibold transition-colors text-sm"
        />
      </form>

      {/* Notes List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {notes?.map((note) => (
          <div key={note.id} className="bg-[#111726] border border-gray-800 p-6 rounded-xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold text-lg text-white">{note.title}</h3>
                <span className="text-[10px] text-gray-500">
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="bg-black/40 border border-gray-800/80 p-3 rounded-lg">
                <p className="text-xs text-gray-300 whitespace-pre-wrap">{note.content}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-800/80">
              <form action={deleteNote}>
                <input type="hidden" name="id" value={note.id} />
                <SubmitButton 
                  defaultText="Delete Note" 
                  loadingText="..." 
                  baseClass="text-red-400 hover:text-red-300 text-xs font-semibold px-3 py-1.5 bg-red-950/40 rounded-lg border border-red-900/40 transition-colors"
                />
              </form>
            </div>
          </div>
        ))}

        {notes?.length === 0 && (
          <div className="col-span-full">
            <p className="text-gray-500 text-center py-12 border border-dashed border-gray-800 rounded-xl bg-[#111726]/50">
              No notes captured yet. Add your first note above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}