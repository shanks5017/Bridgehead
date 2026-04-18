import React, { useState } from 'react';
import { View } from '../types';
import { Input } from './common/FormComponents';
import { GoogleIcon, MicrosoftIcon, ArrowRightIcon } from './icons';

interface SignInProps {
  onSignIn: (identifier: string, password: string) => Promise<boolean>;
  setView: (view: View) => void;
}

const SignIn: React.FC<SignInProps> = ({ onSignIn, setView }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const success = await onSignIn(identifier, password);
      if (!success) {
        setError('Verification Failed: Invalid credentials');
      }
    } catch (err) {
      setError('System Error: Authentication endpoint unreachable');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSocialSignIn = (provider: 'google' | 'microsoft') => {
    console.log(`Connecting to ${provider} gateway...`);
  };

  return (
    <div className="min-h-screen bg-foundation flex items-center justify-center py-20 px-6">
      <div className="w-full max-w-lg space-y-8 animate-slide-up">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-12">
            <h1 className="text-6xl md:text-8xl font-serif-italic font-bold tracking-tighter uppercase leading-none opacity-10 select-none">
                ZONEK
            </h1>
            <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-accent-blue rounded-full" />
                <span className="text-[10px] font-mono tracking-[0.4em] uppercase opacity-50 font-bold">Authentication Gateway</span>
            </div>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-ink p-8 md:p-12 neo-shadow-lg space-y-8">
            <div className="space-y-2">
                <h2 className="text-4xl font-serif-italic font-bold tracking-tight uppercase leading-none">Welcome Back.</h2>
                <p className="text-[10px] font-mono tracking-widest uppercase opacity-40">Re-establish secure session to platform</p>
            </div>

            {/* Social Auth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => handleSocialSignIn('google')}
                    className="flex items-center justify-center gap-3 px-4 py-4 border border-ink hover:bg-foundation transition-all font-bold uppercase tracking-tight text-xs"
                >
                    <GoogleIcon className="w-5 h-5 grayscale" />
                    Google Entry
                </button>
                <button
                    type="button"
                    onClick={() => handleSocialSignIn('microsoft')}
                    className="flex items-center justify-center gap-3 px-4 py-4 border border-ink hover:bg-foundation transition-all font-bold uppercase tracking-tight text-xs"
                >
                    <MicrosoftIcon className="w-5 h-5 grayscale" />
                    Microsoft Link
                </button>
            </div>

            <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-ink/10"></div></div>
                <span className="relative bg-white px-4 text-[10px] font-mono tracking-widest opacity-20 uppercase">OR INTERNAL PROTOCOL</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-accent-blue/5 border border-accent-blue/20 p-4 animate-shake">
                        <p className="text-[10px] font-mono text-accent-blue uppercase font-bold tracking-widest leading-none">Error: {error}</p>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-widest uppercase opacity-40 block px-1">Identity Identifier</label>
                    <Input 
                        type="text" 
                        placeholder="you@domain.host or username" 
                        value={identifier} 
                        onChange={e => setIdentifier(e.target.value)} 
                        required 
                        className="neo-input"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-widest uppercase opacity-40 block px-1">Access Passcode</label>
                    <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        className="neo-input"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="neo-button neo-button-primary w-full py-5 text-lg font-bold group"
                >
                    {isSubmitting ? 'VERIFYING...' : 'INITIALIZE SESSION'}
                    <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
            </form>

            <div className="pt-6 border-t border-ink/10 text-center">
                <p className="text-[10px] font-mono tracking-widest uppercase opacity-40">
                    New Operator?{' '}
                    <button 
                        type="button" 
                        onClick={() => setView(View.SIGN_UP)} 
                        className="font-bold text-accent-blue hover:underline underline-offset-4"
                    >
                        Register Identity
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
