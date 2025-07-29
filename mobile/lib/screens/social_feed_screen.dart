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
        'profilePic': item['followingId']['profilePic'],
      };
    }).toList();

    setState(() => _following = users);

    final now = DateTime.now();
    final mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

    
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
    _loadFeed();
  }
}

Future<void> _unfollowUser(String userIdToUnfollow) async {
  setState(() {
    _following.removeWhere((u) => u['id'] == userIdToUnfollow);
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
    _loadFeed(); 
  }
}

void _showFindFriendsModal() {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.black,
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
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Search users...',
              hintStyle: const TextStyle(color: Colors.grey),
              suffixIcon: IconButton(
                icon: const Icon(Icons.search, color: Colors.white),
                onPressed: () {
                  FocusScope.of(context).unfocus();
                  final query = _searchController.text.trim();
                  if (query.isNotEmpty) {
                    setState(() => _searchQuery = query);
                    _searchUsers();
                  }
                },
              ),
              filled: true,
              fillColor: Colors.grey[900],
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.white.withOpacity(0.12)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.white.withOpacity(0.12)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.white.withOpacity(0.25)),
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (_searching)
            const Center(child: CircularProgressIndicator())
          else if (_searchResults.isEmpty)
            const Text('No users found.', style: TextStyle(color: Colors.white70))
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
                final profilePic = user['profilePic'];
                final userIdToCheck = user['_id'] ?? user['id'];

                return StatefulBuilder(
                  builder: (context, setInnerState) {
                    bool isFollowing = _following.any((u) => u['id'] == userIdToCheck);

                    return Container(
                      margin: const EdgeInsets.symmetric(vertical: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white.withOpacity(0.12)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.white.withOpacity(0.04),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          profilePic != null
                              ? CircleAvatar(
                                  radius: 20,
                                  backgroundImage: NetworkImage(profilePic),
                                )
                              : CircleAvatar(
                                  radius: 20,
                                  backgroundColor: Colors.grey[800],
                                  child: Text(
                                    '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}',
                                    style: const TextStyle(color: Colors.white),
                                  ),
                                ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '$firstName $lastName',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                ),
                                Text(
                                  email,
                                  style: TextStyle(color: Colors.grey[400], fontSize: 13),
                                ),
                              ],
                            ),
                          ),
                          ElevatedButton(
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
                                      if (mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(content: Text('User unfollowed')),
                                        );
                                      }
                                    } else {
                                      await _followUser(userId);
                                      if (mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(content: Text('User followed successfully')),
                                        );
                                      }
                                    }
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: isFollowing ? Colors.black : Colors.white,
                              foregroundColor: isFollowing ? Colors.white : Colors.black,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              side: BorderSide(color: Colors.white.withOpacity(0.12)),
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                            ),
                            child: Text(isFollowing ? 'Unfollow' : 'Follow'),
                          ),
                        ],
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
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
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

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0x1FFFFFFF), width: 1),
      ),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              user['profilePic'] != null
                  ? CircleAvatar(
                      radius: 20,
                      backgroundImage: NetworkImage(user['profilePic']),
                    )
                  : CircleAvatar(
                      backgroundColor: Colors.grey[800],
                      radius: 20,
                      child: Text(
                        user['firstName'][0] + user['lastName'][0],
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${user['firstName']} ${user['lastName']}',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: Colors.white)),
                  Text('$dateDisplay • $mealType',
                      style: TextStyle(color: Colors.grey[400], fontSize: 13)),
                ],
              )
            ],
          ),
          const SizedBox(height: 12),
          if (meal['photo'] != null && meal['photo']['url'] != null)
            Container(
              margin: const EdgeInsets.symmetric(vertical: 8),
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                image: DecorationImage(
                  image: NetworkImage(meal['photo']['url']),
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ...foods.map((f) => Text(
                '${f['description']} • ${f['servingAmount']} ${f['servingUnit']}',
                style: const TextStyle(color: Colors.white70, fontSize: 14),
              )),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _macroColumn('Calories', '${total['calories']!.round()} kcal'),
              _macroColumn('Protein', '${total['protein']!.toStringAsFixed(1)}g'),
              _macroColumn('Carbs', '${total['carbs']!.toStringAsFixed(1)}g'),
              _macroColumn('Fat', '${total['fat']!.toStringAsFixed(1)}g'),
            ],
          )
        ],
      ),
    );
  }


  Drawer buildDrawer(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.black,
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(color: Colors.black),
            child: Text('Macros',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.rss_feed, color: Colors.white),
            title: const Text('Social Feed', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
            onTap: () => Navigator.pushReplacementNamed(context, '/social'),
          ),
          ListTile(
            leading: const Icon(Icons.restaurant, color: Colors.white),
            title: const Text('Food Log', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
            onTap: () => Navigator.pushReplacementNamed(context, '/food-log'),
          ),
          ListTile(
            leading: const Icon(Icons.person, color: Colors.white),
            title: const Text('Profile', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
            onTap: () => Navigator.pushReplacementNamed(context, '/profile'),
          ),
        ],
      ),
    );
  }
 


  
  @override
Widget build(BuildContext context) {
  return Scaffold(
    backgroundColor: Colors.black,
    appBar: AppBar(
      backgroundColor: Colors.black,
      foregroundColor: Colors.white,
      title: const Text(
        'Social Feed',
        style: TextStyle(fontWeight: FontWeight.bold),
      ),
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
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withOpacity(0.12), width: 1),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.white.withOpacity(0.04),
                        blurRadius: 10,
                        spreadRadius: 0,
                      )
                    ]
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Following',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (_following.isEmpty)
                        const Text(
                          'You are not following anyone yet.',
                          style: TextStyle(color: Colors.white),
                        ),
                        /// The rest of the code remains unchanged
/// ...

// Replace the _following.map section in your ListView with:
..._following.map((user) => Container(
  margin: const EdgeInsets.symmetric(vertical: 6),
  padding: const EdgeInsets.all(12),
  decoration: BoxDecoration(
    color: Colors.black,
    borderRadius: BorderRadius.circular(10),
    border: Border.all(color: Colors.white.withOpacity(0.12), width: 1),
    boxShadow: [
      BoxShadow(
        color: Colors.white.withOpacity(0.04),
        blurRadius: 8,
        spreadRadius: 0,
      )
    ]
  ),
  child: Row(
    children: [
      user['profilePic'] != null
          ? CircleAvatar(
              radius: 20,
              backgroundImage: NetworkImage(user['profilePic']),
            )
          : CircleAvatar(
              backgroundColor: Colors.grey[800],
              radius: 20,
              child: Text(
                '${user['firstName'][0]}${user['lastName'][0]}',
                style: const TextStyle(color: Colors.white),
              ),
            ),
      const SizedBox(width: 12),
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${user['firstName']} ${user['lastName']}',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
          Text(
            user['email'],
            style: TextStyle(
              color: Colors.grey[400],
              fontSize: 13,
            ),
          ),
        ],
      ),
    ],
  ),
)),


                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.person_add),
                        label: const Text('Find Friends'),
                        onPressed: _showFindFriendsModal,
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size.fromHeight(40),
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                          side: BorderSide(color: Colors.white.withOpacity(0.12), width: 1),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          elevation: 1,
                          shadowColor: Colors.white.withOpacity(0.05)
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const Padding(
                padding: EdgeInsets.only(left: 16.0, top: 0, bottom: 8),
                child: Text(
                  'Feed',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
              if (_feed.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24.0),
                    child: Text(
                      'No meals from people you follow.',
                      style: TextStyle(color: Colors.white),
                    ),
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

