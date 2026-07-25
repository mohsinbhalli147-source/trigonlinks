import { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Users, DollarSign, TrendingUp, MapPin, Clock, CheckCircle, XCircle, BarChart3, Loader2, RefreshCw } from 'lucide-react';
import DateFilter, { DateFilterType } from '../components/DateFilter';
import { reportsApi } from '../services/api';
import EmptyState from '../components/EmptyState';

export default function ConnectionsReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    const result = await reportsApi.getConnections();
    if (result.success) {
      setReportData(result.data);
    } else {
      setError(result.error || 'Failed to load connection reports');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (_filterType: DateFilterType, _startDate?: Date, _endDate?: Date) => {
    // Filter integration can be extended here
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
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-[#4C8DFF] text-white rounded-lg">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!reportData) {
    return <EmptyState icon="Users" title="No connection data" description="No connection report data is available yet." />;
  }

  const {
    totalConnections = 0,
    activeConnections = 0,
    pendingConnections = 0,
    rejectedConnections = 0,
    monthlyData = [],
    areaWiseConnections = [],
    packageDistribution = [],
    approvalStatusData = [],
    summary = {},
  } = reportData;

  const stats = [
    { name: 'Total Connections', value: totalConnections.toLocaleString(), icon: Users, color: 'text-[#14E8B4]' },
    { name: 'Active', value: activeConnections.toLocaleString(), icon: CheckCircle, color: 'text-[#14E8B4]' },
    { name: 'Pending', value: pendingConnections.toLocaleString(), icon: Clock, color: 'text-[#F6B93B]' },
    { name: 'Rejected', value: rejectedConnections.toLocaleString(), icon: XCircle, color: 'text-[#F5514B]' },
    { name: 'Approval Rate', value: `${summary.approvalRate || 0}%`, icon: TrendingUp, color: 'text-[#4C8DFF]' },
    { name: 'Areas Covered', value: areaWiseConnections.length.toLocaleString(), icon: DollarSign, color: 'text-[#14E8B4]' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Connection Reports</h2>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-[#1B2540] border border-[#232D45] text-[#EAF0FB] rounded-lg hover:border-[#4C8DFF] transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Date Filter */}
      <DateFilter onFilterChange={handleFilterChange} onRefresh={loadData} />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="text-xl font-bold text-[#EAF0FB] mb-1">{stat.value}</div>
            <div className="text-xs text-[#8996AD]">{stat.name}</div>
          </div>
        ))}
      </div>

      {/* Connection Growth Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Connection Growth Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
              <XAxis dataKey="month" stroke="#8996AD" />
              <YAxis stroke="#8996AD" allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#121B2E', border: '1px solid #232D45', borderRadius: '8px' }}
                itemStyle={{ color: '#EAF0FB' }}
              />
              <Legend />
              <Line type="monotone" dataKey="newRequests" stroke="#4C8DFF" strokeWidth={2} name="New Requests" />
              <Line type="monotone" dataKey="approved" stroke="#14E8B4" strokeWidth={2} name="Approved" />
              <Line type="monotone" dataKey="rejected" stroke="#F5514B" strokeWidth={2} name="Rejected" />
              <Line type="monotone" dataKey="pending" stroke="#F6B93B" strokeWidth={2} name="Pending" />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area-wise Connections */}
        {areaWiseConnections.length > 0 && (
          <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Area-wise Connection Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={areaWiseConnections}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
                <XAxis dataKey="name" stroke="#8996AD" />
                <YAxis stroke="#8996AD" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121B2E', border: '1px solid #232D45', borderRadius: '8px' }}
                  itemStyle={{ color: '#EAF0FB' }}
                />
                <Legend />
                <Bar dataKey="approved" fill="#14E8B4" name="Active" />
                <Bar dataKey="rejected" fill="#F5514B" name="Rejected" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Approval Status Pie */}
        {approvalStatusData.filter((d: any) => d.value > 0).length > 0 && (
          <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Approval Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={approvalStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {approvalStatusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#121B2E', border: '1px solid #232D45', borderRadius: '8px' }}
                  itemStyle={{ color: '#EAF0FB' }}
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Package Distribution */}
      {packageDistribution.length > 0 && (
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Package Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={packageDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
              <XAxis type="number" stroke="#8996AD" allowDecimals={false} />
              <YAxis dataKey="name" type="category" stroke="#8996AD" width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: '#121B2E', border: '1px solid #232D45', borderRadius: '8px' }}
                itemStyle={{ color: '#EAF0FB' }}
              />
              <Bar dataKey="connections" fill="#4C8DFF" name="Connections" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Area Table */}
      {areaWiseConnections.length > 0 && (
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Area-wise Detailed Report
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#232D45]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Area</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Total Requests</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Active</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Rejected</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Approval Rate</th>
                </tr>
              </thead>
              <tbody>
                {areaWiseConnections.map((area: any) => (
                  <tr key={area.name} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                    <td className="py-3 px-4 text-sm text-[#EAF0FB] font-medium">{area.name}</td>
                    <td className="py-3 px-4 text-sm text-[#EAF0FB]">{area.requests}</td>
                    <td className="py-3 px-4 text-sm text-[#14E8B4]">{area.approved}</td>
                    <td className="py-3 px-4 text-sm text-[#F5514B]">{area.rejected}</td>
                    <td className="py-3 px-4 text-sm text-[#14E8B4]">
                      {area.requests > 0 ? ((area.approved / area.requests) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalConnections === 0 && (
        <EmptyState icon="Users" title="No connections found" description="No connection requests have been recorded yet." />
      )}
    </div>
  );
}
