const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    comment: {type: String},
    commenter: {type: Object, default: () => {}},
    blogID: String,
    postedOn: {type: Date,
        default: () => new Date().toLocaleString('en-US', { timeZone: 'UTC'})
    },
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;

