import { getSupabaseClient } from '../database/client';
import { CustomersRepository } from '../repositories/CustomersRepository';
import { InvoicesRepository } from '../repositories/InvoicesRepository';

const customersRepo = new CustomersRepository();
const invoicesRepo = new InvoicesRepository();
const supabase = getSupabaseClient();

export interface NotificationData {
  user_id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'reminder';
  title: string;
  message: string;
  action_url?: string;
  action_text?: string;
  related_id?: string;
  related_type?: string;
  is_read: boolean;
  expires_at?: number;
}

// Create notification for a user
export const createNotification = async (data: NotificationData): Promise<string> => {
  try {
    const { data: result, error } = await supabase
      .from('notifications')
      .insert({
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        action_url: data.action_url,
        action_text: data.action_text,
        related_id: data.related_id,
        related_type: data.related_type,
        is_read: false,
        expires_at: data.expires_at,
        created_at: Date.now()
      })
      .select('id')
      .limit(1);

    if (error) throw error;
    return result![0].id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Create notification for multiple users
export const createBulkNotifications = async (
  userIds: string[],
  notificationData: Omit<NotificationData, 'user_id'>
): Promise<void> => {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      action_url: notificationData.action_url,
      action_text: notificationData.action_text,
      related_id: notificationData.related_id,
      related_type: notificationData.related_type,
      is_read: false,
      expires_at: notificationData.expires_at,
      created_at: Date.now()
    }));

    await supabase.from('notifications').insert(notifications);
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

// Get notifications for a user
export const getUserNotifications = async (
  userId: string,
  unreadOnly: boolean = false,
  limit: number = 20
) => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: Date.now() })
      .eq('id', notificationId);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: Date.now() })
      .eq('user_id', userId)
      .eq('is_read', false);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Get unread count for a user
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
};

// Create reminder for unpaid bills
export const createUnpaidBillReminder = async (): Promise<void> => {
  try {
    const now = Date.now();
    const threeDaysFromNow = now + (3 * 24 * 60 * 60 * 1000);

    // Get all unpaid invoices due in the next 3 days
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('status', 'unpaid')
      .gte('due_date', now)
      .lte('due_date', threeDaysFromNow);

    if (error) throw error;

    for (const invoice of invoices) {
      // Get customer ID from invoice
      const customer = await customersRepo.findById(invoice.customer_id);
      if (!customer) continue;

      await createNotification({
        user_id: customer.uid,
        type: 'reminder',
        title: 'Payment Reminder',
        message: `Your invoice ${invoice.invoice_number} of Rs. ${invoice.total_amount || invoice.amount} is due on ${new Date(invoice.due_date).toLocaleDateString()}`,
        action_url: `/invoices/${invoice.id}`,
        action_text: 'View Invoice',
        related_id: invoice.id,
        related_type: 'invoice',
        is_read: false,
      });
    }
  } catch (error) {
    console.error('Error creating unpaid bill reminders:', error);
    throw error;
  }
};

// Create overdue bill notifications
export const createOverdueBillNotifications = async (): Promise<void> => {
  try {
    const now = Date.now();

    // Get all overdue invoices
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('status', 'overdue')
      .lt('due_date', now);

    if (error) throw error;

    for (const invoice of invoices) {
      const customer = await customersRepo.findById(invoice.customer_id);
      if (!customer) continue;

      await createNotification({
        user_id: customer.uid,
        type: 'warning',
        title: 'Overdue Invoice',
        message: `Your invoice ${invoice.invoice_number} of Rs. ${invoice.total_amount || invoice.amount} is overdue. Please make payment immediately.`,
        action_url: `/invoices/${invoice.id}`,
        action_text: 'Pay Now',
        related_id: invoice.id,
        related_type: 'invoice',
        is_read: false,
      });
    }
  } catch (error) {
    console.error('Error creating overdue bill notifications:', error);
    throw error;
  }
};

// Create system announcement notification for all users
export const createAnnouncementNotification = async (
  announcementId: string,
  announcementData: any
): Promise<void> => {
  try {
    // Get all users based on target
    let query = supabase
      .from('users')
      .select('uid')
      .eq('is_active', true);
    
    if (announcementData.target === 'staff') {
      query = query.eq('role', 'staff');
    } else if (announcementData.target === 'admin') {
      query = query.eq('role', 'admin');
    }

    const { data: users, error } = await query;
    if (error) throw error;
    const userIds = users.map(row => row.uid);

    await createBulkNotifications(userIds, {
      type: 'info',
      title: announcementData.title,
      message: announcementData.message,
      action_url: '/announcements',
      action_text: 'View Details',
      related_id: announcementId,
      related_type: 'announcement',
      is_read: false,
      expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000), // Expire in 7 days
    });
  } catch (error) {
    console.error('Error creating announcement notification:', error);
    throw error;
  }
};

// Create notification for new connection status
export const createConnectionStatusNotification = async (
  customerId: string,
  connectionId: string,
  status: string,
  customerName: string
): Promise<void> => {
  try {
    let title = 'Connection Update';
    let message = '';
    let type: 'info' | 'success' | 'warning' | 'error' = 'info';

    switch (status) {
      case 'approved':
        title = 'Connection Approved';
        message = 'Your connection request has been approved. Installation will be scheduled soon.';
        type = 'success';
        break;
      case 'rejected':
        title = 'Connection Rejected';
        message = 'Your connection request has been rejected. Please contact support for more information.';
        type = 'error';
        break;
      case 'completed':
        title = 'Connection Completed';
        message = 'Your internet connection has been successfully installed. You can now enjoy our services.';
        type = 'success';
        break;
      case 'in-progress':
        title = 'Installation In Progress';
        message = 'Your connection installation is currently in progress.';
        type = 'info';
        break;
      default:
        message = `Your connection status has been updated to: ${status}`;
    }

    const customer = await customersRepo.findById(customerId);
    if (!customer) return;

    await createNotification({
      user_id: customer.uid,
      type,
      title,
      message,
      action_url: '/connections',
      action_text: 'View Connection',
      related_id: connectionId,
      related_type: 'connection',
      is_read: false,
      expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000), // Expire in 30 days
    });
  } catch (error) {
    console.error('Error creating connection status notification:', error);
    throw error;
  }
};

// Create notification for complaint status update
export const createComplaintStatusNotification = async (
  customerId: string,
  complaintId: string,
  status: string,
  customerName: string
): Promise<void> => {
  try {
    let title = 'Complaint Update';
    let message = '';
    let type: 'info' | 'success' | 'warning' = 'info';

    switch (status) {
      case 'solved':
        title = 'Complaint Resolved';
        message = 'Your complaint has been resolved. Thank you for your patience.';
        type = 'success';
        break;
      case 'in-progress':
        title = 'Complaint In Progress';
        message = 'Your complaint is being investigated and worked on.';
        type = 'info';
        break;
      default:
        message = `Your complaint status has been updated to: ${status}`;
    }

    const customer = await customersRepo.findById(customerId);
    if (!customer) return;

    await createNotification({
      user_id: customer.uid,
      type,
      title,
      message,
      action_url: '/complaints',
      action_text: 'View Complaint',
      related_id: complaintId,
      related_type: 'complaint',
      is_read: false,
      expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000), // Expire in 30 days
    });
  } catch (error) {
    console.error('Error creating complaint status notification:', error);
    throw error;
  }
};

// Clean up expired notifications
export const cleanupExpiredNotifications = async (): Promise<number> => {
  try {
    const now = Date.now();

    const { count, error } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .lt('expires_at', now);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    return 0;
  }
};

