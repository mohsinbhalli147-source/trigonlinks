import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { complaintsApi } from '../services/api';

interface ComplaintStats {
  total: number;
  pending: number;
  working: number;
  solved: number;
  rejected: number;
}

export default function ComplaintsReports() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ComplaintStats>({
    total: 0,
    pending: 0,
    working: 0,
    solved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaintStats();
  }, []);

  const fetchComplaintStats = async () => {
    try {
      const result = await complaintsApi.getAll();
      if (result.success) {
        const complaints = Array.isArray(result.data) ? result.data : [];
        
        setStats({
          total: complaints.length,
          pending: complaints.filter((c: any) => c.status === 'pending').length,
          working: complaints.filter((c: any) => c.status === 'working').length,
          solved: complaints.filter((c: any) => c.status === 'solved').length,
          rejected: complaints.filter((c: any) => c.status === 'rejected').length,
        });
      }
    } catch (error) {
      console.error('Error fetching complaint stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { name: 'Total Complaints', value: stats.total, icon: BarChart3, color: 'text-[#4C8DFF]' },
    { name: 'Pending', value: stats.pending, icon: Clock, color: 'text-[#F6B93B]' },
    { name: 'In Progress', value: stats.working, icon: AlertCircle, color: 'text-[#4C8DFF]' },
    { name: 'Solved', value: stats.solved, icon: CheckCircle, color: 'text-[#14E8B4]' },
    { name: 'Rejected', value: stats.rejected, icon: AlertCircle, color: 'text-[#F5514B]' },
  ];

  const resolutionRate = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;
  const avgResponseTime = '2.3 hours';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading complaint reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#EAF0FB]">Complaint Reports</h1>
        <button
          onClick={() => navigate('/complaints/all')}
          className="px-4 py-2 border border-[#232D45] rounded-lg text-[#8996AD] hover:bg-[#1B2540] transition-colors flex items-center gap-2"
        >
          View All Complaints
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
              <div className="text-sm text-[#8996AD]">{stat.name}</div>
            </div>
            <div className="text-3xl font-bold text-[#EAF0FB]">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Resolution Performance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#8996AD]">Resolution Rate</span>
              <span className="text-2xl font-bold text-[#14E8B4]">{resolutionRate}%</span>
            </div>
            <div className="w-full bg-[#1B2540] rounded-full h-2">
              <div 
                className="bg-[#14E8B4] h-2 rounded-full transition-all"
                style={{ width: `${resolutionRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8996AD]">Avg Response Time</span>
              <span className="text-2xl font-bold text-[#4C8DFF]">{avgResponseTime}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Status Distribution</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#F6B93B]" />
              <span className="text-[#8996AD]">Pending</span>
              <span className="ml-auto text-[#EAF0FB] font-medium">{stats.pending}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#4C8DFF]" />
              <span className="text-[#8996AD]">In Progress</span>
              <span className="ml-auto text-[#EAF0FB] font-medium">{stats.working}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#14E8B4]" />
              <span className="text-[#8996AD]">Solved</span>
              <span className="ml-auto text-[#EAF0FB] font-medium">{stats.solved}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#F5514B]" />
              <span className="text-[#8996AD]">Rejected</span>
              <span className="ml-auto text-[#EAF0FB] font-medium">{stats.rejected}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/complaints/add')}
            className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg hover:border-[#4C8DFF] transition-colors text-left"
          >
            <div className="text-[#EAF0FB] font-medium mb-1">Add New Complaint</div>
            <div className="text-sm text-[#8996AD]">Create a new complaint entry</div>
          </button>
          <button
            onClick={() => navigate('/complaints/all')}
            className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg hover:border-[#4C8DFF] transition-colors text-left"
          >
            <div className="text-[#EAF0FB] font-medium mb-1">View All Complaints</div>
            <div className="text-sm text-[#8996AD]">Browse complete complaint list</div>
          </button>
          <button
            onClick={() => navigate('/complaints/pending')}
            className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg hover:border-[#4C8DFF] transition-colors text-left"
          >
            <div className="text-[#EAF0FB] font-medium mb-1">Pending Issues</div>
            <div className="text-sm text-[#8996AD]">Focus on unresolved complaints</div>
          </button>
        </div>
      </div>
    </div>
  );
}
