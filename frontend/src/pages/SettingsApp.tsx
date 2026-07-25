import { useState } from 'react';
import { Save, RefreshCw, Bell, Shield, Palette, Globe } from 'lucide-react';
import { toast } from '../components/Toast';

export default function SettingsApp() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    appName: 'TRIGONLINKS PASRUR',
    appVersion: '1.0.0',
    timezone: 'Asia/Karachi',
    dateFormat: 'DD/MM/YYYY',
    currency: 'PKR',
    language: 'en',
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
    },
  });

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Settings saved successfully!');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#EAF0FB]">App Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-5 h-5 text-[#4C8DFF]" />
            <h2 className="text-lg font-semibold text-[#EAF0FB]">General Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Application Name</label>
              <input
                type="text"
                value={settings.appName}
                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg px-4 py-3 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Version</label>
              <input
                type="text"
                value={settings.appVersion}
                onChange={(e) => setSettings({ ...settings, appVersion: e.target.value })}
                className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg px-4 py-3 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg px-4 py-3 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]"
              >
                <option value="Asia/Karachi">Asia/Karachi</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Date Format</label>
              <select
                value={settings.dateFormat}
                onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg px-4 py-3 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg px-4 py-3 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]"
              >
                <option value="PKR">PKR (Pakistani Rupee)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-[#4C8DFF]" />
            <h2 className="text-lg font-semibold text-[#EAF0FB]">Localization</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Language</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg px-4 py-3 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]"
              >
                <option value="en">English</option>
                <option value="ur">Urdu</option>
                <option value="ar">Arabic</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-[#4C8DFF]" />
            <h2 className="text-lg font-semibold text-[#EAF0FB]">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#EAF0FB] font-medium">Email Notifications</div>
                <div className="text-sm text-[#8996AD]">Receive alerts via email</div>
              </div>
              <button
                onClick={() => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, email: !settings.notifications.email }
                })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.email ? 'bg-[#14E8B4]' : 'bg-[#232D45]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.notifications.email ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#EAF0FB] font-medium">SMS Notifications</div>
                <div className="text-sm text-[#8996AD]">Receive alerts via SMS</div>
              </div>
              <button
                onClick={() => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, sms: !settings.notifications.sms }
                })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.sms ? 'bg-[#14E8B4]' : 'bg-[#232D45]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.notifications.sms ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#EAF0FB] font-medium">Push Notifications</div>
                <div className="text-sm text-[#8996AD]">Receive in-app alerts</div>
              </div>
              <button
                onClick={() => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, push: !settings.notifications.push }
                })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.push ? 'bg-[#14E8B4]' : 'bg-[#232D45]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.notifications.push ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-[#4C8DFF]" />
            <h2 className="text-lg font-semibold text-[#EAF0FB]">Security</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#EAF0FB] font-medium">Two-Factor Authentication</div>
                <div className="text-sm text-[#8996AD]">Add extra security layer</div>
              </div>
              <button
                onClick={() => setSettings({
                  ...settings,
                  security: { ...settings.security, twoFactorAuth: !settings.security.twoFactorAuth }
                })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.security.twoFactorAuth ? 'bg-[#14E8B4]' : 'bg-[#232D45]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.security.twoFactorAuth ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Session Timeout (minutes)</label>
              <input
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, sessionTimeout: Number(e.target.value) }
                })}
                className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg px-4 py-3 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Password Expiry (days)</label>
              <input
                type="number"
                value={settings.security.passwordExpiry}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, passwordExpiry: Number(e.target.value) }
                })}
                className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg px-4 py-3 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-3 bg-[#4C8DFF] text-white rounded-lg hover:bg-[#3B7BD9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 border border-[#232D45] rounded-lg text-[#8996AD] hover:bg-[#1B2540] transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reset to Default
        </button>
      </div>
    </div>
  );
}
