import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/auth_service.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/food_log_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
        // Logout button, and go to home screen
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await Provider.of<AuthService>(context, listen: false).logout();
              Navigator.pushReplacementNamed(context, '/login');
            },
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Welcome to the Home Screen!'),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              icon: const Icon(Icons.restaurant_menu),
              label: const Text('Go to Food Log'),
              onPressed: () {
                Navigator.pushNamed(context, '/food-log');
              },
            ),
          ],
        ),
      ),
    );
  }
}

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  String _initialRoute = '/login'; // Default to login
  bool _checkingAuth = true;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }
  // check if user is logged in and decide which screen to show
  Future<void> _checkAuth() async {
    final authService = AuthService();
    final token = await authService.getToken();
    setState(() {
      _initialRoute = (token != null) ? '/home' : '/login';
      _checkingAuth = false;
    });
  }

  // build the app UI
  @override
  Widget build(BuildContext context) {
    if (_checkingAuth) {
      // Show splash/loading while checking auth
      return const MaterialApp(
        home: Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
      );
    }
    // PROVIDER WRAPS MaterialApp!
    return MultiProvider(
      providers: [
        Provider<AuthService>(create: (_) => AuthService()),
      ],
      child: MaterialApp(
        title: 'Macros Flutter',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        ),
        initialRoute: _initialRoute,
        routes: {
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/home': (context) => const HomeScreen(),
          '/food-log': (context) => const FoodLogScreen(),
        },
      ),
    );
  }
}
