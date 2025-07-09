const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const FoodEntrySchema = new Schema({
    userId: {
        type: String,
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
    brandOwner: {
        type: String,
        default: ''
    },
    servingSize: {
        type: Number,
        required: true
    },
    servingSizeUnit: {
        type: String,
        default: 'g'
    },
    nutrients: {
        calories: {
            type: String,
            default: '0'
        },
        protein: {
            type: String,
            default: '0'
        },
        carbohydrates: {
            type: String,
            default: '0'
        },
        fat: {
            type: String,
            default: '0'
        },
        fiber: {
            type: String,
            default: '0'
        },
        sugar: {
            type: String,
            default: '0'
        },
        sodium: {
            type: String,
            default: '0'
        }
    },
    dateAdded: {
        type: String,
        required: true
    },
    timestamp: {
        type: String,
        required: true
    }
});

module.exports = FoodEntry = mongoose.model('foodEntry', FoodEntrySchema); 