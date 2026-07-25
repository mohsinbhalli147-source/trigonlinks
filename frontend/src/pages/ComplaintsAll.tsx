import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { complaintsApi } from '../services/api';
import { toast } from '../components/Toast';

interface Complaint {
  id: string;
  customerId: string;
  customerName: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  assignedTo?: string;
  createdAt: number;
}

export default function ComplaintsAll() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    const result = await complaintsApi.getAll({ limit: 200 });
    if (result.success) {
      setComplaints(result.data?.data || []);
    }
    setLoading(false);
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesFilter = filter === 'all' || complaint.status === filter;
    const matchesSearch = !search ||
      complaint.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      complaint.category?.toLowerCase().includes(search.toLowerCase()) ||
      complaint.description?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-[#F6B93B]" />;
      case 'working': return <AlertCircle className="w-4 h-4 text-[#4C8DFF]" />;
      case 'solved': return <CheckCircle className="w-4 h-4 text-[#14E8B4]" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-[#F5514B]" />;
      default: return <Clock className="w-4 h-4 text-[#8996AD]" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-[#14E8B4]';
      case 'medium': return 'text-[#F6B93B]';
      case 'high': return 'text-[#F5514B]';
      case 'urgent': return 'text-[#FF0000]';
      default: return 'text-[#8996AD]';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this complaint?')) return;

    const result = await complaintsApi.delete(id);
    if (result.success) {
      fetchComplaints();
    } else {
      toast.error(result.error || 'Failed to delete complaint');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading complaints...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#EAF0FB]">All Complaints</h1>
        <button
          onClick={() => navigate('/complaints/add')}
          className="px-4 py-2 bg-[#4C8DFF] text-white rounded-lg hover:bg-[#3B7BD9] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Complaint
        </button>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8996AD]" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg pl-10 pr-4 py-2 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-[#4C8DFF] text-white' : 'bg-[#1B2540] text-[#8996AD] hover:bg-[#232D45]'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'pending' ? 'bg-[#F6B93B] text-[#0A0F1C]' : 'bg-[#1B2540] text-[#8996AD] hover:bg-[#232D45]'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('working')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'working' ? 'bg-[#4C8DFF] text-white' : 'bg-[#1B2540] text-[#8996AD] hover:bg-[#232D45]'}`}
            >
              Working
            </button>
            <button
              onClick={() => setFilter('solved')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'solved' ? 'bg-[#14E8B4] text-[#04231B]' : 'bg-[#1B2540] text-[#8996AD] hover:bg-[#232D45]'}`}
            >
              Solved
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left text-[#8996AD] pb-3 font-medium">Customer</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Category</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Priority</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Status</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Date</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((complaint) => (
                <tr key={complaint.id} className="border-b border-[#232D45] hover:bg-[#1B2540]">
                  <td className="py-4">
                    <div className="text-[#EAF0FB] font-medium">{complaint.customerName}</div>
                    <div className="text-xs text-[#8996AD]">ID: {complaint.customerId}</div>
                  </td>
                  <td className="py-4 text-[#EAF0FB]">{complaint.category}</td>
                  <td className="py-4">
                    <span className={`font-medium ${getPriorityColor(complaint.priority)}`}>
                      {complaint.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(complaint.status)}
                      <span className="text-[#EAF0FB] capitalize">{complaint.status}</span>
                    </div>
                  </td>
                  <td className="py-4 text-[#8996AD]">
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/complaints/${complaint.id}`)}
                        className="p-2 hover:bg-[#232D45] rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-[#8996AD]" />
                      </button>
                      <button
                        onClick={() => handleDelete(complaint.id)}
                        className="p-2 hover:bg-[#232D45] rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-[#F5514B]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredComplaints.length === 0 && (
            <div className="text-center py-12 text-[#8996AD]">
              No complaints found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
