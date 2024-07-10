const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema({
    title: {type: mongoose.Schema.Types.Mixed, required: true},
    content: {type: mongoose.Schema.Types.Mixed, required: true},
    comments: {type: Array, default: () => []},
    userId: String,
    postedOn: {type: Date,
        default: () => new Date().toLocaleString('en-US', { timeZone: 'UTC'})
    },
    postedBy: String
});

const Article = mongoose.model('Article', articleSchema);
module.exports = Article;

