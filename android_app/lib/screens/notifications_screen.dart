import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/notification_provider.dart';
import '../config/theme.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final notificationProvider = context.read<NotificationProvider>();
      notificationProvider.loadNotifications();
      notificationProvider.loadUnreadCount();
    });
  }

  DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
    if (value is String) {
      final numeric = int.tryParse(value);
      if (numeric != null) return DateTime.fromMillisecondsSinceEpoch(numeric);
      try {
        return DateTime.parse(value);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final notificationProvider = context.watch<NotificationProvider>();
    final notifications = notificationProvider.notifications;
    final unreadCount = notificationProvider.unreadCount;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (unreadCount > 0)
            TextButton.icon(
              onPressed: () async {
                await context.read<NotificationProvider>().markAllAsRead();
              },
              icon: const Icon(Icons.mark_email_read, size: 18),
              label: const Text('Mark all read'),
            ),
        ],
      ),
      body: notificationProvider.isLoading && notifications == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async {
                final provider = context.read<NotificationProvider>();
                await provider.loadNotifications();
                await provider.loadUnreadCount();
              },
              child: notifications == null || notifications.isEmpty
                  ? _buildEmptyState()
                  : _buildNotificationsList(notifications),
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.notifications_none_outlined,
            size: 64,
            color: AppColors.textTertiary,
          ),
          const SizedBox(height: 16),
          Text(
            'No Notifications',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'You\'re all caught up!',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textTertiary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationsList(List<dynamic> notifications) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: notifications.length,
      itemBuilder: (context, index) {
        return _buildNotificationCard(notifications[index]);
      },
    );
  }

  Widget _buildNotificationCard(dynamic notification) {
    final id = notification['id']?.toString() ?? '';
    final title = notification['title'] ?? 'Notification';
    final message = notification['message'] ?? '';
    final type = notification['type'] ?? 'general';
    final isRead = notification['is_read'] ?? false;
    final createdAt = notification['created_at'];
    
    Color typeColor;
    IconData typeIcon;
    
    switch (type.toLowerCase()) {
      case 'bill':
      case 'payment':
        typeColor = AppColors.accent;
        typeIcon = Icons.receipt_long;
        break;
      case 'complaint':
      case 'support':
        typeColor = AppColors.primary;
        typeIcon = Icons.support_agent;
        break;
      case 'announcement':
        typeColor = AppColors.secondary;
        typeIcon = Icons.campaign;
        break;
      default:
        typeColor = AppColors.textTertiary;
        typeIcon = Icons.notifications;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: isRead ? null : AppColors.surfaceLight,
      child: InkWell(
        onTap: () async {
          if (!isRead) {
            await context.read<NotificationProvider>().markAsRead(id);
          }
          _showNotificationDetails(notification);
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: typeColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(typeIcon, color: typeColor, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                            ),
                          ),
                        ),
                        if (!isRead)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      message,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (createdAt != null) ...[
                      const SizedBox(height: 8),
                      Builder(builder: (context) {
                        final dt = _parseDate(createdAt);
                        if (dt == null) return const SizedBox.shrink();
                        return Text(
                          DateFormat('MMM dd, yyyy • HH:mm').format(dt),
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textTertiary,
                          ),
                        );
                      }),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 20),
                color: AppColors.textTertiary,
                onPressed: () async {
                  await context.read<NotificationProvider>().deleteNotification(id);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showNotificationDetails(dynamic notification) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(notification['title'] ?? 'Notification'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                notification['message'] ?? '',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
                if (notification['created_at'] != null)
                Text(
                  'Received: ${(() {
                    final dt = _parseDate(notification['created_at']);
                    return dt != null ? DateFormat('yyyy-MM-dd HH:mm:ss').format(dt) : '';
                  })()}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textTertiary,
                  ),
                ),
            ],
          ),
        ),
        actions: [
          if (notification['action_url'] != null)
            TextButton(
              onPressed: () {
                // Open action URL
              },
              child: const Text('Open Link'),
            ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
