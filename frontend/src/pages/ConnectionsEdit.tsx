import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, DollarSign, Package, MapPin, Calendar, Receipt, Percent, FileText, AlertCircle, CheckCircle, XCircle, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { connectionsApi } from '../services/api';
import { toast } from '../components/Toast';

interface ConnectionRequest {
  id: string;
  customerName: string;
  fatherName: string;
  phone: string;
  cnic: string;
  address: string;
  area: string;
  package: string;
  installationDate: string;
  billingDate: string;
  connectionFee: number;
  monthlyFee: number;
  concession: number;
  concessionReason: string;
  expenseAmount: number;
  expenseCategory: string;
  expenseDescription: string;
  inventoryItems: string;
  notes: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export default function ConnectionsEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [formData, setFormData] = useState({
    // Customer Information
    name: '',
    fatherName: '',
    phone: '',
    cnic: '',
    address: '',
    area: '',
    
    // Connection Details
    package: '',
    installationDate: '',
    billingDate: '',
    
    // Financial Details
    connectionFee: '',
    monthlyFee: '',
    concession: '',
    concessionReason: '',
    
    // Additional Information
    notes: '',
  });

  const [expenses, setExpenses] = useState<Array<{
    amount: string;
    category: string;
    description: string;
    inventoryItems: string;
  }>>([]);

