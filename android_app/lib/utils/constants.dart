class AppConstants {
  // App Info
  static const String appName = 'TrigonLinks';
  static const String appVersion = '1.0.0';
  
  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';
  static const String customerDataKey = 'customer_data';
  static const String themeModeKey = 'theme_mode';
  static const String languageKey = 'language';
  static const String fcmTokenKey = 'fcm_token';
  
  // Complaint Categories
  static const List<String> complaintCategories = [
    'Internet Down',
    'Slow Speed',
    'Billing Issue',
    'Router Issue',
    'New Request',
    'Other',
  ];
  
  // Complaint Priorities
  static const List<String> complaintPriorities = [
    'low',
    'medium',
    'high',
    'urgent',
  ];
  
  // Complaint Statuses
  static const List<String> complaintStatuses = [
    'pending',
    'in_progress',
    'resolved',
    'closed',
  ];
  
  // Connection Statuses
  static const List<String> connectionStatuses = [
    'active',
    'suspended',
    'pending',
    'inactive',
  ];
  
  // Invoice Statuses
  static const List<String> invoiceStatuses = [
    'paid',
    'unpaid',
    'partial',
  ];
  
  // API Endpoints
  static const String authEndpoint = '/auth';
  static const String customerEndpoint = '/customers';
  static const String complaintEndpoint = '/complaints';
  static const String invoiceEndpoint = '/invoices';
  static const String notificationEndpoint = '/notifications';
  
  // Error Messages
  static const String networkErrorMessage = 'Network error. Please check your connection.';
  static const String serverErrorMessage = 'Server error. Please try again later.';
  static const String unauthorizedMessage = 'Session expired. Please login again.';
  static const String notFoundMessage = 'Resource not found.';
  static const String validationErrorMessage = 'Invalid input. Please check your data.';
  
  // Success Messages
  static const String loginSuccessMessage = 'Login successful';
  static const String logoutSuccessMessage = 'Logged out successfully';
  static const String complaintCreatedMessage = 'Complaint submitted successfully';
  static const String profileUpdatedMessage = 'Profile updated successfully';
  static const String passwordChangedMessage = 'Password changed successfully';
  
  // Validation
  static const int minPasswordLength = 6;
  static const int maxPasswordLength = 128;
  static const int cnicLength = 13;
  static const int phoneLength = 11;
}
