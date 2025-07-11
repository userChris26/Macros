const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
    UserId: {
        type: Number
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        require: true
    },
    login: {
        type: String,
        require: true
    },
    password: {
        type: String,
        required: true
    }
});

module.exports = user = mongoose.model("users", UserSchema);