  const [showExpenseSection, setShowExpenseSection] = useState(false);
  const [showConcessionSection, setShowConcessionSection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadConnectionData();
  }, [id]);

  const loadConnectionData = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    
    const result = await connectionsApi.getById(id);
    if (result.success) {
      const data = result.data;
      setFormData({
        name: data.customerName || '',
        fatherName: data.fatherName || '',
        phone: data.phone || '',
        cnic: data.cnic || '',
        address: data.address || '',
        area: data.area || '',
        package: data.package || '',
        installationDate: data.installationDate || '',
        billingDate: data.billingDate || '',
        connectionFee: data.connectionFee?.toString() || '',
        monthlyFee: data.monthlyFee?.toString() || '',
        concession: data.concession?.toString() || '',
        concessionReason: data.concessionReason || '',
        notes: data.notes || '',
      });
      
      if (data.expenses && data.expenses.length > 0) {
        setExpenses(data.expenses.map((exp: any) => ({
          amount: exp.amount?.toString() || '',
          category: exp.category || '',
          description: exp.description || '',
          inventoryItems: exp.inventoryItems || ''
        })));
        setShowExpenseSection(true);
      }
      if (data.concession > 0) {
        setShowConcessionSection(true);
      }
    } else {
      setError(result.error || 'Failed to load connection data');
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setSubmitting(true);
    setError('');

    const connectionData = {
      ...formData,
      connectionFee: Number(formData.connectionFee),
      monthlyFee: Number(formData.monthlyFee),
      concession: Number(formData.concession),
      expenses: expenses.map(exp => ({
        amount: Number(exp.amount),
        category: exp.category,
        description: exp.description,
        inventoryItems: exp.inventoryItems
      })),
    };

    const result = await connectionsApi.update(id, connectionData);
    if (result.success) {
      toast.success('Connection request updated successfully!');
      navigate('/connections/pending');
    } else {
      setError(result.error || 'Failed to update connection request');
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    if (confirm('Are you sure you want to approve this connection request? This will:\n\n1. Add the customer to the system\n2. Deduct inventory items from stock\n3. Record the connection payment\n4. Set up monthly billing')) {
      const result = await connectionsApi.update(id, { status: 'approved' });
      if (result.success) {
        toast.success('Connection approved successfully!');
        navigate('/connections/approved');
      } else {
        toast.error(result.error || 'Failed to approve request');
      }
    }
  };

  const handleReject = async () => {
    if (!id) return;
    const reason = prompt('Please provide reason for rejection:');
    if (reason) {
      const result = await connectionsApi.update(id, { status: 'rejected', rejectionReason: reason });
      if (result.success) {
        toast.success('Connection rejected successfully!');
        navigate('/connections/rejected');
      } else {
        toast.error(result.error || 'Failed to reject request');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addExpense = () => {
    setExpenses([...expenses, {
      amount: '',
      category: '',
      description: '',
      inventoryItems: ''
    }]);
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const updateExpense = (index: number, field: string, value: string) => {
    const updatedExpenses = [...expenses];
    updatedExpenses[index] = { ...updatedExpenses[index], [field]: value };
    setExpenses(updatedExpenses);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading connection data...</div>
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
    <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/connections/pending')}
            className="p-2 bg-[#1B2540] text-[#EAF0FB] rounded-lg hover:bg-[#232D45] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-[#EAF0FB]">Edit Connection Request</h2>
        </div>
        {error && (
          <div className="p-3 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg text-[#F5514B] text-sm">
            {error}
          </div>
        )}
      </div>
      
      <div className="mb-4 p-4 bg-[#F6B93B]/10 border border-[#F6B93B] rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#F6B93B] mt-0.5" />
          <div className="text-sm text-[#F6B93B]">
            <p className="font-semibold mb-1">Editing pending connection request</p>
            <p className="text-[#8996AD]">You can modify any details before approving or rejecting this request. Changes will be saved when you click Save.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Customer Information */}
        <div>
          <h3 className="text-lg font-medium text-[#14E8B4] mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Customer Information
          </h3>
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
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Phone Number *</label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
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

        {/* Connection Details */}
        <div>
          <h3 className="text-lg font-medium text-[#14E8B4] mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Connection Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Package *</label>
              <select 
                name="package"
                value={formData.package}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                required
              >
                <option value="">Select Package</option>
                <option value="5 Mbps">5 Mbps - Rs. 1,500/month</option>
                <option value="10 Mbps">10 Mbps - Rs. 2,000/month</option>
                <option value="20 Mbps">20 Mbps - Rs. 2,500/month</option>
                <option value="30 Mbps">30 Mbps - Rs. 3,000/month</option>
                <option value="50 Mbps">50 Mbps - Rs. 4,000/month</option>
                <option value="100 Mbps">100 Mbps - Rs. 6,000/month</option>
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
              >
                <option value="">Select Area</option>
                <option value="Sector A">Sector A</option>
                <option value="Sector B">Sector B</option>
                <option value="Sector C">Sector C</option>
                <option value="Sector D">Sector D</option>
                <option value="Sector E">Sector E</option>
                <option value="Sector F">Sector F</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Installation Date *</label>
              <input 
                type="date" 
                name="installationDate"
                value={formData.installationDate}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Billing Date *</label>
              <input 
                type="number" 
                name="billingDate"
                value={formData.billingDate}
                onChange={handleChange}
                min="1" 
                max="28"
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
                required 
              />
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div>
          <h3 className="text-lg font-medium text-[#14E8B4] mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Financial Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Connection Fee (Rs) *</label>
              <input 
                type="number" 
                name="connectionFee"
                value={formData.connectionFee}
                onChange={handleChange}
                placeholder="One-time installation fee"
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Monthly Fee (Rs) *</label>
              <input 
                type="number" 
                name="monthlyFee"
                value={formData.monthlyFee}
                onChange={handleChange}
                placeholder="Recurring monthly charge"
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Concession (%)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  name="concession"
                  value={formData.concession}
                  onChange={handleChange}
                  placeholder="0"
                  min="0" 
                  max="100"
                  className="flex-1 px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
                />
                <button
                  type="button"
                  onClick={() => setShowConcessionSection(!showConcessionSection)}
                  className="px-3 py-2 bg-[#F6B93B] text-[#04231B] rounded-lg hover:bg-[#F7C86E] transition-colors"
                >
                  <Percent className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {showConcessionSection && (
            <div className="mt-4 p-4 bg-[#1B2540] border border-[#232D45] rounded-lg">
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Concession Reason</label>
              <textarea 
                name="concessionReason"
                value={formData.concessionReason}
                onChange={handleChange}
                rows={2}
                placeholder="Provide reason for concession (e.g., promotional offer, special discount, etc.)"
                className="w-full px-4 py-2 bg-[#121B2E] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
          )}
        </div>

        {/* Expense Details */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-[#14E8B4] flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Installation Expenses
            </h3>
            <button
              type="button"
              onClick={() => setShowExpenseSection(!showExpenseSection)}
              className="px-3 py-1 bg-[#4C8DFF] text-white rounded-lg hover:bg-[#3B7BD9] transition-colors text-sm"
            >
              {showExpenseSection ? 'Hide' : 'Add Expense'}
            </button>
          </div>

          {showExpenseSection && (
            <div className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg space-y-4">
              {expenses.map((expense, index) => (
                <div key={index} className="p-4 bg-[#121B2E] border border-[#232D45] rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-[#14E8B4]">Expense #{index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeExpense(index)}
                      className="p-2 text-[#F5514B] hover:bg-[#F5514B]/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#8996AD] mb-2">Expense Amount (Rs)</label>
                      <input 
                        type="number" 
                        value={expense.amount}
                        onChange={(e) => updateExpense(index, 'amount', e.target.value)}
                        placeholder="Total expense amount"
                        className="w-full px-4 py-2 bg-[#121B2E] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#8996AD] mb-2">Category</label>
                      <select 
                        value={expense.category}
                        onChange={(e) => updateExpense(index, 'category', e.target.value)}
                        className="w-full px-4 py-2 bg-[#121B2E] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                      >
                        <option value="">Select Category</option>
                        <option value="cable">Cable & Wiring</option>
                        <option value="equipment">Equipment</option>
                        <option value="labor">Labor</option>
                        <option value="transport">Transport</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#8996AD] mb-2">Inventory Items Used</label>
                      <input 
                        type="text" 
                        value={expense.inventoryItems}
                        onChange={(e) => updateExpense(index, 'inventoryItems', e.target.value)}
                        placeholder="e.g., 100m cable, 2 connectors, 1 router"
                        className="w-full px-4 py-2 bg-[#121B2E] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8996AD] mb-2">Expense Description</label>
                    <textarea 
                      value={expense.description}
                      onChange={(e) => updateExpense(index, 'description', e.target.value)}
                      rows={2}
                      placeholder="Detailed description of expenses incurred"
                      className="w-full px-4 py-2 bg-[#121B2E] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                    />
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addExpense}
                className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] rounded-lg hover:bg-[#20F0C0] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Another Expense
              </button>
              
              <div className="p-3 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg">
                <p className="text-xs text-[#F5514B]">
                  <strong>Note:</strong> Inventory items will be automatically deducted from stock when this connection is approved.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div>
          <h3 className="text-lg font-medium text-[#14E8B4] mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Additional Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Notes</label>
              <textarea 
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Any additional notes or special instructions"
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => navigate('/connections/pending')} 
              className="px-6 py-2 bg-[#1B2540] text-[#EAF0FB] rounded-lg hover:bg-[#232D45] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="px-6 py-2 bg-[#4C8DFF] text-white font-semibold rounded-lg hover:bg-[#3B7BD9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          
          <div className="border-t border-[#232D45] pt-4">
            <p className="text-sm text-[#8996AD] mb-3">After saving, you can approve or reject this request:</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleReject}
                className="flex items-center gap-2 px-6 py-2 bg-[#F5514B] text-white font-semibold rounded-lg hover:bg-[#E6403A] transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject Request
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="flex items-center gap-2 px-6 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Approve Request
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
