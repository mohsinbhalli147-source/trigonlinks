import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, MapPin, AlertCircle, Download, RefreshCw } from 'lucide-react';
import { reportsApi } from '../services/api';
import { toast } from '../components/Toast';
import EmptyState from '../components/EmptyState';

const COLORS = ['#14E8B4', '#4C8DFF', '#F6B93B', '#F5514B', '#8996AD', '#9B59B6'];

export default function ExpensesReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    const result = await reportsApi.getExpenses();
    if (result.success) {
      setReportData(result.data);
    } else {
      setError(result.error || 'Failed to load expense reports');
      toast.error('Failed to load expense reports');
    }
    setLoading(false);
  };

  const handleExport = () => {
    if (!reportData) return;
    
    const content = `
EXPENSE REPORTS
================
Total Expenses: Rs. ${total.toLocaleString()}
Categories: ${categoryData.length}
Top Category: ${topCategory?.category || 'N/A'} (Rs. ${topCategory?.amount?.toLocaleString() || 0})

CATEGORY BREAKDOWN:
===================
${(reportData?.categoryData || []).map((cat: any) => 
  `${cat.category}: Rs. ${cat.amount.toLocaleString()} (${cat.percentage}%)`
).join('\n')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-reports-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Expense reports exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#4C8DFF] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8996AD] text-sm">Loading expense reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <EmptyState title="Failed to Load" message={error} icon="error" onRetry={loadReports} />;
  }

  const total = reportData?.total || 0;
  const categoryData: { name: string; value: number }[] = (reportData?.categoryData || []).map((c: any) => ({
    name: c.category,
    value: c.amount,
  }));
  const topCategory = reportData?.summary?.topCategory;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Expense Reports</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={loadReports}
            className="flex items-center gap-2 px-4 py-2 bg-[#232D45] hover:bg-[#2A3657] text-[#8996AD] hover:text-[#EAF0FB] rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[#4C8DFF]" />
            <p className="text-sm text-[#8996AD]">Total Expenses</p>
          </div>
          <p className="text-2xl font-bold text-[#EAF0FB]">Rs. {total.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-[#14E8B4]" />
            <p className="text-sm text-[#8996AD]">Categories</p>
          </div>
          <p className="text-2xl font-bold text-[#14E8B4]">{categoryData.length}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-[#F5514B]" />
            <p className="text-sm text-[#8996AD]">Top Category</p>
          </div>
          <p className="text-xl font-bold text-[#F5514B] truncate">{topCategory?.category || 'N/A'}</p>
          {topCategory && (
            <p className="text-sm text-[#8996AD] mt-1">Rs. {topCategory.amount.toLocaleString()}</p>
          )}
        </div>
      </div>

      {categoryData.length === 0 ? (
        <EmptyState
          title="No Expense Data"
          message="No expenses have been recorded yet. Start adding expenses to see reports."
          onRetry={loadReports}
        />
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Expenses by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1B2540', border: '1px solid #232D45' }}
                    itemStyle={{ color: '#EAF0FB' }}
                    formatter={(value: any) => `Rs. ${Number(value).toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Category Amounts</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
                  <XAxis type="number" stroke="#8996AD" tickFormatter={(v) => `Rs. ${v.toLocaleString()}`} />
                  <YAxis type="category" dataKey="name" stroke="#8996AD" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1B2540', border: '1px solid #232D45' }}
                    itemStyle={{ color: '#EAF0FB' }}
                    formatter={(value: any) => `Rs. ${Number(value).toLocaleString()}`}
                  />
                  <Bar dataKey="value" fill="#14E8B4" name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Category Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#232D45]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Total Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData?.categoryData || []).map((cat: any) => (
                    <tr key={cat.category} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                      <td className="py-3 px-4 font-semibold text-[#EAF0FB]">{cat.category}</td>
                      <td className="py-3 px-4 text-sm text-[#F6B93B] font-semibold">Rs. {cat.amount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-[#232D45] rounded-full overflow-hidden">
                            <div className="h-full bg-[#14E8B4]" style={{ width: `${cat.percentage}%` }} />
                          </div>
                          <span className="text-sm text-[#8996AD]">{cat.percentage}%</span>
                        </div>
                      </td>
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
