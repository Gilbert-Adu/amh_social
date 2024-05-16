const mongoose = require("mongoose");

const messagesSchema = new mongoose.Schema({
    content: String,
    time: Date.now,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

const Messages = mongoose.model('Messages', MessagesSchema);
module.exports = Messages;

