import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import '../services/auth_service.dart';
import '../constants/api_constants.dart';
import '../widgets/loading_widget.dart';
import '../widgets/error_widget.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool loading = false;
  bool saving = false;
  String? errorMessage;
  Map<String, dynamic>? userInfo;
  Map<String, int> stats = {'following': 0, 'followers': 0};
  
  // Controllers for editable fields
  final TextEditingController firstNameController = TextEditingController();
  final TextEditingController lastNameController = TextEditingController();
  final TextEditingController bioController = TextEditingController();
  
  // Track if any changes were made
  bool hasChanges = false;


  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  @override
  void dispose() {
    firstNameController.dispose();
    lastNameController.dispose();
    bioController.dispose();
    super.dispose();
  }

  Future<void> _loadProfileData() async {
    setState(() {
      loading = true;
      errorMessage = null;
    });

    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final token = await authService.getToken();
      if (token == null) {
        setState(() {
          errorMessage = 'User not logged in.';
          loading = false;
        });
        return;
      }

      // Decode user info from JWT token
      final parts = token.split('.');
      if (parts.length == 3) {
        final payload = parts[1];
        final normalized = base64Url.normalize(payload);
        final resp = utf8.decode(base64Url.decode(normalized));
        final payloadMap = json.decode(resp);
        
        setState(() {
          userInfo = {
            'userId': payloadMap['userId'],
            'firstName': payloadMap['firstName'],
            'lastName': payloadMap['lastName'],
            'email': payloadMap['email'],
            'profilePic': payloadMap['profilePic'],
            'bio': payloadMap['bio'],
          };
          
          // Initialize controllers with current values
          firstNameController.text = payloadMap['firstName'] ?? '';
          lastNameController.text = payloadMap['lastName'] ?? '';
          bioController.text = payloadMap['bio'] ?? '';
          
          // Add listeners to track changes
          firstNameController.addListener(_onFieldChanged);
          lastNameController.addListener(_onFieldChanged);
          bioController.addListener(_onFieldChanged);
        });
      }



      // Load follower/following stats
      await _loadStats();
      
      setState(() {
        loading = false;
      });
    } catch (e) {
      setState(() {
        errorMessage = 'Failed to load profile: $e';
        loading = false;
      });
    }
  }

  Future<void> _loadStats() async {
    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final userId = await authService.getUserId();
      if (userId == null) return;

      final response = await http.get(
        Uri.parse('${ApiConstants.apiUrl}/dashboard/stats/$userId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await authService.getToken()}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['stats'] != null) {
          setState(() {
            stats = {
              'following': data['stats']['following'] ?? 0,
              'followers': data['stats']['followers'] ?? 0,
            };
          });
        }
      }
    } catch (e) {
      print('Error loading stats: $e');
      // Don't show error for stats, just use defaults
    }
  }

  void _onFieldChanged() {
    if (!loading) {
      setState(() {
        hasChanges = firstNameController.text != (userInfo?['firstName'] ?? '') ||
                    lastNameController.text != (userInfo?['lastName'] ?? '') ||
                    bioController.text != (userInfo?['bio'] ?? '');
      });
    }
  }

  Future<void> _saveChanges() async {
    setState(() {
      saving = true;
      errorMessage = null;
    });

    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final userId = await authService.getUserId();
      if (userId == null) {
        setState(() {
          errorMessage = 'User not logged in.';
          saving = false;
        });
        return;
      }

      // Validate required fields
      if (firstNameController.text.trim().isEmpty) {
        setState(() {
          errorMessage = 'First name is required.';
          saving = false;
        });
        return;
      }

      if (lastNameController.text.trim().isEmpty) {
        setState(() {
          errorMessage = 'Last name is required.';
          saving = false;
        });
        return;
      }

      // Call API to update user profile
      final url = '${ApiConstants.apiUrl}/user/$userId';
      final body = jsonEncode({
        'firstName': firstNameController.text.trim(),
        'lastName': lastNameController.text.trim(),
        'bio': bioController.text.trim(),
      });
      
      print('Profile update request:');
      print('URL: $url');
      print('Body: $body');
      
      final response = await http.put(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await authService.getToken()}',
        },
        body: body,
      );

      print('Profile update response:');
      print('Status: ${response.statusCode}');
      print('Body: ${response.body}');
      
      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && (data['error'] == '' || data['error'] == null)) {
        // Update local user info
        setState(() {
          userInfo = {
            ...userInfo!,
            'firstName': firstNameController.text.trim(),
            'lastName': lastNameController.text.trim(),
            'bio': bioController.text.trim(),
          };
          hasChanges = false;
          saving = false;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully!')),
        );
      } else {
        setState(() {
          errorMessage = data['error'] ?? 'Failed to update profile.';
          saving = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Failed to update profile: $e';
        saving = false;
      });
    }
  }





  Future<void> _pickProfileImage() async {
    final ImagePicker picker = ImagePicker();
    
    final source = await showDialog<ImageSource>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Image Source'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Camera'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Gallery'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );

    if (source == null) return;

    try {
      final XFile? image = await picker.pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 80,
        preferredCameraDevice: CameraDevice.front, // Try front camera for emulator
      );

      if (image != null) {
        await _uploadProfileImage(image);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to pick image: $e')),
      );
    }
  }

  Future<void> _uploadProfileImage(XFile image) async {
    setState(() {
      loading = true;
      errorMessage = null;
    });

    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final userId = await authService.getUserId();
      if (userId == null) {
        setState(() {
          errorMessage = 'User not logged in.';
          loading = false;
        });
        return;
      }

      // Convert image to base64
      final bytes = await image.readAsBytes();
      final base64Image = base64Encode(bytes);

      final response = await http.post(
        Uri.parse('${ApiConstants.apiUrl}/upload-profile-pic/$userId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await authService.getToken()}',
        },
        body: jsonEncode({
          'photoBase64': 'data:image/jpeg;base64,$base64Image',
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['error'] == '') {
        // Update local user info with new profile pic
        setState(() {
          userInfo = {
            ...userInfo!,
            'profilePic': data['profilePicUrl'],
          };
          loading = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile picture updated successfully!')),
        );
      } else {
        setState(() {
          errorMessage = data['error'] ?? 'Failed to upload profile picture.';
          loading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Failed to upload profile picture: $e';
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.home),
            onPressed: () => Navigator.pushReplacementNamed(context, '/home'),
          ),
          IconButton(
            icon: const Icon(Icons.restaurant_menu),
            onPressed: () => Navigator.pushNamed(context, '/food-log'),
          ),
        ],
      ),
      body: loading
          ? const AppLoadingWidget(message: 'Loading profile...')
          : errorMessage != null
              ? AppErrorWidget(
                  message: errorMessage!,
                  onRetry: _loadProfileData,
                )
              : RefreshIndicator(
                  onRefresh: _loadProfileData,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildProfileHeader(),
                        const SizedBox(height: 24),
                        _buildStats(),
                        const SizedBox(height: 24),
                        _buildProfileInformation(),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildProfileHeader() {
    final firstName = userInfo?['firstName'] ?? '';
    final lastName = userInfo?['lastName'] ?? '';
    final initials = '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'.toUpperCase();
    final profilePic = userInfo?['profilePic'];
    
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundColor: Colors.blue[600],
                  backgroundImage: profilePic != null ? NetworkImage(profilePic) : null,
                  child: profilePic == null ? Text(
                    initials,
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ) : null,
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.blue[600],
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                      onPressed: _pickProfileImage,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              '${userInfo?['firstName'] ?? ''} ${userInfo?['lastName'] ?? ''}',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              userInfo?['email'] ?? '',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStats() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Row(
          children: [
            Expanded(
              child: _statItem(
                stats['following'].toString(),
                'Following',
                Icons.people,
                Colors.blue,
              ),
            ),
            Expanded(
              child: _statItem(
                stats['followers'].toString(),
                'Followers',
                Icons.people_outline,
                Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statItem(String value, String label, IconData icon, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 14,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildProfileInformation() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Profile Information',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildEditableField('First Name', firstNameController, isRequired: true),
            _buildEditableField('Last Name', lastNameController, isRequired: true),
            _buildInfoField('Email', userInfo?['email'] ?? ''), // Email is read-only
            _buildEditableField('Bio', bioController, isRequired: false, hintText: 'Tell us about yourself...'),
            if (errorMessage != null) ...[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red[200]!),
                ),
                child: Text(
                  errorMessage!,
                  style: TextStyle(color: Colors.red[700]),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: (hasChanges && !saving) ? _saveChanges : null,
                child: saving 
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Save Changes'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoField(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: Colors.grey[700],
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEditableField(String label, TextEditingController controller, {
    bool isRequired = false,
    String? hintText,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[700],
                  fontSize: 14,
                ),
              ),
              if (isRequired) ...[
                const SizedBox(width: 4),
                Text(
                  '*',
                  style: TextStyle(
                    color: Colors.red[600],
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 4),
          TextFormField(
            controller: controller,
            decoration: InputDecoration(
              hintText: hintText,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            enabled: !saving,
          ),
        ],
      ),
    );
  }




} 