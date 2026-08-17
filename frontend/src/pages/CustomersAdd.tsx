import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../services/api';
import { useDropdownData } from '../hooks/useDropdownData';

export default function CustomersAdd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { areas, packages, loading: optionsLoading, warning: optionsWarning } = useDropdownData();
  // Speed string -> price, derived from the managed packages table.
  const packagePriceMap: Record<string, number> = {};
  packages.forEach((p) => { packagePriceMap[p.speed] = p.price; });
  
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    username: '',
    mobile: '',
    cnic: '',
    package: '',
    install_date: '',
    billing_date: '',
    area: '',
    address: '',
    fee: '',
    status: 'active',
    email: '',
    emergencyContact: '',
    notes: '',
    iptv_enabled: false,
    iptv_box_number: '',
    iptv_box_price: '',
    iptv_installation_charges: '',
    iptv_monthly_charges: '',
    live_ip_enabled: false,
    live_ip_address: '',
    live_ip_monthly_fee: '',
    live_ip_installation_fee: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Explicit validation with clear messages (in addition to HTML5 required)
    const missing: string[] = [];
    if (!formData.name.trim()) missing.push('Name');
    if (!formData.username.trim()) missing.push('Username');
    if (!formData.mobile.trim()) missing.push('Mobile');
    if (!formData.cnic.trim()) missing.push('CNIC');
    if (!formData.address.trim()) missing.push('Address');
    if (!formData.area.trim()) missing.push('Area');
    if (!formData.package.trim()) missing.push('Package');
    if (!formData.install_date) missing.push('Installation Date');
    if (!formData.billing_date) missing.push('Billing Date');
    if (!formData.fee || Number(formData.fee) <= 0) missing.push('Monthly Fee');
    if (missing.length > 0) {
      setError(`Please fill in all required fields: ${missing.join(', ')}`);
      // Scroll to top so the user sees the error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // CNIC format check (13 digits, no dashes required but normalize)
    const cnicDigits = formData.cnic.replace(/\D/g, '');
    if (cnicDigits.length !== 13) {
      setError('CNIC must be 13 digits.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Mobile format check (at least 10 digits)
    const mobileDigits = formData.mobile.replace(/\D/g, '');
    if (mobileDigits.length < 10) {
      setError('Mobile number must be at least 10 digits.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const customerData = {
        name: formData.name.trim(),
        fatherName: formData.fatherName.trim(),
        mobile: mobileDigits,
        cnic: cnicDigits,
        email: formData.email.trim(),
        address: formData.address.trim(),
        area: formData.area,
        package: formData.package,
        fee: Number(formData.fee),
        install_date: formData.install_date ? new Date(formData.install_date).getTime() : undefined,
        billing_date: formData.billing_date ? Number(formData.billing_date) : undefined,
        username: formData.username.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        notes: formData.notes.trim(),
        status: formData.status as 'active' | 'suspended' | 'pending',
        iptv_enabled: formData.iptv_enabled,
        iptv_box_number: formData.iptv_box_number.trim(),
        iptv_box_price: formData.iptv_box_price ? Number(formData.iptv_box_price) : undefined,
        iptv_installation_charges: formData.iptv_installation_charges ? Number(formData.iptv_installation_charges) : undefined,
        iptv_monthly_charges: formData.iptv_monthly_charges ? Number(formData.iptv_monthly_charges) : undefined,
        live_ip_enabled: formData.live_ip_enabled,
        live_ip_address: formData.live_ip_address.trim(),
        live_ip_monthly_fee: formData.live_ip_monthly_fee ? Number(formData.live_ip_monthly_fee) : undefined,
        live_ip_installation_fee: formData.live_ip_installation_fee ? Number(formData.live_ip_installation_fee) : undefined
      };

      const result = await customersApi.create(customerData);
      if (result.success) {
        navigate('/customers/all');
      } else {
        setError(result.error || 'Failed to create customer');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error creating customer:', err);
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
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

    if (name === 'package' && typeof value === 'string' && value) {
      const price = packagePriceMap[value];
      setFormData(prev => ({
        ...prev,
        package: value as string,
        fee: price != null ? price.toString() : ''
      }));
    }
  };

  return (
    <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
      <h2 className="text-xl font-semibold text-[#EAF0FB] mb-6">Add Customer</h2>
      {error && (
        <div className="mb-4 p-3 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg text-[#F5514B]">
          {error}
        </div>
      )}
      {optionsWarning && !error && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500 rounded-lg text-amber-400 text-sm">
          {optionsWarning}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-[#14E8B4] mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Full Name *</label>
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
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Father Name *</label>
              <input 
                type="text" 
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Username *</label>
              <input 
                type="text" 
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Phone Number *</label>
              <input 
                type="tel" 
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">CNIC *</label>
              <input 
                type="text" 
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                placeholder="XXXXX-XXXXXXX-X"
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Emergency Contact</label>
              <input 
                type="tel" 
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Address *</label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
                required 
              />
            </div>
          </div>
        </div>

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
                {packages.map((p) => {
                  const speed = p.speed || p.name;
                  return (
                    <option key={p.id || speed} value={speed}>
                      {p.name && p.name !== speed ? `${p.name} — ` : ''}{speed} — Rs. {p.price}/month
                    </option>
                  );
                })}
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
                {areas.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Installation Date *</label>
              <input 
                type="date" 
                name="install_date"
                value={formData.install_date}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Billing Date *</label>
              <input 
                type="number" 
                name="billing_date"
                value={formData.billing_date}
                onChange={handleChange}
                min="1" 
                max="28"
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Monthly Fee (Rs) *</label>
              <input
                type="number"
                name="fee"
                value={formData.fee}
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
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

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
                value={formData.iptv_box_number}
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
                value={formData.iptv_box_price}
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
                value={formData.iptv_installation_charges}
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
                value={formData.iptv_monthly_charges}
                onChange={handleChange}
                disabled={!formData.iptv_enabled}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] disabled:opacity-50" 
              />
            </div>
          </div>
        </div>

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
                value={formData.live_ip_address}
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
                value={formData.live_ip_monthly_fee}
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
                value={formData.live_ip_installation_fee}
                onChange={handleChange}
                disabled={!formData.live_ip_enabled}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] disabled:opacity-50" 
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#8996AD] mb-2">Notes</label>
          <textarea 
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button 
            type="button" 
            onClick={() => navigate('/customers/all')} 
            className="px-6 py-2 bg-[#1B2540] text-[#EAF0FB] rounded-lg hover:bg-[#232D45] transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Customer'}
          </button>
        </div>
      </form>
    </div>
  );
}
