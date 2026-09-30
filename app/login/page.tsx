import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default function LoginPage() {
  async function login(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error.message);
      redirect('/login?message=Could not authenticate user');
    }

    revalidatePath('/', 'layout');
    redirect('/');
  }

  async function signup(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Signup error:', error.message);
      redirect('/login?message=Could not sign up user');
    }

    revalidatePath('/', 'layout');
    redirect('/');
  }

  return (
    <main className="max-w-md mx-auto p-8 mt-20 text-white bg-gray-900 border border-gray-700 rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Life OS Login</h1>
      
      <form className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full bg-black border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full bg-black border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <div className="flex gap-4 mt-4">
          <button formAction={login} className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold transition-colors">
            Log In
          </button>
          <button formAction={signup} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded font-semibold transition-colors">
            Sign Up
          </button>
        </div>
      </form>
    </main>
  );
}