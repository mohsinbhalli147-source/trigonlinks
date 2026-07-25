import { useState, useEffect } from 'react';
import { MapPin, DollarSign, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { expensesApi, areasApi } from '../services/api';
import { toast } from '../components/Toast';
import EmptyState from '../components/EmptyState';

interface AreaExpenseSummary {
  areaId: string;
  areaName: string;
  totalExpenses: number;
  categories: { name: string; amount: number }[];
}

export default function ExpensesAreas() {
  const [areaExpenses, setAreaExpenses] = useState<AreaExpenseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAreaExpenses();
  }, []);

  const loadAreaExpenses = async () => {
    setLoading(true);
    setError('');
    try {
      // Load areas and expenses in parallel
      const [areasResult, expensesResult] = await Promise.all([
        areasApi.getAll({ limit: 100 }),
        expensesApi.getAll({ limit: 1000 }),
      ]);

      if (!areasResult.success) {
        setError(areasResult.error || 'Failed to load areas');
        return;
      }
      if (!expensesResult.success) {
        setError(expensesResult.error || 'Failed to load expenses');
        return;
      }

      const areas: any[] = areasResult.data?.data || [];
      const expenses: any[] = expensesResult.data?.data || [];

      // Group expenses by area
      const summaryMap: Record<string, AreaExpenseSummary> = {};

      // Initialize with all areas
      areas.forEach(area => {
        summaryMap[area.id] = {
          areaId: area.id,
          areaName: area.name,
          totalExpenses: 0,
          categories: [],
        };
      });

      // Aggregate expenses
      const categoryMap: Record<string, Record<string, number>> = {};
      expenses.forEach(exp => {
        const areaId = exp.area || exp.areaId || 'general';
        const amount = Number(exp.amount) || 0;
        const category = exp.category || 'Other';

        if (!summaryMap[areaId]) {
          // Expense area not in areas list — skip or create generic
          return;
        }
        summaryMap[areaId].totalExpenses += amount;

        if (!categoryMap[areaId]) categoryMap[areaId] = {};
        categoryMap[areaId][category] = (categoryMap[areaId][category] || 0) + amount;
      });

      // Build category arrays
      Object.keys(summaryMap).forEach(areaId => {
        const cats = categoryMap[areaId] || {};
        summaryMap[areaId].categories = Object.entries(cats)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount);
      });

      // Filter to areas that have expenses
      const result = Object.values(summaryMap).filter(s => s.totalExpenses > 0);
      setAreaExpenses(result);
    } catch (err) {
      setError('Failed to load area expenses');
      toast.error('Failed to load area expenses');
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = areaExpenses.reduce((sum, a) => sum + a.totalExpenses, 0);
  const maxExpense = areaExpenses.length > 0 ? Math.max(...areaExpenses.map(a => a.totalExpenses)) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#4C8DFF] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8996AD] text-sm">Loading area expenses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState title="Failed to Load" message={error} icon="error" onRetry={loadAreaExpenses} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Expenses by Area</h2>
        <button
          onClick={loadAreaExpenses}
          className="flex items-center gap-2 px-4 py-2 bg-[#232D45] hover:bg-[#2A3657] text-[#8996AD] hover:text-[#EAF0FB] rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-[#F5514B]" />
            <p className="text-sm text-[#8996AD]">Total Spent</p>
          </div>
          <p className="text-2xl font-bold text-[#F5514B]">Rs. {totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-[#14E8B4]" />
            <p className="text-sm text-[#8996AD]">Areas with Expenses</p>
          </div>
          <p className="text-2xl font-bold text-[#14E8B4]">{areaExpenses.length}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[#4C8DFF]" />
            <p className="text-sm text-[#8996AD]">Highest Spending Area</p>
          </div>
          <p className="text-lg font-bold text-[#4C8DFF] truncate">
            {areaExpenses.length > 0
              ? areaExpenses.reduce((prev, cur) => cur.totalExpenses > prev.totalExpenses ? cur : prev).areaName
              : '—'}
          </p>
        </div>
      </div>

      {areaExpenses.length === 0 ? (
        <EmptyState
          title="No Area Expenses"
          message="No expenses with area assignments found. Add expenses and assign them to areas to see this breakdown."
          onRetry={loadAreaExpenses}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areaExpenses.map((area) => {
            const percentage = maxExpense > 0 ? Math.round((area.totalExpenses / maxExpense) * 100) : 0;
            const barColor = percentage >= 90 ? 'bg-[#F5514B]' : percentage >= 60 ? 'bg-[#F6B93B]' : 'bg-[#14E8B4]';

            return (
              <div key={area.areaId} className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6 hover:border-[#4C8DFF] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#4C8DFF] to-[#2E5CB8] flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-[#EAF0FB]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#EAF0FB]">{area.areaName}</h3>
                    <p className="text-sm text-[#8996AD]">{area.categories.length} categories</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#8996AD]">vs Highest</span>
                      <span className="text-[#EAF0FB]">{percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#232D45] rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-[#8996AD]">Total Spent</p>
                    <p className="text-xl font-bold text-[#F5514B]">Rs. {area.totalExpenses.toLocaleString()}</p>
                  </div>

                  {area.categories.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-[#EAF0FB] mb-2">Breakdown</p>
                      <div className="space-y-1">
                        {area.categories.slice(0, 4).map((cat, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-[#8996AD]">{cat.name}</span>
                            <span className="text-[#EAF0FB]">Rs. {cat.amount.toLocaleString()}</span>
                          </div>
                        ))}
                        {area.categories.length > 4 && (
                          <p className="text-xs text-[#5C6B85]">+{area.categories.length - 4} more categories</p>
                        )}
                      </div>
                    </div>
                  )}

                  {percentage >= 90 && (
                    <div className="flex items-start gap-2 p-2 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg">
                      <AlertCircle className="w-4 h-4 text-[#F5514B] mt-0.5" />
                      <p className="text-xs text-[#F5514B]">Highest spending area</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
