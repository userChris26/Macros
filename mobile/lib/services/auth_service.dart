import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';

class AuthService {
  static const _storage = FlutterSecureStorage(); // for storing the JWT token

  Future<String?> login(String email, String password) async {
    final url = Uri.parse(ApiConstants.loginEndpoint);
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
    final url = Uri.parse(ApiConstants.registerEndpoint);
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
    await _storage.delete(key: 'jwt'); // delete the JWT token
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'jwt');
  }

  Future<String?> getUserId() async {
    final token = await getToken();
    if (token == null) return null;
    
    try {
      // JWT tokens have 3 parts separated by dots: header.payload.signature
      final parts = token.split('.');
      if (parts.length != 3) return null;
      
      // Decode the payload (second part)
      final payload = parts[1];
      // Add padding if needed for base64 decoding
      final normalized = base64Url.normalize(payload);
      final resp = utf8.decode(base64Url.decode(normalized));
      final payloadMap = json.decode(resp);
      
      return payloadMap['userId'];
    } catch (e) {
      print('Error decoding JWT: $e');
      return null;
    }
  }
} 