import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, DollarSign, AlertCircle } from 'lucide-react';
import { expensesApi } from '../services/api';

interface Expense {
  title: string;
  category: string;
  amount: number;
  date: string;
  area: string;
  description: string;
  receipt: string;
  approvedBy: string;
}

export default function ExpensesAdd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expense, setExpense] = useState<Expense>({
    title: '',
    category: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    area: '',
    description: '',
    receipt: '',
    approvedBy: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Expense, string>>>({});

  const categories = [
    'Equipment',
    'Maintenance',
    'Salaries',
    'Utilities',
    'Marketing',
    'Office Supplies',
    'Transportation',
    'Training',
    'Other'
  ];

  const areas = [
    'Sector A',
    'Sector B',
    'Sector C',
    'Model Town',
    'Daska Road',
    'Industrial Area',
    'General'
  ];

  const validateForm = () => {
    const newErrors: Partial<Record<keyof Expense, string>> = {};
    
    if (!expense.title.trim()) newErrors.title = 'Title is required';
    if (!expense.category) newErrors.category = 'Category is required';
    if (!expense.amount || expense.amount <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!expense.date) newErrors.date = 'Date is required';
    if (!expense.area) newErrors.area = 'Area is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const expenseData = {
      name: expense.title,
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      area: expense.area,
      description: expense.description,
      receipt: expense.receipt,
      approvedBy: expense.approvedBy,
      status: 'pending' as const
    };

    const result = await expensesApi.create(expenseData);
    if (result.success) {
      navigate('/expenses/all');
    } else {
      setError(result.error || 'Failed to add expense');
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Expense, value: string | number) => {
    setExpense(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Add Expense</h2>
        {error && (
          <div className="p-3 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg text-[#F5514B]">
            {error}
          </div>
        )}
        <button
          onClick={() => navigate('/expenses/all')}
          className="flex items-center gap-2 px-4 py-2 bg-[#232D45] text-[#8996AD] rounded-lg hover:text-[#EAF0FB] transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Expense Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={expense.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter expense title"
                  className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                    errors.title ? 'border-[#F5514B]' : 'border-[#232D45]'
                  }`}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-[#F5514B] flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Category *
                </label>
                <select
                  value={expense.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                    errors.category ? 'border-[#F5514B]' : 'border-[#232D45]'
                  }`}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-[#F5514B] flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.category}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Amount (Rs) *
                </label>
                <input
                  type="number"
                  value={expense.amount}
                  onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                  placeholder="Enter amount"
                  min="0"
                  className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                    errors.amount ? 'border-[#F5514B]' : 'border-[#232D45]'
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-[#F5514B] flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.amount}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={expense.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                    errors.date ? 'border-[#F5514B]' : 'border-[#232D45]'
                  }`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-[#F5514B] flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.date}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Area *
                </label>
                <select
                  value={expense.area}
                  onChange={(e) => handleChange('area', e.target.value)}
                  className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                    errors.area ? 'border-[#F5514B]' : 'border-[#232D45]'
                  }`}
                >
                  <option value="">Select area</option>
                  {areas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                {errors.area && (
                  <p className="mt-1 text-sm text-[#F5514B] flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.area}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Approved By
                </label>
                <input
                  type="text"
                  value={expense.approvedBy}
                  onChange={(e) => handleChange('approvedBy', e.target.value)}
                  placeholder="Enter approver name"
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="border-t border-[#232D45] pt-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Additional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Description
                </label>
                <textarea
                  value={expense.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  placeholder="Enter expense description..."
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Receipt/Reference Number
                </label>
                <input
                  type="text"
                  value={expense.receipt}
                  onChange={(e) => handleChange('receipt', e.target.value)}
                  placeholder="Enter receipt or reference number"
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/expenses/all')}
              className="px-6 py-3 bg-[#232D45] text-[#8996AD] rounded-lg hover:text-[#EAF0FB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
