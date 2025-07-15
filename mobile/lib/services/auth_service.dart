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
        final token = data['accessToken'];
        if (token != null) {
          await _storage.write(key: 'jwt', value: token);
          return null; // Success
        } else if (data['error'] != null && data['error'].isNotEmpty) {
          return data['error']; // Show backend error
        } else {
          return 'Login failed.';
        }
      } else {
        try {
          final data = jsonDecode(response.body);
          return data['error'] ?? data['message'] ?? 'Login failed.';
        } catch (e) {
          return 'Invalid response from server.';
        }
      }
    } catch (e) {
      return 'An error occurred: $e';
    }
  }

  Future<String?> register(String email, String password, String firstName, String lastName) async {
    final url = Uri.parse('$_baseUrl/api/register');
    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userEmail': email,
          'userPassword': password,
          'userFirstName': firstName,
          'userLastName': lastName,
        }),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['error'] == '') {
          return null; // Success
        } else {
          return data['error'] ?? 'Registration failed.';
        }
      } else {
        final data = jsonDecode(response.body);
        return data['error'] ?? 'Registration failed.';
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