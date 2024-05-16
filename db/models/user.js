const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: String,
    email: String,
    password: String,
    phone: String,
    city: String,
    state: String,
    age: String

});

const User = mongoose.model('User', userSchema);
module.exports = User;

