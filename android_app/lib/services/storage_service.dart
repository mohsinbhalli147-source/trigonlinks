import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../utils/constants.dart';

class StorageService {
  // SharedPreferences for simple key-value storage (non-sensitive data)
  Future<SharedPreferences> get _prefs async => await SharedPreferences.getInstance();
  
  // Flutter Secure Storage for sensitive data (tokens, auth)
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
  );
  
  // Hive boxes for complex data storage
  Box get _authBox => Hive.box('authBox');
  Box get _customerBox => Hive.box('customerBox');
  Box get _complaintBox => Hive.box('complaintBox');
  Box get _settingsBox => Hive.box('settingsBox');
  
  // Auth Token Management (Secure Storage)
  Future<void> saveAccessToken(String token) async {
    await _secureStorage.write(key: AppConstants.accessTokenKey, value: token);
  }
  
  Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: AppConstants.accessTokenKey);
  }
  
  Future<void> saveRefreshToken(String token) async {
    await _secureStorage.write(key: AppConstants.refreshTokenKey, value: token);
  }
  
  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: AppConstants.refreshTokenKey);
  }
  
  Future<void> clearAuthData() async {
    await _secureStorage.delete(key: AppConstants.accessTokenKey);
    await _secureStorage.delete(key: AppConstants.refreshTokenKey);
    await _authBox.clear();
  }
  
  // User Data Management
  Future<void> saveUserData(Map<String, dynamic> userData) async {
    await _authBox.put(AppConstants.userDataKey, userData);
  }
  
  Future<Map<String, dynamic>?> getUserData() async {
    return _authBox.get(AppConstants.userDataKey);
  }
  
  Future<void> clearUserData() async {
    await _authBox.delete(AppConstants.userDataKey);
  }
  
  // Customer Data Management
  Future<void> saveCustomerData(Map<String, dynamic> customerData) async {
    await _customerBox.put(AppConstants.customerDataKey, customerData);
  }
  
  Future<Map<String, dynamic>?> getCustomerData() async {
    return _customerBox.get(AppConstants.customerDataKey);
  }
  
  Future<void> clearCustomerData() async {
    await _customerBox.clear();
  }
  
  // Complaint Data Management (for offline support)
  Future<void> saveComplaints(List<dynamic> complaints) async {
    await _complaintBox.put('complaints_list', complaints);
    await _complaintBox.put('complaints_timestamp', DateTime.now().millisecondsSinceEpoch);
  }
  
  Future<List<dynamic>?> getComplaints() async {
    final timestamp = _complaintBox.get('complaints_timestamp');
    if (timestamp != null) {
      final age = DateTime.now().millisecondsSinceEpoch - timestamp;
      if (age > AppConstants.cacheMaxAge) {
        // Cache expired
        await _complaintBox.delete('complaints_list');
        await _complaintBox.delete('complaints_timestamp');
        return null;
      }
    }
    return _complaintBox.get('complaints_list');
  }
  
  Future<void> clearComplaints() async {
    await _complaintBox.clear();
  }
  
  // Settings Management
  Future<void> saveThemeMode(String themeMode) async {
    final prefs = await _prefs;
    await prefs.setString(AppConstants.themeModeKey, themeMode);
  }
  
  Future<String?> getThemeMode() async {
    final prefs = await _prefs;
    return prefs.getString(AppConstants.themeModeKey);
  }
  
  Future<void> saveLanguage(String language) async {
    final prefs = await _prefs;
    await prefs.setString(AppConstants.languageKey, language);
  }
  
  Future<String?> getLanguage() async {
    final prefs = await _prefs;
    return prefs.getString(AppConstants.languageKey);
  }
  
  // FCM Token Management
  Future<void> saveFcmToken(String token) async {
    final prefs = await _prefs;
    await prefs.setString(AppConstants.fcmTokenKey, token);
  }
  
  Future<String?> getFcmToken() async {
    final prefs = await _prefs;
    return prefs.getString(AppConstants.fcmTokenKey);
  }
  
  // Clear all data (logout)
  Future<void> clearAll() async {
    await clearAuthData();
    await clearUserData();
    await clearCustomerData();
    await clearComplaints();
  }
}
