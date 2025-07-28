import 'package:flutter/material.dart';
import 'package:mobile/screens/sign_up_success_screen.dart';
import 'package:provider/provider.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/food_log_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/social_feed_screen.dart';
import 'services/auth_service.dart';
import 'screens/landing_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  String _initialRoute = '/';
  bool _checkingAuth = true;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final authService = AuthService();
    final token = await authService.getToken();
    setState(() {
      _initialRoute = (token != null) ? '/social' : '/';
      _checkingAuth = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_checkingAuth) {
      return const MaterialApp(
        home: Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    return MultiProvider(
      providers: [
        Provider<AuthService>(create: (_) => AuthService()),
      ],
      child: MaterialApp(
        title: 'Macros Flutter',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
          useMaterial3: true,
        ),
        initialRoute: _initialRoute,
        routes: {
          '/': (context) => const LandingScreen(),
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/social': (context) => const SocialFeedScreen(),
          '/food-log': (context) => const FoodLogScreen(),
          '/profile': (context) => const ProfileScreen(),
          '/signup-success' : (context) => const SignUpSuccessScreen(),
        },
      ),
    );
  }
}
