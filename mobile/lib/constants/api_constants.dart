class ApiConstants {
  // Base URL for API endpoints
  static const String baseUrl = 'http://10.0.2.2:5000';
  static const String apiUrl = '$baseUrl/api';
  
  // API Endpoints
  static const String loginEndpoint = '$apiUrl/login';
  static const String registerEndpoint = '$apiUrl/register';
  static const String searchFoodsEndpoint = '$apiUrl/searchfoods';
  static const String getFoodEntriesEndpoint = '$apiUrl/getfoodentries';
  static const String addFoodEndpoint = '$apiUrl/addfood';
  static const String deleteFoodEntryEndpoint = '$apiUrl/deletefoodentry';
} 