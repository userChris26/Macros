const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const CardSchema = new Schema({
    user: {
        type: Number
    },
    name: {
        type: String,
        required: true
    }
});

module.exports = card = mongoose.model('card', CardSchema);