'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [accent, setAccent] = useState<'purple' | 'blue' | 'emerald' | 'rose'>('purple');
  const [bgTheme, setBgTheme] = useState<'midnight' | 'oled' | 'slate' | 'espresso'>('midnight');
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

    // Read cookies for initial state
    const accentMatch = document.cookie.match(new RegExp('(^| )lifeos_accent=([^;]+)'));
    if (accentMatch) setAccent(accentMatch[2] as any);

    const bgMatch = document.cookie.match(new RegExp('(^| )lifeos_bg=([^;]+)'));
    if (bgMatch) setBgTheme(bgMatch[2] as any);
  }, [router, supabase]);

  const handleAccentChange = (newAccent: 'purple' | 'blue' | 'emerald' | 'rose') => {
    setAccent(newAccent);
    document.cookie = `lifeos_accent=${newAccent}; path=/; max-age=31536000`;
    router.refresh();
  };

  const handleBgChange = (newBg: 'midnight' | 'oled' | 'slate' | 'espresso') => {
    setBgTheme(newBg);
    document.cookie = `lifeos_bg=${newBg}; path=/; max-age=31536000`;
    router.refresh();
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!user) {
    return <div className="text-gray-400 p-8 text-xs font-mono">LOADING SETTINGS...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Settings & Account</h1>
        <p className="text-gray-400 text-xs mt-1">Configure your workspace appearance and session.</p>
      </div>

      <div className="atmospheric-card p-6 rounded-2xl space-y-6">
        
        {/* Accent Palette */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3">Accent Palette</h2>
          <div className="bg-black/30 border border-gray-800/80 p-4 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-xs font-medium text-white block">System Highlight Color</span>
              <span className="text-[11px] text-gray-400">Select your active workspace accent.</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleAccentChange('purple')}
                className={`w-6 h-6 rounded-full bg-purple-500 transition-transform cursor-pointer ${accent === 'purple' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
              />
              <button
                onClick={() => handleAccentChange('blue')}
                className={`w-6 h-6 rounded-full bg-blue-500 transition-transform cursor-pointer ${accent === 'blue' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
              />
              <button
                onClick={() => handleAccentChange('emerald')}
                className={`w-6 h-6 rounded-full bg-emerald-500 transition-transform cursor-pointer ${accent === 'emerald' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
              />
              <button
                onClick={() => handleAccentChange('rose')}
                className={`w-6 h-6 rounded-full bg-rose-500 transition-transform cursor-pointer ${accent === 'rose' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
              />
            </div>
          </div>
        </div>

        {/* Background Theme Selector */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3">Workspace Background</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => handleBgChange('midnight')}
              className={`p-3 rounded-xl border text-left space-y-2 transition-all cursor-pointer ${bgTheme === 'midnight' ? 'border-purple-500 bg-purple-950/20' : 'border-gray-800 bg-[#0b0f19] hover:border-gray-700'}`}
            >
              <div className="w-full h-8 rounded bg-[#0b0f19] border border-gray-800" />
              <div>
                <div className="text-xs font-medium text-white">Midnight</div>
                <div className="text-[10px] text-gray-400">Deep obsidian navy</div>
              </div>
            </button>

            <button
              onClick={() => handleBgChange('oled')}
              className={`p-3 rounded-xl border text-left space-y-2 transition-all cursor-pointer ${bgTheme === 'oled' ? 'border-purple-500 bg-purple-950/20' : 'border-neutral-800 bg-black hover:border-neutral-700'}`}
            >
              <div className="w-full h-8 rounded bg-black border border-neutral-800" />
              <div>
                <div className="text-xs font-medium text-white">OLED Black</div>
                <div className="text-[10px] text-gray-400">Pure absolute black</div>
              </div>
            </button>

            <button
              onClick={() => handleBgChange('slate')}
              className={`p-3 rounded-xl border text-left space-y-2 transition-all cursor-pointer ${bgTheme === 'slate' ? 'border-purple-500 bg-purple-950/20' : 'border-slate-800 bg-[#0f172a] hover:border-slate-700'}`}
            >
              <div className="w-full h-8 rounded bg-[#0f172a] border border-slate-800" />
              <div>
                <div className="text-xs font-medium text-white">Cool Slate</div>
                <div className="text-[10px] text-gray-400">Clean tech charcoal</div>
              </div>
            </button>

            <button
              onClick={() => handleBgChange('espresso')}
              className={`p-3 rounded-xl border text-left space-y-2 transition-all cursor-pointer ${bgTheme === 'espresso' ? 'border-purple-500 bg-purple-950/20' : 'border-[#2a2421] bg-[#12100e] hover:border-[#3a322e]'}`}
            >
              <div className="w-full h-8 rounded bg-[#12100e] border border-[#2a2421]" />
              <div>
                <div className="text-xs font-medium text-white">Espresso</div>
                <div className="text-[10px] text-gray-400">Warm dark brown</div>
              </div>
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3">User Profile</h2>
          <div className="bg-black/30 border border-gray-800/80 p-4 rounded-xl space-y-2 font-mono text-xs">
            <div>
              <span className="text-[10px] text-gray-500 uppercase block">Email Address</span>
              <span className="text-white">{user.email}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase block">User ID</span>
              <span className="text-gray-400">{user.id}</span>
            </div>
          </div>
        </div>

        {/* Session Management */}
        <div className="pt-4 border-t border-gray-800">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3">Session Management</h2>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>

      </div>
    </div>
  );
}