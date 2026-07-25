import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, DollarSign, AlertTriangle, Box, Save } from 'lucide-react';
import { inventoryApi } from '../services/api';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  min_quantity: number;
  unit: string;
  unit_price: number;
  location: string;
  supplier: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  created_at: number;
  updated_at?: number;
}

export default function EditInventoryItem() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    min_quantity: 0,
    unit: '',
    unit_price: 0,
    location: '',
    supplier: ''
  });

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    if (!id) return;
    setLoading(true);
    const result = await inventoryApi.getById(id);
    if (result.success && result.data) {
      setItem(result.data);
      setFormData({
        name: result.data.name || '',
        category: result.data.category || '',
        quantity: result.data.quantity || 0,
        min_quantity: result.data.min_quantity || 0,
        unit: result.data.unit || '',
        unit_price: result.data.unit_price || 0,
        location: result.data.location || '',
        supplier: result.data.supplier || ''
      });
    } else {
      setError(result.error || 'Failed to load inventory item');
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
      updated_at: Date.now()
    };

    const result = await inventoryApi.update(id, updateData);
    if (result.success) {
      navigate('/inventory/all');
    } else {
      setError(result.error || 'Failed to update inventory item');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="text-center text-[#8996AD]">Loading inventory item...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="text-center text-[#F5514B]">{error || 'Inventory item not found'}</div>
      </div>
    );
  }

  const isLowStock = formData.quantity <= formData.min_quantity;

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
            <h1 className="text-2xl font-bold text-[#EAF0FB]">Edit Inventory Item</h1>
            <p className="text-sm text-[#5C6B85]">Item #{item.id}</p>
          </div>
        </div>
        {isLowStock && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#F6B93B]/10 border border-[#F6B93B] rounded-full">
            <AlertTriangle className="w-4 h-4 text-[#F6B93B]" />
            <span className="text-sm font-medium text-[#F6B93B]">Low Stock</span>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#14E8B4] mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                  <option value="equipment">Equipment</option>
                  <option value="cables">Cables</option>
                  <option value="connectors">Connectors</option>
                  <option value="tools">Tools</option>
                  <option value="materials">Materials</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#14E8B4] mb-4">Stock Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Quantity *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Minimum Quantity *</label>
                <input
                  type="number"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({...formData, min_quantity: Number(e.target.value)})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Unit *</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  placeholder="e.g., pcs, meters, kg"
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#14E8B4] mb-4">Pricing Information</h3>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Unit Price (Rs) *</label>
              <input
                type="number"
                value={formData.unit_price}
                onChange={(e) => setFormData({...formData, unit_price: Number(e.target.value)})}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                required
              />
            </div>
          </div>

          {/* Location & Supplier */}
          <div>
            <h3 className="text-lg font-semibold text-[#14E8B4] mb-4">Location & Supplier</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Storage Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., Warehouse A, Shelf 1"
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  placeholder="Supplier name"
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                />
              </div>
            </div>
          </div>

          {/* Stock Status Indicator */}
          <div className={`p-4 rounded-lg ${isLowStock ? 'bg-[#F6B93B]/10 border border-[#F6B93B]' : 'bg-[#14E8B4]/10 border border-[#14E8B4]'}`}>
            <div className="flex items-center gap-3">
              {isLowStock ? <AlertTriangle className="w-5 h-5 text-[#F6B93B]" /> : <Box className="w-5 h-5 text-[#14E8B4]" />}
              <div>
                <p className="font-medium text-[#EAF0FB]">Stock Status</p>
                <p className="text-sm text-[#5C6B85]">
                  {isLowStock 
                    ? `Low stock: ${formData.quantity} ${formData.unit} (minimum: ${formData.min_quantity} ${formData.unit})`
                    : `In stock: ${formData.quantity} ${formData.unit}`
                  }
                </p>
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
