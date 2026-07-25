import { useState, useEffect } from 'react';
import { History, Search, Filter, Calendar, Clock, Eye, Trash2, Download, Bell, Users, MapPin } from 'lucide-react';
import DateFilter, { DateFilterType } from '../components/DateFilter';
import { announcementsApi } from '../services/api';

export default function AnnouncementHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError('');
    const result = await announcementsApi.getAll();
    if (result.success) {
      setAnnouncements(result.data?.data || []);
    } else {
      setError(result.error || 'Failed to load announcements');
    }
    setLoading(false);
  };

  const handleFilterChange = (filterType: DateFilterType, startDate?: Date, endDate?: Date) => {
  };

  const handleRefresh = () => {
    loadAnnouncements();
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const title = announcement?.title || '';
    const message = announcement?.message || '';
    const priority = announcement?.priority || 'normal';
    const type = announcement?.type || '';

    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'important' && priority === 'important') ||
                         (selectedFilter === 'urgent' && priority === 'urgent') ||
                         (selectedFilter === 'normal' && priority === 'normal');
    const matchesType = selectedType === 'all' || type === selectedType;
    return matchesSearch && matchesFilter && matchesType;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-[#F5514B] bg-[#F5514B]/10';
      case 'important': return 'text-[#F6B93B] bg-[#F6B93B]/10';
      default: return 'text-[#14E8B4] bg-[#14E8B4]/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'staff': return Bell;
      case 'customer': return Users;
      case 'area': return MapPin;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'staff': return 'text-[#4C8DFF]';
      case 'customer': return 'text-[#14E8B4]';
      case 'area': return 'text-[#F6B93B]';
      default: return 'text-[#8996AD]';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading announcements...</div>
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
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Announcement History</h2>
        <div className="flex items-center gap-2 text-sm text-[#8996AD]">
          <History className="w-4 h-4" />
          <span>All sent announcements</span>
        </div>
      </div>

      {/* Date Filter */}
      <DateFilter onFilterChange={handleFilterChange} onRefresh={handleRefresh} />

      {/* Search and Filter */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5C6B85]" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#5C6B85]" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="important">Important</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#5C6B85]" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Types</option>
              <option value="staff">Staff</option>
              <option value="customer">Customer</option>
              <option value="area">Area</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <History className="w-5 h-5 text-[#4C8DFF]" />
            <p className="text-sm text-[#8996AD]">Total Sent</p>
          </div>
          <p className="text-2xl font-bold text-[#EAF0FB]">{announcements.length}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-[#14E8B4]" />
            <p className="text-sm text-[#8996AD]">Total Recipients</p>
          </div>
          <p className="text-2xl font-bold text-[#14E8B4]">{announcements.reduce((sum, a) => sum + (a.recipients || 0), 0).toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-5 h-5 text-[#F6B93B]" />
            <p className="text-sm text-[#8996AD]">Staff Announcements</p>
          </div>
          <p className="text-2xl font-bold text-[#F6B93B]">{announcements.filter(a => a.type === 'staff').length}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-[#F5514B]" />
            <p className="text-sm text-[#8996AD]">Area Announcements</p>
          </div>
          <p className="text-2xl font-bold text-[#F5514B]">{announcements.filter(a => a.type === 'area').length}</p>
        </div>
      </div>

      {/* Announcements List */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#EAF0FB]">All Announcements</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Title</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Priority</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Recipients</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnnouncements.map((announcement) => {
                const TypeIcon = getTypeIcon(announcement.type);
                return (
                  <tr key={announcement.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                    <td className="py-3 px-4">
                      <TypeIcon className={`w-5 h-5 ${getTypeColor(announcement.type)}`} />
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-[#EAF0FB]">{announcement.title}</p>
                        <p className="text-xs text-[#8996AD] truncate max-w-xs">{announcement.message}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                        {announcement.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#EAF0FB]">{announcement.recipients}</td>
                    <td className="py-3 px-4 text-sm text-[#8996AD]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{announcement.date}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{announcement.time}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#14E8B4]/10 text-[#14E8B4]">
                        {announcement.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-[#8996AD] hover:text-[#EAF0FB] transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-[#8996AD] hover:text-[#F5514B] transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAnnouncements.length === 0 && (
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-12 text-center">
          <History className="w-12 h-12 text-[#5C6B85] mx-auto mb-4" />
          <p className="text-[#8996AD]">No announcements found</p>
        </div>
      )}
    </div>
  );
}
