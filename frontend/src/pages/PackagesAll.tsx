import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { packagesApi } from '../services/api';
import { toast } from '../components/Toast';

interface Package {
  id: string;
  name: string;
  speed: string;
  price: number;
  status: 'active' | 'inactive';
}

export default function PackagesAll() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    setError('');
    const result = await packagesApi.getAll({ limit: 100 });
    if (result.success) {
      setPackages(result.data?.data || result.data || []);
    } else {
      setError(result.error || 'Failed to load packages');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this package?')) {
      const result = await packagesApi.delete(id);
      if (result.success) {
        loadPackages();
      } else {
        toast.error(result.error || 'Failed to delete package');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading packages...</div>
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
        <h2 className="text-xl font-semibold text-[#EAF0FB]">All Packages</h2>
        <button
          onClick={() => navigate('/packages/add')}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Package
        </button>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Package Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Speed</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Price</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">{pkg.name}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{pkg.speed}</td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">Rs. {pkg.price}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pkg.status === 'active' 
                        ? 'bg-[#14E8B4]/10 text-[#14E8B4]' 
                        : 'bg-[#F5514B]/10 text-[#F5514B]'
                    }`}>
                      {pkg.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(pkg.id)}
                        className="p-2 text-[#8996AD] hover:text-[#F5514B] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-[#5C6B85]">
          Showing {packages.length} packages
        </div>
      </div>
    </div>
  );
}
