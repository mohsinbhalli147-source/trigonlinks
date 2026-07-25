import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft } from 'lucide-react';
import { complaintsApi } from '../services/api';
import { toast } from '../components/Toast';

export default function ComplaintsAdd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    category: 'Internet',
    description: '',
    priority: 'medium',
    assignedTo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await complaintsApi.create(formData);
    if (result.success) {
      navigate('/complaints/all');
    } else {
      toast.error(result.error || 'Failed to create complaint');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/complaints/all')}
          className="p-2 hover:bg-[#1B2540] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#8996AD]" />
        </button>
        <h1 className="text-2xl font-bold text-[#EAF0FB]">Add New Complaint</h1>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Customer ID</label>
              <input
                type="text"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg px-4 py-3 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Customer Name</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg px-4 py-3 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg px-4 py-3 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]"
              >
                <option value="Internet">Internet</option>
                <option value="Billing">Billing</option>
                <option value="Service">Service</option>
                <option value="Technical">Technical</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg px-4 py-3 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#8996AD] mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg px-4 py-3 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#8996AD] mb-2">Assign To (Staff ID)</label>
            <input
              type="text"
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg px-4 py-3 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#4C8DFF] text-white rounded-lg px-6 py-3 hover:bg-[#3B7BD9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Complaint'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/complaints/all')}
              className="px-6 py-3 border border-[#232D45] rounded-lg text-[#8996AD] hover:bg-[#1B2540] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
