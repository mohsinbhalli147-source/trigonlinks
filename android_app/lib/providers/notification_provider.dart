import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';

class NotificationProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  bool _isLoading = false;
  String? _errorMessage;
  List<dynamic>? _notifications;
  int _unreadCount = 0;
  
  // Getters
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  List<dynamic>? get notifications => _notifications;
  int get unreadCount => _unreadCount;
  
  // Load notifications
  Future<void> loadNotifications({bool unreadOnly = false, int limit = 20}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      final response = await _apiService.get(
        AppConstants.notificationEndpoint,
        queryParameters: {
          'unreadOnly': unreadOnly.toString(),
          'limit': limit.toString(),
        },
      );
      
      if (response.statusCode == 200) {
        _notifications = response.data['notifications'] ?? [];
      } else {
        _errorMessage = response.data['error'] ?? AppConstants.serverErrorMessage;
      }
    } catch (e) {
      _errorMessage = e.toString().contains('error:') 
          ? e.toString().split('error: ')[1] 
          : AppConstants.serverErrorMessage;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Load unread count
  Future<void> loadUnreadCount() async {
    try {
      final response = await _apiService.get(
        '${AppConstants.notificationEndpoint}/unread-count',
      );
      
      if (response.statusCode == 200) {
        _unreadCount = response.data['count'] ?? 0;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Failed to load unread count: $e');
    }
  }
  
  // Mark notification as read
  Future<bool> markAsRead(String notificationId) async {
    try {
      final response = await _apiService.put(
        '${AppConstants.notificationEndpoint}/$notificationId/read',
      );
      
      if (response.statusCode == 200) {
        _unreadCount = _unreadCount > 0 ? _unreadCount - 1 : 0;
        await loadNotifications();
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Failed to mark notification as read: $e');
      return false;
    }
  }
  
  // Mark all notifications as read
  Future<bool> markAllAsRead() async {
    try {
      final response = await _apiService.put(
        '${AppConstants.notificationEndpoint}/read-all',
      );
      
      if (response.statusCode == 200) {
        _unreadCount = 0;
        await loadNotifications();
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Failed to mark all notifications as read: $e');
      return false;
    }
  }
  
  // Delete notification
  Future<bool> deleteNotification(String notificationId) async {
    try {
      final response = await _apiService.delete(
        '${AppConstants.notificationEndpoint}/$notificationId',
      );
      
      if (response.statusCode == 200) {
        await loadNotifications();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Failed to delete notification: $e');
      return false;
    }
  }
  
  // Clear error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
