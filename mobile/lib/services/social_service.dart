import 'dart:convert';
import 'package:http/http.dart' as http;

class SocialService {
  static Future<bool> followUser(String userId, String token) async {
    final res = await http.post(
      Uri.parse('https://cop4331iscool.xyz/api/follow/$userId'),
      headers: {'Authorization': 'Bearer $token'},
    );

    return res.statusCode == 200;
  }

  static Future<bool> unfollowUser(String userId, String token) async {
    final response = await http.post(
      Uri.parse('https://cop4331iscool.xyz/api/unfollow/$userId'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    return response.statusCode == 200;
  }
 

  static Future<List<dynamic>> searchUsers(String query, String token) async {
    final res = await http.get(
      Uri.parse('https://cop4331iscool.xyz/api/search?query=$query'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (res.statusCode == 200) {
      final body = jsonDecode(res.body);
      return body['users']; // Make sure your backend returns `users: [...]`
    } else {
      return [];
    }
  }
  
}
