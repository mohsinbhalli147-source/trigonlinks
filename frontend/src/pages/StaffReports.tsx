import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Filter, TrendingUp, DollarSign, Users, Award, Calendar, Download, Loader2, RefreshCw } from 'lucide-react';
import { staffApi } from '../services/api';
import { toast } from '../components/Toast';
import EmptyState from '../components/EmptyState';

interface StaffPerformance {
  id: string;
  name: string;
  role: string;
  totalPayments: number;
  totalConnections: number;
  customerSatisfaction: number | null;
  tasksCompleted: number;
  attendanceRate: number | null;
  month: string | null;
}

export default function StaffReports() {
  const [performances, setPerformances] = useState<StaffPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterRole, setFilterRole] = useState<string>('all');

  // Generate last 12 months for selector
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    return { value, label };
  });

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    const result = await staffApi.getReports({
      month: selectedMonth,
      role: filterRole !== 'all' ? filterRole : undefined,
    });
    if (result.success) {
      setPerformances(result.data || []);
    } else {
      setError(result.error || 'Failed to load staff reports');
    }
    setLoading(false);
  }, [selectedMonth, filterRole]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const chartData = performances.map(p => ({
    name: p.name.split(' ')[0],
    Payments: p.totalPayments,
    Connections: p.totalConnections,
  }));

  const totalPayments = performances.reduce((sum, p) => sum + (p.totalPayments || 0), 0);
  const totalConnections = performances.reduce((sum, p) => sum + (p.totalConnections || 0), 0);
  const topPerformer = performances.length > 0
    ? performances.reduce((max, p) => p.totalPayments > max.totalPayments ? p : max)
    : null;

  const handleExport = () => {
    toast.info('Exporting staff performance report...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#4C8DFF] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-[#F5514B]">{error}</div>
        <button
          onClick={loadReports}
          className="flex items-center gap-2 px-4 py-2 bg-[#4C8DFF] text-white rounded-lg hover:bg-[#3B7BD9]"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Staff Performance Reports</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={loadReports}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B2540] border border-[#232D45] text-[#EAF0FB] rounded-lg hover:border-[#4C8DFF] transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#5C6B85]" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#5C6B85]" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Roles</option>
              <option value="technician">Technician</option>
              <option value="sales">Sales</option>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[#14E8B4]" />
            <p className="text-sm text-[#8996AD]">Total Collections</p>
          </div>
          <p className="text-2xl font-bold text-[#14E8B4]">Rs. {totalPayments.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-[#4C8DFF]" />
            <p className="text-sm text-[#8996AD]">Total Connections</p>
          </div>
          <p className="text-2xl font-bold text-[#4C8DFF]">{totalConnections}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-[#F6B93B]" />
            <p className="text-sm text-[#8996AD]">Active Staff</p>
          </div>
          <p className="text-2xl font-bold text-[#F6B93B]">{performances.length}</p>
        </div>
      </div>

      {/* Top Performer */}
      {topPerformer && topPerformer.totalPayments > 0 && (
        <div className="bg-gradient-to-r from-[#14E8B4]/20 to-[#4C8DFF]/20 border border-[#14E8B4] rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#14E8B4] to-[#4C8DFF] flex items-center justify-center text-2xl font-bold text-[#04231B]">
              {topPerformer.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-5 h-5 text-[#14E8B4]" />
                <h3 className="text-lg font-semibold text-[#EAF0FB]">Top Performer: {topPerformer.name}</h3>
              </div>
              <p className="text-sm text-[#8996AD]">{topPerformer.role} • Rs. {topPerformer.totalPayments.toLocaleString()} collected</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#14E8B4]">{topPerformer.totalConnections}</p>
              <p className="text-sm text-[#8996AD]">Connections</p>
            </div>
          </div>
        </div>
      )}

      {performances.length === 0 ? (
        <EmptyState
          icon="Users"
          title="No staff data"
          description="No staff performance data found for the selected period."
        />
      ) : (
        <>
          {/* Chart */}
          <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
                <XAxis dataKey="name" stroke="#8996AD" />
                <YAxis stroke="#8996AD" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1B2540', border: '1px solid #232D45' }}
                  itemStyle={{ color: '#EAF0FB' }}
                />
                <Bar dataKey="Payments" fill="#14E8B4" name="Payments Collected (Rs)" />
                <Bar dataKey="Connections" fill="#4C8DFF" name="Connections" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Table */}
          <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Detailed Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#232D45]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Staff</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Collections</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Connections</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {performances.map((performance) => (
                    <tr key={performance.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4C8DFF] to-[#2E5CB8] flex items-center justify-center font-bold text-[#EAF0FB]">
                            {performance.name.charAt(0)}
                          </div>
                          <div className="font-semibold text-[#EAF0FB]">{performance.name}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[#8996AD] capitalize">{performance.role}</td>
                      <td className="py-3 px-4 text-sm text-[#14E8B4] font-semibold">Rs. {(performance.totalPayments || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-[#4C8DFF]">{performance.totalConnections}</td>
                      <td className="py-3 px-4 text-sm text-[#EAF0FB]">{performance.tasksCompleted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
