import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Package, AlertCircle } from 'lucide-react';
import { inventoryApi } from '../services/api';

interface InventoryItem {
  name: string;
  sku: string;
  category: string;
  brand: string;
  unit_type: string;
  supplier: string;
  quantity: number;
  unitPrice: number;
  salePrice: number;
  location: string;
  minStockLevel: number;
  description: string;
}

export default function InventoryAdd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [item, setItem] = useState<InventoryItem>({
    name: '',
    sku: '',
    category: 'equipment',
    brand: '',
    unit_type: 'piece',
    supplier: '',
    quantity: 0,
    unitPrice: 0,
    salePrice: 0,
    location: '',
    minStockLevel: 5,
    description: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof InventoryItem, string>>>({});

  const categories = [
    { value: 'equipment', label: 'Equipment' },
    { value: 'cables', label: 'Cables & Wiring' },
    { value: 'routers', label: 'Routers & ONU' },
    { value: 'accessories', label: 'Accessories & Connectors' },
    { value: 'tools', label: 'Tools' },
    { value: 'other', label: 'Other' }
  ];

  const unitTypes = [
    { value: 'meter', label: 'Meter (m)' },
    { value: 'piece', label: 'Piece (pcs)' },
    { value: 'box', label: 'Box' },
    { value: 'roll', label: 'Roll' },
    { value: 'feet', label: 'Feet (ft)' },
    { value: 'kg', label: 'Kg' },
    { value: 'packet', label: 'Packet' }
  ];

  const validateForm = () => {
    const newErrors: Partial<Record<keyof InventoryItem, string>> = {};
    
    if (!item.name.trim()) newErrors.name = 'Item name is required';
    if (!item.sku.trim()) newErrors.sku = 'SKU is required';
    if (item.quantity < 0) newErrors.quantity = 'Quantity cannot be negative';
    if (item.unitPrice < 0) newErrors.unitPrice = 'Purchase price cannot be negative';
    if (item.salePrice < 0) newErrors.salePrice = 'Selling price cannot be negative';
    if (!item.location.trim()) newErrors.location = 'Location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const inventoryData = {
      name: item.name,
      sku: item.sku,
      category: item.category,
      brand: item.brand,
      unit_type: item.unit_type,
      supplier: item.supplier,
      qty: item.quantity,
      price: item.unitPrice,
      sale_price: item.salePrice,
      location: item.location,
      min_stock_level: item.minStockLevel,
      description: item.description
    };

    const result = await inventoryApi.create(inventoryData);
    if (result.success) {
      navigate('/inventory/all');
    } else {
      setError(result.error || 'Failed to add inventory item');
      setLoading(false);
    }
  };

  const handleChange = (field: keyof InventoryItem, value: string | number) => {
    setItem(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const unitMargin = item.salePrice - item.unitPrice;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#EAF0FB]">Add Inventory Item</h2>
          <p className="text-sm text-[#8996AD]">Define stock details, meter/unit types, purchase cost, and selling price</p>
        </div>
        {error && (
          <div className="p-3 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg text-[#F5514B]">
            {error}
          </div>
        )}
        <button
          onClick={() => navigate('/inventory/all')}
          className="flex items-center gap-2 px-4 py-2 bg-[#232D45] text-[#8996AD] rounded-lg hover:text-[#EAF0FB] transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">
                Item Name *
              </label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Fiber Optic Cable 2 Core"
                className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                  errors.name ? 'border-[#F5514B]' : 'border-[#232D45]'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-[#F5514B] flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">
                SKU / Item Code *
              </label>
              <input
                type="text"
                value={item.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                placeholder="e.g. FOC-2C-5000"
                className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                  errors.sku ? 'border-[#F5514B]' : 'border-[#232D45]'
                }`}
              />
              {errors.sku && (
                <p className="mt-1 text-sm text-[#F5514B] flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.sku}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">
                Category *
              </label>
              <select
                value={item.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">
                Brand
              </label>
              <input
                type="text"
                value={item.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                placeholder="e.g. TP-Link, Huawei, FiberHome"
                className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">
                Unit Type *
              </label>
              <select
                value={item.unit_type}
                onChange={(e) => handleChange('unit_type', e.target.value)}
                className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              >
                {unitTypes.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">
                Supplier
              </label>
              <input
                type="text"
                value={item.supplier}
                onChange={(e) => handleChange('supplier', e.target.value)}
                placeholder="e.g. Telecom Wholesale Traders"
                className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
          </div>

          {/* Stock & Costing System */}
          <div className="border-t border-[#232D45] pt-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Stock & Purchase / Selling Cost System
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Initial Quantity ({item.unit_type}s) *
                </label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                    errors.quantity ? 'border-[#F5514B]' : 'border-[#232D45]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Purchase Price / Cost (Rs) *
                </label>
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => handleChange('unitPrice', parseFloat(e.target.value) || 0)}
                  placeholder="50.00"
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                    errors.unitPrice ? 'border-[#F5514B]' : 'border-[#232D45]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Selling Price / Value (Rs) *
                </label>
                <input
                  type="number"
                  value={item.salePrice}
                  onChange={(e) => handleChange('salePrice', parseFloat(e.target.value) || 0)}
                  placeholder="80.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Location / Warehouse *
                </label>
                <input
                  type="text"
                  value={item.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Main Store Pasrur"
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                />
              </div>
            </div>
          </div>

          {/* Costing Preview */}
          <div className="border-t border-[#232D45] pt-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Live Financial Calculations</h3>
            <div className="bg-[#1B2540] border border-[#232D45] rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-[#8996AD]">Total Purchase Cost</p>
                  <p className="text-lg font-semibold text-[#4C8DFF]">
                    Rs. {(item.quantity * item.unitPrice).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[#8996AD]">Total Retail Value</p>
                  <p className="text-lg font-semibold text-[#14E8B4]">
                    Rs. {(item.quantity * item.salePrice).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[#8996AD]">Profit Margin / Unit</p>
                  <p className={`text-lg font-semibold ${unitMargin >= 0 ? 'text-[#14E8B4]' : 'text-[#F5514B]'}`}>
                    +Rs. {unitMargin.toLocaleString()}/{item.unit_type}
                  </p>
                </div>
                <div>
                  <p className="text-[#8996AD]">Total Expected Profit</p>
                  <p className="text-lg font-semibold text-[#F6B93B]">
                    Rs. {(item.quantity * unitMargin).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/inventory/all')}
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
              {loading ? 'Adding...' : 'Save Inventory Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

