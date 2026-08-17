import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { connectionsApi } from '../services/api';
import { toast } from '../components/Toast';

interface Connection {
  id: string;
  customerId?: string;
  customerName?: string;
  package: string;
  area: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed' | 'on-hold' | 'active' | 'inactive' | 'suspended';
  assignedStaff?: string;
  technicianId?: string;
  installationDate?: number;
  notes?: string;
  createdAt: number;
}

export default function Connections() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await connectionsApi.getAll({ page: 1, limit: 1000 });
      if (result.success) {
        const data = result.data;
        const dataArray = Array.isArray(data) ? data : (data?.data || []);
        setConnections(dataArray);
      } else {
        setError(result.error || 'Failed to load connections');
        setConnections([]);
      }
    } catch (err) {
      console.error('Error loading connections:', err);
      setError('Failed to load connections');
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredConnections = connections.filter(connection => {
    if (!connection) return false;
    const customerName = connection.customerName || '';
    const area = connection.area || '';
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || connection.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this connection?')) {
      const result = await connectionsApi.delete(id);
      if (result.success) {
        loadConnections();
      } else {
        toast.error(result.error || 'Failed to delete connection');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed': return 'bg-[#14E8B4]/10 text-[#14E8B4]';
      case 'approved': return 'bg-[#4C8DFF]/10 text-[#4C8DFF]';
      case 'pending': return 'bg-[#F5A623]/10 text-[#F5A623]';
      case 'in-progress': return 'bg-[#4C8DFF]/10 text-[#4C8DFF]';
      case 'on-hold': return 'bg-[#8996AD]/10 text-[#8996AD]';
      case 'inactive': return 'bg-[#5C6B85]/10 text-[#5C6B85]';
      case 'rejected': return 'bg-[#F5514B]/10 text-[#F5514B]';
      case 'suspended': return 'bg-[#F5514B]/10 text-[#F5514B]';
      default: return 'bg-[#5C6B85]/10 text-[#5C6B85]';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading connections...</div>
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
        <h2 className="text-xl font-semibold text-[#EAF0FB]">Connections</h2>
        <button
          onClick={() => navigate('/connections/add')}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Connection
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Total Connections</p>
          <p className="text-2xl font-bold text-[#EAF0FB]">{connections.length}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Pending</p>
          <p className="text-2xl font-bold text-[#F5A623]">{connections.filter(c => c.status === 'pending').length}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Approved</p>
          <p className="text-2xl font-bold text-[#4C8DFF]">{connections.filter(c => c.status === 'approved').length}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Rejected</p>
          <p className="text-2xl font-bold text-[#F5514B]">{connections.filter(c => c.status === 'rejected').length}</p>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
            <input
              type="text"
              placeholder="Search by customer, IP, or MAC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#5C6B85]" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Package</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Area</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Installation Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredConnections.map((connection) => {
                if (!connection || !connection.id) return null;
                return (
                  <tr key={connection.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                    <td className="py-3 px-4 text-sm text-[#EAF0FB]">{connection.customerName || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-[#8996AD]">{connection.package || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-[#EAF0FB]">{connection.area || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-[#8996AD]">{connection.installationDate ? new Date(connection.installationDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(connection.status || 'inactive')}`}>
                        {connection.status || 'inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/connections/edit/${connection.id}`)}
                          className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(connection.id)}
                          className="p-2 text-[#8996AD] hover:text-[#F5514B] hover:bg-[#232D45] rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredConnections.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#5C6B85]">
                    No connections found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-[#5C6B85]">
          Showing {filteredConnections.length} of {connections.length} connections
        </div>
      </div>
    </div>
  );
}
