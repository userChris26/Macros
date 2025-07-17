import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../services/food_log_service.dart';
import '../services/auth_service.dart';
import '../models/food_entry.dart';
import '../models/food_search_result.dart';
import '../widgets/error_widget.dart';
import '../widgets/loading_widget.dart';
import '../utils/validation.dart';

class FoodLogScreen extends StatefulWidget {
  const FoodLogScreen({Key? key}) : super(key: key);

  @override
  State<FoodLogScreen> createState() => _FoodLogScreenState();
}

class _FoodLogScreenState extends State<FoodLogScreen> {
  DateTime selectedDate = DateTime.now();
  bool loading = false;
  String? errorMessage;
  List<FoodEntry> foodEntries = [];
  
  // Add controllers for the form fields
  final TextEditingController foodNameController = TextEditingController();
  final TextEditingController servingSizeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchEntries();
  }

  @override
  void dispose() {
    // Dispose controllers to prevent memory leaks
    foodNameController.dispose();
    servingSizeController.dispose();
    super.dispose();
  }

  Future<void> _fetchEntries() async {
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
      final service = FoodLogService();
      final entries = await service.fetchFoodEntries(userId, selectedDate);
      setState(() {
        foodEntries = entries;
        loading = false;
      });
    } catch (e) {
      setState(() {
        errorMessage = e.toString();
        loading = false;
      });
    }
  }

  Map<String, num> get totalMacros {
    num calories = 0, protein = 0, carbs = 0, fat = 0;
    for (var entry in foodEntries) {
      calories += entry.calories;
      protein += entry.protein;
      carbs += entry.carbohydrates;
      fat += entry.fat;
    }
    return {
      'calories': calories,
      'protein': protein,
      'carbs': carbs,
      'fat': fat,
    };
  }

  void _pickDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != selectedDate) {
      setState(() {
        selectedDate = picked;
      });
      _fetchEntries();
    }
  }

  void _addFoodEntry() async {
    // Show a dialog to search for foods
    final searchQuery = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Search for Food'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: foodNameController,
              decoration: const InputDecoration(
                labelText: 'Search for a food (e.g., apple, chicken, rice)',
                hintText: 'Enter food name...',
              ),
              autofocus: true,
              onSubmitted: (value) => Navigator.pop(context, value),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, foodNameController.text),
            child: const Text('Search'),
          ),
        ],
      ),
    );

    if (searchQuery == null || searchQuery.trim().isEmpty) return;

    // Validate search query
    final validationError = ValidationUtils.validateSearchQuery(searchQuery);
    if (validationError != null) {
      setState(() {
        errorMessage = validationError;
      });
      return;
    }

    // Search for foods
    setState(() {
      loading = true;
      errorMessage = null;
    });

    try {
      final service = FoodLogService();
      final foods = await service.searchFoods(searchQuery.trim());
      
      if (foods.isEmpty) {
        setState(() {
          loading = false;
          errorMessage = 'No foods found for "$searchQuery"';
        });
        return;
      }

      // Show food selection dialog
      final selectedFood = await showDialog<FoodSearchResult>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Select Food (${foods.length} results)'),
          content: SizedBox(
            width: double.maxFinite,
            height: 300,
            child: ListView.builder(
              itemCount: foods.length,
              itemBuilder: (context, index) {
                final food = foods[index];
                return ListTile(
                  title: Text(food.displayName),
                  subtitle: Text('FDC ID: ${food.fdcId}'),
                  onTap: () => Navigator.pop(context, food),
                );
              },
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
          ],
        ),
      );

      if (selectedFood == null) {
        setState(() {
          loading = false;
        });
        return;
      }

      // Show serving size input dialog
      servingSizeController.clear();
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Add ${selectedFood.description}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Selected: ${selectedFood.description}'),
              if (selectedFood.brandOwner != null && selectedFood.brandOwner!.isNotEmpty)
                Text('Brand: ${selectedFood.brandOwner}'),
              const SizedBox(height: 16),
              TextField(
                controller: servingSizeController,
                decoration: const InputDecoration(
                  labelText: 'Serving Size (grams)',
                  hintText: '100',
                ),
                keyboardType: TextInputType.number,
                autofocus: true,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Add'),
            ),
          ],
        ),
      );

      if (confirmed == true) {
        // Validate serving size
        final servingSizeError = ValidationUtils.validateServingSize(servingSizeController.text);
        if (servingSizeError != null) {
          setState(() {
            errorMessage = servingSizeError;
            loading = false;
          });
          return;
        }

        // Add the food entry to the backend
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
          
          final servingSize = int.tryParse(servingSizeController.text);
          if (servingSize == null || servingSize <= 0) {
            setState(() {
              errorMessage = 'Please enter a valid serving size.';
              loading = false;
            });
            return;
          }

          await service.addFoodEntry(
            userId: userId,
            fdcId: selectedFood.fdcId.toString(),
            servingSize: servingSize,
            date: selectedDate,
          );
          
          // Refresh the food entries
          _fetchEntries();
        } catch (e) {
          setState(() {
            errorMessage = 'Failed to add food entry: $e';
            loading = false;
          });
        }
      } else {
        setState(() {
          loading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Failed to search foods: $e';
        loading = false;
      });
    }
  }

  void _deleteEntry(String id) async {
    // show a confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Food Entry'),
        content: const Text('Are you sure you want to delete this food entry?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      // delete the food entry from the backend
      try {
        final authService = Provider.of<AuthService>(context, listen: false);
        final userId = await authService.getUserId();
        if (userId == null) {
          setState(() {
            errorMessage = 'User not logged in.';
          });
          return;
        }
        
        final service = FoodLogService();
        await service.deleteFoodEntry(
          userId: userId,
          entryId: id,
        );
        // refresh the food entries
        _fetchEntries();
      } catch (e) {
        setState(() {
          errorMessage = 'Failed to delete food entry: $e';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isToday = DateFormat('yyyy-MM-dd').format(selectedDate) ==
        DateFormat('yyyy-MM-dd').format(DateTime.now());
    return Scaffold(
      appBar: AppBar(
        title: const Text('Food Log'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with date picker
            Row(
              children: [
                Text(
                  'Food Log',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 16),
                OutlinedButton.icon(
                  icon: const Icon(Icons.calendar_today, size: 18),
                  label: Text(DateFormat('MMMM d, yyyy').format(selectedDate)),
                  onPressed: _pickDate,
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Macros Summary Card
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isToday ? "Today's Macros" : "${DateFormat('MMMM d').format(selectedDate)}'s Macros",
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _macroColumn('Calories', totalMacros['calories']!.toStringAsFixed(0)),
                        _macroColumn('Protein', '${totalMacros['protein']!.toStringAsFixed(1)}g'),
                        _macroColumn('Carbs', '${totalMacros['carbs']!.toStringAsFixed(1)}g'),
                        _macroColumn('Fat', '${totalMacros['fat']!.toStringAsFixed(1)}g'),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Entries List
            Expanded(
              child: Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: loading
                      ? const AppLoadingWidget(message: 'Loading food entries...')
                      : errorMessage != null
                          ? AppErrorWidget(
                              message: errorMessage!,
                              onRetry: _fetchEntries,
                            )
                          : foodEntries.isEmpty
                              ? Center(
                                  child: Text(
                                    'No food entries for ${DateFormat('MMMM d, yyyy').format(selectedDate)}.' +
                                        (isToday ? ' Click the + button to get started!' : ''),
                                    style: TextStyle(color: Colors.grey[600]),
                                    textAlign: TextAlign.center,
                                  ),
                                )
                              : ListView.separated(
                                  itemCount: foodEntries.length,
                                  separatorBuilder: (_, __) => const Divider(),
                                  itemBuilder: (context, index) {
                                    final entry = foodEntries[index];
                                    return ListTile(
                                      leading: const Icon(Icons.restaurant_menu),
                                      title: Text(entry.foodName),
                                      subtitle: Text(
                                        '${entry.servingSize}g • ${entry.calories.toStringAsFixed(0)} kcal',
                                      ),
                                      trailing: IconButton(
                                        icon: const Icon(Icons.delete_outline),
                                        onPressed: () => _deleteEntry(entry.id),
                                      ),
                                    );
                                  },
                                ),
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addFoodEntry,
        icon: const Icon(Icons.add),
        label: const Text('Add Food Entry'),
        tooltip: 'Add Food Entry',
      ),
    );
  }

  Widget _macroColumn(String label, String value) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      ],
    );
  }
} 