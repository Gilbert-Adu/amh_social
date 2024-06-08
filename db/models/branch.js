const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema({
    name: String,
    numMembers: { type: Number, default: () => 1},
    description: String,
    images: {type: mongoose.Schema.Types.Mixed},
    announcements: {type: Array, 
        default: () => []},
    
    leadership: {type: Array, 
        default: () => []},

    memberCount: {type: String, default: 'no'},
    
    members: {type: Array, 
            default: () => []},
    userId: String,
    createdBy: String,
    createdOn: String
    
});

const Branch = mongoose.model('Branch', branchSchema);
module.exports = Branch;

