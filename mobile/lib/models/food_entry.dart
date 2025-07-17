
class FoodEntry {
  final String id;
  final String userId;
  final String fdcId;
  final String foodName;
  final String? brandOwner;
  final double servingSize;
  final String servingSizeUnit;
  final Map<String, String> nutrients;
  final String dateAdded;
  final String timestamp;

  FoodEntry({
    required this.id,
    required this.userId,
    required this.fdcId,
    required this.foodName,
    this.brandOwner,
    required this.servingSize,
    required this.servingSizeUnit,
    required this.nutrients,
    required this.dateAdded,
    required this.timestamp,
  });

  factory FoodEntry.fromJson(Map<String, dynamic> json) {
    return FoodEntry(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      fdcId: json['fdcId']?.toString() ?? '',
      foodName: json['foodName'] ?? '',
      brandOwner: json['brandOwner'],
      servingSize: (json['servingSize'] ?? 0).toDouble(),
      servingSizeUnit: json['servingSizeUnit'] ?? 'g',
      nutrients: Map<String, String>.from(json['nutrients'] ?? {}),
      dateAdded: json['dateAdded'] ?? '',
      timestamp: json['timestamp'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': userId,
      'fdcId': fdcId,
      'foodName': foodName,
      'brandOwner': brandOwner,
      'servingSize': servingSize,
      'servingSizeUnit': servingSizeUnit,
      'nutrients': nutrients,
      'dateAdded': dateAdded,
      'timestamp': timestamp,
    };
  }

  // Helper methods for nutrition data
  double get calories => double.tryParse(nutrients['calories'] ?? '0') ?? 0;
  double get protein => double.tryParse(nutrients['protein'] ?? '0') ?? 0;
  double get carbohydrates => double.tryParse(nutrients['carbohydrates'] ?? '0') ?? 0;
  double get fat => double.tryParse(nutrients['fat'] ?? '0') ?? 0;
  double get fiber => double.tryParse(nutrients['fiber'] ?? '0') ?? 0;
  double get sugar => double.tryParse(nutrients['sugar'] ?? '0') ?? 0;
  double get sodium => double.tryParse(nutrients['sodium'] ?? '0') ?? 0;
} 