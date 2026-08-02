import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Email is missing. Please start the password reset process again.');
      navigate('/forgot-password');
      return;
    }

    if (!otp) {
      setError('Please enter the OTP code sent to your email.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const response = await authApi.resetPassword(email, otp, password);

    if (response.success) {
      setMessage('Your password has been reset successfully. You can now sign in.');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(response.error || 'Failed to reset password.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0F1C] px-4">
      <div className="w-full max-w-md bg-[#121B2E] border border-[#232D45] rounded-xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-[#EAF0FB] mb-3">Set New Password</h1>
        <p className="text-sm text-[#8996AD] mb-6">
          Enter the OTP code sent to your email and set a new secure password.
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
          <label className="block text-sm font-medium text-[#8996AD]">OTP Code</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full px-4 py-3 bg-[#0E162B] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            required
          />

          <label className="block text-sm font-medium text-[#8996AD]">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-[#0E162B] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            placeholder="••••••••"
            required
          />

          <label className="block text-sm font-medium text-[#8996AD]">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-[#0E162B] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            placeholder="••••••••"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#14E8B4] text-[#04231B] rounded-lg font-semibold transition-colors hover:bg-[#20F0C0] disabled:opacity-60"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
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
