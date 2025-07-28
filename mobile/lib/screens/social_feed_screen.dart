import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/social_service.dart';

class SocialFeedScreen extends StatefulWidget {
  const SocialFeedScreen({super.key});

  @override
  State<SocialFeedScreen> createState() => _SocialFeedScreenState();
}

class _SocialFeedScreenState extends State<SocialFeedScreen> {
  List<dynamic> _feed = [];
  List<dynamic> _following = [];
  List<dynamic> _searchResults = [];
  bool _loading = true;
  bool _searching = false;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadFeed();
  }


  Future<void> _loadFeed() async {
  final auth = Provider.of<AuthService>(context, listen: false);
  final token = await auth.getToken();
  final userId = await auth.getUserId();

  if (token == null || userId == null) return;

  try {
    final followingRes = await http.get(
      Uri.parse('https://cop4331iscool.xyz/api/following/$userId'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (followingRes.statusCode != 200) return;

    final data = jsonDecode(followingRes.body);
    final users = (data['following'] as List).map((item) {
      return {
        'id': item['followingId']['_id'],
        'firstName': item['followingId']['firstName'],
        'lastName': item['followingId']['lastName'],
        'email': item['followingId']['email'],
      };
    }).toList();

    setState(() => _following = users);

    final now = DateTime.now();
    final mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

    // ⚡ Parallelize all meal fetch requests
    List<Future<Map<String, dynamic>?>> requests = [];

    for (final user in users) {
      for (int i = 0; i < 7; i++) {
        final date = now.subtract(Duration(days: i)).toIso8601String().split('T')[0];
        for (final type in mealTypes) {
          final url = 'https://cop4331iscool.xyz/api/meal/${user['id']}/$date/$type';
          requests.add(http.get(Uri.parse(url)).then((res) {
            if (res.statusCode == 200) {
              final m = jsonDecode(res.body);
              if (m['success'] && m['meal'] != null) {
                final meal = Map<String, dynamic>.from(m['meal']);
                return {
                  ...meal,
                  'userData': user,
                };
              }
            }
            return null;
          }).catchError((_) => null));

        }
      }
    }

    final results = await Future.wait(requests);
    final allMeals = results.whereType<Map<String, dynamic>>().toList();

    // Sort meals by date, then by meal type
    allMeals.sort((a, b) {
      final dateCompare = DateTime.parse(b['date']).compareTo(DateTime.parse(a['date']));
      if (dateCompare != 0) return dateCompare;
      const order = {'breakfast': 0, 'lunch': 1, 'dinner': 2, 'snack': 3};
      return order[b['mealTime']]!.compareTo(order[a['mealTime']]!);
    });

    setState(() {
      _feed = allMeals;
      _loading = false;
    });
  } catch (e) {
    print('Feed error: $e');
  }
}


  Future<void> _searchUsers() async {
    setState(() => _searching = true);

    final auth = Provider.of<AuthService>(context, listen: false);
    final token = await auth.getToken();
    if (token == null) return;

    try {
      final response = await http.get(
        Uri.parse('https://cop4331iscool.xyz/api/users/search?q=$_searchQuery'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _searchResults = data['users'] ?? [];
        });
      } else {
        print('Error searching users: ${response.body}');
        setState(() => _searchResults = []);
      }
    } catch (e) {
      print('Search error: $e');
    }

    setState(() => _searching = false);
  }

  Future<void> _followUser(String userIdToFollow) async {
  setState(() {
    _following.add({'id': userIdToFollow}); // Optimistic add
  });

  final auth = Provider.of<AuthService>(context, listen: false);
  final token = await auth.getToken();
  final currentUserId = await auth.getUserId();
  if (token == null || currentUserId == null) return;

  final success = await SocialService.followUser(userIdToFollow, currentUserId, token);
  if (!success) {
    // Revert if failed
    setState(() {
      _following.removeWhere((u) => u['id'] == userIdToFollow);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Failed to follow user')),
    );
  } else {
    _loadFeed(); // Optional: refresh with backend truth
  }
}

Future<void> _unfollowUser(String userIdToUnfollow) async {
  setState(() {
    _following.removeWhere((u) => u['id'] == userIdToUnfollow); // Optimistic remove
  });

  final auth = Provider.of<AuthService>(context, listen: false);
  final token = await auth.getToken();
  final currentUserId = await auth.getUserId();
  if (token == null || currentUserId == null) return;

  final success = await SocialService.unfollowUser(userIdToUnfollow, currentUserId, token);
  if (!success) {
    // Revert if failed
    setState(() {
      _following.add({'id': userIdToUnfollow});
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Failed to unfollow user')),
    );
  } else {
    _loadFeed(); // Optional: refresh with backend truth
  }
}



  /*
  Future<void> _followUser(String userIdToFollow) async {
  final auth = Provider.of<AuthService>(context, listen: false);
  final token = await auth.getToken();
  final currentUserId = await auth.getUserId();
  if (token == null || currentUserId == null) return;

  final success = await SocialService.followUser(userIdToFollow, currentUserId, token);
  if (success) {
    await _loadFeed();
    _searchUsers(); // Refresh list
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Followed user!')),
    );
  }
}

Future<void> _unfollowUser(String userIdToUnfollow) async {
  final auth = Provider.of<AuthService>(context, listen: false);
  final token = await auth.getToken();
  final currentUserId = await auth.getUserId();
  if (token == null || currentUserId == null) return;

  final success = await SocialService.unfollowUser(userIdToUnfollow, currentUserId, token);
  if (success) {
    await _loadFeed();
    _searchUsers(); // Refresh list
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Unfollowed user!')),
    );
  }
}*/


  void _showFindFriendsModal() {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (context) => SingleChildScrollView(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        left: 16,
        right: 16,
        top: 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _searchController,
            onChanged: (val) => setState(() => _searchQuery = val),
            onSubmitted: (val) {
              setState(() => _searchQuery = val.trim());
              _searchUsers();
            },
            decoration: InputDecoration(
              hintText: 'Search users...',
              suffixIcon: IconButton(
                icon: const Icon(Icons.search),
                onPressed: () {
                  setState(() => _searchQuery = _searchController.text.trim());
                  _searchUsers();
                },
              ),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
          const SizedBox(height: 16),
          if (_searching)
            const Center(child: CircularProgressIndicator())
          else if (_searchResults.isEmpty)
            const Text('No users found.')
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _searchResults.length,
              itemBuilder: (context, index) {
                final user = _searchResults[index];
                final userId = user['id'] ?? '';
                final firstName = user['firstName'] ?? '';
                final lastName = user['lastName'] ?? '';
                final email = user['email'] ?? '';
                final userIdToCheck = user['_id'] ?? user['id'];

                return StatefulBuilder(
                  builder: (context, setInnerState) {
                    bool isFollowing = _following.any((u) => u['id'] == userIdToCheck);

                    return ListTile(
                      title: Text('$firstName $lastName'),
                      subtitle: Text(email),
                      trailing: ElevatedButton(
                        onPressed: userId.isEmpty
                            ? null
                            : () async {
                                setInnerState(() {
                                  if (isFollowing) {
                                    _following.removeWhere((u) => u['id'] == userIdToCheck);
                                  } else {
                                    _following.add({'id': userIdToCheck});
                                  }
                                });

                                if (isFollowing) {
                                  await _unfollowUser(userId);
                                  if(mounted){
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('User unfollowed')),
                                    );
                                  }
                                } else {
                                  await _followUser(userId);
                                  if(mounted){
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('User followed successfully')),
                                    );
                                  }
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isFollowing ? Colors.white : Colors.black,
                          foregroundColor: isFollowing ? Colors.black : Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                        ),
                        child: Text(isFollowing ? 'Unfollow' : 'Follow'),
                      ),
                    );
                  },
                );
              },
            ),
        ],
      ),
    ),
  );
}



  Widget _macroColumn(String label, String value) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildMealCard(dynamic meal) {
    final user = meal['userData'];
    final foods = List<Map<String, dynamic>>.from(meal['foods']);
    final date = DateTime.parse(meal['date']);
    final isToday = DateTime.now().toLocal().toString().split(' ')[0] == date.toLocal().toString().split(' ')[0];
    final dateDisplay = isToday ? 'Today' : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.weekday % 7];
    final mealType = meal['mealTime'].toString().capitalize();

    final total = foods.fold<Map<String, double>>({
      'calories': 0.0,
      'protein': 0.0,
      'carbs': 0.0,
      'fat': 0.0,
    }, (acc, food) {
      final nutrients = food['nutrients'] as Map<String, dynamic>;
      acc['calories'] = acc['calories']! + (nutrients['calories'] as num).toDouble();
      acc['protein'] = acc['protein']! + (nutrients['protein'] as num).toDouble();
      acc['carbs'] = acc['carbs']! + (nutrients['carbohydrates'] as num).toDouble();
      acc['fat'] = acc['fat']! + (nutrients['fat'] as num).toDouble();
      return acc;
    });

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  child: Text(user['firstName'][0] + user['lastName'][0]),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${user['firstName']} ${user['lastName']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text('$dateDisplay • $mealType')
                  ],
                )
              ],
            ),
            const SizedBox(height: 12),
            ...foods.map((f) => Text('${f['description']} • ${f['servingAmount']} ${f['servingUnit']}')),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _macroColumn('Calories', '${total['calories']!.round()} kcal'),
                _macroColumn('Protein', '${total['protein']!.toStringAsFixed(1)}g'),
                _macroColumn('Carbs', '${total['carbs']!.toStringAsFixed(1)}g'),
                _macroColumn('Fat', '${total['fat']!.toStringAsFixed(1)}g'),
              ],
            )
          ],
        ),
      ),
    );
  }

  Drawer buildDrawer(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(color: Colors.white),
            child: Text('Macros',
              style: TextStyle(
                color: Colors.black,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.rss_feed),
            title: const Text('Social Feed', style: TextStyle(fontWeight: FontWeight.bold)),
            onTap: () => Navigator.pushReplacementNamed(context, '/social'),
          ),
          ListTile(
            leading: const Icon(Icons.restaurant),
            title: const Text('Food Log', style: TextStyle(fontWeight: FontWeight.bold)),
            onTap: () => Navigator.pushReplacementNamed(context, '/food-log'),
          ),
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('Profile', style: TextStyle(fontWeight: FontWeight.bold)),
            onTap: () => Navigator.pushReplacementNamed(context, '/profile'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
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
              Navigator.pushReplacementNamed(context, '/');
            },
          ),
        ],
      ),
      drawer: buildDrawer(context),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.only(bottom: 16),
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
                  child: Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 3,
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Following', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 12),
                          if (_following.isEmpty)
                            const Text('You are not following anyone yet.'),
                          ..._following.map((user) => ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: CircleAvatar(
                                  child: Text('${user['firstName'][0]}${user['lastName'][0]}'),
                                ),
                                title: Text('${user['firstName']} ${user['lastName']}'),
                                subtitle: Text(user['email']),
                              )),
                          const SizedBox(height: 12),
                          ElevatedButton.icon(
                            icon: const Icon(Icons.person_add),
                            label: const Text('Find Friends'),
                            onPressed: _showFindFriendsModal,
                            style: ElevatedButton.styleFrom(minimumSize: const Size.fromHeight(40)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.only(left: 16.0, top: 0, bottom: 8),
                  child: Text('Feed', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ),
                if (_feed.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24.0),
                      child: Text('No meals from people you follow.'),
                    ),
                  )
                else
                  ..._feed.map((meal) => _buildMealCard(meal)).toList(),
              ],
            ),
    );
  }
}

