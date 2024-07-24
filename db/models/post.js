const mongoose = require("mongoose");
const marked = require('marked')
const createDomPurify = require('dompurify')
const { JSDOM } = require('jsdom')
const dompurify = createDomPurify(new JSDOM().window)



const postSchema = new mongoose.Schema({
    title: {type: mongoose.Schema.Types.Mixed, required: true},
    content: {type: mongoose.Schema.Types.Mixed, required: true},
    comments: {type: Array, default: () => []},
    blogDecision: {type: String, default: 'no'},
    userId: String,
    postedOn: {type: Date,
        default: () => new Date().toLocaleString('en-US', { timeZone: 'UTC'})
    },
    postedBy: String,
    sanitizedHtml: {
        type: String,
        required: true
      }
    
});

postSchema.pre('validate', function(next) {
    if (this.content) {
        this.sanitizedHtml = dompurify.sanitize(marked.parse(this.content))
    }
    next();
});
const Post = mongoose.model('Post', postSchema);
module.exports = Post;

