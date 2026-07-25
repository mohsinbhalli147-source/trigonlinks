import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, User, Shield, AlertCircle } from 'lucide-react';
import { staffApi } from '../services/api';

interface StaffMember {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'staff' | 'manager' | 'technician' | 'collector' | 'sales' | 'support';
  status: 'active' | 'inactive' | 'suspended' | 'on-leave';
  hire_date: string;
  salary: number;
  address: string;
  notes: string;
}

export default function StaffAdd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [staff, setStaff] = useState<StaffMember>({
    name: '',
    email: '',
    phone: '',
    role: 'technician',
    status: 'active',
    hire_date: new Date().toISOString().split('T')[0],
    salary: 0,
    address: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof StaffMember, string>>>({});

  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'technician', label: 'Technician' },
    { value: 'collector', label: 'Collector' },
    { value: 'sales', label: 'Sales' },
    { value: 'support', label: 'Support' },
    { value: 'staff', label: 'Staff' }
  ];

  const validateForm = () => {
    const newErrors: Partial<Record<keyof StaffMember, string>> = {};

    if (!staff.name.trim()) newErrors.name = 'Name is required';
    if (!staff.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(staff.email)) newErrors.email = 'Invalid email format';
    if (!staff.phone.trim()) newErrors.phone = 'Phone number is required';
    if (staff.salary < 0) newErrors.salary = 'Salary cannot be negative';
    if (!staff.hire_date) newErrors.hire_date = 'Hire date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const staffData = {
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      username: staff.email.split('@')[0], // Derive username from email
      password: staff.phone || 'Staff@123', // Default password
      role: staff.role,
      status: staff.status,
      hire_date: staff.hire_date,
      salary: staff.salary,
      address: staff.address,
      notes: staff.notes
    };

    const result = await staffApi.create(staffData);
    if (result.success) {
      navigate('/staff/all');
    } else {
      setError(result.error || 'Failed to add staff member');
      setLoading(false);
    }
  };

  const handleChange = (field: keyof StaffMember, value: string | number) => {
    setStaff(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Add Staff Member</h2>
        {error && (
          <div className="p-3 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg text-[#F5514B]">
            {error}
          </div>
        )}
        <button
          onClick={() => navigate('/staff/all')}
          className="flex items-center gap-2 px-4 py-2 bg-[#232D45] text-[#8996AD] rounded-lg hover:text-[#EAF0FB] transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={staff.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter full name"
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
                  Email *
                </label>
                <input
                  type="email"
                  value={staff.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                    errors.email ? 'border-[#F5514B]' : 'border-[#232D45]'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-[#F5514B] flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Phone Number *
                </label>
                <input
                  type="text"
                  value={staff.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="e.g., 0300-1234567"
                  className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                    errors.phone ? 'border-[#F5514B]' : 'border-[#232D45]'
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-[#F5514B] flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={staff.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Enter address"
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                />
              </div>
            </div>
          </div>

          {/* Role & Status */}
          <div className="border-t border-[#232D45] pt-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Role & Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Role *
                </label>
                <select
                  value={staff.role}
                  onChange={(e) => handleChange('role', e.target.value as any)}
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Status *
                </label>
                <select
                  value={staff.status}
                  onChange={(e) => handleChange('status', e.target.value as any)}
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="on-leave">On Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Hire Date *
                </label>
                <input
                  type="date"
                  value={staff.hire_date}
                  onChange={(e) => handleChange('hire_date', e.target.value)}
                  className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                    errors.hire_date ? 'border-[#F5514B]' : 'border-[#232D45]'
                  }`}
                />
                {errors.hire_date && (
                  <p className="mt-1 text-sm text-[#F5514B] flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.hire_date}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Salary */}
          <div className="border-t border-[#232D45] pt-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Salary Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Monthly Salary (Rs)
                </label>
                <input
                  type="number"
                  value={staff.salary}
                  onChange={(e) => handleChange('salary', parseFloat(e.target.value) || 0)}
                  placeholder="Enter monthly salary"
                  min="0"
                  className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                    errors.salary ? 'border-[#F5514B]' : 'border-[#232D45]'
                  }`}
                />
                {errors.salary && (
                  <p className="mt-1 text-sm text-[#F5514B] flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.salary}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t border-[#232D45] pt-6">
            <label className="block text-sm font-medium text-[#8996AD] mb-2">
              Notes
            </label>
            <textarea
              value={staff.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              placeholder="Add any additional notes about this staff member..."
              className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/staff/all')}
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
              {loading ? 'Adding...' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
