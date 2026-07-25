import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, DollarSign, Download, RefreshCw } from 'lucide-react';
import { inventoryApi } from '../services/api';
import { toast } from '../components/Toast';
import EmptyState from '../components/EmptyState';

const COLORS = ['#14E8B4', '#4C8DFF', '#F6B93B', '#F5514B', '#8996AD'];

export default function InventoryReports() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    const result = await inventoryApi.getAll({ limit: 500 });
    if (result.success) {
      setItems(result.data?.data || []);
    } else {
      setError(result.error || 'Failed to load inventory');
      toast.error('Failed to load inventory reports');
    }
    setLoading(false);
  };

  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean)));

  const filtered = filterCategory === 'all'
    ? items
    : items.filter(i => i.category === filterCategory);

  // Category distribution for pie
  const categoryDist = categories.map(cat => ({
    name: cat,
    value: items.filter(i => i.category === cat).reduce((sum, i) => sum + (Number(i.qty) || 0), 0),
  })).filter(c => c.value > 0);

  // Stock movement bar data
  const chartData = filtered.slice(0, 10).map(item => ({
    name: (item.name || item.itemName || 'Unknown').substring(0, 12),
    qty: Number(item.qty) || 0,
    minStock: Number(item.minStock) || 0,
  }));

  const totalItems = filtered.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
  const totalValue = filtered.reduce((sum, i) => sum + ((Number(i.qty) || 0) * (Number(i.price) || 0)), 0);
  const lowStockCount = filtered.filter(i => (Number(i.qty) || 0) <= (Number(i.minStock) || 0)).length;

  const handleExport = () => {
    toast.info('Export feature coming soon');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#4C8DFF] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8996AD] text-sm">Loading inventory reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <EmptyState title="Failed to Load" message={error} icon="error" onRetry={loadReports} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Inventory Reports</h2>
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

      {/* Category Filter */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#8996AD]">Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] text-sm focus:outline-none focus:border-[#14E8B4]"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-[#4C8DFF]" />
            <p className="text-sm text-[#8996AD]">Total Items</p>
          </div>
          <p className="text-2xl font-bold text-[#EAF0FB]">{filtered.length}</p>
          <p className="text-sm text-[#8996AD] mt-1">{totalItems} units in stock</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-[#14E8B4]" />
            <p className="text-sm text-[#8996AD]">Categories</p>
          </div>
          <p className="text-2xl font-bold text-[#14E8B4]">{categories.length}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[#F6B93B]" />
            <p className="text-sm text-[#8996AD]">Total Value</p>
          </div>
          <p className="text-2xl font-bold text-[#F6B93B]">Rs. {totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-[#F5514B]" />
            <p className="text-sm text-[#8996AD]">Low Stock Alerts</p>
          </div>
          <p className="text-2xl font-bold text-[#F5514B]">{lowStockCount}</p>
          <p className="text-sm text-[#8996AD] mt-1">Below min. stock</p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No Inventory Data"
          message="No inventory items found. Add items to see reports."
          onRetry={loadReports}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartData.length > 0 && (
              <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Stock Levels (Top 10)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
                    <XAxis dataKey="name" stroke="#8996AD" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#8996AD" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1B2540', border: '1px solid #232D45' }}
                      itemStyle={{ color: '#EAF0FB' }}
                    />
                    <Bar dataKey="qty" fill="#14E8B4" name="Current Stock" />
                    <Bar dataKey="minStock" fill="#F5514B" name="Min Stock" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {categoryDist.length > 0 && (
              <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Category Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryDist}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryDist.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1B2540', border: '1px solid #232D45' }}
                      itemStyle={{ color: '#EAF0FB' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Detailed Inventory Table */}
          <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">
              Inventory Detail ({filtered.length} items)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#232D45]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Item</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">SKU</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">In Stock</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Min Stock</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Unit Price</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Total Value</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const qty = Number(item.qty) || 0;
                    const minStock = Number(item.minStock) || 0;
                    const price = Number(item.price) || 0;
                    const isLow = qty <= minStock;
                    const isOut = qty === 0;
                    return (
                      <tr key={item.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                        <td className="py-3 px-4 text-sm text-[#EAF0FB] font-medium">{item.name || item.itemName}</td>
                        <td className="py-3 px-4 text-sm text-[#8996AD] font-mono">{item.sku || '—'}</td>
                        <td className="py-3 px-4 text-sm text-[#8996AD] capitalize">{item.category || '—'}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-[#EAF0FB]">{qty}</td>
                        <td className="py-3 px-4 text-sm text-[#8996AD]">{minStock}</td>
                        <td className="py-3 px-4 text-sm text-[#8996AD]">Rs. {price.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-[#F6B93B] font-semibold">Rs. {(qty * price).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isOut ? 'bg-[#F5514B]/20 text-[#F5514B]'
                            : isLow ? 'bg-[#F6B93B]/20 text-[#F6B93B]'
                            : 'bg-[#14E8B4]/20 text-[#14E8B4]'
                          }`}>
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
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
