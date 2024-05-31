const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: {
        type: String,
        default: () => " "
    },
    email: String,
    password: String,
    phone: String,
    city: String,
    state: String,
    age: String,
    branches: {
        type: Array,
        default: () => []
    },
    userColor: String,
    token: String,
    role: {
        type: String,
        default: () => "visitor"
    }

});

const User = mongoose.model('User', userSchema);
module.exports = User;

