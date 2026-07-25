import { useState } from 'react';
import { Send, Users, MapPin, Calendar, Clock, Bell } from 'lucide-react';
import { announcementsApi } from '../services/api';
import { toast } from '../components/Toast';

export default function AnnouncementAdd() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetType:'all',
    targetArea: '',
    priority: 'normal',
    scheduledDate: '',
    scheduledTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const announcementData = {
      title: formData.title,
      message: formData.message,
      targetType: formData.targetType,
      targetArea: formData.targetArea,
      priority: formData.priority,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime
    };

    const result = await announcementsApi.create(announcementData);
    if (result.success) {
      toast.success('Announcement sent successfully!');
      setFormData({
        title: '',
        message: '',
        targetType: 'all',
        targetArea: '',
        priority: 'normal',
        scheduledDate: '',
        scheduledTime: ''
      });
    } else {
      setError(result.error || 'Failed to send announcement');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Add Announcement</h2>
        {error && (
          <div className="p-3 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg text-[#F5514B]">
            {error}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-[#8996AD]">
          <Bell className="w-4 h-4" />
          <span>Create new announcement</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Announcement Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                placeholder="Enter announcement title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Message *</label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                placeholder="Enter announcement message"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Target Audience *</label>
                <select
                  required
                  value={formData.targetType}
                  onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                >
                  <option value="all">All Users</option>
                  <option value="staff">Staff Only</option>
                  <option value="customers">Customers Only</option>
                  <option value="area">Specific Area</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {formData.targetType === 'area' && (
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Select Area *</label>
                <select
                  required
                  value={formData.targetArea}
                  onChange={(e) => setFormData({ ...formData, targetArea: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                >
                  <option value="">Select an area</option>
                  <option value="sector-a">Sector A</option>
                  <option value="sector-b">Sector B</option>
                  <option value="sector-c">Sector C</option>
                  <option value="sector-d">Sector D</option>
                  <option value="sector-e">Sector E</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Schedule (Optional)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Date</label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8996AD] mb-2">Time</label>
              <input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-[#1B2540] border border-[#232D45] rounded-lg">
            <p className="text-sm text-[#8996AD]">
              <Clock className="w-4 h-4 inline mr-2" />
              Leave empty to send immediately
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => setFormData({
              title: '',
              message: '',
              targetType: 'all',
              targetArea: '',
              priority: 'normal',
              scheduledDate: '',
              scheduledTime: ''
            })}
            className="px-6 py-2 bg-[#232D45] text-[#EAF0FB] rounded-lg hover:bg-[#2E3A52] transition-colors"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Sending...' : 'Send Announcement'}
          </button>
        </div>
      </form>
    </div>
  );
}
