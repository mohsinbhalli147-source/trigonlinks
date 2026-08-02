import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:permission_handler/permission_handler.dart';
import '../services/storage_service.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();
  
  final FlutterLocalNotificationsPlugin _localNotificationsPlugin = 
      FlutterLocalNotificationsPlugin();
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final StorageService _storageService = StorageService();
  
  // Notification channels
  static const String billsChannelId = 'bills_channel';
  static const String complaintsChannelId = 'complaints_channel';
  static const String announcementsChannelId = 'announcements_channel';
  static const String generalChannelId = 'general_channel';
  
  Future<void> initialize() async {
    // Request notification permissions
    await _requestPermissions();
    
    // Initialize local notifications
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    
    const InitializationSettings initializationSettings = 
        InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
    );
    
    await _localNotificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );
    
    // Create notification channels
    await _createNotificationChannels();
    
    // Initialize Firebase Messaging
    await _initializeFirebaseMessaging();
  }
  
  Future<void> _requestPermissions() async {
    // Android 13+ requires POST_NOTIFICATIONS permission
    if (defaultTargetPlatform == TargetPlatform.android) {
      final status = await Permission.notification.request();
      if (status.isGranted) {
        debugPrint('Notification permission granted');
      } else {
        debugPrint('Notification permission denied');
      }
    }
  }
  
  Future<void> _createNotificationChannels() async {
    const AndroidNotificationChannel billsChannel = AndroidNotificationChannel(
      billsChannelId,
      'Bills & Payments',
      description: 'Notifications about bills and payment reminders',
      importance: Importance.high,
      enableVibration: true,
      playSound: true,
    );
    
    const AndroidNotificationChannel complaintsChannel = AndroidNotificationChannel(
      complaintsChannelId,
      'Complaints & Support',
      description: 'Updates about your complaints and support tickets',
      importance: Importance.high,
      enableVibration: true,
      playSound: true,
    );
    
    const AndroidNotificationChannel announcementsChannel = AndroidNotificationChannel(
      announcementsChannelId,
      'Announcements',
      description: 'Service announcements and updates',
      importance: Importance.high,
      enableVibration: true,
      playSound: true,
    );
    
    const AndroidNotificationChannel generalChannel = AndroidNotificationChannel(
      generalChannelId,
      'General',
      description: 'General notifications',
      importance: Importance.default_,
      enableVibration: true,
      playSound: true,
    );
    
    await _localNotificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(billsChannel);
    
    await _localNotificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(complaintsChannel);
    
    await _localNotificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(announcementsChannel);
    
    await _localNotificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(generalChannel);
  }
  
  Future<void> _initializeFirebaseMessaging() async {
    // Request permission for iOS
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );
    
    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      debugPrint('User granted permission');
    } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
      debugPrint('User granted provisional permission');
    } else {
      debugPrint('User declined or has not accepted permission');
    }
    
    // Get FCM token
    final token = await _firebaseMessaging.getToken();
    if (token != null) {
      debugPrint('FCM Token: $token');
      await _storageService.saveFcmToken(token);
    }
    
    // Listen to token refresh
    _firebaseMessaging.onTokenRefresh.listen((token) {
      debugPrint('FCM Token refreshed: $token');
      _storageService.saveFcmToken(token);
    });
    
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    
    // Handle background messages
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);
  }
  
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('Received foreground message: ${message.notification?.title}');
    
    RemoteNotification? notification = message.notification;
    AndroidNotification? android = message.notification?.android;
    
    if (notification != null && android != null) {
      _localNotificationsPlugin.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _getChannelId(message.data['type'] ?? 'general'),
            notification.title ?? '',
            channelDescription: notification.body ?? '',
            icon: android.smallIcon,
            importance: Importance.high,
            priority: Priority.high,
          ),
        ),
        payload: message.data.toString(),
      );
    }
  }
  
  void _handleMessageOpenedApp(RemoteMessage message) {
    debugPrint('Message opened from background: ${message.notification?.title}');
    // Handle navigation based on message data
  }
  
  void _onNotificationTap(NotificationResponse response) {
    debugPrint('Notification tapped: ${response.payload}');
    // Handle navigation based on notification payload
  }
  
  String _getChannelId(String type) {
    switch (type.toLowerCase()) {
      case 'bill':
      case 'payment':
        return billsChannelId;
      case 'complaint':
      case 'support':
        return complaintsChannelId;
      case 'announcement':
        return announcementsChannelId;
      default:
        return generalChannelId;
    }
  }
  
  // Show local notification
  Future<void> showNotification({
    required String title,
    required String body,
    String? type,
    Map<String, dynamic>? payload,
  }) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      generalChannelId,
      'General',
      channelDescription: 'General notifications',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
    );
    
    const NotificationDetails platformChannelSpecifics =
        NotificationDetails(android: androidPlatformChannelSpecifics);
    
    await _localNotificationsPlugin.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      platformChannelSpecifics,
      payload: payload?.toString(),
    );
  }
  
  // Schedule notification
  Future<void> scheduleNotification({
    required String title,
    required String body,
    required DateTime scheduledDate,
    String? type,
    Map<String, dynamic>? payload,
  }) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      generalChannelId,
      'General',
      channelDescription: 'General notifications',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
    );
    
    const NotificationDetails platformChannelSpecifics =
        NotificationDetails(android: androidPlatformChannelSpecifics);
    
    await _localNotificationsPlugin.zonedSchedule(
      scheduledDate.millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      TZDateTime.from(scheduledDate, local),
      platformChannelSpecifics,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      payload: payload?.toString(),
    );
  }
  
  // Cancel notification
  Future<void> cancelNotification(int id) async {
    await _localNotificationsPlugin.cancel(id);
  }
  
  // Cancel all notifications
  Future<void> cancelAllNotifications() async {
    await _localNotificationsPlugin.cancelAll();
  }
  
  // Get FCM token
  Future<String?> getFcmToken() async {
    return await _firebaseMessaging.getToken();
  }
}

// Note: For scheduled notifications, you'll need to add timezone package
// import 'package:timezone/timezone.dart' as tz;
// import 'package:timezone/data/latest.dart' as tz;
// final local = tz.getLocation('Asia/Karachi');
