const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema({
    name: String,
    numMembers: String,
    description: String,
    images: {type: mongoose.Schema.Types.Mixed},
    leadership: {type: Array, 
        default: () => []},
    userId: String,
    createdBy: String,
    createdOn: String
    
});

const Branch = mongoose.model('Branch', branchSchema);
module.exports = Branch;

