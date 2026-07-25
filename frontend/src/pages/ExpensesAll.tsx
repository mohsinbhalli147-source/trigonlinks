import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Filter, DollarSign, Calendar, MapPin, TrendingUp } from 'lucide-react';
import { expensesApi } from '../services/api';
import { toast } from '../components/Toast';

interface Expense {
  id: string;
  name: string;
  title: string;
  category: string;
  amount: number;
  date: number;
  description: string;
  area: string;
  created_at: number;
}

export default function ExpensesAll() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    setError('');
    const result = await expensesApi.getAll({ limit: 100 });
    if (result.success) {
      setExpenses(result.data?.data || result.data || []);
    } else {
      setError(result.error || 'Failed to load expenses');
    }
    setLoading(false);
  };

  const categories = Array.from(new Set(expenses.map(e => e.category)));
  const areas = Array.from(new Set(expenses.map(e => e.area)));

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = (expense.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (expense.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (expense.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    const matchesArea = filterArea === 'all' || expense.area === filterArea;
    return matchesSearch && matchesCategory && matchesArea;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      const result = await expensesApi.delete(id);
      if (result.success) {
        loadExpenses();
      } else {
        toast.error(result.error || 'Failed to delete expense');
      }
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading expenses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#F5514B]">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#EAF0FB]">All Expenses</h2>
        <button
          onClick={() => navigate('/expenses/add')}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[#4C8DFF]" />
            <p className="text-sm text-[#8996AD]">Total Expenses</p>
          </div>
          <p className="text-2xl font-bold text-[#EAF0FB]">Rs. {totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-[#F5514B]" />
            <p className="text-sm text-[#8996AD]">Total Areas</p>
          </div>
          <p className="text-2xl font-bold text-[#F5514B]">{areas.length}</p>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
            <input
              type="text"
              placeholder="Search by title, description, or receipt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#5C6B85]" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Areas</option>
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Title</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Area</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-semibold text-[#EAF0FB]">{expense.title || expense.name}</div>
                      <div className="text-sm text-[#8996AD]">{expense.description}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{expense.category}</td>
                  <td className="py-3 px-4 text-sm text-[#F6B93B] font-semibold">Rs. {expense.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{expense.area}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/expenses/edit/${expense.id}`)}
                        className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 text-[#8996AD] hover:text-[#F5514B] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#5C6B85]">
                    No expenses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-[#5C6B85]">
          Showing {filteredExpenses.length} of {expenses.length} expenses
        </div>
      </div>
    </div>
  );
}
