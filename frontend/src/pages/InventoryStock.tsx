import { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, Search, Package } from 'lucide-react';
import { inventoryApi } from '../services/api';
import { toast } from '../components/Toast';

interface StockTransaction {
  id: string;
  itemName: string;
  sku: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  performedBy: string;
  date: string;
  notes: string;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  location: string;
}

export default function InventoryStock() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    itemId: '',
    type: 'in' as 'in' | 'out',
    quantity: 0,
    reason: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');

    const [inventoryResult, transactionsResult] = await Promise.all([
      inventoryApi.getAll(),
      inventoryApi.getTransactions({ limit: 100 }),
    ]);

    if (inventoryResult.success) {
      setInventory(inventoryResult.data.data || inventoryResult.data);
    } else {
      setError(inventoryResult.error || 'Failed to load inventory');
    }

    if (transactionsResult.success) {
      setTransactions(transactionsResult.data.data || transactionsResult.data);
    } else if (!error) {
      setError(transactionsResult.error || 'Failed to load inventory transactions');
    }

    setLoading(false);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.performedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleStockTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedItem = inventory.find(item => item.id === formData.itemId);
    if (!selectedItem) return;

    if (formData.type === 'out' && formData.quantity > selectedItem.quantity) {
      toast.info('Insufficient stock! Available: ' + selectedItem.quantity);
      return;
    }

    // Update inventory via API
    const newQuantity = formData.type === 'in' ? selectedItem.quantity + formData.quantity : selectedItem.quantity - formData.quantity;
    const result = await inventoryApi.createTransaction({
      itemId: formData.itemId,
      type: formData.type,
      quantity: formData.quantity,
      reason: formData.reason,
      notes: formData.notes,
    });
    
    if (result.success) {
      await loadData();
      setShowForm(false);
      setFormData({ itemId: '', type: 'in', quantity: 0, reason: '', notes: '' });
      toast.success('Stock transaction recorded successfully!');
    } else {
      toast.error(result.error || 'Failed to record inventory transaction');
    }
  };

  const totalIn = transactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.quantity, 0);
  const totalOut = transactions.filter(t => t.type === 'out').reduce((sum, t) => sum + t.quantity, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading inventory...</div>
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
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Stock In / Stock Out</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          {showForm ? 'Cancel' : 'New Transaction'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-[#4C8DFF]" />
            <p className="text-sm text-[#8996AD]">Total Transactions</p>
          </div>
          <p className="text-2xl font-bold text-[#EAF0FB]">{transactions.length}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <ArrowDown className="w-5 h-5 text-[#14E8B4]" />
            <p className="text-sm text-[#8996AD]">Stock In</p>
          </div>
          <p className="text-2xl font-bold text-[#14E8B4]">{totalIn}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <ArrowUp className="w-5 h-5 text-[#F5514B]" />
            <p className="text-sm text-[#8996AD]">Stock Out</p>
          </div>
          <p className="text-2xl font-bold text-[#F5514B]">{totalOut}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-[#F6B93B]" />
            <p className="text-sm text-[#8996AD]">Net Change</p>
          </div>
          <p className={`text-2xl font-bold ${totalIn - totalOut >= 0 ? 'text-[#14E8B4]' : 'text-[#F5514B]'}`}>
            {totalIn - totalOut >= 0 ? '+' : ''}{totalIn - totalOut}
          </p>
        </div>
      </div>

      {/* Transaction Form */}
      {showForm && (
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Record Stock Transaction</h3>
          <form onSubmit={handleStockTransaction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Select Item *</label>
                <select
                  value={formData.itemId}
                  onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                >
                  <option value="">Select an item</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku}) - Available: {item.quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Transaction Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'in' | 'out' })}
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                >
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Quantity *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="Enter quantity"
                  min="1"
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Reason *</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                >
                  <option value="">Select reason</option>
                  <option value="New Purchase">New Purchase</option>
                  <option value="Customer Installation">Customer Installation</option>
                  <option value="Replacement">Replacement</option>
                  <option value="Damage/Loss">Damage/Loss</option>
                  <option value="Return">Return</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Add any additional notes..."
                className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-[#232D45] text-[#8996AD] rounded-lg hover:text-[#EAF0FB] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
              >
                Record Transaction
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
            <input
              type="text"
              placeholder="Search by item, SKU, or staff name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Transactions</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Item</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Quantity</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Reason</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Performed By</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-semibold text-[#EAF0FB]">{transaction.itemName}</div>
                      <div className="text-sm text-[#8996AD] font-mono">{transaction.sku}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      transaction.type === 'in' 
                        ? 'bg-[#14E8B4]/20 text-[#14E8B4]' 
                        : 'bg-[#F5514B]/20 text-[#F5514B]'
                    }`}>
                      {transaction.type === 'in' ? (
                        <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUp className="w-3 h-3" />
                      )}
                      {transaction.type === 'in' ? 'Stock In' : 'Stock Out'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-[#EAF0FB]">{transaction.quantity}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{transaction.reason}</td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">{transaction.performedBy}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{transaction.date}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{transaction.notes || '-'}</td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5C6B85]">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-[#5C6B85]">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      </div>
    </div>
  );
}
