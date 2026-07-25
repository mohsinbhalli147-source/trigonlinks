import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, DollarSign, ArrowRight, Download, Calendar } from 'lucide-react';
import axios from 'axios';
import { reportsApi } from '../services/api';

interface IncomeStats {
  totalCollected: number;
  totalPending: number;
  monthly: Record<string, { collected: number; pending: number }>;
}

export default function ReportsIncome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<IncomeStats>({
    totalCollected: 0,
    totalPending: 0,
    monthly: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncomeStats();
  }, []);

  const fetchIncomeStats = async () => {
    try {
      const result = await reportsApi.getIncome();
      if (result.success) {
        setStats(result.data);
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error('Error fetching income stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { name: 'Total Collected', value: `Rs. ${(stats.totalCollected || 0).toLocaleString()}`, icon: DollarSign, color: 'text-[#14E8B4]' },
    { name: 'Total Pending', value: `Rs. ${(stats.totalPending || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-[#F6B93B]' },
    { name: 'Net Income', value: `Rs. ${((stats.totalCollected || 0) - (stats.totalPending || 0)).toLocaleString()}`, icon: TrendingUp, color: 'text-[#4C8DFF]' },
  ];

  const monthlyData = Object.entries(stats.monthly).map(([month, data]) => ({
    month,
    collected: data.collected,
    pending: data.pending,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading income reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#EAF0FB]">Income Reports</h1>
        <button
          onClick={() => navigate('/billing')}
          className="px-4 py-2 border border-[#232D45] rounded-lg text-[#8996AD] hover:bg-[#1B2540] transition-colors flex items-center gap-2"
        >
          View Billing
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
              <div className="text-sm text-[#8996AD]">{stat.name}</div>
            </div>
            <div className="text-3xl font-bold text-[#EAF0FB]">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#EAF0FB]">Monthly Income Breakdown</h2>
          <button className="px-3 py-2 bg-[#4C8DFF] text-white rounded-lg hover:bg-[#3B7BD9] transition-colors flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left text-[#8996AD] pb-3 font-medium">Month</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Collected</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Pending</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Total</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Collection Rate</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((data) => {
                const total = data.collected + data.pending;
                const rate = total > 0 ? Math.round((data.collected / total) * 100) : 0;
                return (
                  <tr key={data.month} className="border-b border-[#232D45] hover:bg-[#1B2540]">
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#8996AD]" />
                        <span className="text-[#EAF0FB] font-medium">{data.month}</span>
                      </div>
                    </td>
                    <td className="py-4 text-[#14E8B4] font-medium">Rs. {(data.collected || 0).toLocaleString()}</td>
                    <td className="py-4 text-[#F6B93B] font-medium">Rs. {(data.pending || 0).toLocaleString()}</td>
                    <td className="py-4 text-[#EAF0FB]">Rs. {(total || 0).toLocaleString()}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-[#1B2540] rounded-full h-2">
                          <div 
                            className="bg-[#14E8B4] h-2 rounded-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="text-sm text-[#8996AD]">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {monthlyData.length === 0 && (
          <div className="text-center py-12 text-[#8996AD]">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-[#8996AD]" />
            <p>No income data available</p>
          </div>
        )}
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Income Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg">
            <div className="text-sm text-[#8996AD] mb-1">Average Monthly Collection</div>
            <div className="text-2xl font-bold text-[#14E8B4]">
              Rs. {monthlyData.length > 0 ? Math.round((stats.totalCollected || 0) / (monthlyData.length || 1)).toLocaleString() : '0'}
            </div>
          </div>
          <div className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg">
            <div className="text-sm text-[#8996AD] mb-1">Best Performing Month</div>
            <div className="text-2xl font-bold text-[#4C8DFF]">
              {monthlyData.length > 0 ? monthlyData.reduce((best, current) => 
                current.collected > best.collected ? current : best
              ).month : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