extension on String {
  String capitalize() => isEmpty ? this : '${this[0].toUpperCase()}${substring(1)}';
}








/*
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/social_service.dart';

class SocialFeedScreen extends StatefulWidget {
  const SocialFeedScreen({super.key});

  @override
  State<SocialFeedScreen> createState() => _SocialFeedScreenState();
}

class _SocialFeedScreenState extends State<SocialFeedScreen> {
  List<dynamic> _feed = [];
  List<dynamic> _following = [];
  List<dynamic> _searchResults = [];
  bool _loading = true;
  bool _searching = false;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadFeed();
  }

  Future<void> _loadFeed() async {
    final auth = Provider.of<AuthService>(context, listen: false);
    final token = await auth.getToken();
    final userId = await auth.getUserId();

    if (token == null || userId == null) return;

    try {
      final followingRes = await http.get(
        Uri.parse('https://cop4331iscool.xyz/api/following/$userId'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (followingRes.statusCode != 200) return;

      final data = jsonDecode(followingRes.body);
      final users = (data['following'] as List).map((item) {
        return {
          'id': item['followingId']['_id'],
          'firstName': item['followingId']['firstName'],
          'lastName': item['followingId']['lastName'],
          'email': item['followingId']['email'],
        };
      }).toList();

      setState(() => _following = users);

      final List<dynamic> allMeals = [];
      final now = DateTime.now();
      final mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

      for (final user in users) {
        for (int i = 0; i < 7; i++) {
          final date = now.subtract(Duration(days: i)).toIso8601String().split('T')[0];
          for (final type in mealTypes) {
            final url = 'https://cop4331iscool.xyz/api/meal/${user['id']}/$date/$type';
            final mealRes = await http.get(Uri.parse(url));
            if (mealRes.statusCode == 200) {
              final m = jsonDecode(mealRes.body);
              if (m['success'] && m['meal'] != null) {
                allMeals.add({
                  ...m['meal'],
                  'userData': user,
                });
              }
            }
          }
        }
      }

      allMeals.sort((a, b) {
        final dateCompare = DateTime.parse(b['date']).compareTo(DateTime.parse(a['date']));
        if (dateCompare != 0) return dateCompare;
        const order = {'breakfast': 0, 'lunch': 1, 'dinner': 2, 'snack': 3};
        return order[b['mealTime']]!.compareTo(order[a['mealTime']]!);
      });

      setState(() {
        _feed = allMeals;
        _loading = false;
      });
    } catch (e) {
      print('Feed error: $e');
    }
  }


  Future<void> _searchUsers() async {
    setState(() => _searching = true);

    final auth = Provider.of<AuthService>(context, listen: false);
    final token = await auth.getToken();
    if (token == null) return;

    try {
      final response = await http.get(
        Uri.parse('https://cop4331iscool.xyz/api/users/search?q=$_searchQuery'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _searchResults = data['users'] ?? [];
        });
      } else {
        print('Error searching users: ${response.body}');
        setState(() => _searchResults = []);
      }
    } catch (e) {
      print('Search error: $e');
    }

    setState(() => _searching = false);
  }

  Future<void> _followUser(String userId) async {
    final auth = Provider.of<AuthService>(context, listen: false);
    final token = await auth.getToken();
    if (token == null) return;
    final success = await SocialService.followUser(userId, token);
    if (success) {
      await _loadFeed();
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Followed user!')),
      );
    }
  }

  void _showFindFriendsModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => SingleChildScrollView(
  padding: EdgeInsets.only(
    bottom: MediaQuery.of(context).viewInsets.bottom + 16,
    left: 16,
    right: 16,
    top: 16,
  ),
  child: Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      TextField(
        controller: _searchController,
        onChanged: (val) => setState(() => _searchQuery = val),
        onSubmitted: (val) {
          setState(() => _searchQuery = val.trim());
          _searchUsers();
        },
        decoration: InputDecoration(
          hintText: 'Search users...',
          suffixIcon: IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              setState(() => _searchQuery = _searchController.text.trim());
              _searchUsers();
            },
          ),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
      const SizedBox(height: 16),
      if (_searching)
        const Center(child: CircularProgressIndicator())
      else if (_searchResults.isEmpty)
        const Text('No users found.')
      else
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _searchResults.length,
          itemBuilder: (context, index) {
            final user = _searchResults[index];
            final alreadyFollowing = _following.any((u) => u['id'] == user['_id']);
            return ListTile(
              title: Text('${user['firstName']} ${user['lastName']}'),
              subtitle: Text(user['email']),
              trailing: ElevatedButton(
                onPressed: () => _followUser(user['_id']),
                child: Text(alreadyFollowing ? 'Unfollow' : 'Follow'),
              ),
            );
          },
        ),
    ],
  ),
),

    );
  }

  Widget _macroColumn(String label, String value) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildMealCard(dynamic meal) {
    final user = meal['userData'];
    final foods = List<Map<String, dynamic>>.from(meal['foods']);
    final date = DateTime.parse(meal['date']);
    final isToday = DateTime.now().toLocal().toString().split(' ')[0] == date.toLocal().toString().split(' ')[0];
    final dateDisplay = isToday ? 'Today' : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.weekday % 7];
    final mealType = meal['mealTime'].toString().capitalize();

    final total = foods.fold<Map<String, double>>({
      'calories': 0.0,
      'protein': 0.0,
      'carbs': 0.0,
      'fat': 0.0,
    }, (acc, food) {
      final nutrients = food['nutrients'] as Map<String, dynamic>;
      acc['calories'] = acc['calories']! + (nutrients['calories'] as num).toDouble();
      acc['protein'] = acc['protein']! + (nutrients['protein'] as num).toDouble();
      acc['carbs'] = acc['carbs']! + (nutrients['carbohydrates'] as num).toDouble();
      acc['fat'] = acc['fat']! + (nutrients['fat'] as num).toDouble();
      return acc;
    });

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  child: Text(user['firstName'][0] + user['lastName'][0]),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${user['firstName']} ${user['lastName']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text('$dateDisplay • $mealType')
                  ],
                )
              ],
            ),
            const SizedBox(height: 12),
            ...foods.map((f) => Text('${f['description']} • ${f['servingAmount']} ${f['servingUnit']}')),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _macroColumn('Calories', '${total['calories']!.round()} kcal'),
                _macroColumn('Protein', '${total['protein']!.toStringAsFixed(1)}g'),
                _macroColumn('Carbs', '${total['carbs']!.toStringAsFixed(1)}g'),
                _macroColumn('Fat', '${total['fat']!.toStringAsFixed(1)}g'),
              ],
            )
          ],
        ),
      ),
    );
  }

  Drawer buildDrawer(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(color: Colors.white),
            child: Text('Macros',
              style: TextStyle(
                color: Colors.black,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.rss_feed),
            title: const Text('Social Feed', style: TextStyle(fontWeight: FontWeight.bold)),
            onTap: () => Navigator.pushReplacementNamed(context, '/social'),
          ),
          ListTile(
            leading: const Icon(Icons.restaurant),
            title: const Text('Food Log', style: TextStyle(fontWeight: FontWeight.bold)),
            onTap: () => Navigator.pushReplacementNamed(context, '/food-log'),
          ),
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('Profile', style: TextStyle(fontWeight: FontWeight.bold)),
            onTap: () => Navigator.pushReplacementNamed(context, '/profile'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
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
              Navigator.pushReplacementNamed(context, '/');
            },
          ),
        ],
      ),
      drawer: buildDrawer(context),
      body: _loading
    ? const Center(child: CircularProgressIndicator())
    : ListView(
        padding: const EdgeInsets.only(bottom: 16),
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
            child: Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 3,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Following',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    if (_following.isEmpty)
                      const Text('You are not following anyone yet.'),
                    ..._following.map((user) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: CircleAvatar(
                            child: Text('${user['firstName'][0]}${user['lastName'][0]}'),
                          ),
                          title: Text('${user['firstName']} ${user['lastName']}'),
                          subtitle: Text(user['email']),
                        )),
                    const SizedBox(height: 12),
                    ElevatedButton.icon(
                      icon: const Icon(Icons.person_add),
                      label: const Text('Find Friends'),
                      onPressed: _showFindFriendsModal,
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size.fromHeight(40),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const Padding(
            padding: EdgeInsets.only(left: 16.0, top: 0, bottom: 8),
            child: Text(
              'Feed',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
          if (_feed.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(24.0),
                child: Text('No meals from people you follow.'),
              ),
            )
          else
            ..._feed.map((meal) => _buildMealCard(meal)).toList(),
        ],
      ),

    );
  }
}

extension on String {
  String capitalize() => isEmpty ? this : '${this[0].toUpperCase()}${substring(1)}';
}*/
