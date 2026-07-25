import { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { DollarSign, TrendingUp, CreditCard, Calendar, CheckCircle, AlertCircle, Clock, Loader2, RefreshCw } from 'lucide-react';
import DateFilter, { DateFilterType } from '../components/DateFilter';
import { reportsApi } from '../services/api';
import EmptyState from '../components/EmptyState';

export default function BillingReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    const result = await reportsApi.getBilling();
    if (result.success) {
      setReportData(result.data);
    } else {
      setError(result.error || 'Failed to load billing reports');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (_filterType: DateFilterType, _startDate?: Date, _endDate?: Date) => {
    // Filter integration can be added here
  };

  const handleRefresh = () => {
    loadData();
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
    return <EmptyState icon="BarChart3" title="No billing data" description="No billing report data is available yet." />;
  }

  const {
    summary = {},
    monthlyData = [],
    paid = 0,
    unpaid = 0,
    overdue = 0,
    partial = 0,
    total = 0,
  } = reportData;

  // Status distribution for pie chart - derived from live counts
  const statusPieData = [
    { name: 'Paid', value: paid, color: '#14E8B4' },
    { name: 'Unpaid', value: unpaid, color: '#F6B93B' },
    { name: 'Overdue', value: overdue, color: '#F5514B' },
    { name: 'Partial', value: partial, color: '#4C8DFF' },
  ].filter(d => d.value > 0);

  const stats = [
    { name: 'Total Revenue', value: `Rs. ${(summary.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-[#14E8B4]' },
    { name: 'Pending Revenue', value: `Rs. ${(summary.pendingRevenue || 0).toLocaleString()}`, icon: Clock, color: 'text-[#F6B93B]' },
    { name: 'Overdue Invoices', value: overdue.toLocaleString(), icon: AlertCircle, color: 'text-[#F5514B]' },
    { name: 'Collection Rate', value: `${summary.collectionRate || 0}%`, icon: TrendingUp, color: 'text-[#14E8B4]' },
    { name: 'Total Invoices', value: total.toLocaleString(), icon: CreditCard, color: 'text-[#4C8DFF]' },
    { name: 'Discount Given', value: `Rs. ${(summary.discountGiven || 0).toLocaleString()}`, icon: CheckCircle, color: 'text-[#8996AD]' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Payment Reports</h2>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-[#1B2540] border border-[#232D45] text-[#EAF0FB] rounded-lg hover:border-[#4C8DFF] transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Date Filter */}
      <DateFilter onFilterChange={handleFilterChange} onRefresh={handleRefresh} />

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        {monthlyData.length > 0 && (
          <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
                <XAxis dataKey="month" stroke="#8996AD" />
                <YAxis stroke="#8996AD" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121B2E', border: '1px solid #232D45', borderRadius: '8px' }}
                  itemStyle={{ color: '#EAF0FB' }}
                  formatter={(value: number) => `Rs. ${value.toLocaleString()}`}
                />
                <Legend />
                <Line type="monotone" dataKey="collected" stroke="#14E8B4" strokeWidth={2} name="Collected" />
                <Line type="monotone" dataKey="pending" stroke="#F6B93B" strokeWidth={2} name="Pending" />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Invoice Status Distribution */}
        {statusPieData.length > 0 && (
          <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Invoice Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
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
      </div>

      {/* Monthly Breakdown Table */}
      {monthlyData.length > 0 && (
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Monthly Revenue Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#232D45]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Month</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Collected</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Pending</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Overdue Count</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Collection Rate</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((data: any) => {
                  const rowTotal = (data.collected || 0) + (data.pending || 0);
                  const rate = rowTotal > 0 ? ((data.collected / rowTotal) * 100).toFixed(1) : '0';
                  return (
                    <tr key={data.month} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                      <td className="py-3 px-4 text-sm text-[#EAF0FB] font-medium">{data.month}</td>
                      <td className="py-3 px-4 text-sm text-[#14E8B4]">Rs. {((data.collected || 0) / 1000).toFixed(0)}K</td>
                      <td className="py-3 px-4 text-sm text-[#F6B93B]">Rs. {((data.pending || 0) / 1000).toFixed(0)}K</td>
                      <td className="py-3 px-4 text-sm text-[#F5514B]">{data.overdue || 0}</td>
                      <td className="py-3 px-4 text-sm text-[#14E8B4]">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {monthlyData.length === 0 && total === 0 && (
        <EmptyState icon="BarChart3" title="No billing data" description="No billing transactions have been recorded yet." />
      )}
    </div>
  );
}
