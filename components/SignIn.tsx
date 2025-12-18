
import React, { useState } from 'react';
import { View } from '../types';
import { Input } from './common/FormComponents';
import { GoogleIcon, MicrosoftIcon } from './icons';

interface SignInProps {
  onSignIn: (email: string, password: string) => Promise<boolean>;
  setView: (view: View) => void;
}

const SignIn: React.FC<SignInProps> = ({ onSignIn, setView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const success = await onSignIn(email, password);
      // If success is false, App.tsx handles the toast, but we might want to set local error too if needed.
      // However, App.tsx implementation returns false on failure and sets a toast.
      // We can also set a generic error here if we want, or just rely on the toast.
      // The original code set a specific hint message. Let's preserve that if it fails.
      if (!success) {
        setError('Invalid email or password. (Hint: alex@example.com / password123 or admin: shanks@gmail.com / shanks@123)');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    }
  };

  const handleSocialSignIn = (provider: 'google' | 'microsoft') => {
    console.log(`Signing in with ${provider}...`);
    // Mock social sign in logic would go here
  };


  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="w-full max-w-md mx-auto bg-[--card-color] border border-[--border-color] rounded-xl p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Welcome Back</h2>
          <p className="text-[--text-secondary]">Sign in to continue to Bridgehead.</p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleSocialSignIn('google')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-[--border-color] rounded-lg text-white font-medium hover:bg-white/10 transition-colors"
          >
            <GoogleIcon className="w-6 h-6" />
            Sign In with Google
          </button>
          <button
            type="button"
            onClick={() => handleSocialSignIn('microsoft')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-[--border-color] rounded-lg text-white font-medium hover:bg-white/10 transition-colors"
          >
            <MicrosoftIcon className="w-6 h-6" />
            Sign In with Microsoft
          </button>
        </div>

        <div className="flex items-center text-center">
          <hr className="flex-grow border-t border-[--border-color]" />
          <span className="px-4 text-xs font-medium text-[--text-secondary]">OR</span>
          <hr className="flex-grow border-t border-[--border-color]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-3 rounded-md">{error}</p>}

          <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />

          <button type="submit" className="w-full mt-4 px-6 py-3 rounded-lg text-lg font-semibold bg-[--primary-color] text-white hover:opacity-90 transition-opacity">
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-[--text-secondary]">
          Don't have an account?{' '}
          <button type="button" onClick={() => setView(View.SIGN_UP)} className="font-medium text-[--primary-color] hover:underline">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
