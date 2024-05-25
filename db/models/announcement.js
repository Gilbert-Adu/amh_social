const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
    title: String,
    userID: String,
    branch: String,
    postedOn: {type: Date,
        default: () => new Date().toLocaleString('en-US', { timeZone: 'UTC'})
    }
});

const Announcement = mongoose.model('Announcement', announcementSchema);
module.exports = Announcement;

