import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, DollarSign, Save, AlertTriangle } from 'lucide-react';
import { areasApi } from '../services/api';

interface Area {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  customer_count: number;
  revenue: number;
  created_at: number;
  updated_at?: number;
}

export default function EditArea() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [area, setArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    loadArea();
  }, [id]);

  const loadArea = async () => {
    if (!id) return;
    setLoading(true);
    const result = await areasApi.getById(id);
    if (result.success && result.data) {
      setArea(result.data);
      setFormData({
        name: result.data.name || '',
        status: result.data.status || 'active'
      });
    } else {
      setError(result.error || 'Failed to load area');
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

    const result = await areasApi.update(id, updateData);
    if (result.success) {
      navigate('/areas/all');
    } else {
      setError(result.error || 'Failed to update area');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="text-center text-[#8996AD]">Loading area...</div>
      </div>
    );
  }

  if (error || !area) {
    return (
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="text-center text-[#F5514B]">{error || 'Area not found'}</div>
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
            <h1 className="text-2xl font-bold text-[#EAF0FB]">Edit Area</h1>
            <p className="text-sm text-[#5C6B85]">Area #{area.id}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#14E8B4] mb-4">Area Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Area Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h3 className="text-lg font-semibold text-[#14E8B4] mb-4">Area Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1B2540] rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#8996AD]" />
                  <div>
                    <p className="text-sm text-[#5C6B85]">Customer Count</p>
                    <p className="text-[#EAF0FB] font-semibold">{area.customer_count || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1B2540] rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-[#8996AD]" />
                  <div>
                    <p className="text-sm text-[#5C6B85]">Total Revenue</p>
                    <p className="text-[#14E8B4] font-semibold">Rs. {area.revenue?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          {area.customer_count > 0 && (
            <div className="p-4 bg-[#F6B93B]/10 border border-[#F6B93B] rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-[#F6B93B]" />
                <div>
                  <p className="font-medium text-[#EAF0FB]">Area has customers</p>
                  <p className="text-sm text-[#5C6B85]">This area has {area.customer_count} customer(s). Changing the name may affect customer records.</p>
                </div>
              </div>
            </div>
          )}

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
