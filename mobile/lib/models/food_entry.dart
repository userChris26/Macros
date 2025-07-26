
class FoodEntry {
  final String id;
  final String userId;
  final String fdcId;
  final String foodName;
  final String? brandOwner;
  final String? brandName;
  final double servingSize;
  final String servingSizeUnit;
  final Map<String, String> nutrients;
  final String dateAdded;
  final String timestamp;
  final String mealType;

  FoodEntry({
    required this.id,
    required this.userId,
    required this.fdcId,
    required this.foodName,
    this.brandOwner,
    this.brandName,
    required this.servingSize,
    required this.servingSizeUnit,
    required this.nutrients,
    required this.dateAdded,
    required this.timestamp,
    required this.mealType,
  });

  factory FoodEntry.fromJson(Map<String, dynamic> json) {
    // Handle nutrients: convert all values to String
    Map<String, String> nutrientsMap = {};
    if (json['nutrients'] != null) {
      (json['nutrients'] as Map<String, dynamic>).forEach((key, value) {
        nutrientsMap[key] = value.toString();
      });
    }
    return FoodEntry(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      fdcId: json['fdcId']?.toString() ?? '',
      foodName: json['foodName'] ?? json['description'] ?? '',
      brandOwner: json['brandOwner'],
      brandName: json['brandName'],
      servingSize: (json['servingAmount'] ?? json['servingSize'] ?? json['gramWeight'] ?? 0).toDouble(),
      servingSizeUnit: json['servingUnit'] ?? json['servingSizeUnit'] ?? 'g',
      nutrients: nutrientsMap,
      dateAdded: json['dateAdded'] ?? json['date'] ?? '',
      timestamp: json['timestamp'] ?? json['createdAt'] ?? '',
      mealType: json['mealType'] ?? 'meal',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': userId,
      'fdcId': fdcId,
      'foodName': foodName,
      'brandOwner': brandOwner,
      'brandName': brandName,
      'servingSize': servingSize,
      'servingSizeUnit': servingSizeUnit,
      'nutrients': nutrients,
      'dateAdded': dateAdded,
      'timestamp': timestamp,
      'mealType': mealType,
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