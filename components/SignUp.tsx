
import React, { useState } from 'react';
import { View } from '../types';
import { Input } from './common/FormComponents';
import { GoogleIcon, MicrosoftIcon } from './icons';

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

  // Validation states
  const [usernameStatus, setUsernameStatus] = useState<ValidationStatus>('unchecked');
  const [emailStatus, setEmailStatus] = useState<ValidationStatus>('unchecked');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Basic validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    const success = onSignUp(name, email, username, password);
    if (!success) {
      setError('Could not create account. Please try again.');
    }
  };

  const handleSocialSignUp = (provider: 'google' | 'microsoft') => {
    console.log(`Signing up with ${provider}...`);
    // Mock social sign up logic would go here
  };

  // Validate username on blur
  const validateUsername = async () => {
    if (!username || username.length < 3) {
      setUsernameStatus('unchecked');
      setUsernameMessage('');
      return;
    }

    setUsernameStatus('checking');
    setUsernameMessage('');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        setUsernameStatus('error');
        setUsernameMessage('Too many checks - you can still submit');
        return;
      }

      const data = await response.json();

      if (data.available) {
        setUsernameStatus('available');
        setUsernameMessage(data.message || 'Likely available');
      } else {
        setUsernameStatus('taken');
        setUsernameMessage(data.message || 'Already taken');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setUsernameStatus('error');
        setUsernameMessage('Check timed out - you can still submit');
      } else {
        setUsernameStatus('error');
        setUsernameMessage('Unable to verify - you can still submit');
      }
    }
  };

  // Validate email on blur
  const validateEmail = async () => {
    if (!email || !email.includes('@')) {
      setEmailStatus('unchecked');
      setEmailMessage('');
      return;
    }

    setEmailStatus('checking');
    setEmailMessage('');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        setEmailStatus('error');
        setEmailMessage('Too many checks - you can still submit');
        return;
      }

      const data = await response.json();

      if (data.available) {
        setEmailStatus('available');
        setEmailMessage(data.message || 'Likely available');
      } else {
        setEmailStatus('taken');
        setEmailMessage(data.message || 'Already registered');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setEmailStatus('error');
        setEmailMessage('Check timed out - you can still submit');
      } else {
        setEmailStatus('error');
        setEmailMessage('Unable to verify - you can still submit');
      }
    }
  };

  const getStatusColor = (status: ValidationStatus) => {
    switch (status) {
      case 'available': return 'text-green-500';
      case 'taken': return 'text-red-500';
      case 'error': return 'text-yellow-500';
      case 'checking': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: ValidationStatus) => {
    switch (status) {
      case 'available': return '✓';
      case 'taken': return '✗';
      case 'error': return '⚠';
      case 'checking': return '⏳';
      default: return '';
    }
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

          {/* Username with validation */}
          <div>
            <Input
              label="Username"
              type="text"
              placeholder="alex_j"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
              onBlur={validateUsername}
              required
            />
            {usernameStatus !== 'unchecked' && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${getStatusColor(usernameStatus)}`}>
                <span>{getStatusIcon(usernameStatus)}</span>
                <span>{usernameMessage}</span>
              </p>
            )}
          </div>

          {/* Email with validation */}
          <div>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={validateEmail}
              required
            />
            {emailStatus !== 'unchecked' && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${getStatusColor(emailStatus)}`}>
                <span>{getStatusIcon(emailStatus)}</span>
                <span>{emailMessage}</span>
              </p>
            )}
          </div>

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
