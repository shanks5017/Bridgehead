/**
 * OnboardingModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Post-signup onboarding modal.
 * Triggered automatically when profiles.onboarding_completed === false.
 * Collects 5 quick founder fields and stores them in the profiles table.
 * On completion it pre-fills the Business Research form defaults.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState } from 'react';
import { config } from '../src/config';

const API_BASE_URL = config.api.baseUrl;

export interface OnboardingData {
  business_stage: string;
  primary_city: string;
  business_type_interest: string;
  total_budget_range: string;
  founder_experience: string;
}

interface Props {
  userId: string;
  token: string;
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
}

const STAGES = ['Idea', 'Validating', 'Operating', 'Scaling'];
const BUDGET_RANGES = ['Under ₹5L', '₹5–10L', '₹10–25L', '₹25L+'];
const EXPERIENCE_OPTS = ['0–2 years', '2–5 years', '5+ years'];

const BUSINESS_SUGGESTIONS = [
  'Cafe / Coffee Shop', 'Restaurant', 'Cloud Kitchen', 'Bakery',
  'Retail Store', 'Fashion Boutique', 'Gym / Fitness Studio',
  'Salon / Spa', 'Pharmacy', 'Medical Clinic', 'Co-working Space',
  'SaaS Product', 'D2C Brand', 'Logistics', 'EdTech', 'FinTech',
  'Real Estate', 'Consultancy', 'Agency', 'Other',
];

const OnboardingModal: React.FC<Props> = ({ userId, token, onComplete, onSkip }) => {
  const [form, setForm] = useState<OnboardingData>({
    business_stage: '',
    primary_city: '',
    business_type_interest: '',
    total_budget_range: '',
    founder_experience: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    form.business_stage &&
    form.primary_city.trim().length >= 2 &&
    form.business_type_interest.trim().length >= 2 &&
    form.total_budget_range &&
    form.founder_experience;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save onboarding data');
      }

      onComplete(form);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🚀</span>
            <h2 className="text-xl font-bold text-white">Quick Setup</h2>
          </div>
          <p className="text-sm text-white/50">
            Help us tailor your Zonek experience — takes under 30 seconds.
          </p>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-5">

          {/* Stage */}
          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
              Where are you in your journey?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STAGES.map(stage => (
                <button
                  key={stage}
                  onClick={() => setForm(f => ({ ...f, business_stage: stage }))}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
                    form.business_stage === stage
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
              Target City
            </label>
            <input
              type="text"
              value={form.primary_city}
              onChange={e => setForm(f => ({ ...f, primary_city: e.target.value }))}
              placeholder="e.g. Bangalore, Mumbai, Pune..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Business Type */}
          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
              Business Type
            </label>
            <input
              type="text"
              list="biz-types"
              value={form.business_type_interest}
              onChange={e => setForm(f => ({ ...f, business_type_interest: e.target.value }))}
              placeholder="e.g. Cafe, Retail, SaaS..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <datalist id="biz-types">
              {BUSINESS_SUGGESTIONS.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
              Budget Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BUDGET_RANGES.map(range => (
                <button
                  key={range}
                  onClick={() => setForm(f => ({ ...f, total_budget_range: range }))}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
                    form.total_budget_range === range
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
              Your Experience in This Field
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EXPERIENCE_OPTS.map(exp => (
                <button
                  key={exp}
                  onClick={() => setForm(f => ({ ...f, founder_experience: exp }))}
                  className={`py-2.5 px-2 rounded-lg text-sm font-medium border transition-all ${
                    form.founder_experience === exp
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold py-3 rounded-xl transition-all text-sm"
          >
            {isSubmitting ? 'Saving...' : 'Start Your Research Journey →'}
          </button>
          <button
            onClick={onSkip}
            className="text-xs text-white/30 hover:text-white/60 transition-colors px-2"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
