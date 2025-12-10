
import React, { useState } from 'react';
import { View } from '../types';
import { Input } from './common/FormComponents';
import { GoogleIcon, MicrosoftIcon } from './icons';

interface SignUpProps {
  onSignUp: (name: string, email: string, password: string) => boolean;
  setView: (view: View) => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSignUp, setView }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Basic validation
    if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
    }
    const success = onSignUp(name, email, password);
    if (!success) {
      setError('Could not create account. Please try again.');
    }
  };

  const handleSocialSignUp = (provider: 'google' | 'microsoft') => {
    console.log(`Signing up with ${provider}...`);
    // Mock social sign up logic would go here
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="w-full max-w-md mx-auto bg-[--card-color] border border-[--border-color] rounded-xl p-8 space-y-6">
        <div className="text-center">
            <h2 className="text-3xl font-bold">Create an Account</h2>
            <p className="text-[--text-secondary]">Join Bridgehead to shape your community.</p>
        </div>

        <div className="space-y-3">
            <button
                type="button"
                onClick={() => handleSocialSignUp('google')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-[--border-color] rounded-lg text-white font-medium hover:bg-white/10 transition-colors"
            >
                <GoogleIcon className="w-6 h-6" />
                Sign Up with Google
            </button>
            <button
                type="button"
                onClick={() => handleSocialSignUp('microsoft')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-[--border-color] rounded-lg text-white font-medium hover:bg-white/10 transition-colors"
            >
                <MicrosoftIcon className="w-6 h-6" />
                Sign Up with Microsoft
            </button>
        </div>

        <div className="flex items-center text-center">
            <hr className="flex-grow border-t border-[--border-color]" />
            <span className="px-4 text-xs font-medium text-[--text-secondary]">OR</span>
            <hr className="flex-grow border-t border-[--border-color]" />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-3 rounded-md">{error}</p>}

            <Input label="Full Name" type="text" placeholder="Alex Johnson" value={name} onChange={e => setName(e.target.value)} required />
            <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input label="Password" type="password" placeholder="8+ characters" value={password} onChange={e => setPassword(e.target.value)} required />
            
            <button type="submit" className="w-full mt-4 px-6 py-3 rounded-lg text-lg font-semibold bg-[--primary-color] text-white hover:opacity-90 transition-opacity">
            Create Account
            </button>
        </form>

        <p className="text-center text-sm text-[--text-secondary]">
          Already have an account?{' '}
          <button type="button" onClick={() => setView(View.SIGN_IN)} className="font-medium text-[--primary-color] hover:underline">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
