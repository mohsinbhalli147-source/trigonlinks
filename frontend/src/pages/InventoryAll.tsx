import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Filter, Package, DollarSign, TrendingUp } from 'lucide-react';
import { inventoryApi } from '../services/api';
import { toast } from '../components/Toast';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  qty: number;
  price: number;
  min_stock_level: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  location: string;
  last_restocked: number;
  created_at: number;
}

export default function InventoryAll() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'equipment' | 'cables' | 'routers' | 'accessories' | 'tools' | 'other'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'price' | 'date'>('name');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    const result = await inventoryApi.getAll({ limit: 100 });
    if (result.success) {
      // Transform API data to include status based on quantity
      const itemsData = result.data?.data || result.data || [];
      const transformedItems = itemsData.map((item: any) => ({
        ...item,
        status: item.quantity === 0 ? 'out-of-stock' : item.quantity <= item.min_quantity ? 'low-stock' : 'in-stock'
      }));
      setItems(transformedItems);
    } else {
      setError(result.error || 'Failed to load inventory');
    }
    setLoading(false);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name);
      case 'quantity': return a.qty - b.qty;
      case 'price': return a.price - b.price;
      case 'date': return b.created_at - a.created_at;
      default: return 0;
    }
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
      case 'in-stock': return 'bg-[#14E8B4]/20 text-[#14E8B4]';
      case 'low-stock': return 'bg-[#F6B93B]/20 text-[#F6B93B]';
      case 'out-of-stock': return 'bg-[#F5514B]/20 text-[#F5514B]';
      default: return 'bg-[#8996AD]/20 text-[#8996AD]';
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const lowStockCount = items.filter(i => i.status === 'low-stock').length;
  const outOfStockCount = items.filter(i => i.status === 'out-of-stock').length;

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
        <h2 className="text-xl font-semibold text-[#EAF0FB]">All Inventory Items</h2>
        <button
          onClick={() => navigate('/inventory/add')}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-[#4C8DFF]" />
            <p className="text-sm text-[#8996AD]">Total Items</p>
          </div>
          <p className="text-2xl font-bold text-[#EAF0FB]">{totalItems}</p>
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
            <TrendingUp className="w-5 h-5 text-[#F6B93B]" />
            <p className="text-sm text-[#8996AD]">Low Stock</p>
          </div>
          <p className="text-2xl font-bold text-[#F6B93B]">{lowStockCount}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-[#F5514B]" />
            <p className="text-sm text-[#8996AD]">Out of Stock</p>
          </div>
          <p className="text-2xl font-bold text-[#F5514B]">{outOfStockCount}</p>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
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
              <option value="tools">Tools</option>
              <option value="other">Other</option>
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
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="name">Sort by Name</option>
              <option value="quantity">Sort by Quantity</option>
              <option value="price">Sort by Price</option>
              <option value="date">Sort by Date</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">SKU</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Quantity</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Unit Price</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Total Value</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Location</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">{item.name}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD] font-mono">{item.sku}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD] capitalize">{item.category}</td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">{item.qty}</td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">Rs. {item.price.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#F6B93B] font-semibold">Rs. {(item.qty * item.price).toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{item.location}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status === 'in-stock' ? 'In Stock' : item.status === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/inventory/edit/${item.id}`)}
                        className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-[#8996AD] hover:text-[#F5514B] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#5C6B85]">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-[#5C6B85]">
          Showing {filteredItems.length} of {items.length} items
        </div>
      </div>
    </div>
  );
}
