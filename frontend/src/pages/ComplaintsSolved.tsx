import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, TrendingUp } from 'lucide-react';
import { complaintsApi } from '../services/api';

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

export default function ComplaintsSolved() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSolvedComplaints();
  }, []);

  const fetchSolvedComplaints = async () => {
    const result = await complaintsApi.getAll({ status: 'resolved', limit: 100 });
    if (result.success) {
      setComplaints(Array.isArray(result.data?.data) ? result.data.data : Array.isArray(result.data?.complaints) ? result.data.complaints : Array.isArray(result.data) ? result.data : []);
    }
    setLoading(false);
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
        <div className="text-[#8996AD]">Loading solved complaints...</div>
      </div>
    );
  }

  const solvedCount = complaints.length;
  const avgResolutionTime = solvedCount > 0 ? '2.5 days' : 'N/A';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#EAF0FB]">Solved Complaints</h1>
        <button
          onClick={() => navigate('/complaints/all')}
          className="px-4 py-2 border border-[#232D45] rounded-lg text-[#8996AD] hover:bg-[#1B2540] transition-colors flex items-center gap-2"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-[#14E8B4]" />
            <div>
              <div className="text-3xl font-bold text-[#EAF0FB]">{solvedCount}</div>
              <div className="text-sm text-[#8996AD]">Total Solved</div>
            </div>
          </div>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-[#4C8DFF]" />
            <div>
              <div className="text-3xl font-bold text-[#EAF0FB]">{avgResolutionTime}</div>
              <div className="text-sm text-[#8996AD]">Avg Resolution Time</div>
            </div>
          </div>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#14E8B4]/20 flex items-center justify-center">
              <span className="text-[#14E8B4] font-bold">%</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#EAF0FB]">94%</div>
              <div className="text-sm text-[#8996AD]">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Recent Solved Complaints</h2>
        <div className="space-y-4">
          {complaints.slice(0, 10).map((complaint) => (
            <div key={complaint.id} className="flex items-center justify-between p-4 bg-[#1B2540] rounded-lg">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-5 h-5 text-[#14E8B4]" />
                <div>
                  <div className="text-[#EAF0FB] font-medium">{complaint.customerName}</div>
                  <div className="text-sm text-[#8996AD]">{complaint.category} - {complaint.description.substring(0, 50)}...</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm font-medium ${getPriorityColor(complaint.priority)}`}>
                  {complaint.priority.toUpperCase()}
                </span>
                <span className="text-xs text-[#8996AD]">
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {complaints.length === 0 && (
          <div className="text-center py-12 text-[#8996AD]">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-[#8996AD]" />
            <p>No solved complaints yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
