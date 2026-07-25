import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { packagesApi } from '../services/api';

export default function PackagesAdd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    speed: '',
    price: '',
    desc: '',
    status: 'active'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const packageData = {
      name: formData.name,
      speed: formData.speed,
      price: Number(formData.price),
      desc: formData.desc,
      status: formData.status as 'active' | 'inactive'
    };

    const result = await packagesApi.create(packageData);
    if (result.success) {
      navigate('/packages/all');
    } else {
      setError(result.error || 'Failed to create package');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
      <h2 className="text-xl font-semibold text-[#EAF0FB] mb-6">Add Package</h2>
      {error && (
        <div className="mb-4 p-3 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg text-[#F5514B]">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#8996AD] mb-2">Package Name</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8996AD] mb-2">Speed</label>
            <input 
              type="text" 
              name="speed"
              placeholder="e.g., 10 Mbps"
              value={formData.speed}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8996AD] mb-2">Price (Monthly)</label>
            <input 
              type="number" 
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8996AD] mb-2">Status</label>
            <select 
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#8996AD] mb-2">Description</label>
          <textarea 
            name="desc"
            value={formData.desc}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/packages/all')} className="px-4 py-2 bg-[#1B2540] text-[#EAF0FB] rounded-lg hover:bg-[#232D45] transition-colors">
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Package'}
          </button>
        </div>
      </form>
    </div>
  );
}
