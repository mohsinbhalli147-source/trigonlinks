import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { newCustomersApi } from '../services/api';

interface Collection {
  id: string;
  customer_id: string;
  customer_name: string;
  payment_method: string;
  notes: string;
  amount: number;
  created_at: number;
}

export default function NewCustomersCollections() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    setError('');
    const result = await newCustomersApi.getCollections();
    if (result.success) {
      setCollections(result.data?.data || result.data || []);
    } else {
      setError(result.error || 'Unable to load collections.');
    }
    setLoading(false);
  };

  const filteredCollections = collections.filter(collection => {
    return (collection.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
           (collection.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase());
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;

    try {
      await newCustomersApi.deleteCollection(id);
      setCollections((prev) => prev.filter(c => c.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to delete collection.');
    }
  };

  const totalCollections = collections.reduce((sum, col) => sum + col.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading collections...</div>
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
        <h2 className="text-xl font-semibold text-[#EAF0FB]">New Customer Collections</h2>
        <button
          onClick={() => navigate('/new-customers/collections/add')}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Collection
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Total Collections</p>
          <p className="text-2xl font-bold text-[#EAF0FB]">Rs. {totalCollections.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Total Records</p>
          <p className="text-2xl font-bold text-[#EAF0FB]">{collections.length}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">This Month</p>
          <p className="text-2xl font-bold text-[#14E8B4]">Rs. {totalCollections.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
          <input
            type="text"
            placeholder="Search by customer or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Description</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Amount</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCollections.map((collection) => (
                <tr key={collection.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">{collection.customer_name}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{collection.notes}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{new Date(collection.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">Rs. {collection.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(collection.id)}
                        className="p-2 text-[#8996AD] hover:text-[#F5514B] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCollections.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#5C6B85]">
                    No collections found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-[#5C6B85]">
          Showing {filteredCollections.length} of {collections.length} collections
        </div>
      </div>
    </div>
  );
}
