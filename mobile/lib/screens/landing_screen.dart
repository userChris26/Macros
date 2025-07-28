import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context, listen: false);

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            ListView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              children: [
                const SizedBox(height: 64),

                
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.asset('assets/banner.png', height: 90), 
                  ],
                ),
                const SizedBox(height: 20), 

                
                const Center(
                  child: Text(
                    'Track your nutrition and share\nyour journey with Macros',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 16, color: Colors.white),
                  ),
                ),

                const SizedBox(height: 48),

                
                const Text(
                  'Why Choose Macros?',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),

                const SizedBox(height: 16),

                
                _buildFeatureCard(
                  icon: Icons.bar_chart,
                  title: 'Track Your Progress',
                  description:
                      'Log your daily nutrition intake and visualize your progress with beautiful charts and insights.',
                ),
                _buildFeatureCard(
                  icon: Icons.group,
                  title: 'Social Community',
                  description:
                      'Connect with like-minded individuals, share your journey, and get inspired by others\' success stories.',
                ),
                _buildFeatureCard(
                  icon: Icons.fastfood,
                  title: 'Smart Food Logging',
                  description:
                      'Easily search and log your meals with our comprehensive food database and quick-add features.',
                ),
                _buildFeatureCard(
                  icon: Icons.camera_alt,
                  title: 'Visual Food Diary',
                  description:
                      'Create a visual diary of your meals with photo uploads and share your favorite healthy recipes.',
                ),

                const SizedBox(height: 32),

                
                const Text(
                  'Ready to Start Your Journey?',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Join thousands of users who are transforming their nutrition habits with Macros.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: Colors.white70),
                ),

                const SizedBox(height: 16),

                ElevatedButton(
                  onPressed: () => Navigator.pushNamed(context, '/register'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text(
                    'Get Started Free',
                    style: TextStyle(color: Colors.black),
                  ),
                ),

                const SizedBox(height: 24),
              ],
            ),

            
            Positioned(
              top: 16,
              right: 16,
              child: Row(
                children: [
                  TextButton(
                    onPressed: () => Navigator.pushNamed(context, '/login'),
                    child: const Text(
                      'Sign In',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton(
                    onPressed: () => Navigator.pushNamed(context, '/register'),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.white),
                      backgroundColor: Colors.transparent,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Sign Up'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static Widget _buildFeatureCard({
    required IconData icon,
    required String title,
    required String description,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 32, color: Colors.white),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 6),
          Text(
            description,
            style: const TextStyle(fontSize: 14, color: Colors.white70),
          ),
        ],
      ),
    );
  }
}


