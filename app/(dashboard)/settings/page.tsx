'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [accent, setAccent] = useState<'purple' | 'blue' | 'emerald' | 'rose'>('purple');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    }
    getUser();

    // Read cookie for initial state
    const match = document.cookie.match(new RegExp('(^| )lifeos_accent=([^;]+)'));
    if (match) {
      setAccent(match[2] as any);
    }
  }, [router, supabase]);

  const handleAccentChange = (newAccent: 'purple' | 'blue' | 'emerald' | 'rose') => {
    setAccent(newAccent);
    // Save to cookie expiring in 1 year
    document.cookie = `lifeos_accent=${newAccent}; path=/; max-age=31536000`;
    router.refresh();
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!user) {
    return <div className="text-gray-400 p-8">Loading settings...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings & Account</h1>
        <p className="text-gray-400 text-sm mt-1">Configure your workspace preferences and session.</p>
      </div>

      <div className="bg-[#111726] border border-gray-800 p-6 rounded-xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-3 text-white">Accent Palette</h2>
          <div className="bg-black/40 border border-gray-800/80 p-4 rounded-lg flex justify-between items-center">
            <div>
              <span className="text-sm font-medium text-white block">System Highlight Color</span>
              <span className="text-xs text-gray-400">Select your active workspace accent.</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleAccentChange('purple')}
                className={`w-7 h-7 rounded-full bg-purple-500 transition-transform cursor-pointer ${accent === 'purple' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
              />
              <button
                onClick={() => handleAccentChange('blue')}
                className={`w-7 h-7 rounded-full bg-blue-500 transition-transform cursor-pointer ${accent === 'blue' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
              />
              <button
                onClick={() => handleAccentChange('emerald')}
                className={`w-7 h-7 rounded-full bg-emerald-500 transition-transform cursor-pointer ${accent === 'emerald' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
              />
              <button
                onClick={() => handleAccentChange('rose')}
                className={`w-7 h-7 rounded-full bg-rose-500 transition-transform cursor-pointer ${accent === 'rose' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3 text-white">User Profile</h2>
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
          <h2 className="text-lg font-semibold mb-3 text-white">Session Management</h2>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
}