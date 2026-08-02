import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState('');

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
      setMessage(response.data.message || 'If the email exists, an OTP will be sent. Please check your inbox.');
      setOtpSent(true);
      if (response.data.otp) {
        setDevOtp(response.data.otp);
      }
    } else {
      setError(response.error || 'Unable to send OTP.');
    }

    setLoading(false);
  };

  const handleProceedToReset = () => {
    navigate('/reset-password', { state: { email } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0F1C] px-4">
      <div className="w-full max-w-md bg-[#121B2E] border border-[#232D45] rounded-xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-[#EAF0FB] mb-3">Reset Your Password</h1>
        <p className="text-sm text-[#8996AD] mb-6">
          Enter the email address associated with your account, and we will send an OTP code.
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

        {!otpSent ? (
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
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {devOtp && (
              <div className="p-3 bg-[#4C8DFF]/10 border border-[#4C8DFF]/50 rounded-lg text-sm text-[#4C8DFF]">
                <strong>Development Mode OTP:</strong> {devOtp}
              </div>
            )}
            <button
              onClick={handleProceedToReset}
              className="w-full py-3 bg-[#14E8B4] text-[#04231B] rounded-lg font-semibold transition-colors hover:bg-[#20F0C0]"
            >
              Proceed to Reset Password
            </button>
            <button
              onClick={() => setOtpSent(false)}
              className="w-full py-3 bg-[#1B2540] text-[#EAF0FB] rounded-lg font-semibold transition-colors hover:bg-[#232D45]"
            >
              Back
            </button>
          </div>
        )}

        <div className="mt-6 text-sm text-[#8996AD]">
          <Link to="/login" className="text-[#4C8DFF] hover:text-[#7AB6FF]">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
