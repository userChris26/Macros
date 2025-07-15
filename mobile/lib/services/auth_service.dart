import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class AuthService {
  static const _storage = FlutterSecureStorage();
  static const _baseUrl = 'http://10.0.2.2:5000'; // Change to your backend URL

  Future<String?> login(String email, String password) async {
    final url = Uri.parse('$_baseUrl/api/login');
    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userEmail': email, 'userPassword': password}),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('Login response: $data'); // debug
        final token = data['accessToken'];
        if (token != null) {
          await _storage.write(key: 'jwt', value: token);
          return null; // Success
        } else {
          return 'Invalid response from server.';
        }
      } else {
        final data = jsonDecode(response.body);
        return data['message'] ?? 'Login failed.';
      }
    } catch (e) {
      return 'An error occurred: $e';
    }
  }

  Future<void> logout() async {
    await _storage.delete(key: 'jwt');
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'jwt');
  }
} 