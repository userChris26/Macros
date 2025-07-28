import 'dart:convert';
import 'package:http/http.dart' as http;

class SocialService {
static Future<bool> followUser(String userIdToFollow, String myUserId, String token) async {
  final response = await http.post(
    Uri.parse('https://cop4331iscool.xyz/api/follow'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({
      'followerId': myUserId,
      'followingId': userIdToFollow,
    }),
  );
  return response.statusCode == 200;
}

static Future<bool> unfollowUser(String userIdToFollow, String myUserId, String token) async {
  final response = await http.delete(
    Uri.parse('https://cop4331iscool.xyz/api/follow'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({
      'followerId': myUserId,
      'followingId': userIdToFollow,
    }),
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
      return body['users']; 
    } else {
      return [];
    }
  }
  
}
