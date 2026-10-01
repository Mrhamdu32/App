import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { SubmitButton } from '../../components/SubmitButton';

export default async function FinancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch transactions ordered by date & creation time
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  // Compute financial metrics
  let totalIncome = 0;
  let totalExpense = 0;

  transactions?.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
    }
  });

  const netBalance = totalIncome - totalExpense;

  async function addTransaction(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const type = formData.get('type') as string;
    const category = formData.get('category') as string;
    const date = formData.get('date') as string;

    if (!title ||isNaN(amount) || !type || !category || !date) return;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('transactions').insert([{
      title,
      amount,
      type,
      category,
      date,
      user_id: user.id
    }]);

    if (error) console.error("Transaction insert error:", error);
    revalidatePath('/finance');
  }

  async function deleteTransaction(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;

    const supabase = await createClient();
    const { error } = await supabase.from('transactions').delete().eq('id', id);

    if (error) console.error("Transaction delete error:", error);
    revalidatePath('/finance');
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Finance & Cash Flow</h1>
        <p className="text-gray-400 text-sm mt-1">Monitor your income, expenses, and net balance.</p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111726] border border-gray-800 p-6 rounded-xl">
          <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Total Income</div>
          <div className="text-2xl font-bold text-green-400">₹{totalIncome.toLocaleString()}</div>
        </div>
        <div className="bg-[#111726] border border-gray-800 p-6 rounded-xl">
          <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Total Expenses</div>
          <div className="text-2xl font-bold text-red-400">₹{totalExpense.toLocaleString()}</div>
        </div>
        <div className="bg-[#111726] border border-gray-800 p-6 rounded-xl">
          <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Net Balance</div>
          <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
            ₹{netBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Add Transaction Form */}
      <form action={addTransaction} className="bg-[#111726] p-6 rounded-xl border border-gray-800 space-y-4">
        <h2 className="text-lg font-semibold">Add Transaction</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <input 
            type="text" 
            name="title" 
            placeholder="Description (e.g., Salary, Groceries)..." 
            required
            className="bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 sm:col-span-2"
            autoComplete="off"
          />
          <input 
            type="number" 
            step="0.01" 
            name="amount" 
            placeholder="Amount (₹)..." 
            required
            className="bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
          />
          <select 
            name="type"
            required
            className="bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input 
            type="text" 
            name="category" 
            placeholder="Category (e.g., Food, Tech)..." 
            required
            className="bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
          <input 
            type="date" 
            name="date" 
            defaultValue={new Date().toISOString().split('T')[0]}
            required
            className="bg-black border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500 cursor-pointer [color-scheme:dark]"
          />
          <SubmitButton 
            defaultText="Add Transaction" 
            loadingText="Saving..." 
            baseClass="bg-purple-600 hover:bg-purple-700 px-6 py-2.5 rounded-lg font-semibold transition-colors text-sm w-full sm:w-auto"
          />
        </div>
      </form>

      {/* Transactions List */}
      <div className="bg-[#111726] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold">Transaction History</h2>
        </div>
        
        <div className="divide-y divide-gray-800/80">
          {transactions?.map((tx) => (
            <div key={tx.id} className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-black/20 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm text-white">{tx.title}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-gray-800 text-gray-300">
                    {tx.category}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString()}
                </span>

                <form action={deleteTransaction}>
                  <input type="hidden" name="id" value={tx.id} />
                  <SubmitButton 
                    defaultText="×" 
                    loadingText="..." 
                    baseClass="text-gray-500 hover:text-red-400 text-base font-bold px-2 py-1 rounded transition-colors"
                  />
                </form>
              </div>
            </div>
          ))}

          {transactions?.length === 0 && (
            <p className="text-gray-500 text-center py-12">
              No transactions recorded yet. Log your first income or expense above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}