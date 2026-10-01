import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { SubmitButton } from '../../components/SubmitButton';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings & Account</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account credentials and session.</p>
      </div>

      <div className="bg-[#111726] border border-gray-800 p-6 rounded-xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">User Profile</h2>
          <div className="bg-black/40 border border-gray-800/80 p-4 rounded-lg space-y-3">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">Email Address</span>
              <span className="text-sm font-medium text-white">{user.email}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">User ID</span>
              <span className="text-xs font-mono text-gray-400">{user.id}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-800">
          <h2 className="text-lg font-semibold mb-3">Session Management</h2>
          <form action={signOut}>
            <SubmitButton 
              defaultText="Sign Out" 
              loadingText="Signing out..." 
              baseClass="bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            />
          </form>
        </div>
      </div>
    </div>
  );
}