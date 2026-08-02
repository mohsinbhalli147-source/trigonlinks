import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, customerLogin, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'admin' | 'customer'>('admin');
  
  // Admin state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Customer state
  const [username, setUsername] = useState('');
  const [cnic, setCnic] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [navigate, user]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0F1C]">
      <div className="w-full max-w-md bg-[#121B2E] border border-[#232D45] rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#14E8B4] to-[#0E9E7B] flex items-center justify-center font-bold text-[#04231B] text-2xl mx-auto mb-4 shadow-lg shadow-[#14E8B4]/20">
            TL
          </div>
          <h1 className="text-2xl font-bold text-[#EAF0FB]">TRIGONLINKS</h1>
          <p className="text-sm text-[#6E7A94] mt-1">ISP Management Portal</p>
        </div>


        {error && (
          <div className="mb-6 p-3 bg-[#F5514B]/10 border border-[#F5514B]/50 rounded-lg text-sm text-[#F5514B] text-center">
            {error}
          </div>
        )}

        {/* Admin Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div>
            <label className="block text-sm font-medium text-[#8996AD] mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] transition-colors"
              placeholder="Email address"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8996AD] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-right">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-sm text-[#4C8DFF] hover:text-[#7AB6FF] transition-colors"
          >
            Forgot Password?
          </button>
        </div>

        <p className="text-center text-xs text-[#5C6B85] mt-6">
          v1.0 · Professional ISP ERP System
        </p>
      </div>
    </div>
  );
}
