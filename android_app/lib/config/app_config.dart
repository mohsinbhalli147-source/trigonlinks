class AppConfig {
  // API Configuration
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://lightgreen-rhinoceros-358548.hostingersite.com/api',
  );
  
  // App Configuration
  static const String appName = 'TrigonLinks';
  static const String appVersion = '1.0.0';
  static const String companyWebsite = 'https://trigonlinks-pasrur.web.app';
  static const String supportEmail = 'support@trigonlinks.com';
  static const String supportPhone = '+92-307-7669999';
  static const String whatsappNumber = '+92-307-7669999';
  
  // Feature Flags
  static const bool enablePushNotifications = true;
  static const bool enableOfflineMode = true;
  static const bool enableSpeedTest = true;
  static const bool enablePdfDownload = true;
  
  // Cache Configuration
  static const int cacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  static const int maxCacheSize = 50 * 1024 * 1024; // 50MB
  
  // Request Timeout
  static const int connectionTimeout = 30000; // 30 seconds
  static const int receiveTimeout = 30000; // 30 seconds
  static const int sendTimeout = 30000; // 30 seconds
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  
  // File Upload
  static const int maxFileSize = 5 * 1024 * 1024; // 5MB
  static const List<String> allowedImageFormats = ['jpg', 'jpeg', 'png'];
}
