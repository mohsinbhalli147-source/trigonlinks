import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../utils/constants.dart';

class ComplaintProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final StorageService _storageService = StorageService();
  
  bool _isLoading = false;
  bool _isSubmitting = false;
  String? _errorMessage;
  List<dynamic>? _complaints;
  int _totalComplaints = 0;
  
  // Getters
  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;
  List<dynamic>? get complaints => _complaints;
  int get totalComplaints => _totalComplaints;
  
  // Load complaints
  Future<void> loadComplaints({int page = 1, int limit = 20}) async {
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
      
      // Try to load from cache first
      if (page == 1) {
        final cachedComplaints = await _storageService.getComplaints();
        if (cachedComplaints != null) {
          _complaints = cachedComplaints;
          notifyListeners();
        }
      }
      
      final response = await _apiService.get(
        AppConstants.complaintEndpoint,
        queryParameters: {
          'page': page,
          'limit': limit,
          'customerId': uid,
        },
      );
      
      if (response.statusCode == 200) {
        _complaints = response.data['data'] ?? [];
        _totalComplaints = response.data['pagination']?['total'] ?? 0;
        
        // Cache first page
        if (page == 1) {
          await _storageService.saveComplaints(_complaints!);
        }
      } else {
        _errorMessage = response.data['error'] ?? AppConstants.serverErrorMessage;
      }
    } catch (e) {
      _errorMessage = e.toString().contains('error:') 
          ? e.toString().split('error: ')[1] 
          : AppConstants.serverErrorMessage;
      
      // If we have cached data, use it even on error
      if (_complaints == null && page == 1) {
        final cachedComplaints = await _storageService.getComplaints();
        if (cachedComplaints != null) {
          _complaints = cachedComplaints;
        }
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Create new complaint
  Future<bool> createComplaint({
    required String customerId,
    required String customerName,
    required String category,
    required String description,
    String? priority,
    String? attachment,
  }) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      final response = await _apiService.post(
        AppConstants.complaintEndpoint,
        data: {
          'customer_id': customerId,
          'customer_name': customerName,
          'category': category,
          'description': description,
          'priority': priority ?? 'medium',
          if (attachment != null) 'attachment': attachment,
        },
      );
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        // Reload complaints list
        await loadComplaints();
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
      _isSubmitting = false;
      notifyListeners();
    }
  }
  
  // Reopen complaint
  Future<bool> reopenComplaint(String complaintId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      final response = await _apiService.put(
        '${AppConstants.complaintEndpoint}/$complaintId',
        data: {
          'status': 'pending',
          'reopened_at': DateTime.now().millisecondsSinceEpoch,
        },
      );
      
      if (response.statusCode == 200) {
        await loadComplaints();
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
  
  // Rate complaint resolution
  Future<bool> rateComplaint(String complaintId, int rating) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      final response = await _apiService.put(
        '${AppConstants.complaintEndpoint}/$complaintId',
        data: {
          'rating': rating,
          'rated_at': DateTime.now().millisecondsSinceEpoch,
        },
      );
      
      if (response.statusCode == 200) {
        await loadComplaints();
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
