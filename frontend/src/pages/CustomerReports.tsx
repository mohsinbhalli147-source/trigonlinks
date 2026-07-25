import { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Users, DollarSign, TrendingUp, MapPin, CreditCard, Activity, BarChart3, Loader2, RefreshCw } from 'lucide-react';
import DateFilter, { DateFilterType } from '../components/DateFilter';
import { reportsApi } from '../services/api';
import EmptyState from '../components/EmptyState';

export default function CustomerReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    const result = await reportsApi.getCustomers();
    if (result.success) {
      setReportData(result.data);
    } else {
      setError(result.error || 'Failed to load customer reports');
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
    return <EmptyState icon="Users" title="No customer data" description="No customer report data is available yet." />;
  }

  const {
    total = 0,
    active = 0,
    suspended = 0,
    totalRevenue = 0,
    avgRevenue = 0,
    monthlyData = [],
    summary = {},
  } = reportData;

  const stats = [
    { name: 'Total Customers', value: total.toLocaleString(), icon: Users, color: 'text-[#14E8B4]' },
    { name: 'Active Customers', value: active.toLocaleString(), icon: Activity, color: 'text-[#14E8B4]' },
    { name: 'Suspended', value: suspended.toLocaleString(), icon: Users, color: 'text-[#F5514B]' },
    { name: 'Total Revenue', value: `Rs. ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-[#4C8DFF]' },
    { name: 'Avg Revenue/Customer', value: `Rs. ${Math.round(avgRevenue).toLocaleString()}`, icon: TrendingUp, color: 'text-[#14E8B4]' },
    { name: 'IPTV Customers', value: (reportData.iptvCustomers || 0).toLocaleString(), icon: CreditCard, color: 'text-[#F6B93B]' },
  ];

  // Build pie data for status distribution
  const statusPieData = [
    { name: 'Active', value: active, color: '#14E8B4' },
    { name: 'Suspended', value: suspended, color: '#F5514B' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Customer Reports</h2>
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

      {/* Customer Growth Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Monthly Customer Growth
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
              <Line type="monotone" dataKey="new" stroke="#4C8DFF" strokeWidth={2} name="New Customers" />
              <Line type="monotone" dataKey="active" stroke="#14E8B4" strokeWidth={2} name="Active" />
              <Line type="monotone" dataKey="suspended" stroke="#F5514B" strokeWidth={2} name="Suspended" />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        {statusPieData.length > 0 && (
          <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Customer Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
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

        {/* Revenue summary card */}
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Revenue Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-[#232D45]">
              <span className="text-[#8996AD]">Total Revenue</span>
              <span className="text-[#14E8B4] font-semibold">Rs. {totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#232D45]">
              <span className="text-[#8996AD]">Avg Revenue / Customer</span>
              <span className="text-[#4C8DFF] font-semibold">Rs. {Math.round(avgRevenue).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#232D45]">
              <span className="text-[#8996AD]">IPTV Revenue</span>
              <span className="text-[#F6B93B] font-semibold">Rs. {(summary.iptvRevenue || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-[#8996AD]">Live IP Revenue</span>
              <span className="text-[#F6B93B] font-semibold">Rs. {(summary.liveIpRevenue || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      {monthlyData.length > 0 && (
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Monthly Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#232D45]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Month</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">New Customers</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Active</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Suspended</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row: any) => (
                  <tr key={row.month} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                    <td className="py-3 px-4 text-sm text-[#EAF0FB] font-medium">{row.month}</td>
                    <td className="py-3 px-4 text-sm text-[#4C8DFF]">{row.new}</td>
                    <td className="py-3 px-4 text-sm text-[#14E8B4]">{row.active}</td>
                    <td className="py-3 px-4 text-sm text-[#F5514B]">{row.suspended}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {monthlyData.length === 0 && (
        <EmptyState icon="Users" title="No monthly data" description="No customer activity data available for the selected period." />
      )}
    </div>
  );
}
