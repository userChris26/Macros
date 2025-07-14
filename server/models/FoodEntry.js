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
    foodName: {
        type: String,
        required: true
    },
    brandOwner: String,
    servingSize: {
        type: Number,
        required: true
    },
    servingSizeUnit: {
        type: String,
        default: 'g'
    },
    nutrients: {
        calories: String,
        protein: String,
        carbohydrates: String,
        fat: String,
        fiber: String,
        sugar: String,
        sodium: String
    },
    dateAdded: {
        type: String,
        default: () => new Date().toISOString().split('T')[0]
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FoodEntry', foodEntrySchema); 