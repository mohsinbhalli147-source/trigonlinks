import { useState, useEffect } from 'react';
import { Search, Filter, Clock, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { staffApi } from '../services/api';

interface ActivityLog {
  id: string;
  staffName: string;
  staffRole: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
  status: 'success' | 'failed' | 'warning';
}

export default function StaffActivity() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStaff, setFilterStaff] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed' | 'warning'>('all');

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    setError('');
    const result = await staffApi.getActivity();

    if (result.success) {
      setActivities(result.data || []);
    } else {
      setError(result.error || 'Unable to load staff activity.');
    }

    setLoading(false);
  };

  const uniqueStaff = Array.from(new Set(activities.map(a => a.staffName)));
  const uniqueActions = Array.from(new Set(activities.map(a => a.action)));

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStaff = filterStaff === 'all' || activity.staffName === filterStaff;
    const matchesAction = filterAction === 'all' || activity.action === filterAction;
    const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
    return matchesSearch && matchesStaff && matchesAction && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-[#14E8B4]/20 text-[#14E8B4]';
      case 'failed': return 'bg-[#F5514B]/20 text-[#F5514B]';
      case 'warning': return 'bg-[#F6B93B]/20 text-[#F6B93B]';
      default: return 'bg-[#8996AD]/20 text-[#8996AD]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-[#F5514B]/10 text-[#F5514B]';
      case 'technician': return 'bg-[#4C8DFF]/10 text-[#4C8DFF]';
      case 'sales': return 'bg-[#14E8B4]/10 text-[#14E8B4]';
      case 'support': return 'bg-[#F6B93B]/10 text-[#F6B93B]';
      default: return 'bg-[#5C6B85]/10 text-[#5C6B85]';
    }
  };

  const successCount = activities.filter(a => a.status === 'success').length;
  const failedCount = activities.filter(a => a.status === 'failed').length;
  const warningCount = activities.filter(a => a.status === 'warning').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading staff activity...</div>
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
        <h2 className="text-2xl font-bold text-[#EAF0FB] flex items-center gap-2">
          <Activity className="w-6 h-6 text-[#4C8DFF]" />
          Staff Activity Log
        </h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-[#4C8DFF]" />
            <p className="text-sm text-[#8996AD]">Total Activities</p>
          </div>
          <p className="text-2xl font-bold text-[#EAF0FB]">{activities.length}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-[#14E8B4]" />
            <p className="text-sm text-[#8996AD]">Successful</p>
          </div>
          <p className="text-2xl font-bold text-[#14E8B4]">{successCount}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-5 h-5 text-[#F5514B]" />
            <p className="text-sm text-[#8996AD]">Failed</p>
          </div>
          <p className="text-2xl font-bold text-[#F5514B]">{failedCount}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-[#F6B93B]" />
            <p className="text-sm text-[#8996AD]">Warnings</p>
          </div>
          <p className="text-2xl font-bold text-[#F6B93B]">{warningCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
            <input
              type="text"
              placeholder="Search by staff, action, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#5C6B85]" />
            <select
              value={filterStaff}
              onChange={(e) => setFilterStaff(e.target.value)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Staff</option>
              {uniqueStaff.map(staff => (
                <option key={staff} value={staff}>{staff}</option>
              ))}
            </select>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="warning">Warning</option>
            </select>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex gap-4 p-4 bg-[#1B2540] border border-[#232D45] rounded-lg hover:border-[#4C8DFF] transition-colors"
            >
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(activity.status)}`}>
                  {getStatusIcon(activity.status)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[#EAF0FB]">{activity.staffName}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(activity.staffRole)}`}>
                        {activity.staffRole}
                      </span>
                    </div>
                    <div className="font-medium text-[#4C8DFF]">{activity.action}</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#8996AD]">
                    <Clock className="w-4 h-4" />
                    {activity.timestamp}
                  </div>
                </div>
                <p className="text-sm text-[#8996AD] mb-2">{activity.details}</p>
                <div className="flex items-center gap-4 text-xs text-[#5C6B85]">
                  <span>IP: {activity.ipAddress}</span>
                </div>
              </div>
            </div>
          ))}
          {filteredActivities.length === 0 && (
            <div className="text-center py-12 text-[#5C6B85]">
              <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No activity logs found</p>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-[#5C6B85]">
          Showing {filteredActivities.length} of {activities.length} activities
        </div>
      </div>
    </div>
  );
}
