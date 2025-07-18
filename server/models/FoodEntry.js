const mongoose = require('mongoose');

const foodEntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fdcId: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    dataType: {
        type: String,
        required: true
    },
    // Only include brand info for branded foods
    brandOwner: String,
    brandName: String,
    // Portion information
    servingAmount: {
        type: Number,
        required: true,
        default: 1
    },
    servingUnit: {
        type: String,
        required: true
    },
    gramWeight: {
        type: Number,
        required: true
    },
    // Nutrients per serving
    nutrients: {
        calories: Number,
        protein: Number,
        fat: Number,
        carbohydrates: Number
    },
    // Meal tracking
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: () => {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            return date;
        }
    }
}, {
    timestamps: true // This adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('FoodEntry', foodEntrySchema); 