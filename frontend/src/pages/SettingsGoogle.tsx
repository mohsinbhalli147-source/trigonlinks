import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Link, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  AlertCircle, 
  ExternalLink,
  Power,
  TestTube
} from 'lucide-react';
import { googleApi } from '../services/api';
import { toast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';

interface GoogleStatus {
  connected: boolean;
  email: string | null;
  configured: boolean;
  sync: {
    totalSynced: number;
    pendingSync: number;
    failedSync: number;
    lastSyncTime: number | null;
  };
}

export default function SettingsGoogle() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    const result = await googleApi.getStatus();
    if (result.success) {
      setStatus(result.data);
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    const result = await googleApi.getAuthUrl('connect');
    if (result.success) {
      // Open Google OAuth in popup
      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      const popup = window.open(
        result.data.authUrl,
        'google-oauth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      // Poll for popup close
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          loadStatus();
        }
      }, 1000);
    } else {
      toast.error('Failed to generate authorization URL');
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect your Google account? This will stop automatic contact syncing.')) {
      const result = await googleApi.disconnect();
      if (result.success) {
        toast.success('Google account disconnected successfully');
        loadStatus();
      } else {
        toast.error(result.error || 'Failed to disconnect account');
      }
    }
  };

  const handleChangeAccount = async () => {
    const result = await googleApi.changeAccount();
    if (result.success) {
      // Open Google OAuth in popup for new account
      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      const popup = window.open(
        result.data.authUrl,
        'google-oauth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      // Poll for popup close
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          loadStatus();
        }
      }, 1000);
    } else {
      toast.error('Failed to initiate account change');
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    const result = await googleApi.syncAllCustomers();
    setSyncing(false);
    
    if (result.success) {
      toast.success(`Sync completed: ${result.data.success} successful, ${result.data.failed} failed`);
      loadStatus();
    } else {
      toast.error(result.error || 'Failed to sync customers');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    const result = await googleApi.testConnection();
    setTesting(false);
    
    if (result.success) {
      if (result.data.connected) {
        toast.success('Google connection is valid');
      } else {
        toast.error('Google connection is invalid or expired');
      }
    } else {
      toast.error('Failed to test connection');
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="text-center text-[#8996AD]">Loading Google integration status...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Google Contacts Integration</h2>
        <button
          onClick={loadStatus}
          className="flex items-center gap-2 px-4 py-2 bg-[#1B2540] border border-[#232D45] text-[#EAF0FB] rounded-lg hover:border-[#14E8B4] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Connection Status */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Connection Status</h3>
        
        {!status?.configured && (
          <div className="flex items-center gap-3 p-4 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg">
            <AlertCircle className="w-5 h-5 text-[#F5514B]" />
            <div>
              <p className="text-[#F5514B] font-medium">Google Integration Not Configured</p>
              <p className="text-sm text-[#8996AD]">Please configure Google OAuth credentials in backend environment variables.</p>
            </div>
          </div>
        )}

        {status?.configured && !status?.connected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-[#F6B93B]/10 border border-[#F6B93B] rounded-lg">
              <XCircle className="w-5 h-5 text-[#F6B93B]" />
              <div>
                <p className="text-[#F6B93B] font-medium">No Google Account Connected</p>
                <p className="text-sm text-[#8996AD]">Connect your Google account to enable automatic contact syncing.</p>
              </div>
            </div>
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 px-6 py-3 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              Connect Google Account
            </button>
          </div>
        )}

        {status?.configured && status?.connected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-[#14E8B4]/10 border border-[#14E8B4] rounded-lg">
              <CheckCircle className="w-5 h-5 text-[#14E8B4]" />
              <div>
                <p className="text-[#14E8B4] font-medium">Google Account Connected</p>
                <p className="text-sm text-[#8996AD]">Connected as: {status.email}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-2 px-4 py-2 bg-[#1B2540] border border-[#232D45] text-[#EAF0FB] rounded-lg hover:border-[#4C8DFF] transition-colors disabled:opacity-50"
              >
                <TestTube className="w-4 h-4" />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={handleChangeAccount}
                className="flex items-center gap-2 px-4 py-2 bg-[#1B2540] border border-[#232D45] text-[#EAF0FB] rounded-lg hover:border-[#4C8DFF] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Change Account
              </button>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-2 px-4 py-2 bg-[#F5514B]/10 border border-[#F5514B] text-[#F5514B] rounded-lg hover:bg-[#F5514B]/20 transition-colors"
              >
                <Power className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sync Statistics */}
      {status?.connected && (
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Sync Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#1B2540] border border-[#232D45] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-[#14E8B4]" />
                <span className="text-sm text-[#8996AD]">Total Synced</span>
              </div>
              <p className="text-2xl font-bold text-[#14E8B4]">{status.sync.totalSynced}</p>
            </div>
            
            <div className="bg-[#1B2540] border border-[#232D45] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-[#F6B93B]" />
                <span className="text-sm text-[#8996AD]">Pending Sync</span>
              </div>
              <p className="text-2xl font-bold text-[#F6B93B]">{status.sync.pendingSync}</p>
            </div>
            
            <div className="bg-[#1B2540] border border-[#232D45] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-[#F5514B]" />
                <span className="text-sm text-[#8996AD]">Failed Sync</span>
              </div>
              <p className="text-2xl font-bold text-[#F5514B]">{status.sync.failedSync}</p>
            </div>
            
            <div className="bg-[#1B2540] border border-[#232D45] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5 text-[#4C8DFF]" />
                <span className="text-sm text-[#8996AD]">Last Sync</span>
              </div>
              <p className="text-lg font-bold text-[#4C8DFF]">
                {status.sync.lastSyncTime 
                  ? new Date(status.sync.lastSyncTime).toLocaleString() 
                  : 'Never'}
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="flex items-center gap-2 px-6 py-3 bg-[#4C8DFF] text-white font-semibold rounded-lg hover:bg-[#3B7BD9] transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-5 h-5" />
            {syncing ? 'Syncing All Customers...' : 'Sync All Customers'}
          </button>
        </div>
      )}

      {/* Configuration Instructions */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Google Cloud Console Configuration</h3>
        
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-[#8996AD] mb-2">To enable Google Contacts integration, configure the following in Google Cloud Console:</p>
            <ol className="list-decimal list-inside space-y-2 text-[#EAF0FB] ml-4">
              <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-[#4C8DFF] hover:underline">Google Cloud Console</a></li>
              <li>Create a new project or select existing one</li>
              <li>Enable Google People API</li>
              <li>Go to APIs & Services → Credentials</li>
              <li>Create OAuth 2.0 Client ID (Web application)</li>
            </ol>
          </div>

          <div className="bg-[#1B2540] border border-[#232D45] rounded-lg p-4">
            <p className="text-[#14E8B4] font-medium mb-2">Authorized JavaScript Origins:</p>
            <code className="text-[#EAF0FB] bg-[#121B2E] px-2 py-1 rounded block">
              http://localhost:5173
            </code>
            <p className="text-[#8996AD] mt-2 text-xs">Add your production domain when deploying</p>
          </div>

          <div className="bg-[#1B2540] border border-[#232D45] rounded-lg p-4">
            <p className="text-[#14E8B4] font-medium mb-2">Authorized Redirect URI:</p>
            <code className="text-[#EAF0FB] bg-[#121B2E] px-2 py-1 rounded block">
              http://localhost:5173/settings/google/callback
            </code>
            <p className="text-[#8996AD] mt-2 text-xs">Update with your production URL when deploying</p>
          </div>

          <div className="bg-[#1B2540] border border-[#232D45] rounded-lg p-4">
            <p className="text-[#14E8B4] font-medium mb-2">Required OAuth Scopes:</p>
            <ul className="list-disc list-inside space-y-1 text-[#EAF0FB]">
              <li>https://www.googleapis.com/auth/contacts</li>
              <li>https://www.googleapis.com/auth/contacts.other.readonly</li>
              <li>https://www.googleapis.com/auth/userinfo.email</li>
              <li>https://www.googleapis.com/auth/userinfo.profile</li>
            </ul>
          </div>

          <div className="bg-[#1B2540] border border-[#232D45] rounded-lg p-4">
            <p className="text-[#14E8B4] font-medium mb-2">Backend Environment Variables:</p>
            <ul className="list-disc list-inside space-y-1 text-[#EAF0FB]">
              <li><code className="bg-[#121B2E] px-1 rounded">GOOGLE_CLIENT_ID</code></li>
              <li><code className="bg-[#121B2E] px-1 rounded">GOOGLE_CLIENT_SECRET</code></li>
              <li><code className="bg-[#121B2E] px-1 rounded">GOOGLE_REDIRECT_URI</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
