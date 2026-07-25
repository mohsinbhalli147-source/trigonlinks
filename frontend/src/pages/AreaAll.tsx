import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Filter, MapPin, Users, DollarSign, Activity } from 'lucide-react';
import { areasApi } from '../services/api';
import { toast } from '../components/Toast';

interface Area {
  id: string;
  name: string;
  code: string;
  city: string;
  district: string;
  province: string;
  assignedStaff: string;
  population: number;
  coverage: string;
  status: 'active' | 'inactive' | 'limited';
  createdAt: number;
}

export default function AreaAll() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'limited'>('all');

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    setLoading(true);
    setError('');
    const result = await areasApi.getAll({ limit: 100 });
    if (result.success) {
      setAreas(result.data?.data || result.data || []);
    } else {
      setError(result.error || 'Failed to load areas');
    }
    setLoading(false);
  };

  const filteredAreas = areas.filter(area => {
    const name = area?.name || '';
    const code = area?.code || '';
    const city = area?.city || '';
    const district = area?.district || '';
    const province = area?.province || '';
    const status = area?.status || 'active';

    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvince = filterProvince === 'all' || province === filterProvince;
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    return matchesSearch && matchesProvince && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this area?')) {
      const result = await areasApi.delete(id);
      if (result.success) {
        loadAreas();
      } else {
        toast.error(result.error || 'Failed to delete area');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#14E8B4]/20 text-[#14E8B4]';
      case 'inactive': return 'bg-[#5C6B85]/20 text-[#5C6B85]';
      case 'limited': return 'bg-[#F6B93B]/20 text-[#F6B93B]';
      default: return 'bg-[#8996AD]/20 text-[#8996AD]';
    }
  };

  const totalPopulation = areas.reduce((sum, a) => sum + (a.population || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading areas...</div>
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
        <h2 className="text-xl font-semibold text-[#EAF0FB]">All Areas</h2>
        <button
          onClick={() => navigate('/areas/add')}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Area
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-[#4C8DFF]" />
            <p className="text-sm text-[#8996AD]">Total Areas</p>
          </div>
          <p className="text-2xl font-bold text-[#EAF0FB]">{areas.length}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-[#F6B93B]" />
            <p className="text-sm text-[#8996AD]">Total Population</p>
          </div>
          <p className="text-2xl font-bold text-[#F6B93B]">{totalPopulation.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
            <input
              type="text"
              placeholder="Search by name, code, city, or district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#5C6B85]" />
            <select
              value={filterProvince}
              onChange={(e) => setFilterProvince(e.target.value)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Provinces</option>
              <option value="Punjab">Punjab</option>
              <option value="Sindh">Sindh</option>
              <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
              <option value="Balochistan">Balochistan</option>
              <option value="Islamabad">Islamabad</option>
              <option value="Azad Kashmir">Azad Kashmir</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="limited">Limited</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Area</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Code</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Location</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Assigned Staff</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Population</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Coverage</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Sections</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAreas.map((area) => (
                <tr key={area.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4C8DFF] to-[#2E5CB8] flex items-center justify-center font-bold text-[#EAF0FB]">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-[#EAF0FB]">{area.name}</div>
                        <div className="text-sm text-[#8996AD]">{area.city}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#8996AD] font-mono">{area.code}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{area.district}, {area.province}</td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">{area.assignedStaff || 'Unassigned'}</td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">{(area.population || 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{area.coverage}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/areas/customers/${area.id}`)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-[#4C8DFF]/15 hover:bg-[#4C8DFF]/25 text-[#4C8DFF] rounded text-xs font-semibold transition-colors"
                        title="View Area Customers"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Customers
                      </button>
                      <button
                        onClick={() => navigate(`/areas/revenue/${area.id}`)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-[#14E8B4]/15 hover:bg-[#14E8B4]/25 text-[#14E8B4] rounded text-xs font-semibold transition-colors"
                        title="View Area Revenue"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Revenue
                      </button>
                      <button
                        onClick={() => navigate(`/areas/reports/${area.id}`)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-[#F6B93B]/15 hover:bg-[#F6B93B]/25 text-[#F6B93B] rounded text-xs font-semibold transition-colors"
                        title="View Area Reports"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        Reports
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(area.status)}`}>
                      {area.status.charAt(0).toUpperCase() + area.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/areas/edit/${area.id}`)}
                        className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(area.id)}
                        className="p-2 text-[#8996AD] hover:text-[#F5514B] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAreas.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#5C6B85]">
                    No areas found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-[#5C6B85]">
          Showing {filteredAreas.length} of {areas.length} areas
        </div>
      </div>
    </div>
  );
}
