import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
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

export default function ComplaintsPending() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingComplaints();
  }, []);

  const fetchPendingComplaints = async () => {
    const result = await complaintsApi.getAll({ status: 'pending', limit: 100 });
    if (result.success) {
      setComplaints(result.data?.data || result.data?.complaints || []);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const result = await complaintsApi.update(id, { status: newStatus });
    if (result.success) {
      fetchPendingComplaints();
    } else {
      toast.error(result.error || 'Failed to update status');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading pending complaints...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#EAF0FB]">Pending Complaints</h1>
        <button
          onClick={() => navigate('/complaints/all')}
          className="px-4 py-2 border border-[#232D45] rounded-lg text-[#8996AD] hover:bg-[#1B2540] transition-colors flex items-center gap-2"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {complaints.map((complaint) => (
          <div key={complaint.id} className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6 hover:border-[#4C8DFF] transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#F6B93B]" />
                <span className={`font-medium ${getPriorityColor(complaint.priority)}`}>
                  {complaint.priority.toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-[#8996AD]">
                {new Date(complaint.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-2">{complaint.customerName}</h3>
            <p className="text-sm text-[#8996AD] mb-2">Category: {complaint.category}</p>
            <p className="text-sm text-[#EAF0FB] mb-4 line-clamp-2">{complaint.description}</p>

            <div className="flex gap-2">
              <button
                onClick={() => handleUpdateStatus(complaint.id, 'working')}
                className="flex-1 px-3 py-2 bg-[#4C8DFF] text-white rounded-lg hover:bg-[#3B7BD9] transition-colors text-sm flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-3 h-3" />
                Start Working
              </button>
              <button
                onClick={() => handleUpdateStatus(complaint.id, 'solved')}
                className="flex-1 px-3 py-2 bg-[#14E8B4] text-[#04231B] rounded-lg hover:bg-[#20F0C0] transition-colors text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-3 h-3" />
                Mark Solved
              </button>
            </div>
          </div>
        ))}
      </div>

      {complaints.length === 0 && (
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-12 text-center">
          <Clock className="w-12 h-12 text-[#8996AD] mx-auto mb-4" />
          <p className="text-[#8996AD]">No pending complaints</p>
        </div>
      )}
    </div>
  );
}
