import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, DollarSign, Package, Receipt, Percent, FileText, AlertCircle, Plus, Trash2, Box } from 'lucide-react';
import { connectionsApi, inventoryApi } from '../services/api';

export default function ConnectionAdd() {
  const navigate = useNavigate();
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
    requestedBy: '', // Auto-filled with logged-in user
  });

  const [availableInventory, setAvailableInventory] = useState<any[]>([]);
  const [usedItems, setUsedItems] = useState<Array<{
    itemId: string;
    quantity: number;
  }>>([]);

  const [expenses, setExpenses] = useState<Array<{
    amount: string;
    category: string;
    description: string;
    inventoryItems: string;
  }>>([]);

  const [showExpenseSection, setShowExpenseSection] = useState(false);
  const [showInventorySection, setShowInventorySection] = useState(true);
  const [showConcessionSection, setShowConcessionSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    const res = await inventoryApi.getAll();
    if (res.success && Array.isArray(res.data)) {
      setAvailableInventory(res.data);
    }
  };

  const addUsedItem = () => {
    if (availableInventory.length === 0) return;
    setUsedItems([...usedItems, { itemId: availableInventory[0].id, quantity: 1 }]);
  };

  const removeUsedItem = (index: number) => {
    setUsedItems(usedItems.filter((_, i) => i !== index));
  };

  const updateUsedItem = (index: number, field: 'itemId' | 'quantity', value: any) => {
    const updated = [...usedItems];
    updated[index] = { ...updated[index], [field]: value };
    setUsedItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    const missing: string[] = [];
    if (!formData.name.trim()) missing.push('Full Name');
    if (!formData.phone.trim()) missing.push('Phone Number');
    if (!formData.cnic.trim()) missing.push('CNIC');
    if (!formData.address.trim()) missing.push('Address');
    if (!formData.area) missing.push('Area');
    if (!formData.package) missing.push('Package');
    if (!formData.installationDate) missing.push('Installation Date');
    if (!formData.billingDate) missing.push('Billing Date');
    if (!formData.connectionFee) missing.push('Connection Fee');
    if (!formData.monthlyFee) missing.push('Monthly Fee');

    if (missing.length > 0) {
      setError(`Please fill in all required fields: ${missing.join(', ')}`);
      return;
    }

    // Phone format check (at least 7 digits)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      setError('Phone Number must be at least 7 digits.');
      return;
    }

    // CNIC format check (13 digits, with or without dashes)
    const cnicDigits = formData.cnic.replace(/\D/g, '');
    if (cnicDigits.length !== 13) {
      setError('CNIC must be exactly 13 digits (e.g. 35202-1234567-1).');
      return;
    }

    // Numeric fee checks
    const connFee = Number(formData.connectionFee);
    const monFee = Number(formData.monthlyFee);
    if (isNaN(connFee) || connFee < 0) {
      setError('Connection Fee must be a valid non-negative number.');
      return;
    }
    if (isNaN(monFee) || monFee < 0) {
      setError('Monthly Fee must be a valid non-negative number.');
      return;
    }

    setLoading(true);

    const connectionData = {
      name: formData.name.trim(),
      fatherName: formData.fatherName.trim(),
      phone: formData.phone.trim(),
      cnic: formData.cnic.trim(),
      address: formData.address.trim(),
      area: formData.area,
      package: formData.package,
      installationDate: formData.installationDate,
      billingDate: formData.billingDate,
      connectionFee: connFee,
      monthlyFee: monFee,
      concession: Number(formData.concession) || 0,
      concessionReason: formData.concessionReason,
      usedItems: usedItems.map(item => ({
        itemId: item.itemId,
        quantity: Number(item.quantity)
      })),
      expenses: expenses.map(exp => ({
        amount: Number(exp.amount),
        category: exp.category,
        description: exp.description,
        inventoryItems: exp.inventoryItems
      })),
      notes: formData.notes,
      status: 'pending'
    };

    const result = await connectionsApi.create(connectionData);
    if (result.success) {
      navigate('/connections/pending');
    } else {
      // Backend validation returns { errors: [...] }; surface a clear message
      setError(result.error || 'Failed to submit connection request. Please check all fields.');
      setLoading(false);
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

  const calculatedTotalInstallationCost = usedItems.reduce((sum, item) => {
    const inv = availableInventory.find(i => i.id === item.itemId);
    const cost = Number(inv?.price || inv?.unitPrice || 0);
    return sum + (cost * (Number(item.quantity) || 0));
  }, 0);

  return (
    <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#EAF0FB]">New Connection Request</h2>
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
            <p className="font-semibold mb-1">Request will require admin approval</p>
            <p className="text-[#8996AD]">Upon approval: Connection Fee Invoice (PAID) will be created, stock automatically deducted, and installation expense recorded in ledger.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Used Inventory Items Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-[#14E8B4] flex items-center gap-2">
              <Box className="w-5 h-5" />
              Used Inventory Items (Meter / Unit Based Stock Deduction)
            </h3>
            <button
              type="button"
              onClick={addUsedItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14E8B4] text-[#04231B] rounded-lg hover:bg-[#20F0C0] transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Select Material / Equipment
            </button>
          </div>

          <div className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg space-y-4">
            {usedItems.length === 0 ? (
              <p className="text-sm text-[#8996AD] text-center py-4">No inventory items selected for this connection. Click "Select Material / Equipment" to add cables or routers used.</p>
            ) : (
              <div className="space-y-3">
                {usedItems.map((item, index) => {
                  const selectedInv = availableInventory.find(i => i.id === item.itemId);
                  const unitCost = Number(selectedInv?.price || selectedInv?.unitPrice || 0);
                  const unitType = selectedInv?.unit_type || 'piece';
                  const itemTotalCost = unitCost * item.quantity;

                  return (
                    <div key={index} className="flex flex-col md:flex-row items-center gap-3 p-3 bg-[#121B2E] border border-[#232D45] rounded-lg">
                      <div className="flex-1 w-full">
                        <label className="block text-xs text-[#8996AD] mb-1">Item</label>
                        <select
                          value={item.itemId}
                          onChange={(e) => updateUsedItem(index, 'itemId', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] text-sm"
                        >
                          {availableInventory.map(inv => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} (Stock: {inv.qty || inv.quantity || 0} {inv.unit_type || 'pcs'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full md:w-36">
                        <label className="block text-xs text-[#8996AD] mb-1">Quantity ({unitType}s)</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateUsedItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] text-sm"
                        />
                      </div>

                      <div className="w-full md:w-44 text-right">
                        <span className="block text-xs text-[#8996AD]">Calculated Cost Price</span>
                        <span className="text-sm font-semibold text-[#14E8B4]">Rs. {itemTotalCost.toLocaleString()}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeUsedItem(index)}
                        className="p-2 text-[#F5514B] hover:bg-[#F5514B]/10 rounded-lg transition-colors mt-4 md:mt-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                <div className="flex justify-between items-center pt-2 border-t border-[#232D45]">
                  <span className="text-sm text-[#8996AD]">Total Auto-Calculated Installation Cost:</span>
                  <span className="text-lg font-bold text-[#14E8B4]">Rs. {calculatedTotalInstallationCost.toLocaleString()}</span>
                </div>
              </div>
            )}
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
            <div className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg">
              <div className="flex items-center gap-2 text-sm text-[#8996AD]">
                <User className="w-4 h-4" />
                <span>Request submitted by: <strong className="text-[#EAF0FB]">Current User</strong></span>
              </div>
              <p className="text-xs text-[#5C6B85] mt-1">This information will be automatically tracked for audit purposes.</p>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
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
            disabled={loading}
            className="px-6 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
