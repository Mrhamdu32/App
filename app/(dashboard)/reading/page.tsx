import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { SubmitButton } from '../../components/SubmitButton';

export default async function ReadingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  async function addBook(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const author = formData.get('author') as string;
    const total_pages = parseInt(formData.get('total_pages') as string) || 0;
    const status = formData.get('status') as string;
    const notes = formData.get('notes') as string;

    if (!title || !author) return;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('books').insert([{
      title,
      author,
      total_pages,
      pages_read: status === 'completed' ? total_pages : 0,
      status,
      notes,
      user_id: user.id
    }]);

    revalidatePath('/reading');
  }

  async function updateProgress(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const pages_read = parseInt(formData.get('pages_read') as string) || 0;
    const total_pages = parseInt(formData.get('total_pages') as string) || 1;
    const notes = formData.get('notes') as string;

    let status = 'reading';
    if (pages_read >= total_pages) status = 'completed';

    const supabase = await createClient();
    await supabase.from('books').update({
      pages_read,
      status,
      notes
    }).eq('id', id);

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
        <p className="text-gray-400 text-sm mt-1">Track your literature, page progression, and insights.</p>
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
          name="notes" 
          placeholder="Initial notes, key takeaways, or summary..." 
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

          return (
            <div key={book.id} className="bg-[#111726] border border-gray-800 p-6 rounded-xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
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

                {/* Notes Section */}
                <div className="bg-black/40 border border-gray-800/80 p-3 rounded-lg mt-3">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-1">Notes & Insights</span>
                  <p className="text-xs text-gray-300 whitespace-pre-wrap">{book.notes || "No notes added yet."}</p>
                </div>
              </div>

              {/* Quick Update Form */}
              <div className="pt-4 border-t border-gray-800/80 flex flex-col gap-3">
                <form action={updateProgress} className="flex gap-2 items-center">
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
                  <input 
                    type="text" 
                    name="notes" 
                    defaultValue={book.notes || ''}
                    placeholder="Update notes..."
                    className="flex-1 bg-black border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <SubmitButton 
                    defaultText="Update" 
                    loadingText="..." 
                    baseClass="bg-gray-800 hover:bg-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-700 transition-colors"
                  />
                </form>

                <div className="flex justify-end">
                  <form action={deleteBook}>
                    <input type="hidden" name="id" value={book.id} />
                    <SubmitButton 
                      defaultText="Delete Book" 
                      loadingText="..." 
                      baseClass="text-red-400 hover:text-red-300 text-xs font-semibold px-3 py-1 bg-red-950/40 rounded-lg border border-red-900/40 transition-colors"
                    />
                  </form>
                </div>
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