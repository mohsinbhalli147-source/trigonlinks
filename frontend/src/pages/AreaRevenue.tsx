import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, Calendar, Download, ArrowLeft, MapPin } from 'lucide-react';
import { areasApi } from '../services/api';
import { toast } from '../components/Toast';
import EmptyState from '../components/EmptyState';

interface RevenueRecord {
  month: string;
  collected: number;
  pending: number;
  expenses: number;
  netRevenue: number;
}

interface AreaDetails {
  id: string;
  name: string;
  code: string;
  city: string;
}

export default function AreaRevenue() {
  const navigate = useNavigate();
  const { areaId } = useParams();
  const [area, setArea] = useState<AreaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [revenueData, setRevenueData] = useState<RevenueRecord[]>([]);
  const [areaList, setAreaList] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2].map(y => y.toString());

  useEffect(() => {
    if (areaId) {
      loadData();
    } else {
      loadAreaList();
    }
  }, [areaId, selectedYear]);

  const loadAreaList = async () => {
    setListLoading(true);
    setError('');
    const result = await areasApi.getAll({ limit: 100 });
    if (result.success) {
      setAreaList(result.data?.data || []);
    } else {
      setError(result.error || 'Failed to load areas');
    }
    setListLoading(false);
    setLoading(false);
  };

  const loadData = async () => {
    setLoading(true);
    setError('');

    const [areaResult, revenueResult] = await Promise.all([
      areasApi.getById(areaId!),
      areasApi.getRevenue(areaId!, selectedYear),
    ]);

    if (areaResult.success) {
      setArea(areaResult.data);
    }

    if (revenueResult.success) {
      setRevenueData(revenueResult.data?.revenueData || []);
    } else {
      setError(revenueResult.error || 'Failed to load revenue data');
      toast.error('Failed to load area revenue');
    }

    setLoading(false);
  };

  const totalCollected = revenueData.reduce((sum, r) => sum + r.collected, 0);
  const totalPending = revenueData.reduce((sum, r) => sum + r.pending, 0);
  const totalExpenses = revenueData.reduce((sum, r) => sum + r.expenses, 0);
  const totalNetRevenue = revenueData.reduce((sum, r) => sum + r.netRevenue, 0);
  const avgMonthlyRevenue = revenueData.length > 0 ? totalNetRevenue / revenueData.filter(r => r.collected > 0).length : 0;

  const handleExport = () => {
    toast.info('Export feature coming soon');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#4C8DFF] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8996AD] text-sm">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  if (!areaId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#EAF0FB]">Area Revenue</h2>
          <p className="text-sm text-[#8996AD]">Select an area to view its revenue</p>
        </div>

        {listLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#4C8DFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : areaList.length === 0 ? (
          <EmptyState title="No Areas Found" message="Add areas first to view revenue reports." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {areaList.map((a) => (
              <div
                key={a.id}
                onClick={() => navigate(`/areas/revenue/${a.id}`)}
                className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6 cursor-pointer hover:border-[#14E8B4] transition-all hover:translate-y-[-2px] group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#4C8DFF]/15 flex items-center justify-center group-hover:bg-[#14E8B4]/15 transition-colors">
                    <MapPin className="w-6 h-6 text-[#4C8DFF] group-hover:text-[#14E8B4] transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#EAF0FB] group-hover:text-[#14E8B4] transition-colors">{a.name}</h3>
                    <p className="text-sm text-[#8996AD]">{a.city}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-[#8996AD] pt-4 border-t border-[#232D45]">
                  <span>Code: {a.code}</span>
                  <span>{a.district || a.province || ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to Load Revenue"
        message={error}
        icon="error"
        onRetry={loadData}
      />
    );
  }

  const activeMonths = revenueData.filter(r => r.collected > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/areas/all')}
            className="p-2 bg-[#232D45] text-[#8996AD] rounded-lg hover:text-[#EAF0FB] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-[#EAF0FB]">Area Revenue</h2>
            {area && (
              <p className="text-sm text-[#8996AD]">
                {area.name} {area.code ? `(${area.code})` : ''} {area.city ? `• ${area.city}` : ''}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Year Filter */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-[#5C6B85]" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[#14E8B4]" />
            <p className="text-sm text-[#8996AD]">Total Collected</p>
          </div>
          <p className="text-2xl font-bold text-[#14E8B4]">Rs. {totalCollected.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[#F6B93B]" />
            <p className="text-sm text-[#8996AD]">Total Pending</p>
          </div>
          <p className="text-2xl font-bold text-[#F6B93B]">Rs. {totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-[#F5514B]" />
            <p className="text-sm text-[#8996AD]">Total Expenses</p>
          </div>
          <p className="text-2xl font-bold text-[#F5514B]">Rs. {totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[#4C8DFF]" />
            <p className="text-sm text-[#8996AD]">Net Revenue</p>
          </div>
          <p className="text-2xl font-bold text-[#4C8DFF]">Rs. {totalNetRevenue.toLocaleString()}</p>
        </div>
      </div>

      {activeMonths.length === 0 ? (
        <EmptyState
          title="No Revenue Data"
          message={`No revenue recorded for ${selectedYear}. Data will appear once invoices are generated for customers in this area.`}
          onRetry={loadData}
        />
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Monthly Revenue Overview</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
                  <XAxis dataKey="month" stroke="#8996AD" />
                  <YAxis stroke="#8996AD" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1B2540', border: '1px solid #232D45' }}
                    itemStyle={{ color: '#EAF0FB' }}
                    formatter={(value: any) => `Rs. ${Number(value).toLocaleString()}`}
                  />
                  <Bar dataKey="collected" fill="#14E8B4" name="Collected" />
                  <Bar dataKey="pending" fill="#F6B93B" name="Pending" />
                  <Bar dataKey="expenses" fill="#F5514B" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Net Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
                  <XAxis dataKey="month" stroke="#8996AD" />
                  <YAxis stroke="#8996AD" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1B2540', border: '1px solid #232D45' }}
                    itemStyle={{ color: '#EAF0FB' }}
                    formatter={(value: any) => `Rs. ${Number(value).toLocaleString()}`}
                  />
                  <Line type="monotone" dataKey="netRevenue" stroke="#4C8DFF" strokeWidth={2} name="Net Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#EAF0FB]">Monthly Breakdown</h3>
              {avgMonthlyRevenue > 0 && (
                <div className="text-sm text-[#8996AD]">
                  Avg Monthly Revenue: <span className="text-[#4C8DFF] font-semibold">Rs. {Math.round(avgMonthlyRevenue).toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#232D45]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Month</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Collected</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Pending</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Expenses</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Net Revenue</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Collection Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.map((record, index) => {
                    const total = record.collected + record.pending;
                    const rate = total > 0 ? Math.round((record.collected / total) * 100) : 0;
                    return (
                      <tr key={index} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                        <td className="py-3 px-4 text-sm text-[#EAF0FB]">{record.month}</td>
                        <td className="py-3 px-4 text-sm text-[#14E8B4] font-semibold">Rs. {record.collected.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-[#F6B93B]">Rs. {record.pending.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-[#F5514B]">Rs. {record.expenses.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-[#4C8DFF] font-semibold">Rs. {record.netRevenue.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          {total > 0 ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rate >= 90 ? 'bg-[#14E8B4]/20 text-[#14E8B4]'
                              : rate >= 70 ? 'bg-[#F6B93B]/20 text-[#F6B93B]'
                              : 'bg-[#F5514B]/20 text-[#F5514B]'
                            }`}>
                              {rate}%
                            </span>
                          ) : (
                            <span className="text-sm text-[#5C6B85]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
