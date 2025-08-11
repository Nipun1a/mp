const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/post-app');

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }]
});

module.exports = mongoose.models.post || mongoose.model('post', postSchema);
