const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
    postSeq: { type:Number, required: true },
    comment: { type:String, required: true },
    commenter: { type:String, required: true },
},
    { timestamps: true }
);

CommentSchema.set("toJSON", {
    virtuals: true,
});
module.exports = mongoose.model("Comment", CommentSchema);