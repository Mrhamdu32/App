import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { SubmitButton } from '../../components/SubmitButton';

export default async function ReadingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 1. Fetch books
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // 2. Fetch all book notes for this user
  const { data: notes } = await supabase
    .from('book_notes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Map notes by book_id for easy lookup
  const notesByBook: Record<string, Array<{ id: string; content: string; created_at: string }>> = {};
  notes?.forEach((note) => {
    if (!notesByBook[note.book_id]) {
      notesByBook[note.book_id] = [];
    }
    notesByBook[note.book_id].push(note);
  });

  async function addBook(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const author = formData.get('author') as string;
    const total_pages = parseInt(formData.get('total_pages') as string) || 0;
    const status = formData.get('status') as string;
    const initialNote = formData.get('initial_note') as string;

    if (!title || !author) return;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Insert book
    const { data: newBook, error } = await supabase.from('books').insert([{
      title,
      author,
      total_pages,
      pages_read: status === 'completed' ? total_pages : 0,
      status,
      user_id: user.id
    }]).select().single();

    if (error || !newBook) return;

    // If initial note was provided, insert it into book_notes
    if (initialNote && initialNote.trim() !== '') {
      await supabase.from('book_notes').insert([{
        book_id: newBook.id,
        user_id: user.id,
        content: initialNote
      }]);
    }

    revalidatePath('/reading');
  }

  async function updateProgress(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const pages_read = parseInt(formData.get('pages_read') as string) || 0;
    const total_pages = parseInt(formData.get('total_pages') as string) || 1;

    let status = 'reading';
    if (pages_read >= total_pages) status = 'completed';

    const supabase = await createClient();
    await supabase.from('books').update({
      pages_read,
      status
    }).eq('id', id);

    revalidatePath('/reading');
  }

  async function addNote(formData: FormData) {
    'use server';
    const book_id = formData.get('book_id') as string;
    const content = formData.get('content') as string;
    if (!book_id || !content || !content.trim()) return;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('book_notes').insert([{
      book_id,
      user_id: user.id,
      content
    }]);

    revalidatePath('/reading');
  }

  async function deleteNote(formData: FormData) {
    'use server';
    const note_id = formData.get('note_id') as string;
    if (!note_id) return;

    const supabase = await createClient();
    await supabase.from('book_notes').delete().eq('id', note_id);
    revalidatePath('/reading');
  }

  async function deleteBook(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;

    const supabase = await createClient();
    await supabase.from('books').delete().eq('id', id);
    revalidatePath('/reading');
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Reading & Library</h1>
        <p className="text-gray-400 text-sm mt-1">Track your literature, page progression, and cumulative insights.</p>
      </div>

      {/* Add Book Form */}
      <form action={addBook} className="bg-[#111726] p-6 rounded-xl border border-gray-800 space-y-4">
        <h2 className="text-lg font-semibold">Add New Book</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="text" 
            name="title" 
            placeholder="Book title..." 
            required
            className="bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
          />
          <input 
            type="text" 
            name="author" 
            placeholder="Author..." 
            required
            className="bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
          />
          <input 
            type="number" 
            name="total_pages" 
            placeholder="Total pages..." 
            required
            className="bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
          />
          <select 
            name="status"
            className="bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="reading">Currently Reading</option>
            <option value="want_to_read">Want to Read</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <textarea 
          name="initial_note" 
          placeholder="First note or initial takeaway (optional)..." 
          rows={2}
          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
        ></textarea>
        <SubmitButton 
          defaultText="Add to Library" 
          loadingText="Saving..." 
          baseClass="bg-purple-600 hover:bg-purple-700 px-6 py-2.5 rounded-lg font-semibold transition-colors text-sm"
        />
      </form>

      {/* Books List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {books?.map((book) => {
          const percentage = book.total_pages > 0 
            ? Math.min(100, Math.round((book.pages_read / book.total_pages) * 100)) 
            : 0;
          const bookNotes = notesByBook[book.id] || [];

          return (
            <div key={book.id} className="bg-[#111726] border border-gray-800 p-6 rounded-xl flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-lg text-white">{book.title}</h3>
                    <p className="text-xs text-purple-400 font-medium">by {book.author}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                    book.status === 'completed' ? 'bg-green-950/60 text-green-400 border border-green-900/50' :
                    book.status === 'reading' ? 'bg-purple-950/60 text-purple-400 border border-purple-900/50' :
                    'bg-gray-800 text-gray-300'
                  }`}>
                    {book.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Progress Bar & Stats */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress: {book.pages_read} / {book.total_pages} pages</span>
                    <span className="font-bold text-white">{percentage}%</span>
                  </div>
                  <div className="w-full bg-black rounded-full h-2 overflow-hidden border border-gray-800">
                    <div 
                      className="bg-purple-500 h-full transition-all duration-300" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Notes Stream Section */}
                <div className="space-y-2 mt-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Notes & Insights Stream</span>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {bookNotes.map((note) => (
                      <div key={note.id} className="bg-black/40 border border-gray-800/80 p-2.5 rounded-lg flex justify-between items-start gap-2">
                        <p className="text-xs text-gray-300 whitespace-pre-wrap flex-1">{note.content}</p>
                        <form action={deleteNote}>
                          <input type="hidden" name="note_id" value={note.id} />
                          <button type="submit" className="text-gray-500 hover:text-red-400 text-xs px-1 transition-colors">×</button>
                        </form>
                      </div>
                    ))}
                    {bookNotes.length === 0 && (
                      <p className="text-xs text-gray-500 italic">No notes recorded yet.</p>
                    )}
                  </div>
                </div>

                {/* Add New Note Form for this specific book */}
                <form action={addNote} className="flex gap-2 pt-1">
                  <input type="hidden" name="book_id" value={book.id} />
                  <input 
                    type="text" 
                    name="content" 
                    placeholder="Add a new note or insight..." 
                    required
                    className="flex-1 bg-black border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <SubmitButton 
                    defaultText="Add Note" 
                    loadingText="..." 
                    baseClass="bg-purple-600/80 hover:bg-purple-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors text-white"
                  />
                </form>
              </div>

              {/* Page Progress Update & Delete Book */}
              <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between gap-2">
                <form action={updateProgress} className="flex gap-2 items-center flex-1">
                  <input type="hidden" name="id" value={book.id} />
                  <input type="hidden" name="total_pages" value={book.total_pages} />
                  <input 
                    type="number" 
                    name="pages_read" 
                    defaultValue={book.pages_read}
                    min={0}
                    max={book.total_pages}
                    className="w-24 bg-black border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <SubmitButton 
                    defaultText="Update Pages" 
                    loadingText="..." 
                    baseClass="bg-gray-800 hover:bg-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-700 transition-colors"
                  />
                </form>

                <form action={deleteBook}>
                  <input type="hidden" name="id" value={book.id} />
                  <SubmitButton 
                    defaultText="Delete" 
                    loadingText="..." 
                    baseClass="text-red-400 hover:text-red-300 text-xs font-semibold px-2.5 py-1.5 bg-red-950/40 rounded-lg border border-red-900/40 transition-colors"
                  />
                </form>
              </div>
            </div>
          );
        })}

        {books?.length === 0 && (
          <div className="col-span-full">
            <p className="text-gray-500 text-center py-12 border border-dashed border-gray-800 rounded-xl bg-[#111726]/50">
              Your library is empty. Add your first book above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}