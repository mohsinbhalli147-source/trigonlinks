import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { inventoryApi } from '../services/api';
import { toast } from '../components/Toast';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  location: string;
  createdAt: number;
}

export default function Inventory() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'equipment' | 'cables' | 'routers' | 'accessories'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    const result = await inventoryApi.getAll();
    if (result.success) {
      const raw = result.data;
      setItems(Array.isArray(raw) ? raw : (raw?.data || []));
    } else {
      setError(result.error || 'Failed to load inventory items');
    }
    setLoading(false);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const result = await inventoryApi.delete(id);
      if (result.success) {
        loadItems();
      } else {
        toast.error(result.error || 'Failed to delete item');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-[#14E8B4]/10 text-[#14E8B4]';
      case 'low-stock': return 'bg-[#F6B93B]/10 text-[#F6B93B]';
      case 'out-of-stock': return 'bg-[#F5514B]/10 text-[#F5514B]';
      default: return 'bg-[#5C6B85]/10 text-[#5C6B85]';
    }
  };

  const [selectedAdjustItem, setSelectedAdjustItem] = useState<any>(null);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({
    type: 'out' as 'in' | 'out',
    reason: 'Damage',
    quantity: '1',
    notes: ''
  });

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdjustItem) return;

    const res = await inventoryApi.createTransaction({
      item_id: selectedAdjustItem.id,
      type: adjustData.type,
      quantity: Number(adjustData.quantity),
      reason: adjustData.reason,
      notes: adjustData.notes
    });

    if (res.success) {
      toast.success('Stock adjusted successfully');
      setAdjustModalOpen(false);
      loadItems();
    } else {
      toast.error(res.error || 'Failed to adjust stock');
    }
  };

  const totalPurchaseValue = items.reduce((sum, item: any) => sum + ((item.qty || item.quantity || 0) * (item.price || item.unitPrice || 0)), 0);
  const totalSellingValue = items.reduce((sum, item: any) => sum + ((item.qty || item.quantity || 0) * (item.sale_price || item.unitPrice || 0)), 0);
  const totalMargin = totalSellingValue - totalPurchaseValue;
  const totalItemsCount = items.reduce((sum, item: any) => sum + (item.qty || item.quantity || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading inventory...</div>
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
        <div>
          <h2 className="text-xl font-semibold text-[#EAF0FB]">ISP Inventory Management</h2>
          <p className="text-sm text-[#8996AD]">Track stock levels, meter units, cost vs retail prices, and profit margins</p>
        </div>
        <button
          onClick={() => navigate('/inventory/add')}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Inventory Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-1">Total Stock Count</p>
          <p className="text-2xl font-bold text-[#EAF0FB]">{totalItemsCount.toLocaleString()}</p>
          <p className="text-xs text-[#5C6B85] mt-1">{items.length} Unique Items</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-1">Cost Valuation (Purchase)</p>
          <p className="text-2xl font-bold text-[#4C8DFF]">Rs. {totalPurchaseValue.toLocaleString()}</p>
          <p className="text-xs text-[#5C6B85] mt-1">Total capital locked</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-1">Retail Valuation (Selling)</p>
          <p className="text-2xl font-bold text-[#14E8B4]">Rs. {totalSellingValue.toLocaleString()}</p>
          <p className="text-xs text-[#5C6B85] mt-1">Expected gross revenue</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-1">Potential Profit Margin</p>
          <p className="text-2xl font-bold text-[#F6B93B]">Rs. {totalMargin.toLocaleString()}</p>
          <p className="text-xs text-[#5C6B85] mt-1">Expected total return</p>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
            <input
              type="text"
              placeholder="Search by name, SKU, brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#5C6B85]" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Categories</option>
              <option value="equipment">Equipment</option>
              <option value="cables">Cables</option>
              <option value="routers">Routers</option>
              <option value="accessories">Accessories</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Item & SKU</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Category & Unit</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Stock Available</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Purchase Price</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Selling Price</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Unit Margin</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item: any) => {
                const qty = item.qty || item.quantity || 0;
                const costPrice = item.price || item.unitPrice || 0;
                const salePrice = item.sale_price || item.unitPrice || 0;
                const margin = salePrice - costPrice;
                const unitType = item.unit_type || 'piece';

                return (
                  <tr key={item.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50 transition-colors">
                    <td className="py-3 px-4 text-sm">
                      <div className="font-semibold text-[#EAF0FB]">{item.name}</div>
                      <div className="text-xs text-[#8996AD] font-mono">{item.sku || 'No SKU'} {item.brand ? `• ${item.brand}` : ''}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="text-[#EAF0FB] capitalize">{item.category}</span>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-[#1B2540] text-[#8996AD] border border-[#232D45] uppercase">{unitType}</span>
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-[#EAF0FB]">
                      {qty.toLocaleString()} <span className="text-xs font-normal text-[#8996AD]">{unitType}s</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#8996AD]">Rs. {costPrice.toLocaleString()}/{unitType}</td>
                    <td className="py-3 px-4 text-sm text-[#14E8B4] font-medium">Rs. {salePrice.toLocaleString()}/{unitType}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={margin >= 0 ? 'text-[#14E8B4]' : 'text-[#F5514B]'}>
                        +Rs. {margin.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status || (qty === 0 ? 'out-of-stock' : qty <= 10 ? 'low-stock' : 'in-stock'))}`}>
                        {item.status || (qty === 0 ? 'out-of-stock' : qty <= 10 ? 'low-stock' : 'in-stock')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedAdjustItem(item);
                            setAdjustModalOpen(true);
                          }}
                          className="px-2 py-1 text-xs bg-[#4C8DFF]/10 text-[#4C8DFF] border border-[#4C8DFF]/30 rounded hover:bg-[#4C8DFF]/20 transition-colors"
                        >
                          Adjust
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-[#8996AD] hover:text-[#F5514B] hover:bg-[#232D45] rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#5C6B85]">
                    No inventory items found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustModalOpen && selectedAdjustItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-[#EAF0FB]">Stock Adjustment: {selectedAdjustItem.name}</h3>
            <p className="text-xs text-[#8996AD]">Current stock: <strong>{selectedAdjustItem.qty || selectedAdjustItem.quantity || 0} {selectedAdjustItem.unit_type || 'piece'}s</strong></p>
            
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-1">Adjustment Type</label>
                <select
                  value={adjustData.type}
                  onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB]"
                >
                  <option value="out">Deduct Stock (Out)</option>
                  <option value="in">Add Stock (In)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-1">Reason</label>
                <select
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB]"
                >
                  <option value="Damage">Damage</option>
                  <option value="Lost">Lost</option>
                  <option value="Correction">Correction</option>
                  <option value="Manual Adjustment">Manual Adjustment</option>
                  <option value="Customer Usage">Customer Usage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-1">Quantity ({selectedAdjustItem.unit_type || 'piece'}s)</label>
                <input
                  type="number"
                  min="1"
                  value={adjustData.quantity}
                  onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-1">Notes</label>
                <textarea
                  value={adjustData.notes}
                  onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                  rows={2}
                  placeholder="Optional details or reference"
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 bg-[#1B2540] text-[#EAF0FB] rounded-lg hover:bg-[#232D45]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0]"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

