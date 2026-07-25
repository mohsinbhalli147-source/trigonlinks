import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, Users, DollarSign, Download, Loader2, RefreshCw } from 'lucide-react';
import DateFilter, { DateFilterType } from '../components/DateFilter';
import { reportsApi } from '../services/api';
import { toast } from '../components/Toast';
import EmptyState from '../components/EmptyState';

const COLORS = ['#14E8B4', '#4C8DFF', '#F6B93B', '#F5514B', '#8996AD'];

export default function PackagesReports() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    const result = await reportsApi.getPackages();
    if (result.success) {
      setReportData(result.data);
    } else {
      setError(result.error || 'Failed to load package reports');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleFilterChange = (_filterType: DateFilterType, _startDate?: Date, _endDate?: Date) => {
    // Filter integration can be extended here
  };

  const handleExport = () => {
    toast.info('Exporting package reports...');
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
        <button onClick={loadReports} className="flex items-center gap-2 px-4 py-2 bg-[#4C8DFF] text-white rounded-lg">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!reportData) {
    return <EmptyState icon="Package" title="No package data" description="No package report data is available yet." />;
  }

  const {
    packageReports = [],
    totalPackages = 0,
    totalCustomers = 0,
    totalRevenue = 0,
    customerDistribution = [],
    revenueDistribution = [],
  } = reportData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Package Reports</h2>
        <div className="flex items-center gap-3">
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

      {/* Date Filter */}
      <DateFilter onFilterChange={handleFilterChange} onRefresh={loadReports} />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-[#4C8DFF]" />
            <p className="text-sm text-[#8996AD]">Total Packages</p>
          </div>
          <p className="text-2xl font-bold text-[#EAF0FB]">{totalPackages}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-[#14E8B4]" />
            <p className="text-sm text-[#8996AD]">Total Customers</p>
          </div>
          <p className="text-2xl font-bold text-[#14E8B4]">{totalCustomers.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[#F6B93B]" />
            <p className="text-sm text-[#8996AD]">Monthly Revenue</p>
          </div>
          <p className="text-2xl font-bold text-[#F6B93B]">Rs. {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-[#F5514B]" />
            <p className="text-sm text-[#8996AD]">Avg Revenue/Package</p>
          </div>
          <p className="text-2xl font-bold text-[#F5514B]">
            Rs. {totalPackages > 0 ? Math.round(totalRevenue / totalPackages).toLocaleString() : 0}
          </p>
        </div>
      </div>

      {packageReports.length === 0 ? (
        <EmptyState icon="Package" title="No packages found" description="No packages have been configured yet." />
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {customerDistribution.length > 0 && (
              <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Customer Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={customerDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="customers"
                    >
                      {customerDistribution.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1B2540', border: '1px solid #232D45' }}
                      itemStyle={{ color: '#EAF0FB' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {revenueDistribution.length > 0 && (
              <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Revenue Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
                    <XAxis dataKey="name" stroke="#8996AD" />
                    <YAxis stroke="#8996AD" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1B2540', border: '1px solid #232D45' }}
                      itemStyle={{ color: '#EAF0FB' }}
                      formatter={(value) => `Rs. ${(Number(value) || 0).toLocaleString()}`}
                    />
                    <Bar dataKey="revenue" fill="#14E8B4" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Detailed Table */}
          <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Package Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#232D45]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Package</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Speed</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Total Customers</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Active</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {packageReports.map((report: any) => (
                    <tr key={report.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                      <td className="py-3 px-4 font-semibold text-[#EAF0FB]">{report.name}</td>
                      <td className="py-3 px-4 text-sm text-[#8996AD]">{report.speed}</td>
                      <td className="py-3 px-4 text-sm text-[#4C8DFF]">Rs. {(report.price || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-[#EAF0FB]">{report.customers}</td>
                      <td className="py-3 px-4 text-sm text-[#14E8B4]">{report.activeCustomers}</td>
                      <td className="py-3 px-4 text-sm text-[#F6B93B] font-semibold">Rs. {(report.revenue || 0).toLocaleString()}</td>
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
