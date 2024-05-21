const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    title: {type: mongoose.Schema.Types.Mixed, required: true},
    desc: String,
    mainImage: {type: mongoose.Schema.Types.Mixed, required: true},
    altText: {type: mongoose.Schema.Types.Mixed, required: true},
    content: {type: mongoose.Schema.Types.Mixed, required: true},
    userId: String,
    postedOn: {type: Date,
        default: () => new Date().toLocaleString('en-US', { timeZone: 'UTC'})
    },
    postedBy: String
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;

