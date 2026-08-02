import 'package:flutter/material.dart';
import '../services/storage_service.dart';

class ThemeProvider with ChangeNotifier {
  final StorageService _storageService = StorageService();
  
  ThemeMode _themeMode = ThemeMode.dark;
  double _textScaleFactor = 1.0;
  
  // Getters
  ThemeMode get themeMode => _themeMode;
  double get textScaleFactor => _textScaleFactor;
  bool get isDarkMode => _themeMode == ThemeMode.dark;
  
  // Initialize theme from storage
  Future<void> initTheme() async {
    final savedTheme = await _storageService.getThemeMode();
    if (savedTheme != null) {
      _themeMode = savedTheme == 'light' ? ThemeMode.light : ThemeMode.dark;
    }
    notifyListeners();
  }
  
  // Toggle theme
  void toggleTheme() {
    _themeMode = _themeMode == ThemeMode.dark 
        ? ThemeMode.light 
        : ThemeMode.dark;
    _storageService.saveThemeMode(_themeMode == ThemeMode.light ? 'light' : 'dark');
    notifyListeners();
  }
  
  // Set specific theme
  void setThemeMode(ThemeMode mode) {
    _themeMode = mode;
    _storageService.saveThemeMode(mode == ThemeMode.light ? 'light' : 'dark');
    notifyListeners();
  }
  
  // Set text scale factor
  void setTextScaleFactor(double factor) {
    _textScaleFactor = factor.clamp(0.8, 1.3);
    notifyListeners();
  }
}
