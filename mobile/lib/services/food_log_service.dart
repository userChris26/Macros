import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import '../models/food_entry.dart';
import '../models/food_search_result.dart';

class FoodLogService {
  // search for foods
  Future<List<FoodSearchResult>> searchFoods(String query) async {
    final response = await http.post(
      Uri.parse(ApiConstants.searchFoodsEndpoint),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'query': query}),
    );
    final data = jsonDecode(response.body);
    if (data['success'] == true) {
      final foodsList = data['foods'] as List;
      return foodsList.map((food) => FoodSearchResult.fromJson(food)).toList();
    } else {
      throw Exception(data['error'] ?? 'Failed to search foods');
    }
  }

  Future<List<FoodEntry>> fetchFoodEntries(String userId, DateTime date) async {
    final response = await http.post(
      Uri.parse(ApiConstants.getFoodEntriesEndpoint),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'userId': userId,
        'date': date.toIso8601String().substring(0, 10), // 'yyyy-MM-dd'
      }),
    );
    final data = jsonDecode(response.body);
    if (data['success'] == true) {
      final entriesList = data['foodEntries'] as List;
      return entriesList.map((entry) => FoodEntry.fromJson(entry)).toList();
    } else {
      throw Exception(data['error'] ?? 'Failed to fetch food entries');
    }
  }

  Future<void> addFoodEntry({
    required String userId,
    required String fdcId,
    required int servingSize,
    required DateTime date,
  }) async {
    final response = await http.post(
      Uri.parse(ApiConstants.addFoodEndpoint),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'userId': userId,
        'fdcId': fdcId,
        'servingSize': servingSize,
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
    final response = await http.post(
      Uri.parse(ApiConstants.deleteFoodEntryEndpoint),
      headers: {'Content-Type': 'application/json'},
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
} 