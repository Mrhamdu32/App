'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
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

    // Load saved preferences from localStorage
    const savedTheme = localStorage.getItem('lifeos_theme') as 'dark' | 'light';
    const savedAccent = localStorage.getItem('lifeos_accent') as 'purple' | 'blue' | 'emerald' | 'rose';
    if (savedTheme) setTheme(savedTheme);
    if (savedAccent) setAccent(savedAccent);
  }, [router, supabase]);

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('lifeos_theme', newTheme);
    // Apply class to html/body
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  };

  const handleAccentChange = (newAccent: 'purple' | 'blue' | 'emerald' | 'rose') => {
    setAccent(newAccent);
    localStorage.setItem('lifeos_accent', newAccent);
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
        {/* Appearance & Themes */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-white">Appearance & Theme</h2>
          <div className="space-y-4 bg-black/40 border border-gray-800/80 p-4 rounded-lg">
            
            {/* Mode Toggle */}
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium text-white block">Interface Theme</span>
                <span className="text-xs text-gray-400">Choose between dark operational mode and light mode.</span>
              </div>
              <div className="flex bg-black border border-gray-700 rounded-lg p-1">
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    theme === 'dark' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    theme === 'light' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Light
                </button>
              </div>
            </div>

            {/* Accent Color Selection */}
            <div className="pt-4 border-t border-gray-800/80 flex justify-between items-center">
              <div>
                <span className="text-sm font-medium text-white block">Accent Palette</span>
                <span className="text-xs text-gray-400">Select your primary system highlight color.</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccentChange('purple')}
                  className={`w-6 h-6 rounded-full bg-purple-500 transition-transform ${accent === 'purple' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
                />
                <button
                  onClick={() => handleAccentChange('blue')}
                  className={`w-6 h-6 rounded-full bg-blue-500 transition-transform ${accent === 'blue' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
                />
                <button
                  onClick={() => handleAccentChange('emerald')}
                  className={`w-6 h-6 rounded-full bg-emerald-500 transition-transform ${accent === 'emerald' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
                />
                <button
                  onClick={() => handleAccentChange('rose')}
                  className={`w-6 h-6 rounded-full bg-rose-500 transition-transform ${accent === 'rose' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
                />
              </div>
            </div>

          </div>
        </div>

        {/* User Profile */}
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

        {/* Session Management */}
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