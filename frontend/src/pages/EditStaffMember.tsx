import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, DollarSign, Calendar, Shield, Save } from 'lucide-react';
import { staffApi } from '../services/api';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  assigned_area: string;
  role: 'admin' | 'staff' | 'manager' | 'technician' | 'collector' | 'sales' | 'support';
  salary: number;
  status: 'active' | 'inactive' | 'suspended' | 'on-leave';
  hire_date: number;
  created_at: number;
  updated_at?: number;
}

export default function EditStaffMember() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    assigned_area: '',
    role: '',
    salary: 0,
    status: 'active' as 'active' | 'inactive' | 'suspended' | 'on-leave'
  });

  useEffect(() => {
    loadStaff();
  }, [id]);

  const loadStaff = async () => {
    if (!id) return;
    setLoading(true);
    const result = await staffApi.getById(id);
    if (result.success && result.data) {
      setStaff(result.data);
      setFormData({
        name: result.data.name || '',
        email: result.data.email || '',
        phone: result.data.phone || '',
        address: result.data.address || '',
        assigned_area: result.data.assigned_area || '',
        role: result.data.role || '',
        salary: result.data.salary || 0,
        status: result.data.status || 'active'
      });
    } else {
      setError(result.error || 'Failed to load staff member');
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

    const result = await staffApi.update(id, updateData);
    if (result.success) {
      navigate('/staff/all');
    } else {
      setError(result.error || 'Failed to update staff member');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="text-center text-[#8996AD]">Loading staff member...</div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="text-center text-[#F5514B]">{error || 'Staff member not found'}</div>
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
            <h1 className="text-2xl font-bold text-[#EAF0FB]">Edit Staff Member</h1>
            <p className="text-sm text-[#5C6B85]">Staff #{staff.id}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#14E8B4] mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                />
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#14E8B4] mb-4">Work Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Assigned Area</label>
                <select
                  value={formData.assigned_area}
                  onChange={(e) => setFormData({...formData, assigned_area: e.target.value})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                >
                  <option value="">Select Area</option>
                  <option value="Sector A">Sector A</option>
                  <option value="Sector B">Sector B</option>
                  <option value="Sector C">Sector C</option>
                  <option value="Sector D">Sector D</option>
                  <option value="Sector E">Sector E</option>
                  <option value="Sector F">Sector F</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="technician">Technician</option>
                  <option value="collector">Collector</option>
                  <option value="sales">Sales</option>
                  <option value="support">Support</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Salary (Rs) *</label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="on-leave">On Leave</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hire Date */}
          <div>
            <h3 className="text-lg font-semibold text-[#14E8B4] mb-4">Employment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Hire Date</label>
                <input
                  type="date"
                  value={staff.hire_date ? new Date(staff.hire_date).toISOString().split('T')[0] : ''}
                  disabled
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#8996AD] focus:outline-none focus:border-[#14E8B4] disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg text-[#F5514B] text-sm">
              <User className="w-4 h-4" />
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
