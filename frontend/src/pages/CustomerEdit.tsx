import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { customersApi } from '../services/api';
import { useDropdownData } from '../hooks/useDropdownData';

interface Customer {
  id: string;
  uid: string;
  name: string;
  fatherName?: string;
  username?: string;
  mobile: string;
  cnic?: string;
  email?: string;
  address: string;
  area: string;
  status: 'active' | 'inactive' | 'suspended' | 'on-leave';
  package: string;
  fee: number;
  install_date?: number;
  billing_date?: number;
  emergencyContact?: string;
  notes?: string;
  iptv_enabled: boolean;
  iptv_box_number?: string;
  iptv_box_price?: number;
  iptv_installation_charges?: number;
  iptv_monthly_charges: number;
  live_ip_enabled: boolean;
  live_ip_address?: string;
  live_ip_monthly_fee: number;
  live_ip_installation_fee?: number;
  created_at: number;
  updated_at?: number;
}

export default function CustomerEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<Customer>({
    id: id || '',
    uid: '',
    name: '',
    fatherName: '',
    username: '',
    mobile: '',
    cnic: '',
    email: '',
    address: '',
    area: '',
    status: 'active',
    package: '',
    fee: 0,
    install_date: undefined,
    billing_date: undefined,
    emergencyContact: '',
    notes: '',
    iptv_enabled: false,
    iptv_box_number: '',
    iptv_box_price: undefined,
    iptv_installation_charges: undefined,
    iptv_monthly_charges: 0,
    live_ip_enabled: false,
    live_ip_address: '',
    live_ip_monthly_fee: 0,
    live_ip_installation_fee: undefined,
    created_at: Date.now(),
    updated_at: undefined
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { areas, packages, loading: optionsLoading, warning: optionsWarning } = useDropdownData();
  const packagePriceMap: Record<string, number> = {};
  packages.forEach((p) => { packagePriceMap[p.speed] = p.price; });

  useEffect(() => {
    loadCustomerData();
  }, [id]);

  const loadCustomerData = async () => {
    if (!id) return;
    try {
      const result = await customersApi.getById(id);
      if (result.success && result.data) {
        const data = result.data;
        setFormData({
          id: data.id || id,
          uid: data.uid || '',
          name: data.name || '',
          fatherName: data.fatherName || data.father_name || '',
          username: data.username || '',
          mobile: data.mobile || data.phone || '',
          cnic: data.cnic || '',
          email: data.email || '',
          address: data.address || '',
          area: data.area || '',
          status: data.status || 'active',
          package: data.package || '',
          fee: data.fee || data.monthlyFee || 0,
          install_date: data.install_date || data.installationDate,
          billing_date: data.billing_date || data.billingDate,
          emergencyContact: data.emergencyContact || data.emergency_contact || '',
          notes: data.notes || '',
          iptv_enabled: data.iptv_enabled || data.iptvEnabled || false,
          iptv_box_number: data.iptv_box_number || data.iptvBoxNumber || '',
          iptv_box_price: data.iptv_box_price || data.iptvBoxPrice,
          iptv_installation_charges: data.iptv_installation_charges || data.iptvInstallationCharges,
          iptv_monthly_charges: data.iptv_monthly_charges || data.iptvMonthlyCharges || 0,
          live_ip_enabled: data.live_ip_enabled || data.liveIpEnabled || false,
          live_ip_address: data.live_ip_address || data.liveIpAddress || '',
          live_ip_monthly_fee: data.live_ip_monthly_fee || data.liveIpMonthlyFee || 0,
          live_ip_installation_fee: data.live_ip_installation_fee || data.liveIpInstallationFee,
          created_at: data.created_at || Date.now(),
          updated_at: data.updated_at
        });
      } else {
        setError(result.error || 'Failed to load customer data');
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSubmitting(true);
    setError('');

    const updateData = {
      name: formData.name,
      fatherName: formData.fatherName,
      username: formData.username,
      mobile: formData.mobile,
      cnic: formData.cnic,
      email: formData.email,
      address: formData.address,
      area: formData.area,
      status: formData.status,
      package: formData.package,
      fee: formData.fee,
      install_date: formData.install_date,
      billing_date: formData.billing_date,
      emergencyContact: formData.emergencyContact,
      notes: formData.notes,
      iptv_enabled: formData.iptv_enabled,
      iptv_box_number: formData.iptv_box_number,
      iptv_box_price: formData.iptv_box_price,
      iptv_installation_charges: formData.iptv_installation_charges,
      iptv_monthly_charges: formData.iptv_monthly_charges,
      live_ip_enabled: formData.live_ip_enabled,
      live_ip_address: formData.live_ip_address,
      live_ip_monthly_fee: formData.live_ip_monthly_fee,
      live_ip_installation_fee: formData.live_ip_installation_fee,
      updated_at: Date.now()
    };
    const result = await customersApi.update(id, updateData);
    if (result.success) {
      navigate(`/customers/profile/${id}`);
    } else {
      console.error('Update customer error:', result.error);
      setError(result.error || 'Failed to update customer');
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!e || !e.target) return;

    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    const name = e.target.name;

    setFormData({
      ...formData,
      [name]: value
    });

    // Auto-populate monthly fee when package is selected
    if (name === 'package' && typeof value === 'string' && value) {
      const price = packagePriceMap[value];
      setFormData(prev => ({
        ...prev,
        package: value,
        fee: price != null ? price : prev.fee
      }));
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="text-center text-[#8996AD]">Loading customer data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="text-center text-[#F5514B]">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#EAF0FB]">Edit Customer</h2>
        {error && (
          <div className="p-3 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg text-[#F5514B] text-sm">
            {error}
          </div>
        )}
        {optionsWarning && !error && (
          <div className="p-3 bg-amber-500/10 border border-amber-500 rounded-lg text-amber-400 text-sm">
            {optionsWarning}
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-medium text-[#14E8B4] mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Father Name</label>
              <input
                type="text"
                name="fatherName"
                value={formData.fatherName || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Mobile Number *</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">CNIC</label>
              <input
                type="text"
                name="cnic"
                value={formData.cnic || ''}
                onChange={handleChange}
                placeholder="XXXXX-XXXXXXX-X"
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Emergency Contact</label>
              <input
                type="tel"
                name="emergencyContact"
                value={formData.emergencyContact || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                required
              />
            </div>
          </div>
        </div>

        {/* Connection Details */}
        <div>
          <h3 className="text-lg font-medium text-[#14E8B4] mb-4">Connection Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Package *</label>
              <select
                name="package"
                value={formData.package}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                required
                disabled={optionsLoading}
              >
                <option value="">{optionsLoading ? 'Loading packages…' : 'Select Package'}</option>
                {(() => {
                  const speeds = packages.map((p) => p.speed || p.name);
                  const current = formData.package;
                  const showCurrentFallback = current && !speeds.includes(current);
                  return (
                    <>
                      {showCurrentFallback && <option value={current}>{current} (current)</option>}
                      {packages.map((p) => {
                        const speed = p.speed || p.name;
                        return (
                          <option key={p.id || speed} value={speed}>
                            {p.name && p.name !== speed ? `${p.name} — ` : ''}{speed} — Rs. {p.price}/month
                          </option>
                        );
                      })}
                    </>
                  );
                })()}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Area *</label>
              <select 
                name="area"
                value={formData.area}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                required
                disabled={optionsLoading}
              >
                <option value="">{optionsLoading ? 'Loading areas…' : 'Select Area'}</option>
                {(() => {
                  const lowered = areas.map((a) => a.toLowerCase());
                  const current = formData.area;
                  const showCurrentFallback = current && !lowered.includes(current.toLowerCase());
                  return (
                    <>
                      {showCurrentFallback && <option value={current}>{current} (current)</option>}
                      {areas.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </>
                  );
                })()}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Installation Date</label>
              <input 
                type="date" 
                name="install_date"
                value={formData.install_date ? new Date(formData.install_date).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({...formData, install_date: e.target.value ? new Date(e.target.value).getTime() : undefined})}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Billing Date</label>
              <input 
                type="number" 
                name="billing_date"
                value={formData.billing_date || ''}
                onChange={handleChange}
                min="1" 
                max="28"
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Monthly Fee (Rs) *</label>
              <input
                type="number"
                name="fee"
                value={formData.fee || 0}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="on-leave">On Leave</option>
              </select>
            </div>
          </div>
        </div>

        {/* IPTV Information */}
        <div>
          <h3 className="text-lg font-medium text-[#14E8B4] mb-4">IPTV Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="iptv_enabled"
                id="iptv_enabled"
                checked={formData.iptv_enabled}
                onChange={handleChange}
                className="w-5 h-5 rounded bg-[#1B2540] border-[#232D45] text-[#14E8B4] focus:ring-[#14E8B4]"
              />
              <label htmlFor="iptv_enabled" className="text-sm font-medium text-[#EAF0FB]">IPTV Enabled</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">IPTV Box Number / Serial</label>
              <input
                type="text"
                name="iptv_box_number"
                value={formData.iptv_box_number || ''}
                onChange={handleChange}
                disabled={!formData.iptv_enabled}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">IPTV Box Price (Rs)</label>
              <input
                type="number"
                name="iptv_box_price"
                value={formData.iptv_box_price || ''}
                onChange={handleChange}
                disabled={!formData.iptv_enabled}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">IPTV Installation Charges (Rs)</label>
              <input
                type="number"
                name="iptv_installation_charges"
                value={formData.iptv_installation_charges || ''}
                onChange={handleChange}
                disabled={!formData.iptv_enabled}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">IPTV Monthly Charges (Rs)</label>
              <input
                type="number"
                name="iptv_monthly_charges"
                value={formData.iptv_monthly_charges || 0}
                onChange={handleChange}
                disabled={!formData.iptv_enabled}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Live IP Information */}
        <div>
          <h3 className="text-lg font-medium text-[#14E8B4] mb-4">Live IP Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="live_ip_enabled"
                id="live_ip_enabled"
                checked={formData.live_ip_enabled}
                onChange={handleChange}
                className="w-5 h-5 rounded bg-[#1B2540] border-[#232D45] text-[#14E8B4] focus:ring-[#14E8B4]"
              />
              <label htmlFor="live_ip_enabled" className="text-sm font-medium text-[#EAF0FB]">Live IP Enabled</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Live IP Address</label>
              <input
                type="text"
                name="live_ip_address"
                value={formData.live_ip_address || ''}
                onChange={handleChange}
                disabled={!formData.live_ip_enabled}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Live IP Monthly Fee (Rs)</label>
              <input
                type="number"
                name="live_ip_monthly_fee"
                value={formData.live_ip_monthly_fee || 0}
                onChange={handleChange}
                disabled={!formData.live_ip_enabled}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Live IP Installation Fee (Rs)</label>
              <input
                type="number"
                name="live_ip_installation_fee"
                value={formData.live_ip_installation_fee || ''}
                onChange={handleChange}
                disabled={!formData.live_ip_enabled}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-[#8996AD] mb-2">Notes</label>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button 
            type="button" 
            onClick={() => navigate(`/customers/profile/${id}`)} 
            className="px-6 py-2 bg-[#1B2540] text-[#EAF0FB] rounded-lg hover:bg-[#232D45] transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={submitting}
            className="px-6 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Updating...' : 'Update Customer'}
          </button>
        </div>
      </form>
    </div>
  );
}
