import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    const response = await authApi.forgotPassword(email.trim());
    if (response.success) {
      setMessage('If the email exists, a reset link will be sent. Please check your inbox.');
    } else {
      setError(response.error || 'Unable to send password reset link.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0F1C] px-4">
      <div className="w-full max-w-md bg-[#121B2E] border border-[#232D45] rounded-xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-[#EAF0FB] mb-3">Reset Your Password</h1>
        <p className="text-sm text-[#8996AD] mb-6">
          Enter the email address associated with your account, and we will send a password reset link.
        </p>

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-[#14E8B4]/10 text-[#14E8B4] border border-[#14E8B4]/20">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#F5514B]/10 text-[#F5514B] border border-[#F5514B]/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-[#8996AD]">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-[#0E162B] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            placeholder="you@example.com"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#14E8B4] text-[#04231B] rounded-lg font-semibold transition-colors hover:bg-[#20F0C0] disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-sm text-[#8996AD]">
          <Link to="/login" className="text-[#4C8DFF] hover:text-[#7AB6FF]">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
