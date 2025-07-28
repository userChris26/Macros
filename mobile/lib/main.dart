import 'package:flutter/material.dart';
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
        },
      ),
    );
  }
}



/*import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

class SocialFeedScreen extends StatelessWidget {
  const SocialFeedScreen({super.key});

  Drawer buildDrawer(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(color: Colors.black),
            child: Text('Macros', style: TextStyle(color: Colors.white, fontSize: 24)),
          ),
          ListTile(
            leading: const Icon(Icons.rss_feed),
            title: const Text('Social Feed'),
            onTap: () => Navigator.pushReplacementNamed(context, '/social'),
          ),
          ListTile(
            leading: const Icon(Icons.restaurant),
            title: const Text('Food Log'),
            onTap: () => Navigator.pushReplacementNamed(context, '/food-log'),
          ),
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('Profile'),
            onTap: () => Navigator.pushReplacementNamed(context, '/profile'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Social Feed'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.red),
            tooltip: 'Logout',
            onPressed: () async {
              final authService = Provider.of<AuthService>(context, listen: false);
              await authService.logout();
              Navigator.pushReplacementNamed(context, '/login');
            },
          ),
        ],
      ),
      drawer: isMobile ? buildDrawer(context) : null,
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Social Feed',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),
            if (isMobile)
              Expanded(
                child: ListView(
                  children: [
                    Center(
                      child: Column(
                        children: [
                          const Text('No meals from people you follow in the last 7 days.'),
                          const SizedBox(height: 24),
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('Following', style: TextStyle(fontWeight: FontWeight.bold)),
                                      TextButton(onPressed: () {}, child: const Text('Find Friends')),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  const Text("You're not following anyone yet."),
                                ],
                              ),
                            ),
                          )
                        ],
                      ),
                    ),
                  ],
                ),
              )
            else
              Expanded(
                child: Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: Center(
                        child: const Text('No meals from people you follow in the last 7 days.'),
                      ),
                    ),
                    const SizedBox(width: 32),
                    Expanded(
                      flex: 1,
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Following', style: TextStyle(fontWeight: FontWeight.bold)),
                                  TextButton(onPressed: () {}, child: const Text('Find Friends')),
                                ],
                              ),
                              const SizedBox(height: 16),
                              const Text("You're not following anyone yet."),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}*/



/*import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/auth_service.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/food_log_screen.dart';
import 'screens/profile_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  String _initialRoute = '/login';
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
      _initialRoute = (token != null) ? '/social' : '/login';
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
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/social': (context) => const SocialFeedScreen(),
          '/food-log': (context) => const FoodLogScreen(),
          '/profile': (context) => const ProfileScreen(),
        },
      ),
    );
  }
}

class SocialFeedScreen extends StatelessWidget {
  const SocialFeedScreen({super.key});

  Drawer buildDrawer(BuildContext context) {
    final authService = Provider.of<AuthService>(context, listen: false);

    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(color: Colors.black),
            child: Text('Macros', style: TextStyle(color: Colors.white, fontSize: 24)),
          ),
          ListTile(
            leading: const Icon(Icons.rss_feed),
            title: const Text('Social Feed'),
            onTap: () => Navigator.pushReplacementNamed(context, '/social'),
          ),
          ListTile(
            leading: const Icon(Icons.restaurant),
            title: const Text('Food Log'),
            onTap: () => Navigator.pushReplacementNamed(context, '/food-log'),
          ),
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('Profile'),
            onTap: () => Navigator.pushReplacementNamed(context, '/profile'),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Logout', style: TextStyle(color: Colors.red)),
            onTap: () async {
              await authService.logout();
              Navigator.pushReplacementNamed(context, '/login');
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      appBar: AppBar(title: const Text('Social Feed')),
      drawer: isMobile ? buildDrawer(context) : null,
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Social Feed',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),
            if (isMobile)
              Expanded(
                child: ListView(
                  children: [
                    Center(
                      child: Column(
                        children: [
                          const Text('No meals from people you follow in the last 7 days.'),
                          const SizedBox(height: 24),
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('Following', style: TextStyle(fontWeight: FontWeight.bold)),
                                      TextButton(onPressed: () {}, child: const Text('Find Friends')),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  const Text("You're not following anyone yet."),
                                ],
                              ),
                            ),
                          )
                        ],
                      ),
                    ),
                  ],
                ),
              )
            else
              Expanded(
                child: Row(
                  children: [
                    // Feed Column
                    Expanded(
                      flex: 2,
                      child: Center(
                        child: const Text('No meals from people you follow in the last 7 days.'),
                      ),
                    ),
                    const SizedBox(width: 32),
                    // Following Column
                    Expanded(
                      flex: 1,
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Following', style: TextStyle(fontWeight: FontWeight.bold)),
                                  TextButton(onPressed: () {}, child: const Text('Find Friends')),
                                ],
                              ),
                              const SizedBox(height: 16),
                              const Text("You're not following anyone yet."),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}*/



