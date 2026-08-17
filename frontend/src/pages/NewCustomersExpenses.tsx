import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { connectionsApi, newCustomersApi } from '../services/api';

interface Expense {
  id: string;
  customer_id: string;
  name: string;
  title: string;
  category: string;
  description: string;
  amount: number;
  date: number;
  created_at: number;
  __synthetic?: boolean;
}

export default function NewCustomersExpenses() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    setError('');

    // 1) Try the dedicated expenses endpoint first.
    const result = await newCustomersApi.getExpenses();
    let rows: Expense[] = result.success
      ? (result.data?.data || result.data || [])
      : [];

    // 2) Fallback: the relational connection_expenses table is empty for
    // legacy data, so if the endpoint returned nothing, flatten the
    // JSONB `expenses` array embedded on each connection record instead.
    if (rows.length === 0) {
      const connRes = await connectionsApi.getAll({ limit: 500 });
      if (connRes.success) {
        const data = connRes.data;
        const conns = Array.isArray(data) ? data : (data?.data || []);
        rows = conns.flatMap((conn: any) => {
          const arr = Array.isArray(conn.expenses) ? conn.expenses : [];
          return arr.map((exp: any, idx: number) => ({
            id: `${conn.id}-${idx}`,
            customer_id: conn.id,
            name: conn.customerName || conn.customer_name || '',
            title: exp.category || exp.title || '',
            category: exp.category || '',
            description: exp.description || '',
            amount: Number(exp.amount) || 0,
            date: conn.createdAt || conn.created_at || Date.now(),
            created_at: conn.createdAt || conn.created_at || Date.now(),
            __synthetic: true,
          }));
        });
      } else if (!result.success) {
        setError(connRes.error || 'Unable to load expenses.');
      }
    }

    setExpenses(rows);
    setLoading(false);
  };

  const filteredExpenses = expenses.filter(expense => {
    return (expense.name?.toLowerCase() || expense.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
           (expense.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
  });

  const handleDelete = async (expense: Expense) => {
    if (expense.__synthetic) {
      alert('This expense is managed on its connection. Edit it from the Approved Connections page.');
      return;
    }
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      await newCustomersApi.deleteExpense(expense.id);
      setExpenses((prev) => prev.filter(e => e.id !== expense.id));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to delete expense.');
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

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
        <h2 className="text-xl font-semibold text-[#EAF0FB]">New Customer Expenses</h2>
        <button
          onClick={() => navigate('/new-customers/expenses/add')}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Total Expenses</p>
          <p className="text-2xl font-bold text-[#EAF0FB]">Rs. {totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Total Records</p>
          <p className="text-2xl font-bold text-[#EAF0FB]">{expenses.length}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">This Month</p>
          <p className="text-2xl font-bold text-[#14E8B4]">Rs. {totalExpenses.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
          <input
            type="text"
            placeholder="Search by customer or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Description</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Amount</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">{expense.name || expense.title}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{expense.description}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">Rs. {expense.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => expense.__synthetic && expense.customer_id ? navigate(`/connections/${expense.customer_id}`) : undefined}
                        className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors"
                        title={expense.__synthetic ? 'View connection' : 'Edit expense'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        className="p-2 text-[#8996AD] hover:text-[#F5514B] hover:bg-[#232D45] rounded-lg transition-colors"
                        title={expense.__synthetic ? 'Managed on connection' : 'Delete expense'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#5C6B85]">
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
