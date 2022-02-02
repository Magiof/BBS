const mongoose = require("mongoose");
const autoIdSetter = require('./auto-seq-setter');
const User = require("../models/user")


const postsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    authorName: {
        type: String,
    },
    content: {
        type: String,
        required: true,
    },
},
{timestamps: true}
);
autoIdSetter(postsSchema, mongoose, 'application', 'seq');

module.exports = mongoose.model("posts", postsSchema);