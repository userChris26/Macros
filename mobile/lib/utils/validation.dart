class ValidationUtils {
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  }

  static String? validateRequired(String? value, String fieldName) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    return null;
  }

  static String? validateServingSize(String? value) {
    if (value == null || value.isEmpty) {
      return 'Serving size is required';
    }
    final size = double.tryParse(value);
    if (size == null || size <= 0) {
      return 'Please enter a valid serving size';
    }
    if (size > 10000) {
      return 'Serving size seems too large';
    }
    return null;
  }

  static String? validateSearchQuery(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter a food name to search';
    }
    if (value.trim().length < 2) {
      return 'Search query must be at least 2 characters';
    }
    return null;
  }
} 