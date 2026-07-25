import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingDown, DollarSign, ArrowRight, Download, PieChart } from 'lucide-react';
import axios from 'axios';
import { reportsApi } from '../services/api';

interface ExpenseStats {
  total: number;
  byCategory: Record<string, number>;
  expenses: any[];
}

export default function ReportsExpenses() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ExpenseStats>({
    total: 0,
    byCategory: {},
    expenses: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenseStats();
  }, []);

  const fetchExpenseStats = async () => {
    try {
      const result = await reportsApi.getExpenses();
      if (result.success) {
        setStats(result.data);
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error('Error fetching expense stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryData = Object.entries(stats.byCategory).map(([category, amount]) => ({
    category,
    amount,
    percentage: stats.total > 0 ? Math.round((amount / stats.total) * 100) : 0,
  })).sort((a, b) => b.amount - a.amount);

  const topCategory = categoryData.length > 0 ? categoryData[0] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading expense reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#EAF0FB]">Expense Reports</h1>
        <button
          onClick={() => navigate('/expenses/all')}
          className="px-4 py-2 border border-[#232D45] rounded-lg text-[#8996AD] hover:bg-[#1B2540] transition-colors flex items-center gap-2"
        >
          View Expenses
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 text-[#F5514B]" />
            <div className="text-sm text-[#8996AD]">Total Expenses</div>
          </div>
          <div className="text-3xl font-bold text-[#EAF0FB]">Rs. {(stats.total || 0).toLocaleString()}</div>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <PieChart className="w-6 h-6 text-[#4C8DFF]" />
            <div className="text-sm text-[#8996AD]">Categories</div>
          </div>
          <div className="text-3xl font-bold text-[#EAF0FB]">{categoryData.length}</div>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown className="w-6 h-6 text-[#F6B93B]" />
            <div className="text-sm text-[#8996AD]">Top Category</div>
          </div>
          <div className="text-xl font-bold text-[#EAF0FB]">
            {topCategory ? topCategory.category : 'N/A'}
          </div>
          <div className="text-sm text-[#8996AD]">
            {topCategory ? `Rs. ${(topCategory.amount || 0).toLocaleString()}` : ''}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Expense by Category</h2>
          <div className="space-y-3">
            {categoryData.map((data) => (
              <div key={data.category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#EAF0FB]">{data.category}</span>
                  <span className="text-[#8996AD]">Rs. {(data.amount || 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-[#1B2540] rounded-full h-2">
                  <div 
                    className="bg-[#4C8DFF] h-2 rounded-full transition-all"
                    style={{ width: `${data.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Category Distribution</h2>
          <div className="space-y-2">
            {categoryData.slice(0, 5).map((data) => (
              <div key={data.category} className="flex items-center justify-between p-3 bg-[#1B2540] rounded-lg">
                <div>
                  <div className="text-[#EAF0FB] font-medium">{data.category}</div>
                  <div className="text-xs text-[#8996AD]">{data.percentage}% of total</div>
                </div>
                <div className="text-[#14E8B4] font-medium">Rs. {(data.amount || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#EAF0FB]">Recent Expenses</h2>
          <button className="px-3 py-2 bg-[#4C8DFF] text-white rounded-lg hover:bg-[#3B7BD9] transition-colors flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left text-[#8996AD] pb-3 font-medium">Title</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Category</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Amount</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.expenses.slice(0, 10).map((expense) => (
                <tr key={expense.id} className="border-b border-[#232D45] hover:bg-[#1B2540]">
                  <td className="py-4">
                    <div className="text-[#EAF0FB] font-medium">{expense.name || expense.title}</div>
                    {expense.desc && <div className="text-xs text-[#8996AD]">{expense.desc}</div>}
                  </td>
                  <td className="py-4 text-[#8996AD]">{expense.category}</td>
                  <td className="py-4 text-[#F5514B] font-medium">Rs. {Number(expense.amount || 0).toLocaleString()}</td>
                  <td className="py-4 text-[#8996AD]">{expense.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {stats.expenses.length === 0 && (
          <div className="text-center py-12 text-[#8996AD]">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-[#8996AD]" />
            <p>No expense data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
