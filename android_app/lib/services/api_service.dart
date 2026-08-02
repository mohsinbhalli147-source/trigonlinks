import 'package:dio/dio.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import 'package:flutter/foundation.dart';
import '../config/app_config.dart';
import '../utils/constants.dart';
import 'storage_service.dart';

class ApiService {
  late Dio _dio;
  final StorageService _storageService = StorageService();
  
  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.baseUrl,
      connectTimeout: const Duration(milliseconds: AppConfig.connectionTimeout),
      receiveTimeout: const Duration(milliseconds: AppConfig.receiveTimeout),
      sendTimeout: const Duration(milliseconds: AppConfig.sendTimeout),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));
    
    // Add interceptors
    _dio.interceptors.add(_authInterceptor);
    _dio.interceptors.add(_errorInterceptor);
    
    // Add logger in debug mode
    if (kDebugMode) {
      _dio.interceptors.add(
        PrettyDioLogger(
          requestHeader: true,
          requestBody: true,
          responseBody: true,
          responseHeader: false,
          error: true,
          compact: true,
        ),
      );
    }
  }
  
  // Auth Interceptor - Add access token to requests
  InterceptorsWrapper get _authInterceptor => InterceptorsWrapper(
    onRequest: (options, handler) async {
      final token = await _storageService.getAccessToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      return handler.next(options);
    },
    onError: (error, handler) async {
      // Handle 401 - Token expired, try to refresh
      if (error.response?.statusCode == 401) {
        try {
          final newToken = await _refreshToken();
          if (newToken != null) {
            // Retry the original request with new token
            final opts = error.requestOptions;
            opts.headers['Authorization'] = 'Bearer $newToken';
            final response = await _dio.fetch(opts);
            return handler.resolve(response);
          }
        } catch (e) {
          // Refresh failed, logout
          await _storageService.clearAuthData();
        }
      }
      return handler.next(error);
    },
  );
  
  // Error Interceptor - Handle common errors
  InterceptorsWrapper get _errorInterceptor => InterceptorsWrapper(
    onError: (error, handler) {
      String errorMessage = AppConstants.serverErrorMessage;
      
      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.sendTimeout) {
        errorMessage = AppConstants.networkErrorMessage;
      } else if (error.type == DioExceptionType.connectionError) {
        errorMessage = AppConstants.networkErrorMessage;
      } else if (error.response?.statusCode == 401) {
        errorMessage = AppConstants.unauthorizedMessage;
      } else if (error.response?.statusCode == 404) {
        errorMessage = AppConstants.notFoundMessage;
      } else if (error.response?.statusCode == 400) {
        errorMessage = AppConstants.validationErrorMessage;
      } else if (error.response?.data is Map && 
                 error.response?.data['error'] != null) {
        errorMessage = error.response?.data['error'];
      }
      
      error = DioException(
        requestOptions: error.requestOptions,
        response: error.response,
        type: error.type,
        error: errorMessage,
        message: errorMessage,
      );
      
      return handler.next(error);
    },
  );
  
  // Refresh access token
  Future<String?> _refreshToken() async {
    try {
      final refreshToken = await _storageService.getRefreshToken();
      if (refreshToken == null) return null;
      
      final response = await _dio.post(
        '${AppConfig.baseUrl}${AppConstants.authEndpoint}/refresh',
        data: {'refreshToken': refreshToken},
      );
      
      if (response.statusCode == 200 && response.data['accessToken'] != null) {
        final newAccessToken = response.data['accessToken'];
        final newRefreshToken = response.data['refreshToken'];
        
        await _storageService.saveAccessToken(newAccessToken);
        if (newRefreshToken != null) {
          await _storageService.saveRefreshToken(newRefreshToken);
        }
        
        return newAccessToken;
      }
    } catch (e) {
      debugPrint('Token refresh failed: $e');
    }
    return null;
  }
  
  // Generic GET request
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    return _dio.get(path, queryParameters: queryParameters);
  }
  
  // Generic POST request
  Future<Response> post(String path, {dynamic data}) async {
    return _dio.post(path, data: data);
  }
  
  // Generic PUT request
  Future<Response> put(String path, {dynamic data}) async {
    return _dio.put(path, data: data);
  }
  
  // Generic DELETE request
  Future<Response> delete(String path) async {
    return _dio.delete(path);
  }
  
  // Generic PATCH request
  Future<Response> patch(String path, {dynamic data}) async {
    return _dio.patch(path, data: data);
  }
  
  // Upload file
  Future<Response> uploadFile(String path, String filePath, {Map<String, dynamic>? data}) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
      ...?data,
    });
    return _dio.post(path, data: formData);
  }
  
  // Download file
  Future<Response> downloadFile(String path, String savePath) async {
    return _dio.download(path, savePath);
  }
}
