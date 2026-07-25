import { useState, useEffect } from 'react';
import { AlertTriangle, Search, Filter, Package, MapPin, TrendingDown, Bell } from 'lucide-react';
import { inventoryApi } from '../services/api';

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  unitPrice: number;
  location: string;
  lastRestocked: string;
  status: 'critical' | 'low' | 'out-of-stock';
  monthlyUsage: number;
  estimatedDaysUntilEmpty: number;
}

export default function InventoryAlerts() {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'equipment' | 'cables' | 'routers' | 'accessories'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'critical' | 'low' | 'out-of-stock'>('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    setError('');
    const result = await inventoryApi.getAlerts();
    if (result.success) {
      setItems(result.data || []);
    } else {
      setError(result.error || 'Unable to load inventory alerts.');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-[#F5514B]/20 text-[#F5514B]';
      case 'low': return 'bg-[#F6B93B]/20 text-[#F6B93B]';
      case 'out-of-stock': return 'bg-[#8996AD]/20 text-[#8996AD]';
      default: return 'bg-[#5C6B85]/10 text-[#5C6B85]';
    }
  };

  const getStatusBorder = (status: string) => {
    switch (status) {
      case 'critical': return 'border-l-4 border-l-[#F5514B]';
      case 'low': return 'border-l-4 border-l-[#F6B93B]';
      case 'out-of-stock': return 'border-l-4 border-l-[#8996AD]';
      default: return 'border-l-4 border-l-[#5C6B85]';
    }
  };

  const totalCritical = items.filter(i => i.status === 'critical').length;
  const totalLow = items.filter(i => i.status === 'low').length;
  const totalOutOfStock = items.filter(i => i.status === 'out-of-stock').length;
  const totalValueNeeded = items.reduce((sum, item) => {
    const needed = item.minStockLevel - item.currentStock;
    return sum + (needed > 0 ? needed * item.unitPrice : 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading inventory alerts...</div>
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
        <h2 className="text-2xl font-bold text-[#EAF0FB] flex items-center gap-2">
          <Bell className="w-6 h-6 text-[#F6B93B]" />
          Low Stock Alerts
        </h2>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-[#F5514B]" />
            <p className="text-sm text-[#8996AD]">Critical</p>
          </div>
          <p className="text-2xl font-bold text-[#F5514B]">{totalCritical}</p>
          <p className="text-xs text-[#8996AD] mt-1">Immediate action required</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-[#F6B93B]" />
            <p className="text-sm text-[#8996AD]">Low Stock</p>
          </div>
          <p className="text-2xl font-bold text-[#F6B93B]">{totalLow}</p>
          <p className="text-xs text-[#8996AD] mt-1">Plan to reorder soon</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-[#8996AD]" />
            <p className="text-sm text-[#8996AD]">Out of Stock</p>
          </div>
          <p className="text-2xl font-bold text-[#8996AD]">{totalOutOfStock}</p>
          <p className="text-xs text-[#8996AD] mt-1">Currently unavailable</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-[#4C8DFF]" />
            <p className="text-sm text-[#8996AD]">Value to Restock</p>
          </div>
          <p className="text-2xl font-bold text-[#4C8DFF]">Rs. {totalValueNeeded.toLocaleString()}</p>
          <p className="text-xs text-[#8996AD] mt-1">Estimated cost</p>
        </div>
      </div>

      {/* Filters */}
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
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Status</option>
              <option value="critical">Critical</option>
              <option value="low">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Alert Cards */}
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className={`bg-[#1B2540] border border-[#232D45] rounded-lg p-4 ${getStatusBorder(item.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-[#EAF0FB]">{item.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status === 'critical' ? 'Critical' : item.status === 'low' ? 'Low Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#8996AD]">
                    <span className="font-mono">{item.sku}</span>
                    <span>•</span>
                    <span className="capitalize">{item.category}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {item.location}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#EAF0FB]">{item.currentStock}</p>
                  <p className="text-xs text-[#8996AD]">/ {item.minStockLevel} min</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-[#8996AD] mb-1">Unit Price</p>
                  <p className="font-semibold text-[#EAF0FB]">Rs. {item.unitPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[#8996AD] mb-1">Needed to Restock</p>
                  <p className="font-semibold text-[#14E8B4]">
                    {item.minStockLevel - item.currentStock > 0 ? item.minStockLevel - item.currentStock : 0} units
                  </p>
                </div>
                <div>
                  <p className="text-[#8996AD] mb-1">Cost to Restock</p>
                  <p className="font-semibold text-[#4C8DFF]">
                    Rs. {((item.minStockLevel - item.currentStock) * item.unitPrice).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[#8996AD] mb-1">Est. Days Until Empty</p>
                  <p className={`font-semibold ${
                    item.estimatedDaysUntilEmpty <= 3 ? 'text-[#F5514B]' : 
                    item.estimatedDaysUntilEmpty <= 7 ? 'text-[#F6B93B]' : 
                    'text-[#14E8B4]'
                  }`}>
                    {item.estimatedDaysUntilEmpty} days
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#232D45] flex items-center justify-between text-sm">
                <div className="text-[#8996AD]">
                  <span>Last restocked: {item.lastRestocked}</span>
                  <span className="mx-2">•</span>
                  <span>Monthly usage: {item.monthlyUsage} units</span>
                </div>
                <button className="px-4 py-2 bg-[#14E8B4]/20 text-[#14E8B4] rounded-lg hover:bg-[#14E8B4]/30 transition-colors text-sm font-medium">
                  Create Purchase Order
                </button>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-[#5C6B85]">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No low stock alerts found</p>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-[#5C6B85]">
          Showing {filteredItems.length} of {items.length} items with low stock alerts
        </div>
      </div>
    </div>
  );
}
