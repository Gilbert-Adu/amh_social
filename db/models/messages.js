const mongoose = require("mongoose");

const messagesSchema = new mongoose.Schema({
    message: String,
    postedOn: {type: Date,
        default: () => new Date().toLocaleString('en-US', { timeZone: 'UTC'})
    },
    user: { type: Object,
    default: () => {}},
    userID: String
});

const Message = mongoose.model('Message', messagesSchema);
module.exports = Message;

