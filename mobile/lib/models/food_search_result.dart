class FoodSearchResult {
  final int fdcId;
  final String description;
  final String? brandOwner;
  final String? brandName;
  final String? dataType;
  final String? gtinUpc;
  final String? ingredients;
  final String? marketCountry;
  final String? foodCategory;
  final String? allHighlightFields;
  final double? score;

  FoodSearchResult({
    required this.fdcId,
    required this.description,
    this.brandOwner,
    this.brandName,
    this.dataType,
    this.gtinUpc,
    this.ingredients,
    this.marketCountry,
    this.foodCategory,
    this.allHighlightFields,
    this.score,
  });

  factory FoodSearchResult.fromJson(Map<String, dynamic> json) {
    return FoodSearchResult(
      fdcId: json['fdcId'] ?? 0,
      description: json['description'] ?? '',
      brandOwner: json['brandOwner'],
      brandName: json['brandName'],
      dataType: json['dataType'],
      gtinUpc: json['gtinUpc'],
      ingredients: json['ingredients'],
      marketCountry: json['marketCountry'],
      foodCategory: json['foodCategory'],
      allHighlightFields: json['allHighlightFields'],
      score: json['score']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'fdcId': fdcId,
      'description': description,
      'brandOwner': brandOwner,
      'brandName': brandName,
      'dataType': dataType,
      'gtinUpc': gtinUpc,
      'ingredients': ingredients,
      'marketCountry': marketCountry,
      'foodCategory': foodCategory,
      'allHighlightFields': allHighlightFields,
      'score': score,
    };
  }

  String get displayName {
    if (brandOwner != null && brandOwner!.isNotEmpty) {
      return '$description ($brandOwner)';
    }
    return description;
  }
} 