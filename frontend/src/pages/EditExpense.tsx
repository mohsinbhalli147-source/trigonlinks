import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, MapPin, Tag, User, Save, AlertTriangle } from 'lucide-react';
import { expensesApi } from '../services/api';

interface Expense {
  id: string;
  customer_id?: string;
  customer_name?: string;
  amount: number;
  category: string;
  description: string;
  date: number;
  area?: string;
  created_at: number;
  updated_at?: number;
}

export default function EditExpense() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    amount: 0,
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    area: ''
  });

  useEffect(() => {
    loadExpense();
  }, [id]);

  const loadExpense = async () => {
    if (!id) return;
    setLoading(true);
    const result = await expensesApi.getById(id);
    if (result.success && result.data) {
      setExpense(result.data);
      setFormData({
        amount: result.data.amount || 0,
        category: result.data.category || '',
        description: result.data.description || '',
        date: result.data.date ? new Date(result.data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        area: result.data.area || ''
      });
    } else {
      setError(result.error || 'Failed to load expense');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    setError('');

    const updateData = {
      ...formData,
      date: formData.date ? new Date(formData.date).getTime() : Date.now(),
      updated_at: Date.now()
    };

    const result = await expensesApi.update(id, updateData);
    if (result.success) {
      navigate('/expenses/all');
    } else {
      setError(result.error || 'Failed to update expense');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="text-center text-[#8996AD]">Loading expense...</div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="text-center text-[#F5514B]">{error || 'Expense not found'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#232D45] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#8996AD]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#EAF0FB]">Edit Expense</h1>
            <p className="text-sm text-[#5C6B85]">Expense #{expense.id}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#14E8B4] mb-4">Expense Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Amount (Rs) *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="installation">Installation</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="repair">Repair</option>
                  <option value="equipment">Equipment</option>
                  <option value="salary">Salary</option>
                  <option value="utilities">Utilities</option>
                  <option value="rent">Rent</option>
                  <option value="marketing">Marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Area</label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#8996AD] mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              required
            />
          </div>

          {/* Customer Information (if applicable) */}
          {expense.customer_name && (
            <div className="bg-[#1B2540] rounded-lg p-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-[#8996AD]" />
                <div>
                  <p className="text-sm text-[#5C6B85]">Related Customer</p>
                  <p className="text-[#EAF0FB]">{expense.customer_name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="p-4 bg-[#F6B93B]/10 border border-[#F6B93B] rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#F6B93B]" />
              <div>
                <p className="font-medium text-[#EAF0FB]">Expense Modification</p>
                <p className="text-sm text-[#5C6B85]">Modifying expense records may affect financial reports and accounting.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg text-[#F5514B] text-sm">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-[#1B2540] text-[#EAF0FB] rounded-lg hover:bg-[#232D45] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-[#14E8B4] hover:bg-[#20F0C0] text-[#04231B] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
