import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { customersAdvancedApi, customersApi } from '../services/api';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Package, 
  CreditCard, 
  FileText, 
  Tag, 
  Tag as Label,
  Star, 
  AlertCircle,
  Clock,
  Download,
  Upload,
  Edit,
  Trash2,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Users,
  Activity,
  File,
  MessageSquare,
  Share2,
  Filter,
  Search
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  area: string;
  status: string;
  package: string;
  fee: number;
  rating?: number;
  priority?: string;
  last_activity_at?: number;
  created_at: number;
}

interface CustomerTag {
  id: string;
  tag_name: string;
  tag_color: string;
}

interface CustomerLabel {
  id: string;
  label_name: string;
  label_type: string;
  label_color: string;
}

interface CustomerNote {
  id: string;
  note_text: string;
  note_type: string;
  is_pinned: boolean;
  created_at: number;
  created_by?: string;
}

interface CustomerDocument {
  id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  uploaded_at: number;
}

interface Activity {
  id: string;
  activity_type: string;
  activity_title: string;
  activity_description?: string;
  created_at: number;
}

export default function CustomerProfileAdvanced() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [tags, setTags] = useState<CustomerTag[]>([]);
  const [labels, setLabels] = useState<CustomerLabel[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    loadCustomerData();
  }, [id]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      
      // Load customer basic info
      const customerRes = await customersApi.getById(id!);
      setCustomer(customerRes.data);

      // Load Phase 2 features
      const [tagsRes, labelsRes, notesRes, docsRes, activityRes] = await Promise.all([
        customersAdvancedApi.getTags(id!),
        customersAdvancedApi.getLabels(id!),
        customersAdvancedApi.getNotes(id!),
        customersAdvancedApi.getDocuments(id!),
        customersAdvancedApi.getActivity(id!, 20)
      ]);

      setTags(tagsRes.data);
      setLabels(labelsRes.data);
      setNotes(notesRes.data);
      setDocuments(docsRes.data);
      setActivities(activityRes.data);
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Customer not found</p>
          <button
            onClick={() => navigate('/customers/all')}
            className="text-blue-600 hover:underline"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/customers/all')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                <p className="text-sm text-gray-500">Customer Profile</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[customer.status as keyof typeof statusColors]}`}>
                {customer.status}
              </span>
              {customer.priority && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[customer.priority as keyof typeof priorityColors]}`}>
                  {customer.priority}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'billing', label: 'Billing', icon: CreditCard },
              { id: 'connections', label: 'Connections', icon: Share2 },
              { id: 'documents', label: 'Documents', icon: File },
              { id: 'notes', label: 'Notes', icon: FileText },
              { id: 'activity', label: 'Activity', icon: Activity },
              { id: 'tags', label: 'Tags & Labels', icon: Tag },
              { id: 'family', label: 'Family', icon: Users }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Customer Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Mobile</p>
                    <p className="font-medium">{customer.mobile}</p>
                  </div>
                </div>
                {customer.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{customer.email}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Area</p>
                    <p className="font-medium">{customer.area}</p>
                  </div>
                </div>
                {customer.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{customer.address}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Package</p>
                    <p className="font-medium">{customer.package}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Monthly Fee</p>
                    <p className="font-medium">Rs. {customer.fee}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Joined</p>
                    <p className="font-medium">{new Date(customer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {customer.rating !== undefined && (
                  <div className="flex items-center space-x-3">
                    <Star className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Rating</p>
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
                    </div>
                  </div>
                )}
                {customer.last_activity_at && (
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Last Activity</p>
                      <p className="font-medium">{new Date(customer.last_activity_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tags and Labels */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Tags & Labels</h2>
              <div className="space-y-3">
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                        style={{ backgroundColor: tag.tag_color + '20', color: tag.tag_color }}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag.tag_name}
                      </span>
                    ))}
                  </div>
                )}
                {labels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => (
                      <span
                        key={label.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                        style={{ backgroundColor: label.label_color + '20', color: label.label_color }}
                      >
                        <Label className="w-3 h-3 mr-1" />
                        {label.label_name}
                      </span>
                    ))}
                  </div>
                )}
                {tags.length === 0 && labels.length === 0 && (
                  <p className="text-gray-500 text-sm">No tags or labels assigned</p>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.activity_title}</p>
                        {activity.activity_description && (
                          <p className="text-sm text-gray-600">{activity.activity_description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Documents</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Upload className="w-4 h-4" />
                <span>Upload Document</span>
              </button>
            </div>
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <File className="w-10 h-10 text-blue-500" />
                      <div className="flex space-x-1">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-medium mt-3">{doc.document_name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{doc.document_type}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No documents uploaded yet</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Upload First Document
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Notes</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                <span>Add Note</span>
              </button>
            </div>
            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className={`bg-white rounded-lg shadow p-4 ${note.is_pinned ? 'border-l-4 border-blue-500' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-900">{note.note_text}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            note.note_type === 'important' ? 'bg-red-100 text-red-800' :
                            note.note_type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            note.note_type === 'info' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {note.note_type}
                          </span>
                          {note.is_pinned && (
                            <span className="text-xs text-blue-600 flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pinned
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(note.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-1 ml-4">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notes added yet</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add First Note
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Activity Timeline</h2>
            {activities.length > 0 ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={activity.id} className="flex items-start space-x-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        {index < activities.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-gray-900">{activity.activity_title}</p>
                        {activity.activity_description && (
                          <p className="text-sm text-gray-600 mt-1">{activity.activity_description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No activity recorded yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tags' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tags Section */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Tags</h2>
                  <button className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    <Plus className="w-4 h-4" />
                    <span>Add Tag</span>
                  </button>
                </div>
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{ backgroundColor: tag.tag_color + '20', color: tag.tag_color }}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag.tag_name}
                        <button className="ml-2 hover:opacity-70">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No tags assigned</p>
                )}
              </div>

              {/* Labels Section */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Labels</h2>
                  <button className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                    <Plus className="w-4 h-4" />
                    <span>Add Label</span>
                  </button>
                </div>
                {labels.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => (
                      <span
                        key={label.id}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{ backgroundColor: label.label_color + '20', color: label.label_color }}
                      >
                        <Label className="w-3 h-3 mr-1" />
                        {label.label_name}
                        <span className="text-xs opacity-70 ml-1">({label.label_type})</span>
                        <button className="ml-2 hover:opacity-70">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No labels assigned</p>
                )}
              </div>
            </div>

            {/* Rating and Priority */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Rating & Priority</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Rating</label>
                  <div className="flex items-center space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <button
                        key={i}
                        className={`w-8 h-8 rounded-full ${
                          i < (customer.rating || 0) ? 'bg-yellow-400 text-white' : 'bg-gray-200'
                        }`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                  <select
                    value={customer.priority || 'normal'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'family' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Family Account</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Users className="w-4 h-4" />
                <span>Create Family Account</span>
              </button>
            </div>
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No family account linked</p>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create Family Account
              </button>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Billing History</h2>
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Billing history coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Connections</h2>
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Share2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Connection history coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
