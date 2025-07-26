import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import '../models/food_entry.dart';
import '../models/food_search_result.dart';
import 'auth_service.dart';

class FoodLogService {
  // search for foods
  Future<List<FoodSearchResult>> searchFoods(String query) async {
    final token = await AuthService().getToken();
    final url = Uri.parse('${ApiConstants.searchFoodsEndpoint}?query=${Uri.encodeComponent(query)}');
    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );
    print('Status: ${response.statusCode}');
    print('Body: ${response.body}');
    final data = jsonDecode(response.body);
    if (data['success'] == true) {
      final foodsList = data['foods'] as List;
      return foodsList.map((food) => FoodSearchResult.fromJson(food)).toList();
    } else {
      throw Exception(data['error'] ?? 'Failed to search foods');
    }
  }

  Future<List<FoodEntry>> fetchMealEntries(String userId, DateTime date, String mealType) async {
    final token = await AuthService().getToken();
    final url = Uri.parse('${ApiConstants.apiUrl}/meal/$userId/${date.toIso8601String().substring(0, 10)}/$mealType');
    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );
    print('Meal fetch [$mealType] status: ${response.statusCode}');
    print('Meal fetch [$mealType] body: ${response.body}');
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final meal = data['meal'];
      if (meal == null) return [];
      final foodsList = meal['foods'] as List;
      return foodsList.map((entry) => FoodEntry.fromJson(entry)).toList();
    } else {
      throw Exception('Failed to fetch $mealType entries');
    }
  }

  Future<void> addFoodEntry({
    required String userId,
    required int fdcId,
    required int servingAmount,
    required String mealType, // e.g., 'dinner'
    required DateTime date,
  }) async {
    final token = await AuthService().getToken();
    final response = await http.post(
      Uri.parse(ApiConstants.addFoodEndpoint),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'userId': userId,
        'fdcId': fdcId,
        'servingAmount': servingAmount,
        'mealType': mealType,
        'date': date.toIso8601String().substring(0, 10),
      }),
    );
    final data = jsonDecode(response.body);
    if (data['success'] != true) {
      throw Exception(data['error'] ?? 'Failed to add food entry');
    }
  }

  Future<void> deleteFoodEntry({
    required String userId,
    required String entryId,
  }) async {
    final token = await AuthService().getToken();
    final response = await http.post(
      Uri.parse(ApiConstants.deleteFoodEntryEndpoint),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'userId': userId,
        'entryId': entryId,
      }),
    );
    final data = jsonDecode(response.body);
    if (data['success'] != true) {
      throw Exception(data['error'] ?? 'Failed to delete food entry');
    }
  }

  Future<String?> fetchMealPhoto(String userId, DateTime date, String mealType) async {
    final token = await AuthService().getToken();
    final url = Uri.parse('${ApiConstants.apiUrl}/meal/$userId/${date.toIso8601String().substring(0, 10)}/$mealType');
    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final meal = data['meal'];
      return meal?['photo']?['url'];
    }
    return null;
  }

  Future<void> deleteMealPhoto(String userId, DateTime date, String mealType) async {
    final token = await AuthService().getToken();
    final response = await http.delete(
      Uri.parse('${ApiConstants.apiUrl}/meal/photo'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'userId': userId,
        'date': date.toIso8601String().substring(0, 10),
        'mealType': mealType,
      }),
    );
    final data = jsonDecode(response.body);
    if (data['success'] != true) {
      throw Exception(data['error'] ?? 'Failed to delete meal photo');
    }
  }
} 