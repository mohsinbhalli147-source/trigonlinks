import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, MapPin, AlertCircle } from 'lucide-react';
import { areasApi } from '../services/api';

interface Area {
  name: string;
  code: string;
  city: string;
  district: string;
  province: string;
  assignedStaff: string;
  population: number;
  coverage: string;
  notes: string;
}

export default function AreaAdd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [area, setArea] = useState<Area>({
    name: '',
    code: '',
    city: '',
    district: '',
    province: 'Punjab',
    assignedStaff: '',
    population: 0,
    coverage: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Area, string>>>({});

  const provinces = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad', 'Azad Kashmir'];

  const validateForm = () => {
    const newErrors: Partial<Record<keyof Area, string>> = {};
    
    if (!area.name.trim()) newErrors.name = 'Area name is required';
    if (!area.code.trim()) newErrors.code = 'Area code is required';
    if (!area.city.trim()) newErrors.city = 'City is required';
    if (!area.district.trim()) newErrors.district = 'District is required';
    if (area.population < 0) newErrors.population = 'Population cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const areaData = {
      name: area.name,
      code: area.code,
      city: area.city,
      district: area.district,
      province: area.province,
      assignedStaff: area.assignedStaff,
      population: area.population,
      coverage: area.coverage,
      notes: area.notes,
      status: 'active' as const
    };

    const result = await areasApi.create(areaData);
    if (result.success) {
      navigate('/areas/all');
    } else {
      setError(result.error || 'Failed to add area');
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Area, value: string | number) => {
    setArea(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Add Area</h2>
        {error && (
          <div className="p-3 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg text-[#F5514B]">
            {error}
          </div>
        )}
        <button
          onClick={() => navigate('/areas/all')}
          className="flex items-center gap-2 px-4 py-2 bg-[#232D45] text-[#8996AD] rounded-lg hover:text-[#EAF0FB] transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Area Name *
                </label>
                <input
                  type="text"
                  value={area.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter area name"
                  className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                    errors.name ? 'border-[#F5514B]' : 'border-[#232D45]'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-[#F5514B] flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Area Code *
                </label>
                <input
                  type="text"
                  value={area.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  placeholder="e.g., PAS-001"
                  className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                    errors.code ? 'border-[#F5514B]' : 'border-[#232D45]'
                  }`}
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-[#F5514B] flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.code}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={area.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Enter city name"
                  className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                    errors.city ? 'border-[#F5514B]' : 'border-[#232D45]'
                  }`}
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-[#F5514B] flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.city}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  District *
                </label>
                <input
                  type="text"
                  value={area.district}
                  onChange={(e) => handleChange('district', e.target.value)}
                  placeholder="Enter district name"
                  className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                    errors.district ? 'border-[#F5514B]' : 'border-[#232D45]'
                  }`}
                />
                {errors.district && (
                  <p className="mt-1 text-sm text-[#F5514B] flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.district}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Province *
                </label>
                <select
                  value={area.province}
                  onChange={(e) => handleChange('province', e.target.value)}
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                >
                  {provinces.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Assigned Staff
                </label>
                <input
                  type="text"
                  value={area.assignedStaff}
                  onChange={(e) => handleChange('assignedStaff', e.target.value)}
                  placeholder="Staff member name"
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                />
              </div>
            </div>
          </div>

          {/* Coverage Information */}
          <div className="border-t border-[#232D45] pt-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Coverage Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Estimated Population
                </label>
                <input
                  type="number"
                  value={area.population}
                  onChange={(e) => handleChange('population', parseInt(e.target.value) || 0)}
                  placeholder="Enter estimated population"
                  min="0"
                  className={`w-full px-4 py-3 bg-[#1B2540] border rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] ${
                    errors.population ? 'border-[#F5514B]' : 'border-[#232D45]'
                  }`}
                />
                {errors.population && (
                  <p className="mt-1 text-sm text-[#F5514B] flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.population}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">
                  Coverage Description
                </label>
                <input
                  type="text"
                  value={area.coverage}
                  onChange={(e) => handleChange('coverage', e.target.value)}
                  placeholder="e.g., Full coverage, Partial coverage"
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t border-[#232D45] pt-6">
            <label className="block text-sm font-medium text-[#8996AD] mb-2">
              Notes
            </label>
            <textarea
              value={area.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              placeholder="Add any additional notes about this area..."
              className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/areas/all')}
              className="px-6 py-3 bg-[#232D45] text-[#8996AD] rounded-lg hover:text-[#EAF0FB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Adding...' : 'Add Area'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
