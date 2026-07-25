import { useState, useEffect } from 'react';
import { Search, Filter, Download, AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import axios from 'axios';
import { settingsApi } from '../services/api';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  user: string;
  module: string;
}

export default function SettingsLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const result = await settingsApi.getLogs();
      if (result.success) {
        setLogs(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.error || 'Failed to load logs');
      }
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      setError('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.level === filter;
    const matchesSearch = 
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.module.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info': return <Info className="w-4 h-4 text-[#4C8DFF]" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-[#F6B93B]" />;
      case 'error': return <XCircle className="w-4 h-4 text-[#F5514B]" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-[#14E8B4]" />;
      default: return <Info className="w-4 h-4 text-[#8996AD]" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'bg-[#4C8DFF]/20 text-[#4C8DFF]';
      case 'warning': return 'bg-[#F6B93B]/20 text-[#F6B93B]';
      case 'error': return 'bg-[#F5514B]/20 text-[#F5514B]';
      case 'success': return 'bg-[#14E8B4]/20 text-[#14E8B4]';
      default: return 'bg-[#8996AD]/20 text-[#8996AD]';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#F5514B]">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#EAF0FB]">System Logs</h1>
        <button className="px-4 py-2 bg-[#4C8DFF] text-white rounded-lg hover:bg-[#3B7BD9] transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Logs
        </button>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8996AD]" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg pl-10 pr-4 py-2 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-[#4C8DFF] text-white' : 'bg-[#1B2540] text-[#8996AD] hover:bg-[#232D45]'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('info')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'info' ? 'bg-[#4C8DFF] text-white' : 'bg-[#1B2540] text-[#8996AD] hover:bg-[#232D45]'}`}
            >
              Info
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'warning' ? 'bg-[#F6B93B] text-[#0A0F1C]' : 'bg-[#1B2540] text-[#8996AD] hover:bg-[#232D45]'}`}
            >
              Warning
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'error' ? 'bg-[#F5514B] text-white' : 'bg-[#1B2540] text-[#8996AD] hover:bg-[#232D45]'}`}
            >
              Error
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'success' ? 'bg-[#14E8B4] text-[#04231B]' : 'bg-[#1B2540] text-[#8996AD] hover:bg-[#232D45]'}`}
            >
              Success
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left text-[#8996AD] pb-3 font-medium">Timestamp</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Level</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Message</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">User</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Module</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-[#232D45] hover:bg-[#1B2540]">
                  <td className="py-4 text-[#8996AD]">{log.timestamp}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      {getLevelIcon(log.level)}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-[#EAF0FB]">{log.message}</td>
                  <td className="py-4 text-[#8996AD]">{log.user}</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-[#1B2540] rounded text-xs text-[#EAF0FB]">
                      {log.module}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-[#8996AD]">
            <Info className="w-12 h-12 mx-auto mb-4 text-[#8996AD]" />
            <p>No logs found</p>
          </div>
        )}
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Log Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg">
            <div className="text-sm text-[#8996AD] mb-1">Total Logs</div>
            <div className="text-2xl font-bold text-[#EAF0FB]">{logs.length}</div>
          </div>
          <div className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg">
            <div className="text-sm text-[#8996AD] mb-1">Errors</div>
            <div className="text-2xl font-bold text-[#F5514B]">{logs.filter(l => l.level === 'error').length}</div>
          </div>
          <div className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg">
            <div className="text-sm text-[#8996AD] mb-1">Warnings</div>
            <div className="text-2xl font-bold text-[#F6B93B]">{logs.filter(l => l.level === 'warning').length}</div>
          </div>
          <div className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg">
            <div className="text-sm text-[#8996AD] mb-1">Success</div>
            <div className="text-2xl font-bold text-[#14E8B4]">{logs.filter(l => l.level === 'success').length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
