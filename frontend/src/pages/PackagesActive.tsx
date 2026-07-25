import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Search, Package } from 'lucide-react';
import { packagesApi } from '../services/api';
import { toast } from '../components/Toast';

interface Package {
  id: string;
  name: string;
  speed: string;
  price: number;
  status: 'active' | 'inactive';
  desc?: string;
  createdAt?: number;
}

export default function PackagesActive() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    setError('');
    const result = await packagesApi.getAll();
    if (result.success && Array.isArray(result.data)) {
      setPackages(result.data);
    } else if (result.success && Array.isArray(result.data?.data)) {
      setPackages(result.data.data);
    } else {
      setPackages([]);
      setError(result.error || 'Failed to load packages');
    }
    setLoading(false);
  };

  const filteredPackages = (Array.isArray(packages) ? packages : []).filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pkg.speed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = pkg.status === 'active';
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this package?')) {
      const result = await packagesApi.update(id, { status: 'inactive' });
      if (result.success) {
        loadPackages();
      } else {
        toast.error(result.error || 'Failed to deactivate package');
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
        <h2 className="text-xl font-semibold text-[#EAF0FB]">Active Packages</h2>
        <button
          onClick={() => navigate('/packages/add')}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Package className="w-4 h-4" />
          Add Package
        </button>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
          <input
            type="text"
            placeholder="Search by name or speed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
          />
        </div>

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
              {filteredPackages.map((pkg) => (
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
              {filteredPackages.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#5C6B85]">
                    No active packages found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-[#5C6B85]">
          Showing {filteredPackages.length} active packages
        </div>
      </div>
    </div>
  );
}
