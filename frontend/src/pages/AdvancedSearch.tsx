import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { customersAdvancedApi } from '../services/api';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  User, 
  Phone, 
  MapPin, 
  Package, 
  Star,
  AlertCircle,
  Download,
  Save,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  area: string;
  status: string;
  package: string;
  fee: number;
  rating?: number;
  priority?: string;
  created_at: number;
  tags?: string[];
  labels?: string[];
}

interface SearchFilters {
  search_term?: string;
  status?: string;
  area?: string;
  package?: string;
  rating?: number;
  priority?: string;
  tags?: string[];
  labels?: string[];
  date_from?: string;
  date_to?: string;
}

export default function AdvancedSearch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allLabels, setAllLabels] = useState<string[]>([]);
  const [allAreas, setAllAreas] = useState<string[]>([]);
  const [allPackages, setAllPackages] = useState<string[]>([]);
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    loadReferenceData();
    loadSavedFilters();
  }, []);

  const loadReferenceData = async () => {
    try {
      const [tagsRes, savedFiltersRes] = await Promise.all([
        customersAdvancedApi.getAllTags(),
        customersAdvancedApi.getSavedFilters()
      ]);
      setAllTags((tagsRes.data as any[]).map((t: any) => t.tag_name));
      setSavedFilters(savedFiltersRes.data as any[]);
      
      // Extract unique areas and packages from results (will populate after first search)
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  };

  const loadSavedFilters = async () => {
    try {
      const res = await customersAdvancedApi.getSavedFilters();
      setSavedFilters(res.data);
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  };

  const executeSearch = async (page = 1) => {
    try {
      setLoading(true);
      const res = await customersAdvancedApi.search({
        ...filters,
        page,
        limit: pagination.limit
      });
      setResults(res.data.data);
      setPagination(res.data.pagination);
      
      // Extract unique areas and packages from results
      const areas = [...new Set((res.data.data as Customer[]).map((c: Customer) => c.area))];
      const packages = [...new Set((res.data.data as Customer[]).map((c: Customer) => c.package))];
      setAllAreas(areas);
      setAllPackages(packages);
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    executeSearch(1);
  };

  const clearFilters = () => {
    setFilters({});
    setResults([]);
    setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
  };

  const saveFilter = async () => {
    if (!filterName.trim()) {
      alert('Please enter a filter name');
      return;
    }

    try {
      await customersAdvancedApi.createSavedFilter({
        filter_name: filterName,
        filter_type: 'customer_search',
        filter_config: filters,
        is_default: false
      });
      setShowSaveModal(false);
      setFilterName('');
      loadSavedFilters();
      alert('Filter saved successfully');
    } catch (error) {
      console.error('Error saving filter:', error);
      alert('Failed to save filter');
    }
  };

  const loadSavedFilter = async (filter: any) => {
    setFilters(filter.filter_config);
    setShowFilters(true);
    handleSearch();
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
    'on-leave': 'bg-yellow-100 text-yellow-800'
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    normal: 'bg-gray-100 text-gray-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Advanced Search</h1>
          <p className="text-gray-600 mt-1">Search customers with advanced filters</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, mobile, or email..."
                value={filters.search_term || ''}
                onChange={(e) => setFilters({ ...filters, search_term: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>Search</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>Filters</span>
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Save className="w-5 h-5" />
              <span>Save</span>
            </button>
            {Object.keys(filters).length > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                <X className="w-5 h-5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Saved Filters</h3>
            <div className="flex flex-wrap gap-2">
              {savedFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => loadSavedFilter(filter)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100"
                >
                  <Filter className="w-4 h-4" />
                  <span>{filter.filter_name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Advanced Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="on-leave">On Leave</option>
                </select>
              </div>

              {/* Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                <select
                  value={filters.area || ''}
                  onChange={(e) => setFilters({ ...filters, area: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Areas</option>
                  {allAreas.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              {/* Package */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Package</label>
                <select
                  value={filters.package || ''}
                  onChange={(e) => setFilters({ ...filters, package: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Packages</option>
                  {allPackages.map((pkg) => (
                    <option key={pkg} value={pkg}>{pkg}</option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                <select
                  value={filters.rating || ''}
                  onChange={(e) => setFilters({ ...filters, rating: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any Rating</option>
                  <option value="1">1 Star+</option>
                  <option value="2">2 Stars+</option>
                  <option value="3">3 Stars+</option>
                  <option value="4">4 Stars+</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any Priority</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={filters.date_to || ''}
                    onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        const currentTags = filters.tags || [];
                        const newTags = currentTags.includes(tag)
                          ? currentTags.filter(t => t !== tag)
                          : [...currentTags, tag];
                        setFilters({ ...filters, tags: newTags });
                      }}
                      className={`px-3 py-1 rounded-full text-sm ${
                        (filters.tags || []).includes(tag)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Results ({pagination.total} customers found)
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    customersAdvancedApi.exportCSV({ customer_ids: results.map(r => r.id) })
                      .then((response: any) => {
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `customers-export-${Date.now()}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                      });
                  }}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{customer.name}</td>
                      <td className="px-4 py-3 text-gray-600">{customer.mobile}</td>
                      <td className="px-4 py-3 text-gray-600">{customer.area}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[customer.status as keyof typeof statusColors]}`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{customer.package}</td>
                      <td className="px-4 py-3">
                        {customer.rating !== undefined && (
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < (customer.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {customer.priority && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[customer.priority as keyof typeof priorityColors]}`}>
                            {customer.priority}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/customers/profile-advanced/${customer.id}`)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      if (pagination.page > 1) {
                        setPagination({ ...pagination, page: pagination.page - 1 });
                        executeSearch(pagination.page - 1);
                      }
                    }}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded">
                    {pagination.page}
                  </span>
                  <button
                    onClick={() => {
                      if (pagination.page < pagination.totalPages) {
                        setPagination({ ...pagination, page: pagination.page + 1 });
                        executeSearch(pagination.page + 1);
                      }
                    }}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {results.length === 0 && !loading && Object.keys(filters).length > 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No results found for your search</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Save Filter Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Save Filter</h3>
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter Name</label>
                    <input
                      type="text"
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter filter name..."
                    />
                  </div>
                  <div className="flex space-x-2 justify-end">
                    <button
                      onClick={() => setShowSaveModal(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveFilter}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
