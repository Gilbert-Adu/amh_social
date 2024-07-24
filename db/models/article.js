const mongoose = require("mongoose");
const marked = require('marked')
const createDomPurify = require('dompurify')
const { JSDOM } = require('jsdom')
const dompurify = createDomPurify(new JSDOM().window)


const articleSchema = new mongoose.Schema({
    title: {type: mongoose.Schema.Types.Mixed, required: true},
    content: {type: mongoose.Schema.Types.Mixed, required: true},
    comments: {type: Array, default: () => []},
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

articleSchema.pre('validate', function(next) {
    if (this.content) {
        this.sanitizedHtml = dompurify.sanitize(marked.parse(this.content))
    }
    next();
});


const Article = mongoose.model('Article', articleSchema);
module.exports = Article;

