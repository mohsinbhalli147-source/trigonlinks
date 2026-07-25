import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Zap, AlertCircle } from 'lucide-react';
import { packagesApi } from '../services/api';
import { toast } from '../components/Toast';

interface PackagePricing {
  id: string;
  name: string;
  speed: string;
  monthlyPrice: number;
  quarterlyPrice: number;
  yearlyPrice: number;
  installationFee: number;
  discountYearly: number;
  status: 'active' | 'inactive';
}

export default function PackagesPricing() {
  const [pricing, setPricing] = useState<PackagePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPackage, setNewPackage] = useState<Partial<PackagePricing>>({
    name: '',
    speed: '',
    monthlyPrice: 0,
    quarterlyPrice: 0,
    yearlyPrice: 0,
    installationFee: 0,
    discountYearly: 10,
    status: 'active'
  });

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    setLoading(true);
    setError('');
    const result = await packagesApi.getAll();
    if (result.success) {
      setPricing(result.data);
    } else {
      setError(result.error || 'Failed to load packages');
    }
    setLoading(false);
  };

  const handleAddPackage = async () => {
    if (!newPackage.name || !newPackage.speed || !newPackage.monthlyPrice) {
      toast.warning('Please fill in all required fields');
      return;
    }

    const quarterly = newPackage.monthlyPrice * 3 * 0.95;
    const yearly = newPackage.monthlyPrice * 12 * (1 - (newPackage.discountYearly || 10) / 100);

    const packageToAdd: PackagePricing = {
      id: Date.now().toString(),
      name: newPackage.name,
      speed: newPackage.speed,
      monthlyPrice: newPackage.monthlyPrice,
      quarterlyPrice: quarterly,
      yearlyPrice: yearly,
      installationFee: newPackage.installationFee || 0,
      discountYearly: newPackage.discountYearly || 10,
      status: 'active'
    };

    const result = await packagesApi.create(packageToAdd);
    if (result.success) {
      loadPricing();
      setNewPackage({
        name: '',
        speed: '',
        monthlyPrice: 0,
        quarterlyPrice: 0,
        yearlyPrice: 0,
        installationFee: 0,
        discountYearly: 10,
        status: 'active'
      });
      setShowAddForm(false);
    } else {
      toast.error(result.error || 'Failed to add package');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this pricing?')) {
      const result = await packagesApi.delete(id);
      if (result.success) {
        loadPricing();
      } else {
        toast.error(result.error || 'Failed to delete package');
      }
    }
  };

  const calculateSavings = (pkg: PackagePricing) => {
    const yearlyWithoutDiscount = pkg.monthlyPrice * 12;
    const savings = yearlyWithoutDiscount - pkg.yearlyPrice;
    return Math.round((savings / yearlyWithoutDiscount) * 100);
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
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Package Pricing</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Cancel' : 'Add Package'}
        </button>
      </div>

      {/* Add Package Form */}
      {showAddForm && (
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Add New Package Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Package Name *</label>
              <input
                type="text"
                value={newPackage.name}
                onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                placeholder="e.g., Basic Plan"
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Speed *</label>
              <input
                type="text"
                value={newPackage.speed}
                onChange={(e) => setNewPackage({ ...newPackage, speed: e.target.value })}
                placeholder="e.g., 10 Mbps"
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Monthly Price (Rs) *</label>
              <input
                type="number"
                value={newPackage.monthlyPrice}
                onChange={(e) => setNewPackage({ ...newPackage, monthlyPrice: parseFloat(e.target.value) || 0 })}
                placeholder="2000"
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Installation Fee (Rs)</label>
              <input
                type="number"
                value={newPackage.installationFee}
                onChange={(e) => setNewPackage({ ...newPackage, installationFee: parseFloat(e.target.value) || 0 })}
                placeholder="500"
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Yearly Discount (%)</label>
              <input
                type="number"
                value={newPackage.discountYearly}
                onChange={(e) => setNewPackage({ ...newPackage, discountYearly: parseFloat(e.target.value) || 10 })}
                placeholder="10"
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddPackage}
                className="w-full px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Add Package
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Table */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Package</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Speed</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Monthly</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Quarterly</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Yearly</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Installation</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Yearly Savings</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((pkg) => (
                <tr key={pkg.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4C8DFF] to-[#2E5CB8] flex items-center justify-center">
                        <Zap className="w-5 h-5 text-[#EAF0FB]" />
                      </div>
                      <div className="font-semibold text-[#EAF0FB]">{pkg.name}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{pkg.speed}</td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">Rs. {pkg.monthlyPrice.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#14E8B4]">Rs. {pkg.quarterlyPrice.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#F6B93B] font-semibold">Rs. {pkg.yearlyPrice.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">Rs. {pkg.installationFee.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#14E8B4]/20 text-[#14E8B4]">
                      {calculateSavings(pkg)}% OFF
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className="p-2 text-[#8996AD] hover:text-[#F5514B] hover:bg-[#232D45] rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Tips */}
        <div className="mt-6 p-4 bg-[#1B2540] border border-[#232D45] rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#F6B93B] mt-0.5" />
            <div>
              <p className="font-medium text-[#EAF0FB] mb-1">Pricing Tips</p>
              <ul className="text-sm text-[#8996AD] space-y-1">
                <li>• Quarterly plans offer 5% discount compared to monthly</li>
                <li>• Yearly plans offer additional discount (default 10%)</li>
                <li>• Installation fees are one-time charges applied at connection</li>
                <li>• Update pricing carefully as it affects existing customers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
