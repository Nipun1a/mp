const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/post-app');

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true
    },
    name:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const user = mongoose.model('user', userSchema);
module.exports = user;