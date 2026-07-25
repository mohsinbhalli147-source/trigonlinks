import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, User, Bell, Shield, Database, Palette, Link as LinkIcon } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'system' | 'appearance'>('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'system', name: 'System', icon: Database },
    { id: 'appearance', name: 'Appearance', icon: Palette },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#EAF0FB]">Settings</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#14E8B4]/10 text-[#14E8B4] border-l-2 border-[#14E8B4]'
                  : 'text-[#A9B4C9] hover:bg-[#141D33] hover:text-[#EAF0FB]'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#EAF0FB]">Profile Settings</h3>
              
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#4C8DFF] to-[#7C5CFF] flex items-center justify-center font-bold text-white text-2xl">
                  SA
                </div>
                <button className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-sm text-[#EAF0FB] hover:border-[#14E8B4] transition-colors">
                  Change Avatar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#8996AD] mb-2">Full Name</label>
                  <input
                    type="text"
                    defaultValue="System Admin"
                    className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8996AD] mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue="admin@trigonlinks.com"
                    className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8996AD] mb-2">Mobile</label>
                  <input
                    type="tel"
                    defaultValue="0300-1234567"
                    className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8996AD] mb-2">Role</label>
                  <input
                    type="text"
                    defaultValue="Administrator"
                    disabled
                    className="w-full px-4 py-2 bg-[#0A0F1C] border border-[#232D45] rounded-lg text-[#5C6B85] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#EAF0FB]">Notification Settings</h3>
              
              <div className="space-y-4">
                {[
                  { label: 'New customer registrations', desc: 'Get notified when new customers sign up' },
                  { label: 'Payment reminders', desc: 'Receive alerts for pending payments' },
                  { label: 'System updates', desc: 'Stay informed about system maintenance' },
                  { label: 'Low inventory alerts', desc: 'Get notified when stock is running low' },
                  { label: 'Staff activity', desc: 'Monitor staff actions and assignments' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-[#1B2540] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[#EAF0FB]">{item.label}</p>
                      <p className="text-xs text-[#8996AD]">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-[#232D45] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#14E8B4]" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#EAF0FB]">Security Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#8996AD] mb-2">Current Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8996AD] mb-2">New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8996AD] mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  />
                </div>
                <button className="px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors">
                  Update Password
                </button>
              </div>

              <div className="border-t border-[#232D45] pt-6">
                <h4 className="text-sm font-medium text-[#EAF0FB] mb-4">Two-Factor Authentication</h4>
                <div className="flex items-center justify-between p-4 bg-[#1B2540] rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-[#EAF0FB]">Enable 2FA</p>
                    <p className="text-xs text-[#8996AD]">Add an extra layer of security to your account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-[#232D45] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#14E8B4]" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#EAF0FB]">System Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#8996AD] mb-2">Company Name</label>
                  <input
                    type="text"
                    defaultValue="TRIGONLINKS"
                    className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8996AD] mb-2">Location</label>
                  <input
                    type="text"
                    defaultValue="Pasrur"
                    className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8996AD] mb-2">Currency</label>
                  <select className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]">
                    <option>PKR (Pakistani Rupee)</option>
                    <option>USD (US Dollar)</option>
                    <option>EUR (Euro)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8996AD] mb-2">Timezone</label>
                  <select className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]">
                    <option>Asia/Karachi (PKT)</option>
                    <option>UTC</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-[#232D45] pt-6">
                <h4 className="text-sm font-medium text-[#EAF0FB] mb-4">Integrations</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/settings/google')}
                    className="w-full flex items-center justify-between p-4 bg-[#1B2540] border border-[#232D45] rounded-lg hover:border-[#4C8DFF] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4285F4] flex items-center justify-center">
                        <span className="text-white font-bold text-sm">G</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-[#EAF0FB]">Google Contacts</p>
                        <p className="text-xs text-[#8996AD]">Sync customers with Google Contacts</p>
                      </div>
                    </div>
                    <LinkIcon className="w-5 h-5 text-[#8996AD]" />
                  </button>
                </div>
              </div>

              <div className="border-t border-[#232D45] pt-6">
                <h4 className="text-sm font-medium text-[#EAF0FB] mb-4">Backup & Restore</h4>
                <div className="flex gap-4">
                  <button className="px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors">
                    Backup Data
                  </button>
                  <button className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-sm text-[#EAF0FB] hover:border-[#14E8B4] transition-colors">
                    Restore from Backup
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#EAF0FB]">Appearance Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#8996AD] mb-2">Theme</label>
                  <div className="grid grid-cols-3 gap-4">
                    <button className="p-4 bg-[#0A0F1C] border-2 border-[#14E8B4] rounded-lg text-center">
                      <div className="w-full h-8 bg-[#0A0F1C] rounded mb-2"></div>
                      <p className="text-xs text-[#14E8B4]">Dark</p>
                    </button>
                    <button className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg text-center hover:border-[#14E8B4] transition-colors">
                      <div className="w-full h-8 bg-white rounded mb-2"></div>
                      <p className="text-xs text-[#8996AD]">Light</p>
                    </button>
                    <button className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg text-center hover:border-[#14E8B4] transition-colors">
                      <div className="w-full h-8 bg-gradient-to-r from-[#0A0F1C] to-white rounded mb-2"></div>
                      <p className="text-xs text-[#8996AD]">System</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8996AD] mb-2">Accent Color</label>
                  <div className="flex gap-3">
                    <button className="w-10 h-10 rounded-full bg-[#14E8B4] border-4 border-[#14E8B4]"></button>
                    <button className="w-10 h-10 rounded-full bg-[#4C8DFF] border-2 border-[#232D45] hover:border-[#4C8DFF] transition-colors"></button>
                    <button className="w-10 h-10 rounded-full bg-[#F5514B] border-2 border-[#232D45] hover:border-[#F5514B] transition-colors"></button>
                    <button className="w-10 h-10 rounded-full bg-[#F6B93B] border-2 border-[#232D45] hover:border-[#F6B93B] transition-colors"></button>
                    <button className="w-10 h-10 rounded-full bg-[#7C5CFF] border-2 border-[#232D45] hover:border-[#7C5CFF] transition-colors"></button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8996AD] mb-2">Font Size</label>
                  <select className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]">
                    <option>Small</option>
                    <option selected>Medium</option>
                    <option>Large</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
