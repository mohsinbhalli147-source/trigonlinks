import { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { expensesApi } from '../services/api';
import { toast } from '../components/Toast';

interface Category {
  id: string;
  name: string;
  description: string;
  budget: number;
  spent: number;
  color: string;
}

export default function ExpensesCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    description: '',
    budget: 0,
    color: '#4C8DFF'
  });

  const colors = ['#4C8DFF', '#14E8B4', '#F6B93B', '#F5514B', '#8996AD', '#9B59B6', '#3498DB', '#1ABC9C'];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    const result = await expensesApi.getCategories({ limit: 100 });
    if (result.success) {
      setCategories(result.data?.data || result.data || []);
    } else {
      setError(result.error || 'Unable to load categories.');
    }
    setLoading(false);
  };

  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.budget) {
      toast.warning('Please fill in all required fields');
      return;
    }

    const name = newCategory.name?.trim() || '';
    const description = newCategory.description || '';
    const budget = Number(newCategory.budget || 0);
    const color = newCategory.color || '#4C8DFF';

    const result = await expensesApi.createCategory({
      name,
      description,
      budget,
      spent: 0,
      color,
    });

    if (result.success) {
      const newItem: Category = {
        id: result.data?.id || Date.now().toString(),
        name,
        description,
        budget,
        spent: 0,
        color,
      };
      setCategories((prev) => [newItem, ...prev]);
      setNewCategory({
        name: '',
        description: '',
        budget: 0,
        color: '#4C8DFF'
      });
      setShowAddForm(false);
      toast.success('Category added successfully');
    } else {
      toast.error(result.error || 'Failed to add category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    const result = await expensesApi.deleteCategory(id);
    if (result.success) {
      setCategories((prev) => prev.filter(c => c.id !== id));
      toast.success('Category deleted successfully');
    } else {
      toast.error(result.error || 'Unable to delete category.');
    }
  };

  const getBudgetStatus = (category: Category) => {
    const percentage = (category.spent / category.budget) * 100;
    if (percentage >= 90) return { status: 'critical', color: 'bg-[#F5514B]' };
    if (percentage >= 70) return { status: 'warning', color: 'bg-[#F6B93B]' };
    return { status: 'good', color: 'bg-[#14E8B4]' };
  };

  const totalBudget = categories.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const remainingBudget = totalBudget - totalSpent;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading categories...</div>
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
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Expense Categories</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[#4C8DFF]" />
            <p className="text-sm text-[#8996AD]">Total Budget</p>
          </div>
          <p className="text-2xl font-bold text-[#EAF0FB]">Rs. {totalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-[#F5514B]" />
            <p className="text-sm text-[#8996AD]">Total Spent</p>
          </div>
          <p className="text-2xl font-bold text-[#F5514B]">Rs. {totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[#14E8B4]" />
            <p className="text-sm text-[#8996AD]">Remaining</p>
          </div>
          <p className="text-2xl font-bold text-[#14E8B4]">Rs. {remainingBudget.toLocaleString()}</p>
        </div>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Add New Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Category Name *</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g., Equipment"
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Monthly Budget (Rs) *</label>
              <input
                type="number"
                value={newCategory.budget}
                onChange={(e) => setNewCategory({ ...newCategory, budget: parseFloat(e.target.value) || 0 })}
                placeholder="10000"
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Description</label>
              <input
                type="text"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Category description"
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Color</label>
              <div className="flex gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewCategory({ ...newCategory, color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newCategory.color === color ? 'border-[#EAF0FB]' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddCategory}
                className="w-full px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const budgetStatus = getBudgetStatus(category);
          const percentage = Math.round((category.spent / category.budget) * 100);

          return (
            <div key={category.id} className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6 hover:border-[#4C8DFF] transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: category.color }} />
                  <div>
                    <h3 className="font-semibold text-[#EAF0FB]">{category.name}</h3>
                    <p className="text-sm text-[#8996AD]">{category.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-2 text-[#8996AD] hover:text-[#F5514B] hover:bg-[#232D45] rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#8996AD]">Budget Used</span>
                    <span className="text-[#EAF0FB]">{percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#232D45] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${budgetStatus.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[#8996AD]">Budget</p>
                    <p className="text-lg font-semibold text-[#EAF0FB]">Rs. {category.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#8996AD]">Spent</p>
                    <p className="text-lg font-semibold text-[#F5514B]">Rs. {category.spent.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-[#8996AD]">Remaining</p>
                  <p className="text-lg font-semibold text-[#14E8B4]">Rs. {(category.budget - category.spent).toLocaleString()}</p>
                </div>

                {budgetStatus.status === 'critical' && (
                  <div className="flex items-start gap-2 p-2 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg">
                    <AlertCircle className="w-4 h-4 text-[#F5514B] mt-0.5" />
                    <p className="text-xs text-[#F5514B]">Budget nearly exhausted</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
