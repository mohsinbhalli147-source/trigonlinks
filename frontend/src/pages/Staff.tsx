import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { staffApi } from '../services/api';
import { toast } from '../components/Toast';

interface Staff {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'admin' | 'technician' | 'sales' | 'support';
  status: 'active' | 'inactive';
  joinedDate: string;
  createdAt: number;
}

export default function Staff() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'technician' | 'sales' | 'support'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    setError('');
    const result = await staffApi.getAll();
    if (result.success) {
      const raw = result.data;
      setStaff(Array.isArray(raw) ? raw : (raw?.data || []));
    } else {
      setError(result.error || 'Failed to load staff');
    }
    setLoading(false);
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.mobile.includes(searchTerm);
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      const result = await staffApi.delete(id);
      if (result.success) {
        loadStaff();
      } else {
        toast.error(result.error || 'Failed to delete staff member');
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-[#F5514B]/10 text-[#F5514B]';
      case 'technician': return 'bg-[#4C8DFF]/10 text-[#4C8DFF]';
      case 'sales': return 'bg-[#14E8B4]/10 text-[#14E8B4]';
      case 'support': return 'bg-[#F6B93B]/10 text-[#F6B93B]';
      default: return 'bg-[#5C6B85]/10 text-[#5C6B85]';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#14E8B4]/10 text-[#14E8B4]';
      case 'inactive': return 'bg-[#5C6B85]/10 text-[#5C6B85]';
      default: return 'bg-[#5C6B85]/10 text-[#5C6B85]';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading staff...</div>
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
        <h2 className="text-xl font-semibold text-[#EAF0FB]">Staff Management</h2>
        <button
          onClick={() => navigate('/staff/add')}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Total Staff</p>
          <p className="text-2xl font-bold text-[#EAF0FB]">{staff.length}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Active</p>
          <p className="text-2xl font-bold text-[#14E8B4]">{staff.filter(s => s.status === 'active').length}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Inactive</p>
          <p className="text-2xl font-bold text-[#5C6B85]">{staff.filter(s => s.status === 'inactive').length}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Admins</p>
          <p className="text-2xl font-bold text-[#F5514B]">{staff.filter(s => s.role === 'admin').length}</p>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
            <input
              type="text"
              placeholder="Search by name, email, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#5C6B85]" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="technician">Technician</option>
              <option value="sales">Sales</option>
              <option value="support">Support</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Mobile</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Joined Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((member) => (
                <tr key={member.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">{member.name}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{member.email}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{member.mobile}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{member.joinedDate}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(member.id)}
                        className="p-2 text-[#8996AD] hover:text-[#F5514B] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5C6B85]">
                    No staff members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-[#5C6B85]">
          Showing {filteredStaff.length} of {staff.length} staff members
        </div>
      </div>
    </div>
  );
}
