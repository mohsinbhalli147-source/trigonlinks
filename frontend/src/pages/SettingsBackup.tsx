import { useState } from 'react';
import { Download, Upload, RefreshCw, HardDrive, Calendar, Clock } from 'lucide-react';
import { toast } from '../components/Toast';

export default function SettingsBackup() {
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState('2024-06-15 14:30:00');
  const [backupSize, setBackupSize] = useState('2.4 MB');

  const handleBackup = async () => {
    setLoading(true);
    // Simulate backup process
    setTimeout(() => {
      setLoading(false);
      setLastBackup(new Date().toLocaleString());
      toast.success('Backup completed successfully!');
    }, 2000);
  };

  const handleRestore = async () => {
    if (!confirm('Are you sure you want to restore from backup? This action cannot be undone.')) return;
    setLoading(true);
    // Simulate restore process
    setTimeout(() => {
      setLoading(false);
      toast.success('Restore completed successfully!');
    }, 2000);
  };

  const backupHistory = [
    { id: 1, date: '2024-06-15 14:30:00', size: '2.4 MB', type: 'Full' },
    { id: 2, date: '2024-06-14 14:30:00', size: '2.3 MB', type: 'Full' },
    { id: 3, date: '2024-06-13 14:30:00', size: '2.2 MB', type: 'Full' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#EAF0FB]">Backup & Restore</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className="w-6 h-6 text-[#4C8DFF]" />
            <div>
              <div className="text-sm text-[#8996AD]">Last Backup</div>
              <div className="text-lg font-semibold text-[#EAF0FB]">{lastBackup}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#8996AD]">
            <Clock className="w-4 h-4" />
            <span>Size: {backupSize}</span>
          </div>
        </div>

        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-[#14E8B4]" />
            <div>
              <div className="text-sm text-[#8996AD]">Auto Backup</div>
              <div className="text-lg font-semibold text-[#EAF0FB]">Daily</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#8996AD]">
            <Clock className="w-4 h-4" />
            <span>Time: 02:00 AM</span>
          </div>
        </div>

        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="w-6 h-6 text-[#F6B93B]" />
            <div>
              <div className="text-sm text-[#8996AD]">Backup Status</div>
              <div className="text-lg font-semibold text-[#14E8B4]">Healthy</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#8996AD]">
            <Clock className="w-4 h-4" />
            <span>Next: Tomorrow 02:00 AM</span>
          </div>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Backup Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleBackup}
            disabled={loading}
            className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg hover:border-[#4C8DFF] transition-colors text-left flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 rounded-lg bg-[#14E8B4]/20 flex items-center justify-center">
              <Download className="w-6 h-6 text-[#14E8B4]" />
            </div>
            <div>
              <div className="text-[#EAF0FB] font-medium">Create Backup</div>
              <div className="text-sm text-[#8996AD]">Download full system backup</div>
            </div>
          </button>
          <button
            onClick={handleRestore}
            disabled={loading}
            className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg hover:border-[#4C8DFF] transition-colors text-left flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 rounded-lg bg-[#4C8DFF]/20 flex items-center justify-center">
              <Upload className="w-6 h-6 text-[#4C8DFF]" />
            </div>
            <div>
              <div className="text-[#EAF0FB] font-medium">Restore Backup</div>
              <div className="text-sm text-[#8996AD]">Restore from backup file</div>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Backup History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left text-[#8996AD] pb-3 font-medium">Date</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Size</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Type</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {backupHistory.map((backup) => (
                <tr key={backup.id} className="border-b border-[#232D45] hover:bg-[#1B2540]">
                  <td className="py-4 text-[#EAF0FB]">{backup.date}</td>
                  <td className="py-4 text-[#8996AD]">{backup.size}</td>
                  <td className="py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#4C8DFF]/20 text-[#4C8DFF]">
                      {backup.type}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-[#14E8B4]/20 text-[#14E8B4] rounded text-sm hover:bg-[#14E8B4]/30 transition-colors">
                        Download
                      </button>
                      <button className="px-3 py-1 bg-[#4C8DFF]/20 text-[#4C8DFF] rounded text-sm hover:bg-[#4C8DFF]/30 transition-colors">
                        Restore
                      </button>
                      <button className="px-3 py-1 bg-[#F5514B]/20 text-[#F5514B] rounded text-sm hover:bg-[#F5514B]/30 transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Backup Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#8996AD] mb-2">Auto Backup Frequency</label>
            <select className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg px-4 py-3 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="never">Never</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8996AD] mb-2">Retention Period</label>
            <select className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg px-4 py-3 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]">
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
