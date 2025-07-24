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
import 'dart:convert';

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
      final mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      final futures = mealTypes.map((mealType) => service.fetchMealEntries(userId, selectedDate, mealType));
      final results = await Future.wait(futures);
      final entries = results.expand((e) => e).toList();
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

  void _addFoodEntry([String? mealType]) async {
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
          title: Text('Select Food ( ${foods.length} results)'),
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

        // Use provided mealType or prompt if not given
        String selectedMealType = mealType ?? 'dinner';
        if (mealType == null) {
          final mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
          final pickedMealType = await showDialog<String>(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Select Meal Type'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: mealTypes.map((type) => RadioListTile<String>(
                  title: Text(type[0].toUpperCase() + type.substring(1)),
                  value: type,
                  groupValue: selectedMealType,
                  onChanged: (value) {
                    Navigator.pop(context, value);
                  },
                )).toList(),
              ),
            ),
          );
          if (pickedMealType != null) {
            selectedMealType = pickedMealType;
          }
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
            fdcId: selectedFood.fdcId, // int
            servingAmount: servingSize, // int
            mealType: selectedMealType, // user picked or provided
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
    final mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    final mealLabels = {
      'breakfast': 'Breakfast',
      'lunch': 'Lunch',
      'dinner': 'Dinner',
      'snack': 'Snack',
    };
    // Group entries by meal type
    Map<String, List<FoodEntry>> entriesByMeal = {
      for (var meal in mealTypes) meal: [],
    };
    for (var entry in foodEntries) {
      final meal = entry.mealType.toLowerCase();
      if (entriesByMeal.containsKey(meal)) {
        entriesByMeal[meal]!.add(entry);
      }
    }
    // Helper to get total kcal for a meal
    num mealCalories(String meal) => entriesByMeal[meal]!.fold(0, (sum, e) => sum + e.calories);

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
            // Grouped Entries by Meal
            Expanded(
              child: loading
                  ? const AppLoadingWidget(message: 'Loading food entries...')
                  : errorMessage != null
                      ? AppErrorWidget(
                          message: errorMessage!,
                          onRetry: _fetchEntries,
                        )
                      : ListView.builder(
                          itemCount: mealTypes.length,
                          itemBuilder: (context, idx) {
                            final meal = mealTypes[idx];
                            final entries = entriesByMeal[meal]!;
                            return Card(
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              margin: const EdgeInsets.only(bottom: 16),
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(mealLabels[meal]!, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                                        Text('${mealCalories(meal).toStringAsFixed(0)} kcal', style: const TextStyle(fontWeight: FontWeight.w600)),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        OutlinedButton.icon(
                                          icon: const Icon(Icons.photo_camera),
                                          label: const Text('Add Photo'),
                                          onPressed: () {
                                            // TODO: Implement add photo
                                          },
                                        ),
                                        const SizedBox(width: 8),
                                        OutlinedButton.icon(
                                          icon: const Icon(Icons.add),
                                          label: const Text('Add Food'),
                                          onPressed: () => _addFoodEntry(meal),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    entries.isEmpty
                                        ? const Text('No food entries yet', style: TextStyle(color: Colors.grey))
                                        : ListView.separated(
                                            shrinkWrap: true,
                                            physics: const NeverScrollableScrollPhysics(),
                                            itemCount: entries.length,
                                            separatorBuilder: (_, __) => const Divider(),
                                            itemBuilder: (context, i) {
                                              final entry = entries[i];
                                              return ListTile(
                                                title: Text(entry.foodName),
                                                subtitle: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    if (entry.brandOwner != null && entry.brandOwner!.isNotEmpty)
                                                      Text('${entry.brandName != null && entry.brandName!.isNotEmpty ? entry.brandName! + ' • ' : ''}${entry.brandOwner!}'),
                                                    Text('${entry.servingSize} ${entry.servingSizeUnit} • ${entry.calories.toStringAsFixed(0)} kcal'),
                                                  ],
                                                ),
                                                trailing: IconButton(
                                                  icon: const Icon(Icons.delete_outline),
                                                  onPressed: () => _deleteEntry(entry.id),
                                                ),
                                              );
                                            },
                                          ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
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
        Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      ],
    );
  }

  String _capitalize(String s) {
    if (s.isEmpty) return s;
    return s[0].toUpperCase() + s.substring(1);
  }
} 