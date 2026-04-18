import React, { useState } from 'react';
import { View } from '../types';
import { Input } from './common/FormComponents';
import { GoogleIcon, MicrosoftIcon, ArrowRightIcon } from './icons';
import { config } from '../src/config';

interface SignUpProps {
  onSignUp: (name: string, email: string, username: string, password: string) => boolean;
  setView: (view: View) => void;
}

type ValidationStatus = 'unchecked' | 'checking' | 'available' | 'taken' | 'error';

const SignUp: React.FC<SignUpProps> = ({ onSignUp, setView }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<ValidationStatus>('unchecked');
  const [emailStatus, setEmailStatus] = useState<ValidationStatus>('unchecked');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Policy Breach: Passcode must be 8+ characters');
      return;
    }
    setIsSubmitting(true);
    try {
        const success = onSignUp(name, email, username, password);
        if (!success) {
          setError('Registration Failure: Signal could not be broadcast');
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const validateUsername = async () => {
    if (!username || username.length < 3) {
      setUsernameStatus('unchecked');
      return;
    }
    setUsernameStatus('checking');
    try {
      const response = await fetch(`${config.api.baseUrl}/auth/check-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      setUsernameStatus(data.available ? 'available' : 'taken');
      setUsernameMessage(data.message || (data.available ? 'Identity Available' : 'Identity Reserved'));
    } catch (err) {
      setUsernameStatus('error');
    }
  };

  const validateEmail = async () => {
    if (!email || !email.includes('@')) {
      setEmailStatus('unchecked');
      return;
    }
    setEmailStatus('checking');
    try {
      const response = await fetch(`${config.api.baseUrl}/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setEmailStatus(data.available ? 'available' : 'taken');
      setEmailMessage(data.message || (data.available ? 'Email Valid' : 'Email Active'));
    } catch (err) {
      setEmailStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-foundation flex items-center justify-center py-20 px-6">
      <div className="w-full max-w-xl space-y-8 animate-slide-up">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-12">
            <h1 className="text-6xl md:text-8xl font-serif-italic font-bold tracking-tighter uppercase leading-none opacity-10 select-none">
                ZONEK
            </h1>
            <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
                <span className="text-[10px] font-mono tracking-[0.4em] uppercase opacity-50 font-bold">Registration Protocol</span>
            </div>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-ink p-8 md:p-12 neo-shadow-lg space-y-8">
            <div className="space-y-2">
                <h2 className="text-4xl font-serif-italic font-bold tracking-tight uppercase leading-none">New Entity.</h2>
                <p className="text-[10px] font-mono tracking-widest uppercase opacity-40">Initialize your presence in the network</p>
            </div>

            {/* Social Auth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button type="button" className="flex items-center justify-center gap-3 px-4 py-4 border border-ink hover:bg-foundation transition-all font-bold uppercase tracking-tight text-xs">
                    <GoogleIcon className="w-5 h-5 grayscale" />
                    Google Base
                </button>
                <button type="button" className="flex items-center justify-center gap-3 px-4 py-4 border border-ink hover:bg-foundation transition-all font-bold uppercase tracking-tight text-xs">
                    <MicrosoftIcon className="w-5 h-5 grayscale" />
                    Microsoft Link
                </button>
            </div>

            <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-ink/10"></div></div>
                <span className="relative bg-white px-4 text-[10px] font-mono tracking-widest opacity-20 uppercase">OR INTERNAL DEPLOYMENT</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-accent-blue/5 border border-accent-blue/20 p-4 animate-shake">
                        <p className="text-[10px] font-mono text-accent-blue uppercase font-bold tracking-widest leading-none">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono tracking-widest uppercase opacity-40 block px-1">Legal Designation</label>
                        <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="neo-input" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono tracking-widest uppercase opacity-40 block px-1">Network Alias</label>
                        <Input 
                            placeholder="username" 
                            value={username} 
                            onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                            onBlur={validateUsername}
                            required 
                            className="neo-input"
                        />
                        {usernameStatus !== 'unchecked' && (
                            <p className={`text-[10px] font-mono uppercase tracking-widest px-1 mt-1 ${usernameStatus === 'available' ? 'text-accent-green' : 'text-accent-blue'}`}>
                                {usernameStatus === 'checking' ? 'Validating...' : usernameMessage}
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-widest uppercase opacity-40 block px-1">Electronic Mail Address</label>
                    <Input 
                        type="email" 
                        placeholder="you@domain.host" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        onBlur={validateEmail}
                        required 
                        className="neo-input"
                    />
                    {emailStatus !== 'unchecked' && (
                        <p className={`text-[10px] font-mono uppercase tracking-widest px-1 mt-1 ${emailStatus === 'available' ? 'text-accent-green' : 'text-accent-blue'}`}>
                            {emailStatus === 'checking' ? 'Verifying...' : emailMessage}
                        </p>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-widest uppercase opacity-40 block px-1">Passcode Protocol</label>
                    <Input 
                        type="password" 
                        placeholder="Min 8 Characters Required" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        className="neo-input"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="neo-button neo-button-primary w-full py-5 text-lg font-bold group mt-4"
                >
                    {isSubmitting ? 'INITIALIZING...' : 'CREATE IDENTITY'}
                    <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
            </form>

            <div className="pt-6 border-t border-ink/10 text-center">
                <p className="text-[10px] font-mono tracking-widest uppercase opacity-40">
                    Existing Entity?{' '}
                    <button 
                        type="button" 
                        onClick={() => setView(View.SIGN_IN)} 
                        className="font-bold text-accent-blue hover:underline underline-offset-4"
                    >
                        Initialize Session
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
