import { useState } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) {
        setError(error.message);
        setSubmitting(false);
        return;
      }
      // On successful sign-up, a session is created immediately (email confirmation off).
      // onAuthStateChange will update the app state.
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setError(error.message);
        setSubmitting(false);
        return;
      }
    }
    setSubmitting(false);
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // On success the browser redirects to Google; no need to reset loading.
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-white shadow-md">
            <GraduationCap size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Class Countdown</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {mode === 'signup' ? 'Create an account to track your classes' : 'Welcome back'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setMode('signup')}
              className={`rounded-lg py-2.5 text-sm font-semibold transition ${
                mode === 'signup'
                  ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Sign up
            </button>
            <button
              onClick={() => setMode('signin')}
              className={`rounded-lg py-2.5 text-sm font-semibold transition ${
                mode === 'signin'
                  ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Sign in
            </button>
          </div>

          <button
            onClick={handleGoogle}
            disabled={googleLoading || submitting}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                or
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-slate-700"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-slate-700"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
