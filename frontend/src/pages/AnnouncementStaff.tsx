import { useState, useEffect } from 'react';
import { Bell, Send, Trash2, Eye, Clock, Calendar, Filter, Search } from 'lucide-react';
import DateFilter, { DateFilterType } from '../components/DateFilter';
import { announcementsApi } from '../services/api';

export default function AnnouncementStaff() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError('');
    const result = await announcementsApi.getByTarget('staff');
    if (result.success) {
      const raw = result.data;
      setAnnouncements(Array.isArray(raw) ? raw : (raw?.data || []));
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
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'unread' && announcement.status === 'unread') ||
                         (selectedFilter === 'read' && announcement.status === 'read') ||
                         (selectedFilter === 'urgent' && announcement.priority === 'urgent');
    return matchesSearch && matchesFilter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-[#F5514B] bg-[#F5514B]/10';
      case 'important': return 'text-[#F6B93B] bg-[#F6B93B]/10';
      default: return 'text-[#14E8B4] bg-[#14E8B4]/10';
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
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Staff Announcements</h2>
        <div className="flex items-center gap-2 text-sm text-[#8996AD]">
          <Bell className="w-4 h-4" />
          <span>Internal communications</span>
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
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => (
          <div key={announcement.id} className={`bg-[#121B2E] border border-[#232D45] rounded-xl p-6 ${announcement.status === 'unread' ? 'border-l-4 border-l-[#14E8B4]' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={`text-lg font-semibold ${announcement.status === 'unread' ? 'text-[#EAF0FB]' : 'text-[#8996AD]'}`}>
                    {announcement.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                    {announcement.priority}
                  </span>
                  {announcement.status === 'unread' && (
                    <span className="w-2 h-2 bg-[#14E8B4] rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-[#8996AD] mb-3">{announcement.message}</p>
                <div className="flex items-center gap-4 text-xs text-[#5C6B85]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{announcement.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{announcement.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">From:</span>
                    <span>{announcement.sender}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button className="p-2 text-[#8996AD] hover:text-[#EAF0FB] transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 text-[#8996AD] hover:text-[#F5514B] transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAnnouncements.length === 0 && (
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-12 text-center">
          <Bell className="w-12 h-12 text-[#5C6B85] mx-auto mb-4" />
          <p className="text-[#8996AD]">No announcements found</p>
        </div>
      )}
    </div>
  );
}
