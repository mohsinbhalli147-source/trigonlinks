import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../utils/constants.dart';

class CustomerProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final StorageService _storageService = StorageService();
  
  bool _isLoading = false;
  bool _isRefreshing = false;
  String? _errorMessage;
  Map<String, dynamic>? _customerData;
  List<dynamic>? _invoices;
  int _totalInvoices = 0;
  
  // Getters
  bool get isLoading => _isLoading;
  bool get isRefreshing => _isRefreshing;
  String? get errorMessage => _errorMessage;
  Map<String, dynamic>? get customerData => _customerData;
  List<dynamic>? get invoices => _invoices;
  int get totalInvoices => _totalInvoices;
  
  // Load customer data
  Future<void> loadCustomerData({bool forceRefresh = false}) async {
    if (forceRefresh) {
      _isRefreshing = true;
    } else {
      _isLoading = true;
    }
    _errorMessage = null;
    notifyListeners();
    
    try {
      final userData = await _storageService.getUserData();
      if (userData == null) {
        _errorMessage = 'User data not found';
        return;
      }
      
      final uid = userData['uid'];
      if (uid == null) {
        _errorMessage = 'User ID not found';
        return;
      }
      
      // Try to load from cache first if not forcing refresh
      if (!forceRefresh) {
        final cachedData = await _storageService.getCustomerData();
        if (cachedData != null) {
          _customerData = cachedData;
          notifyListeners();
        }
      }
      
      final response = await _apiService.get(
        '${AppConstants.customerEndpoint}/$uid',
      );
      
      if (response.statusCode == 200) {
        _customerData = response.data;
        await _storageService.saveCustomerData(_customerData!);
      } else {
        _errorMessage = response.data['error'] ?? AppConstants.serverErrorMessage;
      }
    } catch (e) {
      _errorMessage = e.toString().contains('error:') 
          ? e.toString().split('error: ')[1] 
          : AppConstants.serverErrorMessage;
      
      // If we have cached data, use it even on error
      if (_customerData == null) {
        final cachedData = await _storageService.getCustomerData();
        if (cachedData != null) {
          _customerData = cachedData;
        }
      }
    } finally {
      _isLoading = false;
      _isRefreshing = false;
      notifyListeners();
    }
  }
  
  // Load invoices
  Future<void> loadInvoices({int page = 1, int limit = 20}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      final userData = await _storageService.getUserData();
      if (userData == null) {
        _errorMessage = 'User data not found';
        return;
      }
      
      final uid = userData['uid'];
      if (uid == null) {
        _errorMessage = 'User ID not found';
        return;
      }
      
      final response = await _apiService.get(
        AppConstants.invoiceEndpoint,
        queryParameters: {
          'page': page,
          'limit': limit,
          'customerId': uid,
        },
      );
      
      if (response.statusCode == 200) {
        _invoices = response.data['data'] ?? [];
        _totalInvoices = response.data['pagination']?['total'] ?? 0;
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
  
  // Update customer profile
  Future<bool> updateProfile(Map<String, dynamic> updates) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      final userData = await _storageService.getUserData();
      if (userData == null) {
        _errorMessage = 'User data not found';
        return false;
      }
      
      final uid = userData['uid'];
      if (uid == null) {
        _errorMessage = 'User ID not found';
        return false;
      }
      
      final response = await _apiService.put(
        '${AppConstants.customerEndpoint}/$uid',
        data: updates,
      );
      
      if (response.statusCode == 200) {
        _customerData = response.data;
        await _storageService.saveCustomerData(_customerData!);
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
  
  // Clear error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
