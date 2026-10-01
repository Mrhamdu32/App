import { cookies } from 'next/headers';

export async function getAccentClasses() {
  const cookieStore = await cookies();
  const accent = cookieStore.get('lifeos_accent')?.value || 'purple';

  const map: Record<string, {
    text: string;
    bg: string;
    border: string;
    gradient: string;
    button: string;
    ring: string;
  }> = {
    purple: {
      text: 'text-purple-400',
      bg: 'bg-purple-950/60',
      border: 'border-purple-900/50',
      gradient: 'from-purple-400 to-blue-500',
      button: 'bg-purple-600 hover:bg-purple-700',
      ring: 'border-t-purple-500',
    },
    blue: {
      text: 'text-blue-400',
      bg: 'bg-blue-950/60',
      border: 'border-blue-900/50',
      gradient: 'from-blue-400 to-cyan-500',
      button: 'bg-blue-600 hover:bg-blue-700',
      ring: 'border-t-blue-500',
    },
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-950/60',
      border: 'border-emerald-900/50',
      gradient: 'from-emerald-400 to-teal-500',
      button: 'bg-emerald-600 hover:bg-emerald-700',
      ring: 'border-t-emerald-500',
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-950/60',
      border: 'border-rose-900/50',
      gradient: 'from-rose-400 to-orange-500',
      button: 'bg-rose-600 hover:bg-rose-700',
      ring: 'border-t-rose-500',
    },
  };

  return map[accent] || map.purple;
}