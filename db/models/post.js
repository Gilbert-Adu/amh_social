const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    title: {type: mongoose.Schema.Types.Mixed, required: true},
    desc: String,
    mainImage: {type: mongoose.Schema.Types.Mixed, required: false},
    altText: {type: mongoose.Schema.Types.Mixed, required: false},
    content: {type: mongoose.Schema.Types.Mixed, required: true},
    comments: {type: Array, default: () => []},
    blogDecision: {type: String, default: 'no'},
    userId: String,
    postedOn: {type: Date,
        default: () => new Date().toLocaleString('en-US', { timeZone: 'UTC'})
    },
    postedBy: String
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;

