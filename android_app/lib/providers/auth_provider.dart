import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../utils/constants.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final StorageService _storageService = StorageService();
  
  bool _isLoading = false;
  bool _isAuthenticated = false;
  String? _errorMessage;
  Map<String, dynamic>? _userData;
  
  // Getters
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  String? get errorMessage => _errorMessage;
  Map<String, dynamic>? get userData => _userData;
  
  // Check if user is logged in on initialization
  Future<void> checkAuthStatus() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final token = await _storageService.getAccessToken();
      final userData = await _storageService.getUserData();
      
      if (token != null && userData != null) {
        _isAuthenticated = true;
        _userData = userData;
      } else {
        _isAuthenticated = false;
        _userData = null;
      }
    } catch (e) {
      _isAuthenticated = false;
      _userData = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Customer Login with Username and CNIC
  Future<bool> customerLogin({
    required String username,
    required String cnic,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      final response = await _apiService.post(
        '${AppConstants.authEndpoint}/customer-login',
        data: {
          'username': username,
          'cnic': cnic,
        },
      );
      
      if (response.statusCode == 200) {
        final data = response.data;
        
        // Save tokens
        await _storageService.saveAccessToken(data['accessToken']);
        await _storageService.saveRefreshToken(data['refreshToken']);
        
        // Save user data
        final user = data['user'];
        await _storageService.saveUserData(user);
        
        _isAuthenticated = true;
        _userData = user;
        
        return true;
      } else {
        _errorMessage = data['error'] ?? AppConstants.serverErrorMessage;
        return false;
      }
    } catch (e) {
      _errorMessage = e.toString().contains('error:') 
          ? e.toString().split('error: ')[1] 
          : AppConstants.serverErrorMessage;
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Logout
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      // Call logout endpoint
      final refreshToken = await _storageService.getRefreshToken();
      if (refreshToken != null) {
        await _apiService.post(
          '${AppConstants.authEndpoint}/logout',
          data: {'refreshToken': refreshToken},
        );
      }
    } catch (e) {
      debugPrint('Logout API call failed: $e');
    } finally {
      // Clear local storage regardless of API call result
      await _storageService.clearAll();
      
      _isAuthenticated = false;
      _userData = null;
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Change Password
  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      final response = await _apiService.post(
        '${AppConstants.authEndpoint}/change-password',
        data: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );
      
      if (response.statusCode == 200) {
        return true;
      } else {
        _errorMessage = response.data['error'] ?? AppConstants.serverErrorMessage;
        return false;
      }
    } catch (e) {
      _errorMessage = e.toString().contains('error:') 
          ? e.toString().split('error: ')[1] 
          : AppConstants.serverErrorMessage;
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Clear error message
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
